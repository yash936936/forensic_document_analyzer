const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔍 [FORENSIC HANDSHAKE] Attempting connection to MongoDB Cluster...');
    
    // Disable buffering globally to catch connection errors immediately
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'asdas',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ [SECURE LINK] Neural database established: ${conn.connection.host}`);
    console.log(`📂 [DATA STORE] Active Database: ${conn.connection.db.databaseName}`);
    console.log(`📡 [CONNECTION STATE] Status: ${mongoose.connection.readyState}`);
  } catch (error) {
    console.error(`❌ [ACCESS DENIED] Database Connection Error: ${error.message}`);
    if (error.message.includes('MongooseServerSelectionError')) {
      console.log('💡 TIP: Check your MongoDB Atlas "Network Access" to ensure your IP is whitelisted.');
    }
    // Don't exit in dev mode, let it retry
  }
};

module.exports = connectDB;
