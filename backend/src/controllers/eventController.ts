import { Request, Response } from 'express';
import { Event } from '../models/Event.js';
import { runClassificationPipeline } from '../engine/pipeline.js';

export const submitEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            user_id,
            event_type,
            message,
            source,
            priority_hint,
            channel,
            metadata,
            dedupe_key,
            expires_at
        } = req.body;

        // 1. Initial Validation
        if (!user_id || !event_type || !message || !source) {
            res.status(400).json({ error: 'Missing required fields: user_id, event_type, message, source' });
            return;
        }

        // 2. Exact Deduplication Check (Fast Path)
        if (dedupe_key) {
            const existingEvent = await Event.findOne({ dedupe_key });
            if (existingEvent) {
                res.status(409).json({
                    status: 'DUPLICATE',
                    message: 'Exact duplicate detected',
                    original_event_id: existingEvent._id
                });
                return;
            }
        }

        // 3. Create Event
        const newEvent = new Event({
            user_id,
            event_type,
            message,
            source,
            priority_hint,
            channel,
            metadata,
            dedupe_key,
            expires_at
        });

        await newEvent.save();

        // 4. Trigger Async Pipeline (Do not await here to return 202 immediately, or await if immediate response desired)
        // The spec requires immediate response, AI processing async.

        // We will initiate the pipeline asynchronously
        runClassificationPipeline(newEvent._id.toString()).catch(err => {
            console.error(`Pipeline failed for event ${newEvent._id}`, err);
        });

        res.status(202).json({
            status: 'ACCEPTED',
            message: 'Event accepted for processing',
            event_id: newEvent._id
        });
    } catch (error) {
        console.error('Error submitting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
