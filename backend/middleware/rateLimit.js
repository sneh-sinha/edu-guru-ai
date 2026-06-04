const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 AI requests per minute per IP to protect credits
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You are sending questions too fast! Please slow down to protect our AI servers.' }
});

module.exports = { apiLimiter, aiLimiter };
