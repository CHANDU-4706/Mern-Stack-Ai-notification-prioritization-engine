import { Request, Response } from 'express';
import { Event } from '../models/Event.js';

export const getQueue = async (req: Request, res: Response) => {
    try {
        const queue = await Event.find({ status: 'LATER_QUEUE' })
            .sort({ created_at: 1 }); // Oldest first

        res.json({ data: queue });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
};
