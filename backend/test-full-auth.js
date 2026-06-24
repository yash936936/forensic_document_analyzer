const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
    console.log('--- STARTING AUTH ENDPOINT TESTS ---');
    
    const api = axios.create({
        baseURL: 'http://127.0.0.1:5000/api',
        timeout: 5000
    });

    try {
        console.log('\n[1] Testing Registration...');
        const regRes = await api.post('/auth/register', {
            name: 'Test Agent',
            email: 'test@asdas.gov',
            password: 'Pass123Password',
            badgeId: 'BADGE-999'
        });
        console.log('✅ Registration success:', regRes.data.status);
    } catch (err) {
        console.error('❌ Registration failed:', err.response?.data?.message || err.message);
    }

    await sleep(1000);

    try {
        console.log('\n[2] Testing Login with Seeded User...');
        const logRes = await api.post('/auth/login', {
            email: 'ayushi@asdas.gov',
            password: 'ASDAS-Forensic-2026'
        });
        console.log('✅ Login success:', logRes.data.status);
    } catch (err) {
        console.error('❌ Login failed:', err.response?.data?.message || err.message);
    }

    try {
        console.log('\n[3] Testing Login with New User...');
        const logRes2 = await api.post('/auth/login', {
            email: 'test@asdas.gov',
            password: 'Pass123Password'
        });
        console.log('✅ New login success:', logRes2.data.status);
    } catch (err) {
        console.error('❌ New login failed:', err.response?.data?.message || err.message);
    }
}

runTests();
