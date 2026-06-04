const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getSystemPrompt } = require('../utils/prompts');
const { getMockResponse } = require('../utils/mocks');
const { saveToHistory } = require('../utils/history');
const { aiLimiter } = require('../middleware/rateLimit');
const openai = require('../utils/ai');

const upload = multer({ dest: 'uploads/' });

// POST /api/chat
router.post('/', aiLimiter, [
  body('message').trim().isString().isLength({ max: 2000 }),
  body('userId').optional().isString().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Invalid input message format' });
  }

  let { userId, message, subject = 'General Knowledge Teacher', classLevel = 'Class 6-8', preferredLanguage = 'English', history = [] } = req.body;

  // Basic Input Sanitization (Phase 1 Security)
  if (message) {
    message = message.replace(/[<>]/g, ''); // Strip basic HTML tags
  }

  console.log(`[CHAT] Query: "${message}" | Subject: ${subject} | Grade: ${classLevel}`);

  if (!openai) {
    // Return high-quality Mock response if OpenAI is not configured
    const mockResponse = getMockResponse(message, subject, classLevel);
    
    // Save to Supabase if available
    await saveToHistory(userId, subject, message, JSON.stringify(mockResponse));
    
    return res.json({ success: true, data: mockResponse, mocked: true });
  }

  try {
    const systemPrompt = getSystemPrompt(subject, classLevel, preferredLanguage);

    // Format chat history for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Include recent history (limit to last 4 turns)
    const recentHistory = history.slice(-4);
    recentHistory.forEach(h => {
      messages.push({ role: 'user', content: h.question });
      messages.push({ role: 'assistant', content: typeof h.ai_response === 'string' ? h.ai_response : JSON.stringify(h.ai_response) });
    });

    // Add current user prompt
    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages
    });

    const aiText = completion.choices[0].message.content;
    
    // Safety fallback: sometimes LLM might wrap JSON in markdown block like ```json ... ```
    let parsedData;
    try {
      const jsonStart = aiText.indexOf('{');
      const jsonEnd = aiText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsedData = JSON.parse(aiText.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response. Raw output:', aiText);
      // Fallback response format if AI messes up the schema
      parsedData = {
        isRelatedToSubject: true,
        explanation: aiText,
        followUp: "Did you understand my explanation?"
      };
    }

    // Save history
    await saveToHistory(userId, subject, message, JSON.stringify(parsedData));

    return res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error in OpenAI API:', error);
    // Graceful fallback for network/timeout errors
    const mock = getMockResponse(message, subject, classLevel);
    
    // Inject the real error into the UI so we can debug it
    mock.explanation = "⚠️ **API CONNECTION ERROR:** The AI API failed to respond. Error details: `" + error.message + "`\n\nIf you see a 401 or 403 error, your API key is invalid. If you see 404, the model name is incorrect. If you see 429, you are being rate-limited.\n\n---\n\n" + mock.explanation;

    return res.status(200).json({ success: true, data: mock, error: error.message, mocked: true });
  }
});

// POST /api/voice-chat
router.post('/voice-chat', upload.single('audio'), async (req, res) => {
  const { userId, subject = 'General Knowledge Teacher', classLevel = 'Class 6-8', preferredLanguage = 'English' } = req.body;
  const audioFile = req.file;

  console.log(`[VOICE-CHAT] Received audio request. File details:`, audioFile ? audioFile.originalname : 'base64 or empty');

  if (!openai) {
    // Return mock voice transcription and response
    const mockText = "What is Newton's First Law?";
    const mockResponse = getMockResponse(mockText, subject, classLevel);
    // Mock base64 audio response (a short empty sound file representation or placeholder)
    const mockAudioBase64 = "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA"; 
    
    await saveToHistory(userId, subject, "[Voice Question]", JSON.stringify(mockResponse));
    return res.json({
      success: true,
      transcription: mockText,
      data: mockResponse,
      audioBase64: mockAudioBase64,
      mocked: true
    });
  }

  try {
    let transcription = '';

    if (audioFile) {
      // Perform Speech-To-Text with Whisper
      const translation = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile.path),
        model: 'whisper-1',
      });
      transcription = translation.text;
      
      // Clean up upload file
      fs.unlinkSync(audioFile.path);
    } else if (req.body.audioBase64) {
      // If client sent audio as base64, save to a temp file first
      const tempPath = path.join(__dirname, `../uploads/temp_${Date.now()}.wav`);
      fs.writeFileSync(tempPath, Buffer.from(req.body.audioBase64, 'base64'));
      const translation = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-1',
      });
      transcription = translation.text;
      fs.unlinkSync(tempPath);
    } else {
      throw new Error("No audio source provided");
    }

    console.log(`[VOICE-CHAT] Transcribed: "${transcription}"`);

    // Get Teacher response
    const systemPrompt = getSystemPrompt(subject, classLevel, preferredLanguage);
    const completion = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcription }
      ]
    });

    const aiText = completion.choices[0].message.content;
    let parsedData;
    try {
      parsedData = JSON.parse(aiText);
    } catch (parseError) {
      console.error('Failed to parse Voice JSON. Raw output:', aiText);
      parsedData = {
        isRelatedToSubject: true,
        explanation: "I heard you say: " + transcription + ". " + aiText,
        followUp: "Did you catch all that?"
      };
    }

    // Save history
    await saveToHistory(userId, subject, transcription, JSON.stringify(parsedData));

    // Convert teacher explanation to Speech (TTS)
    // We speech-synthesize the explanation text (cleaned of markdown stars)
    const speechText = parsedData.explanation.replace(/[*#`_\-]/g, '').substring(0, 400) + ". Let me check your understanding: " + parsedData.followUp;
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy', // friendly teacher voice
      input: speechText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioBase64 = buffer.toString('base64');

    return res.json({
      success: true,
      transcription,
      data: parsedData,
      audioBase64
    });
  } catch (error) {
    console.error('Error in Voice Chat:', error);
    const fallbackTrans = "Explain gravity";
    const mock = getMockResponse(fallbackTrans, subject, classLevel);
    return res.status(200).json({
      success: true,
      transcription: fallbackTrans,
      data: mock,
      audioBase64: "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA",
      error: error.message,
      mocked: true
    });
  }
});

module.exports = router;
