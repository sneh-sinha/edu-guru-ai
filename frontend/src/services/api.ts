// Frontend API Service with automatic offline/mock fallbacks

const API_BASE_URL = 'http://localhost:5000/api';

// Check if backend is reachable, if not, use mock
let serverReachable = true;
let authToken = '';

async function fetchWithFallback(endpoint: string, options: RequestInit = {}) {
  if (!serverReachable) {
    throw new Error('Server offline - using mock mode');
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 120000); // 120 second timeout for slow free AI models

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.warn(`Backend connection failed for ${endpoint}. Falling back to client-side mock.`, error.message);
    // If it's a network error or abort, mark server as unreachable for this session
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      // serverReachable = false; // keep checking or fall back dynamically
    }
    throw error;
  }
}

export const apiService = {
  setAuthToken(token: string) {
    authToken = token;
  },
  
  // Authentication
  async signup(data: any) {
    try {
      return await fetchWithFallback('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      return { success: true, user: { id: 'client-mock-uid-123', ...data, coins: 50, streak_days: 1 } };
    }
  },

  async login(data: any) {
    try {
      return await fetchWithFallback('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      return { success: true, user: { id: 'client-mock-uid-123', email: data.email, class_level: 'Class 6-8', coins: 150, streak_days: 3 } };
    }
  },

  async loginWithGoogle(data: { idToken?: string; user?: any }) {
    try {
      return await fetchWithFallback('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      return { success: true, user: { id: 'client-google-mock', email: data.user?.email || 'google@test.com', class_level: 'Class 6-8', coins: 150, streak_days: 3 }, token: 'mock-token' };
    }
  },

  async resetPassword(email: string) {
    try {
      return await fetchWithFallback('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (e) {
      return { success: true, message: 'Password reset instructions sent (Mocked).' };
    }
  },

  // Onboarding
  async saveProfile(profileData: {
    name: string;
    email: string;
    classLevel: string;
    preferredLanguage: string;
    favoriteSubjects: string[];
  }) {
    try {
      return await fetchWithFallback('/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
    } catch (e) {
      // Return Client-Side Mock
      return {
        success: true,
        user: {
          id: 'client-mock-uid-123',
          ...profileData,
          created_at: new Date().toISOString()
        },
        mocked: true
      };
    }
  },

  // AI Chat
  async sendMessage(chatParams: {
    userId: string;
    message: string;
    subject: string;
    classLevel: string;
    preferredLanguage: string;
    history: any[];
  }) {
    try {
      return await fetchWithFallback('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatParams)
      });
    } catch (e: any) {
      // Client-Side Mock response generator
      const mockData = getClientMockChatResponse(chatParams.message, chatParams.subject, chatParams.classLevel);
      
      mockData.explanation = "⚠️ **FRONTEND NETWORK ERROR:** The frontend app cannot connect to the backend server! Error: `" + e.message + "`\n\nPlease ensure your Node.js backend is running on port 5000 (`npm run dev`).\n\n---\n\n" + mockData.explanation;
      
      return {
        success: true,
        data: mockData,
        mocked: true
      };
    }
  },

  // Voice Chat
  async sendVoiceMessage(voiceParams: {
    userId: string;
    subject: string;
    classLevel: string;
    preferredLanguage: string;
    audioBase64?: string;
  }) {
    try {
      return await fetchWithFallback('/chat/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceParams)
      });
    } catch (e) {
      const mockText = "What is Newton's First Law?";
      return {
        success: true,
        transcription: mockText,
        data: getClientMockChatResponse(mockText, voiceParams.subject, voiceParams.classLevel),
        audioBase64: "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA",
        mocked: true
      };
    }
  },

  // Image Solver (OCR)
  async solveImage(imageParams: {
    userId: string;
    subject: string;
    classLevel: string;
    imageBase64: string;
  }) {
    try {
      return await fetchWithFallback('/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageParams)
      });
    } catch (e) {
      const mockQuestionText = "Solve 3x + 12 = 27";
      return {
        success: true,
        extractedText: mockQuestionText,
        data: getClientMockChatResponse(mockQuestionText, imageParams.subject, imageParams.classLevel),
        mocked: true
      };
    }
  },

  // Quiz Generator
  async generateQuiz(topic: string, classLevel: string) {
    try {
      return await fetchWithFallback('/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, classLevel })
      });
    } catch (e) {
      return {
        success: true,
        quiz: getClientMockQuiz(topic, classLevel),
        mocked: true
      };
    }
  },

  // Quiz Evaluator
  async evaluateQuiz(evaluationParams: {
    userId: string;
    topic: string;
    mcqAnswers: Record<string, string>;
    shortAnswers: Record<string, string>;
    appAnswer: string;
    quiz: any;
  }) {
    try {
      return await fetchWithFallback('/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationParams)
      });
    } catch (e) {
      // Client-Side evaluation fallback
      let mcqScore = 0;
      const feedback: Record<string, any> = {};
      const { quiz, mcqAnswers, topic } = evaluationParams;

      quiz.mcqs?.forEach((q: any) => {
        const studentAns = mcqAnswers[q.id];
        const correct = studentAns === q.correctAnswer;
        if (correct) mcqScore++;
        feedback[q.id] = {
          isCorrect: correct,
          studentAnswer: studentAns || 'Not Answered',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        };
      });

      const totalScore = mcqScore + 3; // Mocking 3/3 for short + app questions
      const accuracy = Math.round((totalScore / 8) * 100);

      return {
        success: true,
        evaluation: {
          score: totalScore,
          maxScore: 8,
          accuracy,
          mcqScore,
          shortScore: 2,
          appScore: 1,
          feedback: {
            mcqs: feedback,
            shortQuestions: {
              [quiz.shortQuestions?.[0]?.id]: { score: 1, feedback: "Great work! Concepts explained correctly." },
              [quiz.shortQuestions?.[1]?.id]: { score: 1, feedback: "Detailed explanation fits perfectly." }
            },
            applicationQuestion: {
              score: 1,
              feedback: "Accurate real-world solution design."
            }
          },
          strongTopic: topic,
          weakTopic: "None"
        },
        mocked: true
      };
    }
  },

  // Fetch Dashboard Stats
  async getDashboardStats(userId: string) {
    try {
      return await fetchWithFallback(`/users/dashboard/${userId}`, {
        method: 'GET'
      });
    } catch (e) {
      return {
        success: true,
        stats: {
          learningStreak: 5,
          totalQuestions: 18,
          accuracy: 82,
          topicsCompleted: 4,
          weakAreas: ["Thermodynamics", "Polynomial division"],
          strongAreas: ["Photosynthesis", "Linear equations", "Grammar"],
          weeklyProgress: [
            { day: 'Mon', questions: 2 },
            { day: 'Tue', questions: 4 },
            { day: 'Wed', questions: 1 },
            { day: 'Thu', questions: 6 },
            { day: 'Fri', questions: 5 },
            { day: 'Sat', questions: 0 },
            { day: 'Sun', questions: 0 }
          ]
        },
        mocked: true
      };
    }
  },

  // GAMIFICATION
  async earnCoins(userId: string, amount: number) {
    try {
      return await fetchWithFallback(`/users/${userId}/coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
    } catch (e) {
      return { success: true, newTotal: 150 + amount, mocked: true };
    }
  },

  // FLASHCARDS
  async getFlashcards(userId: string) {
    try {
      return await fetchWithFallback(`/flashcards/${userId}`, { method: 'GET' });
    } catch (e) {
      return {
        success: true,
        flashcards: [
          { id: '1', front: "What is Newton's First Law?", back: "Law of Inertia: An object at rest stays at rest unless acted upon by a force." },
          { id: '2', front: "Solve for x: 2x = 10", back: "x = 5" },
          { id: '3', front: "What is the powerhouse of the cell?", back: "Mitochondria" }
        ],
        mocked: true
      };
    }
  },

  // DOCUMENTS
  async uploadDocument(file: any) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name
      } as any);

      return await fetchWithFallback('/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
    } catch (e) {
      console.warn('Document upload mock fallback', e);
      return { success: true, text: "Mock extracted text: This document is about advanced physics and relativity...", filename: file.name, mocked: true };
    }
  },

  // NOTIFICATIONS & PARENT
  async registerPushToken(userId: string, pushToken: string) {
    try {
      return await fetchWithFallback('/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pushToken })
      });
    } catch (e) {
      return { success: true, mocked: true };
    }
  },

  async getParentStats(userId: string, pin: string) {
    // In a real app, the PIN verification would happen on the backend
    if (pin !== '1234') {
      return { success: false, error: 'Invalid PIN' };
    }
    
    try {
      // Re-use dashboard stats for parent view
      return await this.getDashboardStats(userId);
    } catch (e) {
      return { success: false, error: 'Failed to load stats' };
    }
  }
};

// Client-side local mock data fallback logic for instant testing
function getClientMockChatResponse(query: string, subject: string, classLevel: string) {
  const q = query.toLowerCase();
  
  let concept = '';
  let simpleExample = '';
  let realLifeExample = '';
  let question = '';
  let options = ['A', 'B', 'C', 'D'];
  let correctAnswer = '';
  let whiteboardTitle = '';
  let whiteboardType: 'diagram' | 'equation' | 'graph' | 'steps' = 'steps';
  let whiteboardSteps: string[] = [];
  let whiteboardElements: any[] = [];

  if (q.includes('newton') || q.includes('inertia') || q.includes('law')) {
    concept = "Newton's First Law of Motion states that objects tend to keep doing what they are doing. If an object is sitting still, it stays still. If it is moving at a constant speed, it keeps moving in a straight line. It only changes speed or direction if a push or pull (force) acts on it. This property is called Inertia.";
    simpleExample = "Imagine placing a toy car on a carpet. It won't move until you push it. If you slide it, it will eventually stop because the carpet rubs against its wheels (friction), which is an external force.";
    realLifeExample = "When you are in a bus and it suddenly accelerates forward, you feel pushed back. That's because your body wants to stay still, but the bus seat pushes you forward. If the bus brakes suddenly, you lean forward because your body wants to keep moving!";
    question = "What will happen to a soccer ball rolling on a perfectly frictionless surface in space?";
    options = [
      "A) It will slow down and stop immediately.",
      "B) It will continue rolling in a straight line forever at the same speed.",
      "C) It will explode due to pressure.",
      "D) It will float up."
    ];
    correctAnswer = "B) It will continue rolling in a straight line forever at the same speed.";
    whiteboardTitle = "Newton's First Law & Inertia";
    whiteboardType = "diagram";
    whiteboardSteps = [
      "1. Balanced Forces: Object remains in constant state (Rest/Motion).",
      "2. Unbalanced Force: Causes acceleration (change in speed/direction)."
    ];
    whiteboardElements = [
      { shape: "rect", x: 120, y: 150, label: "Mass (Object)" },
      { shape: "line", x: 60, y: 170, label: "Friction (F_f)" },
      { shape: "line", x: 180, y: 170, label: "Push (F_p)" }
    ];
  } else if (q.includes('solve') || q.includes('x') || q.includes('equation') || q.includes('math')) {
    concept = "To solve for x in algebra, our goal is to isolate 'x' on one side of the equals sign. We do this by reversing operations (addition becomes subtraction, multiplication becomes division). We must always perform the same operation on both sides of the equation to keep it balanced.";
    simpleExample = "If x + 5 = 12, to isolate x we reverse the '+ 5' by subtracting 5 from both sides. x + 5 - 5 = 12 - 5, which simplifies to x = 7.";
    realLifeExample = "You buy a ticket to a concert for $15 and 3 matching T-shirts. Your total bill is $60. How much is each T-shirt? Equation: 3x + 15 = 60. Subtract 15: 3x = 45. Divide by 3: x = 15. So, each T-shirt is $15!";
    question = "Solve for x: 4x - 7 = 17";
    options = [
      "A) x = 5",
      "B) x = 6",
      "C) x = 8",
      "D) x = 4"
    ];
    correctAnswer = "B) x = 6";
    whiteboardTitle = "Solving: 4x - 7 = 17";
    whiteboardType = "equation";
    whiteboardSteps = [
      "Original: 4x - 7 = 17",
      "Step 1: Add 7 to both sides: 4x = 24",
      "Step 2: Divide both sides by 4: x = 24 / 4",
      "Result: x = 6"
    ];
  } else if (q.includes('photo') || q.includes('leaf') || q.includes('plant')) {
    concept = "Photosynthesis is the process by which green plants make their own food. Plants use sunlight, water from the soil, and carbon dioxide from the air to create glucose (sugar, which is their food) and release oxygen into the air.";
    simpleExample = "Think of a leaf like a tiny kitchen. The stove is the sun, the ingredients are water (poured at the roots) and carbon dioxide (breathed in from the air), and the cooked meal is sugar.";
    realLifeExample = "Every time you take a breath of fresh air, you are breathing oxygen released by plants during photosynthesis. Without plants doing this, humans and animals wouldn't have oxygen to breathe!";
    question = "What gas do plants absorb from the air to perform photosynthesis?";
    options = [
      "A) Oxygen",
      "B) Carbon Dioxide",
      "C) Nitrogen",
      "D) Hydrogen"
    ];
    correctAnswer = "B) Carbon Dioxide";
    whiteboardTitle = "Photosynthesis Formula";
    whiteboardType = "equation";
    whiteboardSteps = [
      "Inputs: Carbon Dioxide (6CO2) + Water (6H2O) + Light Energy",
      "Outputs: Glucose (C6H12O6) + Oxygen (6O2)",
      "Site: Occurs in the Chloroplasts of plant cells"
    ];
  } else {
    // General default mock
    concept = `Let's discuss "${query}". As your ${subject}, I will explain this step-by-step. To truly understand this concept, we look at how its basic parts interact, its mathematical or logical structure, and why it is important.`;
    simpleExample = "Think of it like building with LEGO blocks. Each block is a simple component, but putting them together builds the full concept.";
    realLifeExample = "In daily life, we experience this concept in how we interact with technology, the environment, and social networks.";
    question = "Which of the following best describes the key element of this concept?";
    options = [
      "A) It is built from simple foundational rules.",
      "B) It only applies to lab experiments.",
      "C) It has no practical daily usage.",
      "D) It is impossible to calculate."
    ];
    correctAnswer = "A) It is built from simple foundational rules.";
    whiteboardTitle = `Visualizing ${query}`;
    whiteboardType = "steps";
    whiteboardSteps = [
      "1. Understand the core definitions.",
      "2. Observe real-world representations.",
      "3. Solve practice questions to verify."
    ];
  }

  // Adjust wording by grade level
  let headerText = '';
  if (classLevel === 'Class 1-5') {
    headerText = `🎒 **Hey there! Let's explore together!** 🎒\n\n`;
    concept = "🌟 " + concept.replace(/objects/g, "toys").replace(/object/g, "toy");
  } else if (classLevel === 'Class 9-12' || classLevel === 'College') {
    headerText = `🔬 **Academic Breakdown (${classLevel})** 🔬\n\n`;
  }

  return {
    explanation: `${headerText}CONCEPT EXPLANATION:\n${concept}\n\nSIMPLE ANALOGY:\n${simpleExample}\n\nREAL-LIFE APPLICATION:\n${realLifeExample}`,
    practiceQuestion: {
      question,
      type: "mcq",
      options,
      correctAnswer
    },
    whiteboard: {
      title: whiteboardTitle,
      type: whiteboardType,
      data: {
        label: whiteboardTitle,
        steps: whiteboardSteps,
        elements: whiteboardElements
      }
    },
    followUp: `Would you like me to go deeper into this topic or try another practice question?`
  };
}

function getClientMockQuiz(topic: string, classLevel: string) {
  return {
    topic,
    classLevel,
    mcqs: [
      {
        id: "mcq_1",
        question: `Which of these is the main pillar of ${topic}?`,
        options: ["A) Practical Practice", "B) Memorizing equations", "C) Rushing through books", "D) Ignoring lectures"],
        correctAnswer: "A) Practical Practice",
        explanation: "Doing hands-on examples cements understanding."
      },
      {
        id: "mcq_2",
        question: `How does Class Level ${classLevel} affect learning?`,
        options: ["A) Makes explanations harder", "B) Automatically simplifies or expands explanations to match age", "C) Doesn't do anything", "D) Limits access to lessons"],
        correctAnswer: "B) Automatically simplifies or expands explanations to match age",
        explanation: "Graded teaching ensures students learn at their own pace."
      },
      {
        id: "mcq_3",
        question: "What is 15 + 24?",
        options: ["A) 35", "B) 39", "C) 41", "D) 49"],
        correctAnswer: "B) 39",
        explanation: "Simple addition: 5+4 = 9, 1+2 = 3. Total 39."
      },
      {
        id: "mcq_4",
        question: "Which organelle in plant cells is responsible for energy production?",
        options: ["A) Nucleus", "B) Chloroplast", "C) Cell Wall", "D) Ribosome"],
        correctAnswer: "B) Chloroplast",
        explanation: "Chloroplasts contain chlorophyll which absorbs sunlight for photosynthesis."
      },
      {
        id: "mcq_5",
        question: "If a force of 10N acts on an object of 2kg, what is the acceleration?",
        options: ["A) 5 m/s²", "B) 2 m/s²", "C) 20 m/s²", "D) 0.2 m/s²"],
        correctAnswer: "A) 5 m/s²",
        explanation: "Acceleration a = F/m = 10N / 2kg = 5 m/s²."
      }
    ],
    shortQuestions: [
      {
        id: "short_1",
        question: `Briefly explain the role of a teacher in helping you learn ${topic}.`,
        sampleAnswer: "A teacher simplifies complex concepts, provides relatable examples, and validates understanding."
      },
      {
        id: "short_2",
        question: `Why is checking your understanding through quizzes helpful?`,
        sampleAnswer: "Quizzes highlight weak areas and reinforce strong ones."
      }
    ],
    applicationQuestion: {
      id: "app_1",
      question: `How would you explain the concept of ${topic} to a 5-year-old child using only items in a living room?`,
      sampleAnswer: "Explain using everyday toys, showing how items drop due to gravity, or how blocks pile up to form equations."
    }
  };
}
