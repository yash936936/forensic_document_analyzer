// backend/src/modules/fragments/fragment.model.js
const mongoose = require('mongoose');

const fragmentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fraudScore: { type: Number, default: null },
    elaScore: { type: Number, default: null },
    ocrText: { type: String, default: null },
    analysisStatus: {
      type: String,
      enum: ['pending', 'complete', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fragment', fragmentSchema);
