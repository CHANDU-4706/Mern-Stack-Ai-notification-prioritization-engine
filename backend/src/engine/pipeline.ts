import { Event } from '../models/Event.js';
import { AuditLog } from '../models/AuditLog.js';
import { Rule } from '../models/Rule.js';
import { classifyWithGroq } from '../services/aiService.js';
import stringSimilarity from 'string-similarity';

export const runClassificationPipeline = async (eventId: string) => {
    const event = await Event.findById(eventId);
    if (!event) return;

    const startTime = Date.now();

    try {
        // Stage 1: Near-Duplicate Detection
        const recentEvents = await Event.find({
            user_id: event.user_id,
            _id: { $ne: event._id },
            created_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
        }).sort({ created_at: -1 }).limit(20);

        for (const recent of recentEvents) {
            const similarity = stringSimilarity.compareTwoStrings(event.message, recent.message);
            if (similarity > 0.85) {
                return finalizeDecision(event, 'NEVER', `Near-duplicate of event ${recent._id} (similarity: ${(similarity * 100).toFixed(1)}%)`, 'NEAR_DEDUPLICATE', startTime);
            }
        }

        // Stage 2: Alert Fatigue Check 
        // Example: Max 5 alerts in 1 hour
        if (recentEvents.length >= 5) {
            return finalizeDecision(event, 'LATER', `Alert fatigue threshold exceeded (5 alerts in 1hr)`, 'ALERT_FATIGUE', startTime);
        }

        // Stage 3: Custom Rules Evaluation
        const rules = await Rule.find({ is_active: true }).sort({ priority: -1 });

        // Extremely simplistic rule engine execution for demo purposes
        // In production, this would use a safer parsing mechanism like JSON logic
        for (const rule of rules) {
            let conditionMet = false;
            try {
                // DANGER: Eval is evil, but used here for rapid condition mapping based on the spec strings like: "event.source === 'SECURITY'"
                // A real app should use a strict AST parser or json-rules-engine
                const func = new Function('event', `return ${rule.condition};`);
                conditionMet = func(event);
            } catch (e) {
                console.error(`Error evaluating rule ${rule.name}`, e);
            }

            if (conditionMet) {
                return finalizeDecision(event, rule.action, `Matched rule: ${rule.name}`, 'RULE_ENGINE', startTime, rule._id.toString());
            }
        }

        // Stage 4: AI Classification with Fallback
        const aiResult = await classifyWithGroq({
            type: event.event_type,
            message: event.message,
            source: event.source,
            priority_hint: event.priority_hint || ''
        });

        if (aiResult.isFallback) {
            return finalizeDecision(event, aiResult.decision, aiResult.reason, 'FALLBACK_ENGINE', startTime, undefined, aiResult.confidence, aiResult.model, true);
        }

        // Stage 5: Finalize AI Decision
        return finalizeDecision(event, aiResult.decision, aiResult.reason, 'AI_ENGINE', startTime, undefined, aiResult.score, aiResult.model, false);

    } catch (error: any) {
        console.error(`Pipeline error for ${eventId}:`, error);
        // Generic ultimate fallback
        return finalizeDecision(event, 'LATER', `Ultimate pipeline fallback due to error: ${error.message}`, 'SYSTEM_FALLBACK', startTime, undefined, 1.0, 'None', true);
    }
};

async function finalizeDecision(
    event: any,
    decision: 'NOW' | 'LATER' | 'NEVER',
    reason: string,
    engine: string,
    startTime: number,
    ruleId?: string,
    confidence?: number,
    aiModel?: string,
    isFallback: boolean = false
) {
    const processingTimeMs = Date.now() - startTime;

    // 1. Update the Event
    event.status = decision === 'LATER' ? 'LATER_QUEUE' : 'PROCESSED';
    event.classification_result = {
        decision,
        reason,
        engine_used: engine,
        score: confidence || 1.0,
        confidence: confidence || 1.0
    };
    await event.save();

    // 2. Write completely immutable Audit Log
    const audit = new AuditLog({
        event_id: event._id.toString(),
        user_id: event.user_id,
        decision,
        reason,
        engine_used: engine,
        rule_id: ruleId,
        ai_confidence: confidence,
        ai_model: aiModel,
        is_fallback: isFallback,
        processing_time_ms: processingTimeMs
    });

    await audit.save();
}
