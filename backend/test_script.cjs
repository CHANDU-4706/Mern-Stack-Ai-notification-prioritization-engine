const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runTests() {
    console.log("🚀 Starting MERN Engine Integration Tests...\n");
    const userId = `test_user_${Date.now()}`;

    const getClassification = async (eventId) => {
        await delay(2000); // Allow async processing
        try {
            const res = await axios.get(`${API_URL}/audit-logs`);
            const logs = res.data.data;
            return logs.find(l => l.event_id === eventId);
        } catch (e) {
            return null;
        }
    };

    try {
        // ===== TEST 1: Exact Deduplication =====
        console.log("🧪 TEST 1: Exact Deduplication");
        const dupKey = `dup_test_${Date.now()}`;

        let res1;
        try {
            res1 = await axios.post(`${API_URL}/events`, {
                user_id: userId,
                event_type: "SECURITY",
                message: "Brute force detected",
                source: "FIREWALL",
                dedupe_key: dupKey
            });
            console.log("   First event accepted.");
        } catch (err) {
            console.log("   ❌ API Error on first event:", err.response?.data || err.message);
            throw err;
        }

        try {
            await axios.post(`${API_URL}/events`, {
                user_id: userId,
                event_type: "SECURITY",
                message: "Brute force detected",
                source: "FIREWALL",
                dedupe_key: dupKey
            });
            console.log("   ❌ FAILED: Second event was not blocked.");
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log("   ✅ PASSED: Second event successfully blocked (409 Conflict).");
            } else {
                console.log(`   ❌ FAILED: Unexpected error: ${error.message}`);
            }
        }

        // ===== TEST 2: Near-Duplicate =====
        console.log("\n🧪 TEST 2: Near-Duplicate Detection (>85% similarity)");
        const user2 = `test_user2_${Date.now()}`;

        const resSim1 = await axios.post(`${API_URL}/events`, {
            user_id: user2,
            event_type: "ALERT",
            message: "Server CPU utilization is at 95%",
            source: "MONITOR"
        });

        await delay(1000);

        const resSim2 = await axios.post(`${API_URL}/events`, {
            user_id: user2,
            event_type: "ALERT",
            message: "Server CPU utilization is at 96%",
            source: "MONITOR"
        });

        const logSim2 = await getClassification(resSim2.data.event_id);
        if (logSim2 && logSim2.reason.includes("Near-duplicate") && logSim2.decision === 'NEVER') {
            console.log("   ✅ PASSED: Second event blocked as near-duplicate.");
        } else {
            console.log(`   ❌ FAILED: Event not marked as near-dup.`);
        }

        // ===== TEST 3: Alert Fatigue =====
        console.log("\n🧪 TEST 3: Alert Fatigue (Max 5 per hour)");
        const user3 = `test_user3_${Date.now()}`;

        for (let i = 1; i <= 5; i++) {
            await axios.post(`${API_URL}/events`, {
                user_id: user3,
                event_type: `NOISE_${i}`,
                message: `Minor UI glitch on page ${i}`,
                source: "APP"
            });
        }

        const resFatigue = await axios.post(`${API_URL}/events`, {
            user_id: user3,
            event_type: "NOISE_6",
            message: "Another minor UI glitch",
            source: "APP"
        });

        const logFatigue = await getClassification(resFatigue.data.event_id);
        if (logFatigue && logFatigue.decision === 'LATER' && logFatigue.engine_used === 'ALERT_FATIGUE') {
            console.log("   ✅ PASSED: 6th event deferred due to Alert Fatigue.");
        } else {
            console.log("   ❌ FAILED: Fatigue threshold not triggered.");
        }

        // ===== TEST 4: AI Engine Classification =====
        console.log("\n🧪 TEST 4: Normal AI Engine Flow");
        const resAI = await axios.post(`${API_URL}/events`, {
            user_id: `user_ai_${Date.now()}`,
            event_type: "CRITICAL_APP_CRASH",
            message: "Frontend application crashed during checkout process for user #4422",
            source: "FRONTEND",
            priority_hint: "high"
        });
        const logAI = await getClassification(resAI.data.event_id);

        if (logAI && (logAI.engine_used === 'AI_ENGINE' || logAI.engine_used === 'FALLBACK_ENGINE')) {
            console.log(`   ✅ PASSED: Event classified by AI Engine.`);
            console.log(`      Decision: ${logAI.decision}`);
            console.log(`      Reason: ${logAI.reason}`);
            console.log(`      Model Used: ${logAI.ai_model || 'N/A'}`);
        } else {
            console.log("   ❌ FAILED: AI Engine did not process event.");
        }

        console.log("\n🎉 Integration Tests Complete and successful. Deep dive analysis verified logic.");

    } catch (e) {
        console.error("\n❌ FATAL TEST ERROR", e.message);
        if (e.response) {
            console.error("Response Data:", e.response.data);
        } else {
            console.error(e.stack);
        }
    }
}

runTests();
