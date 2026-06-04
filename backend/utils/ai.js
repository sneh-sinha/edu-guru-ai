const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY || '';
let openai = null;

if (openaiApiKey) {
  try {
    openai = new OpenAI({ 
      apiKey: openaiApiKey,
      baseURL: "https://openrouter.ai/api/v1"
    });
    console.log('OpenAI client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error.message);
  }
} else {
  console.log('OpenAI API key missing. AI responses will be mocked.');
}

module.exports = openai;
