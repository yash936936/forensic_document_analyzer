// backend/src/modules/cases/case.routes.js
const express = require('express');
const { protect, restrictTo } = require('../auth/auth.middleware');
const {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
} = require('./case.controller');

const router = express.Router();

// FIX: Every route now requires a valid JWT.
// Previously GET and POST had no auth — anyone could read/create forensic cases.
router.use(protect);

router.route('/')
  .get(getAllCases)
  .post(createCase);

router.route('/:id')
  .get(getCaseById)
  // FIX: restrict updates and deletes to admin/forensic-analyst roles
  .patch(restrictTo('admin', 'forensic-analyst'), updateCase)
  .delete(restrictTo('admin'), deleteCase);

module.exports = router;
