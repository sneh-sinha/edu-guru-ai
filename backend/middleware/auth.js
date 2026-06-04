const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    // For demo/mock purposes, if no token is provided but it's a guest or mocked environment
    // we can allow it, or strictly return 401. Let's return 401.
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ success: false, error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
