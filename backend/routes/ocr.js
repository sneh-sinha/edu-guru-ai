const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { getMockResponse } = require('../utils/mocks');
const { saveToHistory } = require('../utils/history');
const { aiLimiter } = require('../middleware/rateLimit');
const openai = require('../utils/ai');

const upload = multer({ dest: 'uploads/' });

// POST /api/ocr
router.post('/', upload.single('image'), aiLimiter, async (req, res) => {
  const { userId, subject = 'Science Teacher', classLevel = 'Class 9-12' } = req.body;
  const imageFile = req.file;

  console.log(`[OCR] Uploaded image size:`, imageFile ? imageFile.size : 'base64');

  if (!openai) {
    // Return mock solved math/science question
    const mockQuestion = "Solve for x: 2x + 5 = 15";
    const mockResponse = getMockResponse(mockQuestion, subject, classLevel);
    
    await saveToHistory(userId, subject, `[Image Solve]: ${mockQuestion}`, JSON.stringify(mockResponse));
    return res.json({
      success: true,
      extractedText: mockQuestion,
      data: mockResponse,
      mocked: true
    });
  }

  try {
    let base64Image = '';

    if (imageFile) {
      const fileBuffer = fs.readFileSync(imageFile.path);
      base64Image = fileBuffer.toString('base64');
      fs.unlinkSync(imageFile.path); // clean up
    } else if (req.body.imageBase64) {
      base64Image = req.body.imageBase64;
    } else {
      throw new Error("No image source provided");
    }

    // Send base64 image directly to GPT-4o for OCR and step-by-step solving in one step!
    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: `You are EduGuru AI Teacher. You have been sent an image of a homework sheet, math equation, or textbook question(s).
          1. Extract ALL questions accurately (OCR). If there are multiple questions, you MUST process every single one.
          2. Explain the concepts needed to solve these problems.
          3. Provide a clear, detailed step-by-step solution for EACH question found in the image. Separate your answers clearly with headings (e.g. "Question 1:", "Question 2:").
          4. Suggest 1 or 2 similar practice questions to build skill.
          5. CRITICAL JSON RULES: You MUST escape all newlines in your string values as \\n. Do not use raw line breaks inside strings. Escape all double quotes inside strings as \\".
          
          You MUST respond strictly in valid JSON format matching this schema:
          {
            "extractedText": "The full text of ALL questions extracted from the image.",
            "explanation": "Classroom-style teaching explanation of the concepts, followed by the step-by-step solutions for ALL the questions present. Remember to use \\n for newlines.",
            "practiceQuestion": {
              "question": "A similar practice question based on this problem.",
              "type": "mcq" | "short",
              "options": ["Option A", "Option B", "Option C", "Option D"], // required if mcq
              "correctAnswer": "Answer detail"
            },
            "whiteboard": {
              "title": "Step-by-step Illustration",
              "type": "steps" | "equation" | "diagram",
              "data": {
                "label": "Visual steps to solve the problem",
                "steps": ["Step 1: Write down equation: ...", "Step 2: Subtract... ", "Step 3: Divide..."]
              }
            },
            "followUp": "Do you want me to explain any step of this calculation in more detail?"
          }`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please read ALL the questions in this image. Extract all of them, explain the required concepts, and provide a step-by-step solution for EACH question.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ]
    });

    let aiText = response.choices[0].message.content;
    const firstBrace = aiText.indexOf('{');
    const lastBrace = aiText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      aiText = aiText.substring(firstBrace, lastBrace + 1);
    }
    let parsedData;
    try {
      parsedData = JSON.parse(aiText);
    } catch (parseError) {
      console.error('Failed to parse OCR JSON. Raw output:', response.choices[0].message.content);
      parsedData = {
        extractedText: "Text extracted from image.",
        explanation: "Here is the solution I found:\n\n" + response.choices[0].message.content,
        followUp: "Do you want me to explain any step of this calculation in more detail?"
      };
    }
    
    await saveToHistory(userId, subject, `[OCR Image Question]: ${parsedData.extractedText}`, JSON.stringify(parsedData));

    return res.json({
      success: true,
      extractedText: parsedData.extractedText,
      data: parsedData
    });
  } catch (error) {
    console.error('Error in OCR Solver:', error);
    const mock = getMockResponse("Solve 3x + 12 = 27", subject, classLevel);
    return res.status(200).json({
      success: true,
      extractedText: "Solve 3x + 12 = 27",
      data: mock,
      error: error.message,
      mocked: true
    });
  }
});

module.exports = router;
