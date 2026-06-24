// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize'); // FIX: add NoSQL injection protection
const rateLimit = require('express-rate-limit');         // FIX: add rate limiting

const caseRoutes = require('./modules/cases/case.routes');
const fragmentRoutes = require('./modules/fragments/fragment.routes');
const authRoutes = require('./modules/auth/auth.routes');

const app = express();

// FIX: Lock CORS to your exact domain instead of trusting any *.vercel.app
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// FIX: Sanitize req.body / req.params / req.query against NoSQL injection
app.use(mongoSanitize());

// FIX: Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/fragments', fragmentRoutes);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Global error handler — FIX: never leak stack traces to the client
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

module.exports = app;
