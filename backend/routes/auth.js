const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '12063504761-52urhg7cbnb5sma4epe1inn5shkerv5q.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// POST /api/auth/signup
router.post('/signup', [
  body('name').trim().escape().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, error: errors.array()[0].msg });
  }
  const { name, email, password } = req.body;
  if (!supabase) {
    const mockUser = { id: 'mock-id', name, email, class_level: 'Not Set' };
    const token = jwt.sign({ id: mockUser.id, email: mockUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, user: mockUser, token });
  }
  
  try {
    const { data: existing, error: checkErr } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (existing) {
      return res.json({ success: false, error: 'Email already exists. Please login instead.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, class_level: 'Not Set' })
      .select().single();
      
    if (insertErr) throw insertErr;

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Don't send password hash back
    delete newUser.password;

    return res.json({ success: true, user: newUser, token });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, error: errors.array()[0].msg });
  }
  const { email, password } = req.body;
  if (!supabase) {
    const mockUser = { id: 'mock-id', email, class_level: 'Class 6-8' };
    const token = jwt.sign({ id: mockUser.id, email: mockUser.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, user: mockUser, token });
  }
  
  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    
    if (!user) {
      return res.json({ success: false, error: 'Invalid email or password' });
    }

    let isMatch = false;
    // Check if it's a legacy plain text password or hashed password
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (password === user.password); // Fallback for old accounts
    }

    if (!isMatch) {
      return res.json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Don't send password hash back
    delete user.password;

    return res.json({ success: true, user, token });
  } catch (err) {
    return res.json({ success: false, error: 'Login failed' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { idToken, user: clientUser } = req.body;
  
  try {
    let email, name;
    
    if (idToken) {
      // Verify the token securely with Google
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } else if (clientUser && clientUser.email) {
      // Fallback for access token based flow
      email = clientUser.email;
      name = clientUser.name || 'Google User';
    } else {
      return res.json({ success: false, error: 'No user data provided' });
    }

    if (!supabase) {
      const mockUser = { id: 'google-mock-id', email, name, class_level: 'Not Set' };
      const token = jwt.sign({ id: mockUser.id, email: mockUser.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, user: mockUser, token });
    }
    
    // Check if user exists
    const { data: user, error: fetchErr } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    
    let finalUser = user;
    if (!user) {
      // Create new user for google login
      // Generate a random password since they use Google to login
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({ name, email, password: hashedPassword, class_level: 'Not Set' })
        .select().single();
        
      if (insertErr) throw insertErr;
      finalUser = newUser;
    }
    
    const token = jwt.sign({ id: finalUser.id, email: finalUser.email }, JWT_SECRET, { expiresIn: '7d' });
    delete finalUser.password;
    
    return res.json({ success: true, user: finalUser, token });
  } catch (err) {
    console.error('Google login error:', err);
    return res.json({ success: false, error: 'Google Login failed' });
  }
});

module.exports = router;
