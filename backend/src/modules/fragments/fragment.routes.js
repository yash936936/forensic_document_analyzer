// backend/src/modules/fragments/fragment.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../auth/auth.middleware');
const { uploadFragments, getFragmentsByCase } = require('./fragment.controller');

// FIX: Validate file type (images and PDFs only) and cap size at 10 MB.
// Previously multer accepted any file of any size.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage(); // keep in memory; write to disk in controller

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 20 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}. Accepted: JPEG, PNG, TIFF, WEBP, PDF`));
    }
  },
});

const router = express.Router();

// FIX: protect middleware now guards every route.
// Previously these were completely unauthenticated.
router.use(protect);

router.route('/')
  .post(upload.array('files', 20), uploadFragments);

router.route('/case/:caseId')
  .get(getFragmentsByCase);

module.exports = router;
