// backend/src/modules/auth/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',  // FIX: reduced from 30d to 1d
  });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    // Prevent self-assigning admin role
    const safeRole = role === 'admin' ? 'viewer' : role;
    const user = await User.create({ name, email, password, role: safeRole });
    const token = signToken(user._id);
    res.status(201).json({ status: 'success', token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Email already registered.' });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    // select: false means we must explicitly request the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Incorrect email or password.' });
    }

    const token = signToken(user._id);
    res.json({ status: 'success', token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  // Client must delete the token. Server-side revocation via a blocklist
  // can be added here if needed (e.g. add token to a Redis set).
  res.json({ status: 'success', message: 'Logged out successfully.' });
};
