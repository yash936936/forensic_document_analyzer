
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'c:/Users/asus/Videos/Ms. Ayushi/backend/.env' });

const CaseSchema = new mongoose.Schema({
  caseId: String,
  name: String,
  status: String,
  description: String,
  reconstructionProgress: Number
}, { timestamps: true });

const Case = mongoose.model('Case', CaseSchema);

async function checkCases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const cases = await Case.find();
    console.log('Current Cases count:', cases.length);
    if (cases.length === 0) {
      console.log('No cases found. Creating a default case...');
      await Case.create({
        caseId: 'CASE-2026-001',
        name: 'Financial Forgery Investigation',
        status: 'Active',
        description: 'System-generated test case for document fragmentation analysis.',
        reconstructionProgress: 0
      });
      console.log('Default case created.');
    } else {
      console.log('Cases:', JSON.stringify(cases, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkCases();
