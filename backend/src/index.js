// backend/src/index.js
// FIX: dotenv MUST be the very first line so every module that
// loads after it (including app.js and db.js) sees the env vars.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // FIX: handler now calls process.exit(1) after server close so the
  // process doesn't linger in a broken state.
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION — shutting down:', err);
    server.close(() => process.exit(1));
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION — shutting down:', err);
    server.close(() => process.exit(1));
  });
});
