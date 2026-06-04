const express = require('express');
const router = express.Router();
const { getMockQuiz } = require('../utils/mocks');
const { aiLimiter } = require('../middleware/rateLimit');
const supabase = require('../utils/db');
const openai = require('../utils/ai');

// POST /api/quiz/generate
router.post('/generate', aiLimiter, async (req, res) => {
  const { topic = 'Photosynthesis', classLevel = 'Class 6-8' } = req.body;

  console.log(`[QUIZ] Generating quiz for: "${topic}" | Grade: ${classLevel}`);

  if (!openai) {
    const mockQuiz = getMockQuiz(topic, classLevel);
    return res.json({ success: true, quiz: mockQuiz, mocked: true });
  }

  try {
    const prompt = `You are EduGuru AI, a classroom teacher. Please generate an interactive assessment for the topic "${topic}" adapted to the class level "${classLevel}".
    
    The quiz must contain:
    - Exactly 5 Multiple Choice Questions (MCQs) with 4 options each.
    - Exactly 2 Short Answer Questions (testing conceptual explanations).
    - Exactly 1 Application-Based Question (situational or problem solving context).
    
    You MUST respond strictly in valid JSON format matching this schema:
    {
      "topic": "${topic}",
      "classLevel": "${classLevel}",
      "mcqs": [
        {
          "id": "mcq_1",
          "question": "Question text...",
          "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
          "correctAnswer": "A) option 1",
          "explanation": "Why this is correct..."
        },
        ...
      ],
      "shortQuestions": [
        {
          "id": "short_1",
          "question": "Explain why...",
          "sampleAnswer": "A standard good answer containing keywords..."
        },
        ...
      ],
      "applicationQuestion": {
        "id": "app_1",
        "question": "Imagine you are... how would you apply...",
        "sampleAnswer": "A good application answer..."
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }]
    });

    let aiText = completion.choices[0].message.content;
    const firstBrace = aiText.indexOf('{');
    const lastBrace = aiText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      aiText = aiText.substring(firstBrace, lastBrace + 1);
    }
    const quizData = JSON.parse(aiText);
    return res.json({ success: true, quiz: quizData });
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    const mockQuiz = getMockQuiz(topic, classLevel);
    return res.json({ success: true, quiz: mockQuiz, error: error.message, mocked: true });
  }
});

// POST /api/quiz/evaluate
router.post('/evaluate', aiLimiter, async (req, res) => {
  const { userId, topic, mcqAnswers = {}, shortAnswers = {}, appAnswer = '', quiz = {} } = req.body;

  console.log(`[QUIZ EVALUATION] Topic: ${topic} | User: ${userId}`);

  // Base evaluation scores
  let mcqScore = 0;
  const mcqFeedback = {};
  const maxScore = 8; // 5 mcqs + 2 short + 1 app

  // 1. Evaluate MCQs locally
  quiz.mcqs?.forEach((q) => {
    const studentAns = mcqAnswers[q.id];
    const correctAns = q.correctAnswer;
    const isCorrect = studentAns === correctAns;
    if (isCorrect) {
      mcqScore += 1;
    }
    mcqFeedback[q.id] = {
      isCorrect,
      studentAnswer: studentAns || 'Not Answered',
      correctAnswer: correctAns,
      explanation: q.explanation
    };
  });

  if (!openai) {
    // Mock Short & App answers grading
    const mockShortScore = 2; // out of 2
    const mockAppScore = 1; // out of 1
    const totalScore = mcqScore + mockShortScore + mockAppScore;
    const accuracy = Math.round((totalScore / maxScore) * 100);

    const evaluation = {
      score: totalScore,
      maxScore,
      accuracy,
      mcqScore,
      shortScore: mockShortScore,
      appScore: mockAppScore,
      feedback: {
        mcqs: mcqFeedback,
        shortQuestions: {
          [quiz.shortQuestions?.[0]?.id || 's1']: { score: 1, feedback: "Good effort! You captured the main keywords." },
          [quiz.shortQuestions?.[1]?.id || 's2']: { score: 1, feedback: "Excellently explained." }
        },
        applicationQuestion: {
          score: 1,
          feedback: "Great application logic. Fully correct explanation."
        }
      },
      strongTopic: topic,
      weakTopic: "None"
    };

    await saveProgress(userId, topic, totalScore, accuracy, evaluation.weakTopic, evaluation.strongTopic);
    return res.json({ success: true, evaluation, mocked: true });
  }

  try {
    // Evaluate Short Answer and Application Questions using OpenAI
    const evaluationPrompt = `You are EduGuru AI Teacher grading a student's quiz.
    Topic: ${topic}
    
    Student's Answers to Grade:
    1. Short Question 1: "${quiz.shortQuestions?.[0]?.question}"
       Student Answer: "${shortAnswers[quiz.shortQuestions?.[0]?.id] || 'Not Answered'}"
       Model Answer: "${quiz.shortQuestions?.[0]?.sampleAnswer}"
       
    2. Short Question 2: "${quiz.shortQuestions?.[1]?.question}"
       Student Answer: "${shortAnswers[quiz.shortQuestions?.[1]?.id] || 'Not Answered'}"
       Model Answer: "${quiz.shortQuestions?.[1]?.sampleAnswer}"
       
    3. Application Question: "${quiz.applicationQuestion?.question}"
       Student Answer: "${appAnswer}"
       Model Answer: "${quiz.applicationQuestion?.sampleAnswer}"
       
    Please grade each out of 1 point (total 3 points). Provide friendly teacher feedback.
    Determine the student's overall understanding. List the student's strong points and any weak aspects of their explanation.

    You MUST respond strictly in valid JSON format matching this schema:
    {
      "short1Score": 0.0 to 1.0,
      "short1Feedback": "Short constructive message...",
      "short2Score": 0.0 to 1.0,
      "short2Feedback": "Short feedback...",
      "appScore": 0.0 to 1.0,
      "appFeedback": "Short feedback...",
      "strongTopic": "Topic Name (e.g., Photosynthesis Reactions)",
      "weakTopic": "Topic Name (or 'None' if they scored well)"
    }`;

    const completion = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: evaluationPrompt }]
    });

    let aiText = completion.choices[0].message.content;
    const firstBrace = aiText.indexOf('{');
    const lastBrace = aiText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      aiText = aiText.substring(firstBrace, lastBrace + 1);
    }
    const aiEval = JSON.parse(aiText);

    const shortScoreTotal = Math.round((Number(aiEval.short1Score) || 0) + (Number(aiEval.short2Score) || 0));
    const finalAppScore = Math.round(Number(aiEval.appScore) || 0);
    const totalScore = mcqScore + shortScoreTotal + finalAppScore;
    const accuracy = Math.round((totalScore / maxScore) * 100);

    const evaluation = {
      score: totalScore,
      maxScore,
      accuracy,
      mcqScore,
      shortScore: shortScoreTotal,
      appScore: finalAppScore,
      feedback: {
        mcqs: mcqFeedback,
        shortQuestions: {
          [quiz.shortQuestions?.[0]?.id]: { score: aiEval.short1Score, feedback: aiEval.short1Feedback },
          [quiz.shortQuestions?.[1]?.id]: { score: aiEval.short2Score, feedback: aiEval.short2Feedback }
        },
        applicationQuestion: {
          score: aiEval.appScore,
          feedback: aiEval.appFeedback
        }
      },
      strongTopic: aiEval.strongTopic,
      weakTopic: aiEval.weakTopic
    };

    // Save progress to Supabase
    await saveProgress(userId, topic, totalScore, accuracy, aiEval.weakTopic, aiEval.strongTopic);

    // Save quiz attempt
    await saveQuizRecord(userId, topic, totalScore);

    return res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Quiz Evaluation Error:', error);
    // Graceful fallback
    const totalScore = mcqScore + 2;
    const accuracy = Math.round((totalScore / maxScore) * 100);
    const fallbackEval = {
      score: totalScore,
      maxScore,
      accuracy,
      mcqScore,
      shortScore: 1,
      appScore: 1,
      feedback: {
        mcqs: mcqFeedback,
        shortQuestions: {
          [quiz.shortQuestions?.[0]?.id || 'short_1']: { score: 1.0, feedback: "Excellent answer logic." },
          [quiz.shortQuestions?.[1]?.id || 'short_2']: { score: 1.0, feedback: "Concept fully captured." }
        },
        applicationQuestion: {
          score: 1.0,
          feedback: "Great application logic."
        },
        error: error.message
      },
      strongTopic: topic,
      weakTopic: "None"
    };
    return res.json({ success: true, evaluation: fallbackEval, error: error.message, mocked: true });
  }
});

async function saveProgress(userId, topic, score, accuracy, weakTopic, strongTopic) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('progress').insert({
      user_id: userId,
      topic,
      score,
      accuracy,
      weak_topic: weakTopic,
      strong_topic: strongTopic
    });
  } catch (e) {
    console.error('Supabase progress save error:', e);
  }
}

async function saveQuizRecord(userId, topic, score) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('quizzes').insert({
      user_id: userId,
      topic,
      score,
      date: new Date().toISOString()
    });
  } catch (e) {
    console.error('Supabase quiz record error:', e);
  }
}

module.exports = router;
