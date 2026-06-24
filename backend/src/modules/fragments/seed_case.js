// backend/src/modules/fragments/seed_case.js
// FIX: removed hardcoded Windows path 'c:/Users/asus/...'
// dotenv.config() with no path argument looks for .env in the project root.
require('dotenv').config();
const mongoose = require('mongoose');
const Case = require('../cases/case.model');
const User = require('../users/user.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for seeding...');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found. Create one first with POST /api/v1/auth/register');
    process.exit(1);
  }

  await Case.deleteMany({});
  await Case.insertMany([
    { caseId: 'CASE-001', title: 'Document Forgery Investigation Alpha', status: 'open', priority: 'high', createdBy: admin._id },
    { caseId: 'CASE-002', title: 'Financial Fraud - Invoice Tampering', status: 'in-progress', priority: 'critical', createdBy: admin._id },
    { caseId: 'CASE-003', title: 'Identity Document Analysis', status: 'open', priority: 'medium', createdBy: admin._id },
  ]);

  console.log('Seed complete.');
  await mongoose.disconnect();
}

seed().catch(console.error);
