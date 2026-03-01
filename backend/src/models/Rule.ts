import mongoose, { Schema, Document } from 'mongoose';

export interface IRule extends Document {
    name: string;
    description: string;
    condition: string; // e.g. "event.source === 'SECURITY' && event.priority_hint === 'critical'"
    action: 'NOW' | 'LATER' | 'NEVER';
    priority: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const RuleSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        condition: { type: String, required: true },
        action: { type: String, enum: ['NOW', 'LATER', 'NEVER'], required: true },
        priority: { type: Number, default: 0 },
        is_active: { type: Boolean, default: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

export const Rule = mongoose.model<IRule>('Rule', RuleSchema);
