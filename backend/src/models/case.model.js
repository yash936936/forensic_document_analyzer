const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Open', 'Processing', 'Suspended', 'Completed'], 
    default: 'Open' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  reconstructionProgress: { type: Number, default: 0 },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
