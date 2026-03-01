import { Groq } from 'groq-sdk';
import CircuitBreaker from 'opossum';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// 1. Define the exact AI call
const callGroqAPI = async (eventData: { type: string, message: string, source: string, priority_hint: string }) => {
    const prompt = `
  You are an AI-Native Notification Prioritization Engine.
  Classify the following notification event into one of: NOW, LATER, NEVER.
  
  Rules:
  - NOW: Urgent, time-sensitive, critical alerts (security, OTP, immediate action needed).
  - LATER: Informational, non-urgent updates, reminders that can be seen later.
  - NEVER: Spam, promotional noise, or irrelevant system chatter.

  Event Details:
  - Type: ${eventData.type}
  - Message: ${eventData.message}
  - Source: ${eventData.source}
  - Priority Hint: ${eventData.priority_hint}
  
  Respond ONLY in JSON format with the following fields:
  {
    "decision": "NOW | LATER | NEVER",
    "reason": "Clear explanation of why this decision was made",
    "score": 0.0 to 1.0 (urgency score),
    "confidence": 0.0 to 1.0
  }
  `;

    const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        response_format: { type: 'json_object' }
    }, { timeout: 2500 }); // timeout is passed in RequestOptions options object

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("Empty response from AI");

    return JSON.parse(responseText);
};

// 2. Wrap it in a Circuit Breaker (Fail-Safe Architecture)
const breakerOptions = {
    timeout: 3000, // If function takes longer than 3s, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 10000 // After 10s, try again
};

export const aiCircuitBreaker = new CircuitBreaker(callGroqAPI, breakerOptions);

// Fallback logic when circuit is open or call fails repeatedly
aiCircuitBreaker.fallback((eventData: any, error: any) => {
    console.warn(`[CIRCUIT BREAKER FALLBACK] Returning safe default. Error: ${error.message}`);
    return {
        decision: eventData.priority_hint === 'critical' || eventData.source === 'SECURITY' ? 'NOW' : 'LATER',
        reason: `Fallback classification due to AI unavailability. Status: ${aiCircuitBreaker.opened ? 'Open' : 'Closed'}`,
        score: 0.5,
        confidence: 1.0,
        model: 'FALLBACK_RULE',
        isFallback: true
    };
});

// 3. Exported service method for the pipeline
export const classifyWithGroq = async (eventData: any) => {
    try {
        const result: any = await aiCircuitBreaker.fire(eventData);
        return {
            decision: result.decision || 'LATER',
            reason: result.reason || 'No reason provided by LLM',
            score: result.score || 0.5,
            confidence: result.confidence || 0.0,
            model,
            isFallback: result.isFallback || false
        };
    } catch (error: any) {
        console.error(`Unexpected AI Service Error: ${error.message}`);
        // Absolute final safety net
        return {
            decision: 'LATER',
            reason: 'Ultimate fallback due to fatal AI error',
            score: 0.0,
            confidence: 1.0,
            model: 'PLATFORM_FALLBACK',
            isFallback: true
        };
    }
};
