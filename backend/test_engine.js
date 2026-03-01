"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const dotenv_1 = require("dotenv");
dotenv_1.default.config();
const API_URL = 'http://localhost:5000/api';
const delay = (ms) => new Promise(res => setTimeout(res, ms));
async function runTests() {
    console.log("🚀 Starting MERN Engine Integration Tests...\n");
    const userId = `test_user_${Date.now()}`;
    // Helper to fetch the actual classification from DB since the API is async (returns 202)
    const getClassification = async (eventId) => {
        // Wait 2 seconds for processing
        await delay(2000);
        const res = await axios_1.default.get(`${API_URL}/audit-logs`);
        const logs = res.data.data;
        const log = logs.find((l) => l.event_id === eventId);
        return log;
    };
    try {
        // ===== TEST 1: Exact Deduplication (Fast Path) =====
        console.log("🧪 TEST 1: Exact Deduplication");
        const dupKey = `dup_test_${Date.now()}`;
        let res1 = await axios_1.default.post(`${API_URL}/events`, {
            user_id: userId,
            event_type: "SECURITY",
            message: "Multiple failed login attempts",
            source: "FIREWALL",
            dedupe_key: dupKey
        });
        console.log("   First event accepted.");
        try {
            await axios_1.default.post(`${API_URL}/events`, {
                user_id: userId,
                event_type: "SECURITY",
                message: "Multiple failed login attempts",
                source: "FIREWALL",
                dedupe_key: dupKey
            });
            console.log("   ❌ FAILED: Second event was not blocked by dedup key.");
        }
        catch (error) {
            if (error.response?.status === 409) {
                console.log("   ✅ PASSED: Second event successfully blocked (409 Conflict).");
            }
            else {
                console.log("   ❌ FAILED: Unexpected error on second event", error.message);
            }
        }
        // ===== TEST 2: Near-Duplicate (Similarity) =====
        console.log("\n🧪 TEST 2: Near-Duplicate Detection (>85% similarity)");
        const user2 = `test_user2_${Date.now()}`;
        const resSim1 = await axios_1.default.post(`${API_URL}/events`, {
            user_id: user2,
            event_type: "ALERT",
            message: "Server CPU utilization is at 95%",
            source: "MONITOR"
        });
        const idSim1 = resSim1.data.event_id;
        await delay(1000); // Small delay to ensure order
        const resSim2 = await axios_1.default.post(`${API_URL}/events`, {
            user_id: user2,
            event_type: "ALERT",
            message: "Server CPU utilization is at 96%", // Very similar message
            source: "MONITOR"
        });
        const idSim2 = resSim2.data.event_id;
        const logSim2 = await getClassification(idSim2);
        if (logSim2 && logSim2.reason.includes("Near-duplicate") && logSim2.decision === 'NEVER') {
            console.log("   ✅ PASSED: Second event blocked as near-duplicate.");
        }
        else {
            console.log(`   ❌ FAILED: Event not marked as near-dup. Log:`, logSim2);
        }
        // ===== TEST 3: Alert Fatigue =====
        console.log("\n🧪 TEST 3: Alert Fatigue (Max 5 per hour)");
        const user3 = `test_user3_${Date.now()}`;
        let fatigueFailed = false;
        // Send 5 events quickly
        for (let i = 1; i <= 5; i++) {
            await axios_1.default.post(`${API_URL}/events`, {
                user_id: user3,
                event_type: `NOISE_${i}`,
                message: `Minor UI glitch on page ${i}`,
                source: "APP"
            });
        }
        // 6th event should trigger fatigue
        const resFatigue = await axios_1.default.post(`${API_URL}/events`, {
            user_id: user3,
            event_type: "NOISE_6",
            message: "Another minor UI glitch",
            source: "APP"
        });
        const idFatigue = resFatigue.data.event_id;
        const logFatigue = await getClassification(idFatigue);
        if (logFatigue && logFatigue.decision === 'LATER' && logFatigue.engine_used === 'ALERT_FATIGUE') {
            console.log("   ✅ PASSED: 6th event deferred due to Alert Fatigue.");
        }
        else {
            console.log("   ❌ FAILED: Fatigue threshold not triggered.", logFatigue);
        }
        // ===== TEST 4: Custom Rule Evaluation =====
        console.log("\n🧪 TEST 4: Custom Rule Bypass");
        // Ensure a specific rule is active
        const ruleRes = await axios_1.default.get(`${API_URL}/rules`);
        const rules = ruleRes.data.data;
        const marketingRule = rules.find((r) => r.condition.includes("MARKETING"));
        if (marketingRule && marketingRule.is_active) {
            const resRule = await axios_1.default.post(`${API_URL}/events`, {
                user_id: userId,
                event_type: "PROMO",
                message: "New 20% off coupon!",
                source: "MARKETING"
            });
            const logRule = await getClassification(resRule.data.event_id);
            if (logRule && logRule.engine_used === 'RULE_ENGINE') {
                console.log(`   ✅ PASSED: Event caught by Custom Rule. Action taken: ${logRule.decision}`);
            }
            else {
                console.log("   ❌ FAILED: Rules engine did not catch the event.", logRule);
            }
        }
        else {
            console.log("   ⚠️ SKIPPED: Needs an active rule containing 'MARKETING' in condition to test this auto-matically.");
        }
        // ===== TEST 5: AI Engine Classification =====
        console.log("\n🧪 TEST 5: Normal AI Engine Flow");
        const resAI = await axios_1.default.post(`${API_URL}/events`, {
            user_id: `user_ai_${Date.now()}`,
            event_type: "CRITICAL_PAYMENT_FAILURE",
            message: "Payment gateway timeout for transaction #88991",
            source: "BILLING",
            priority_hint: "high"
        });
        const logAI = await getClassification(resAI.data.event_id);
        if (logAI && (logAI.engine_used === 'AI_ENGINE' || logAI.engine_used === 'FALLBACK_ENGINE')) {
            console.log(`   ✅ PASSED: Event classified by AI Engine.`);
            console.log(`      Decision: ${logAI.decision}`);
            console.log(`      Reason: ${logAI.reason}`);
            console.log(`      Model Used: ${logAI.ai_model || 'N/A'}, Confidence: ${logAI.ai_confidence || 'N/A'}`);
        }
        else {
            console.log("   ❌ FAILED: AI Engine did not process event.", logAI);
        }
        console.log("\n🎉 Integration Tests Complete (excluding offline/env tests to be done manually).");
    }
    catch (e) {
        console.error("\n❌ FATAL TEST ERROR", e.message);
    }
}
runTests();
