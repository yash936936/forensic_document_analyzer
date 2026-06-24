const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const dotenv = require('dotenv');
dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'asdas' });
        const users = await User.find({}, 'name email badgeId');
        console.log('--- REGISTERED AGENTS ---');
        console.log(users);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listUsers();
