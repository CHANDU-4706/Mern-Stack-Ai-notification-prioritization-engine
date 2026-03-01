import { Request, Response } from 'express';
import { Event } from '../models/Event.js';

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const totalProcessed = await Event.countDocuments();
        const aiProcessed = await Event.countDocuments({ 'classification_result.engine_used': 'AI_ENGINE' });
        const fallbackProcessed = await Event.countDocuments({ 'classification_result.engine_used': { $in: ['FALLBACK_ENGINE', 'SYSTEM_FALLBACK'] } });
        const ruleProcessed = await Event.countDocuments({ 'classification_result.engine_used': 'RULE_ENGINE' });
        const laterQueueSize = await Event.countDocuments({ status: 'LATER_QUEUE' });
        const fatugueDropped = await Event.countDocuments({ 'classification_result.engine_used': 'ALERT_FATIGUE' });
        const duplicatesDropped = await Event.countDocuments({ 'classification_result.engine_used': 'NEAR_DEDUPLICATE' });

        res.json({
            metrics: {
                totalProcessed,
                aiProcessed,
                fallbackProcessed,
                ruleProcessed,
                laterQueueSize,
                fatugueDropped,
                duplicatesDropped
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
};
