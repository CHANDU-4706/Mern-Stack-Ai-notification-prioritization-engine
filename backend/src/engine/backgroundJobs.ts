import { Agenda } from 'agenda';
import { Event } from '../models/Event.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoBackend } from '@agendajs/mongo-backend';
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cyepro-notifications';
const agenda = new Agenda({
    backend: new MongoBackend({ address: mongoUri, collection: 'agendaJobs' })
});

// Define the LATER queue processor
agenda.define('process later queue', async (job) => {
    console.log(`[AGENDA] Running scheduled LATER queue processor...`);

    try {
        // Find events that are in LATER_QUEUE status and haven't expired
        const now = new Date();

        const laterEvents = await Event.find({
            status: 'LATER_QUEUE',
            $or: [
                { expires_at: { $exists: false } },
                { expires_at: { $gt: now } }
            ]
        }).sort({ created_at: 1 }).limit(50); // Process in batches

        if (laterEvents.length === 0) {
            console.log(`[AGENDA] Queue is empty.`);
            return;
        }

        console.log(`[AGENDA] Found ${laterEvents.length} events to process.`);

        for (const event of laterEvents) {
            // Here we could re-run fatigue checks, or simply deliver them
            // For this demo, we mark them as DELIVERED/PROCESSED
            event.status = 'PROCESSED';
            // (Optional) Add to a history/delivery log here
            await event.save();
            console.log(`[AGENDA] Processed deferred event: ${event._id}`);
        }

    } catch (error) {
        console.error(`[AGENDA] Error processing LATER queue:`, error);
        // Don't crash the scheduler, let it throw so agenda marks the job as failed and retries
        throw error;
    }
});

// Define a DLQ (Dead Letter Queue) sweeper for FAILED events
agenda.define('process dead letter queue', async (job) => {
    console.log(`[AGENDA] Running Dead Letter Queue sweeper...`);
    try {
        const failedEvents = await Event.find({ status: 'FAILED' }).limit(10);
        // Retry logic could go here, or alerting.
    } catch (error) {
        console.error(`[AGENDA] DLQ Error:`, error);
    }
});

export const startAgenda = async () => {
    await agenda.start();
    console.log('[AGENDA] Background job scheduler started.');

    // Run the LATER queue processor every 5 minutes
    await agenda.every('5 minutes', 'process later queue');

    // Run the DLQ sweeper every hour
    await agenda.every('1 hour', 'process dead letter queue');
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[AGENDA] Shutting down scheduler gracefully...');
    await agenda.stop();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('[AGENDA] Shutting down scheduler gracefully...');
    await agenda.stop();
    process.exit(0);
});
