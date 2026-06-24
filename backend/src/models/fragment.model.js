const mongoose = require('mongoose');

const fragmentSchema = new mongoose.Schema({
  fragmentId: { type: String, required: true, unique: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  originalName: { type: String },
  storagePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Processed', 'Suspicious', 'Matched', 'Rejected'], 
    default: 'Pending' 
  },
  features: {
    edgeGeometry: { type: Object },
    textFragments: [String],
    averageColor: { type: String }
  },
  metadata: {
    fraudScore: { type: Number },
    isFraudulent: { type: Boolean },
    ocrText: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Fragment', fragmentSchema);
