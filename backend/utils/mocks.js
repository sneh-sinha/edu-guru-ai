// Fallback high-quality teaching mock response generator
function getMockResponse(query, subject, classLevel) {
  const lowercaseQuery = query.toLowerCase();
  
  let explanation = '';
  let concept = '';
  let simpleExample = '';
  let realLifeExample = '';
  let practiceQuestion = {};
  let whiteboard = {};
  let followUp = '';

  if (lowercaseQuery.includes('newton') || lowercaseQuery.includes('force') || lowercaseQuery.includes('law')) {
    concept = "Newton's First Law of Motion (also known as the Law of Inertia) states that an object at rest will stay at rest, and an object in motion will stay in motion with a constant velocity, unless acted upon by a net external force.";
    simpleExample = "Imagine placing a soccer ball on a flat grass field. It will sit there forever unless you kick it. Once kicked, it would slide forever, but friction and air resistance eventually force it to slow down and stop.";
    realLifeExample = "When you are riding in a car and the driver suddenly hits the brakes, your body jerks forward. This is because your body was moving forward at the speed of the car, and it wants to keep moving forward even though the car has stopped!";
    
    explanation = `NEWTON'S FIRST LAW (LAW OF INERTIA)\n\n${concept}\n\nA SIMPLE EXPLANATION:\n${simpleExample}\n\nEVERYDAY APPLICATION:\n${realLifeExample}`;
    
    practiceQuestion = {
      question: "If a spaceship is traveling in deep space (where there is no gravity or air friction) and its engines turn off, what will happen to the spaceship?",
      type: "mcq",
      options: [
        "A) It will slow down and eventually stop.",
        "B) It will continue moving at the exact same speed and direction.",
        "C) It will immediately stop in place.",
        "D) It will fly in random circles."
      ],
      correctAnswer: "B) It will continue moving at the exact same speed and direction."
    };

    whiteboard = {
      title: "Inertia Visualization",
      type: "diagram",
      data: {
        label: "Forces acting on an object",
        steps: ["Object at Rest: Net force = 0", "Object in Motion: Net force = 0 (moving at constant speed)", "External Net Force applied: Acceleration occurs"],
        elements: [
          { shape: "rect", x: 100, y: 150, label: "Block (Mass)" },
          { shape: "line", x: 50, y: 175, label: "Friction (Ff)" },
          { shape: "line", x: 150, y: 175, label: "Applied Force (Fa)" }
        ]
      }
    };

    followUp = "Can you think of another time you felt inertia in action, like on a slide or rollercoaster?";

  } else if (lowercaseQuery.includes('gravity') || lowercaseQuery.includes('gravitation')) {
    concept = "Gravity is an invisible pulling force that pulls objects toward each other. Anything that has mass (amount of matter) also has a gravitational pull. The more mass an object has, the stronger its gravity.";
    simpleExample = "Think of a heavy bowling ball sitting on a trampoline. It creates a deep dip. If you roll smaller marbles nearby, they will spiral toward the bowling ball. That dip represents how gravity warps space!";
    realLifeExample = "Gravity is what holds our feet to the Earth, keeps the Moon in orbit around us, and ensures that when you toss a basketball up in the air, it falls back down into the hoop.";
    
    explanation = `WHAT IS GRAVITY?\n\n${concept}\n\nSIMPLE TRAMPOLINE EXAMPLE:\n${simpleExample}\n\nREAL LIFE APPLICATION:\n${realLifeExample}`;
    
    practiceQuestion = {
      question: "Which of the following objects has the strongest gravitational force?",
      type: "mcq",
      options: [
        "A) A bowling ball",
        "B) The Moon",
        "C) The Earth",
        "D) The Sun"
      ],
      correctAnswer: "D) The Sun"
    };

    whiteboard = {
      title: "Gravitational Warp",
      type: "graph",
      data: {
        label: "Gravity well curve",
        steps: ["Space-time fabric is flat without mass", "Adding mass creates a gravity well", "Smaller objects fall into this curve"],
        elements: [
          { shape: "circle", x: 200, y: 200, label: "Earth" },
          { shape: "circle", x: 350, y: 150, label: "Moon (Orbital path)" }
        ]
      }
    };

    followUp = "If the Earth suddenly lost its gravity, what do you think would happen to the oceans?";

  } else if (lowercaseQuery.includes('solve') || lowercaseQuery.includes('x') || lowercaseQuery.includes('math') || lowercaseQuery.includes('equation')) {
    concept = "Solving algebraic equations is like balancing a scale. Whatever operation you perform on one side of the equals sign (=), you must perform on the other side to keep the balance. Our goal is to isolate the variable (x) on one side.";
    simpleExample = "If you have a box of mystery chocolates plus 5 extra chocolates, and it equals 12 chocolates in total. How many chocolates are in the mystery box? (Box + 5 = 12). To solve it, subtract 5 from both sides: Box = 7.";
    realLifeExample = "Suppose you are saving money to buy a video game that costs $60. You already have $15. If you save $5 every week, how many weeks (w) will it take? Equation: 5w + 15 = 60. Subtract 15: 5w = 45. Divide by 5: w = 9 weeks!";
    
    explanation = `BALANCING EQUATIONS (ALGEBRA)\n\n${concept}\n\nCHOCOLATE BOX ANALOGY:\n${simpleExample}\n\nREAL LIFE BUDGETING:\n${realLifeExample}`;
    
    practiceQuestion = {
      question: "Solve the equation for x: 3x - 4 = 17",
      type: "mcq",
      options: [
        "A) x = 5",
        "B) x = 7",
        "C) x = 6",
        "D) x = 8"
      ],
      correctAnswer: "B) x = 7"
    };

    whiteboard = {
      title: "Solving 3x - 4 = 17",
      type: "equation",
      data: {
        label: "Steps to isolate x",
        steps: [
          "Original: 3x - 4 = 17",
          "Step 1: Add 4 to both sides: 3x = 17 + 4",
          "Step 2: Simplify: 3x = 21",
          "Step 3: Divide both sides by 3: x = 21 / 3",
          "Result: x = 7"
        ]
      }
    };

    followUp = "Would you like me to generate another equation for you to try solving by yourself?";
  } else {
    // Default fallback topic
    concept = `Let's talk about "${query}". In academic studies, we break down topics into fundamentals so that they become clear and easy to understand.`;
    simpleExample = "A basic model is comparing the concept to something we can touch and feel in a small, local system.";
    realLifeExample = "In daily life, we encounter this concept whenever we interact with standard technology, environment, or communication.";
    
    explanation = `LEARNING ABOUT ${query.toUpperCase()}\n\n${concept}\n\nSIMPLE ANALOGY:\n${simpleExample}\n\nEVERYDAY APPLICATION:\n${realLifeExample}`;
    
    practiceQuestion = {
      question: `Which of the following describes the core theme of ${query}?`,
      type: "mcq",
      options: [
        "A) It is a fundamental law of nature.",
        "B) It is a tool for problem solving.",
        "C) It is a historical milestone.",
        "D) All of the above depend on the context."
      ],
      correctAnswer: "D) All of the above depend on the context."
    };

    whiteboard = {
      title: query,
      type: "steps",
      data: {
        label: `Conceptual Map of ${query}`,
        steps: ["Core Idea", "Analogy", "Application", "Testing"]
      }
    };

    followUp = "What specific part of this concept would you like to explore first?";
  }

  // Adjust tone/structure slightly based on grade
  if (classLevel === 'Class 1-5') {
    explanation = `🌟 **Hi there! Let's learn together!** 🌟\n\n${explanation.replace(/Newton's First Law of Motion/g, "Newton's Magic Soccer Ball Rule")}`;
  }

  return {
    explanation,
    practiceQuestion,
    whiteboard,
    followUp
  };
}

// Generate Mock Quiz
function getMockQuiz(topic, classLevel) {
  return {
    topic,
    classLevel,
    mcqs: [
      {
        id: "mcq_1",
        question: `What is the primary factor in ${topic}?`,
        options: ["A) Energy", "B) Matter", "C) Time", "D) Space"],
        correctAnswer: "A) Energy",
        explanation: "Energy is the fundamental driving force."
      },
      {
        id: "mcq_2",
        question: `How does Class-level ${classLevel} relate to ${topic}?`,
        options: ["A) Advanced theoretical math only", "B) Structured step-by-step introduction", "C) Only historical dates", "D) It does not apply"],
        correctAnswer: "B) Structured step-by-step introduction",
        explanation: "Learning levels adapt the depth of the concept."
      },
      {
        id: "mcq_3",
        question: `Which of these is a daily example of ${topic}?`,
        options: ["A) Eating food for power", "B) Staring at a wall", "C) Sleeping at night", "D) All of the above"],
        correctAnswer: "A) Eating food for power",
        explanation: "Daily activities illustrate physics and biological energy."
      },
      {
        id: "mcq_4",
        question: "What is the opposite of kinetic energy?",
        options: ["A) Thermal energy", "B) Chemical energy", "C) Potential energy", "D) Nuclear energy"],
        correctAnswer: "C) Potential energy",
        explanation: "Potential energy is stored energy, whereas kinetic is energy of motion."
      },
      {
        id: "mcq_5",
        question: "When applying a constant force to an object, what happens?",
        options: ["A) It stops immediately", "B) It accelerates", "C) It decelerates", "D) It gains mass"],
        correctAnswer: "B) It accelerates",
        explanation: "According to Newton's Second Law, F = ma, so a constant net force causes acceleration."
      }
    ],
    shortQuestions: [
      {
        id: "short_1",
        question: `Explain the main concept of ${topic} in your own words.`,
        sampleAnswer: "It relates to how energy transfers between different systems under physical laws."
      },
      {
        id: "short_2",
        question: `Give one major advantage of applying ${topic} in real life.`,
        sampleAnswer: "It helps us build better machines, understand weather patterns, and optimize energy usage."
      }
    ],
    applicationQuestion: {
      id: "app_1",
      question: `If you were a scientist tasked with building a solar-powered vehicle, how would you apply the principles of ${topic} to maximize its efficiency?`,
      sampleAnswer: "By converting solar radiation into electric currents with high efficiency, reducing friction in wheels, and using lightweight materials."
    }
  };
}

module.exports = { getMockResponse, getMockQuiz };
