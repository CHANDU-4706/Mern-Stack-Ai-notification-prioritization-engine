import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    event_id: string; // User-facing ID or MongoDB _id stringified
    user_id: string;
    decision: 'NOW' | 'LATER' | 'NEVER';
    reason: string;
    engine_used: string;
    rule_id?: string;
    ai_confidence?: number;
    ai_model?: string;
    is_fallback: boolean;
    processing_time_ms: number;
    created_at: Date;
}

const AuditLogSchema: Schema = new Schema(
    {
        event_id: { type: String, required: true, index: true },
        user_id: { type: String, required: true, index: true },
        decision: { type: String, enum: ['NOW', 'LATER', 'NEVER'], required: true },
        reason: { type: String, required: true },
        engine_used: { type: String, required: true },
        rule_id: { type: String },
        ai_confidence: { type: Number },
        ai_model: { type: String },
        is_fallback: { type: Boolean, default: false },
        processing_time_ms: { type: Number, required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false } // Append-only by design
    }
);

// Prevent modifications after creation to enforce append-only audit trail
AuditLogSchema.pre('save', function (this: any) {
    if (!this.isNew) {
        throw new Error('Audit logs are append-only. They cannot be modified.');
    }
});

AuditLogSchema.pre('findOneAndUpdate' as any, function (next: any) {
    next(new Error('Audit logs are append-only. They cannot be modified.'));
});

AuditLogSchema.pre('updateOne' as any, function (next: any) {
    next(new Error('Audit logs are append-only. They cannot be modified.'));
});

AuditLogSchema.index({ created_at: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
