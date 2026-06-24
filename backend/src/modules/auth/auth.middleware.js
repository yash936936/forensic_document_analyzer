// backend/src/modules/auth/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+active');
    if (!user || !user.active) {
      return res.status(401).json({ status: 'error', message: 'User no longer exists or is deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
  }
};

// FIX: restrictTo was defined but never applied anywhere.
// Now used in case.routes.js for role-based access.
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ status: 'error', message: 'You do not have permission to perform this action.' });
  }
  next();
};
