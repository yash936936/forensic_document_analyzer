// backend/src/modules/auth/auth.routes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, register, logout } = require('./auth.controller');
const { protect } = require('./auth.middleware');

// FIX: Tight rate limiter for auth endpoints — 10 attempts per 15 minutes.
// Previously there was no rate limiting, allowing brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);

module.exports = router;
