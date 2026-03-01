import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
    user_id: string;
    event_type: string;
    message: string;
    source: string;
    priority_hint?: string;
    channel?: string;
    metadata?: Record<string, any>;
    dedupe_key?: string;
    expires_at?: Date;
    status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'LATER_QUEUE';
    classification_result?: {
        decision: 'NOW' | 'LATER' | 'NEVER';
        reason: string;
        engine_used: string;
        score: number;
        confidence: number;
    };
    created_at: Date;
    updated_at: Date;
}

const EventSchema: Schema = new Schema(
    {
        user_id: { type: String, required: true, index: true },
        event_type: { type: String, required: true, index: true },
        message: { type: String, required: true },
        source: { type: String, required: true },
        priority_hint: { type: String },
        channel: { type: String },
        metadata: { type: Schema.Types.Mixed },
        dedupe_key: { type: String },
        expires_at: { type: Date },
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSED', 'FAILED', 'LATER_QUEUE'],
            default: 'PENDING',
            index: true
        },
        classification_result: {
            decision: { type: String, enum: ['NOW', 'LATER', 'NEVER'] },
            reason: { type: String },
            engine_used: { type: String },
            score: { type: Number },
            confidence: { type: Number },
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// Indexes for fast fatigue and deduplication checks
EventSchema.index({ user_id: 1, created_at: -1 });
EventSchema.index({ dedupe_key: 1 }, { unique: true, partialFilterExpression: { dedupe_key: { $exists: true } } });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
