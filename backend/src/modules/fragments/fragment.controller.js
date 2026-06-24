// backend/src/modules/fragments/fragment.controller.js
const fs = require('fs');
const path = require('path');
const Fragment = require('./fragment.model');
const Case = require('../cases/case.model');
const aiService = require('../../services/ai.service');

const UPLOAD_DIR = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

exports.uploadFragments = async (req, res, next) => {
  try {
    // FIX: Guard against empty uploads — previously this would crash with
    // "Cannot read properties of undefined (reading 'length')".
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No files uploaded.' });
    }

    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ status: 'error', message: 'caseId is required.' });
    }

    // FIX: Run all AI analysis calls in parallel instead of sequentially.
    // Previously: for (const file of req.files) { await analyzeFragment(file) }
    // Now: all files are sent to the AI service simultaneously.
    const analysisResults = await Promise.all(
      req.files.map(async (file) => {
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filePath, file.buffer);

        let analysis = {};
        try {
          analysis = await aiService.analyzeFragment(filePath, file.mimetype);
        } catch (aiErr) {
          // AI failure is non-fatal — save the fragment anyway, mark analysis pending
          console.error('AI analysis failed for', filename, aiErr.message);
          analysis = { fraudScore: null, ocrText: null, elaScore: null, status: 'pending' };
        }

        return { file, filename, filePath, analysis };
      })
    );

    // Persist fragments to DB
    const fragments = await Fragment.insertMany(
      analysisResults.map(({ file, filename, analysis }) => ({
        caseId,
        originalName: file.originalname,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id,
        fraudScore: analysis.fraudScore,
        ocrText: analysis.ocrText,
        elaScore: analysis.elaScore,
        analysisStatus: analysis.status || 'complete',
      }))
    );

    // FIX: fragmentCount now exists on case.model.js so this $inc actually works.
    await Case.findByIdAndUpdate(caseId, { $inc: { fragmentCount: fragments.length } });

    res.status(201).json({ status: 'success', count: fragments.length, data: fragments });
  } catch (err) {
    next(err);
  }
};

exports.getFragmentsByCase = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [fragments, total] = await Promise.all([
      Fragment.find({ caseId: req.params.caseId }).skip(skip).limit(limit).sort('-createdAt').lean(),
      Fragment.countDocuments({ caseId: req.params.caseId }),
    ]);

    res.json({ status: 'success', total, page, limit, data: fragments });
  } catch (err) {
    next(err);
  }
};
