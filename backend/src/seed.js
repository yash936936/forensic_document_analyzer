// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const User = require('./models/user.model');
// const Case = require('./models/case.model');
// 
// dotenv.config({ path: '.env' });


// const seedData = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI, { dbName: 'asdas' });
//     console.log('Connected to DB for seeding...');

//     // Clear existing
//     await User.deleteMany();
//     await Case.deleteMany();

//     // Create Admin Agent
//     const admin = await User.create({
//       name: 'Agent Ayushi',
//       email: 'ayushi@asdas.gov',
//       password: 'ASDAS-Forensic-2026',
//       badgeId: 'FN-9021-X',
//       role: 'admin'
//     });

//     console.log('Admin User Created: ayushi@asdas.gov / ASDAS-Forensic-2026');

//     // Create Initial Case
//     await Case.create({
//       caseId: 'FRN-782',
//       name: 'Financial Ledger 2023_v4',
//       description: 'Reconstruction of shredded tax documents found in suspect residence.',
//       status: 'Completed',
//       priority: 'High',
//       reconstructionProgress: 100,
//       assignedAgent: admin._id,
//       tags: ['Financial', 'Tax Fraud']
//     });

//     await Case.create({
//       caseId: 'FRN-901',
//       name: 'Shredded Memo_Confidential',
//       description: 'Inter-office memo regarding operation X. Highly sensitive.',
//       status: 'Processing',
//       priority: 'Critical',
//       reconstructionProgress: 64,
//       assignedAgent: admin._id,
//       tags: ['Confidential', 'Security']
//     });

//     console.log('Sample Cases Seeded.');
//     process.exit();
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// };

// seedData();
