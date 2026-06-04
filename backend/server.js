const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { apiLimiter } = require('./middleware/rateLimit');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const ocrRoutes = require('./routes/ocr');
const quizRoutes = require('./routes/quiz');
const flashcardRoutes = require('./routes/flashcards');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:8081', 'http://127.0.0.1:8081'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiLimiter);

// ----------------------------------------------------
// FEATURE: CHAT & VOICE-CHAT
// ----------------------------------------------------
app.use('/api/chat', authMiddleware, chatRoutes);

// ----------------------------------------------------
// FEATURE 5: IMAGE QUESTION SOLVER (OCR + SOLUTION)
// ----------------------------------------------------
app.use('/api/ocr', authMiddleware, ocrRoutes);

// ----------------------------------------------------
// FEATURE 7: QUIZ GENERATOR ENDPOINT
// ----------------------------------------------------
app.use('/api/quiz', authMiddleware, quizRoutes);

// ----------------------------------------------------
// FEATURE: FLASHCARDS
// ----------------------------------------------------
app.use('/api/flashcards', authMiddleware, flashcardRoutes);

// ----------------------------------------------------
// FEATURE: DOCUMENTS
// ----------------------------------------------------
app.use('/api/documents', authMiddleware, documentRoutes);

// ----------------------------------------------------
// FEATURE: NOTIFICATIONS
// ----------------------------------------------------
app.use('/api/notifications', authMiddleware, notificationRoutes);

// ----------------------------------------------------
// FEATURE: AUTHENTICATION & PROFILE
// ----------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, usersRoutes);


// Start Server
app.listen(PORT, () => {
  console.log(`EduGuru AI Backend running on port ${PORT}`);
});
