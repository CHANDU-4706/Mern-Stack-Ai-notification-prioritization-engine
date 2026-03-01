import { Request, Response } from 'express';
import { Rule } from '../models/Rule.js';

export const getRules = async (req: Request, res: Response) => {
    try {
        const rules = await Rule.find().sort({ created_at: -1 });
        res.json({ data: rules });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};

export const createRule = async (req: Request, res: Response) => {
    try {
        const { rule_name, condition, action, priority_score, confidence_score } = req.body;

        // Basic validation
        if (!rule_name || !condition) {
            return res.status(400).json({ error: 'rule_name and condition are required' });
        }

        const newRule = new Rule({
            rule_name,
            condition,
            action: action || 'LATER',
            priority_score: priority_score || 0.5,
            confidence_score: confidence_score || 1.0,
            is_active: true
        });

        await newRule.save();
        res.status(201).json({ message: 'Rule created successfully', data: newRule });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create rule' });
    }
};

export const toggleRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const rule = await Rule.findByIdAndUpdate(
            id,
            { is_active, updated_at: new Date() },
            { new: true }
        );

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        res.json({ message: 'Rule updated', data: rule });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update rule' });
    }
};

export const deleteRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rule = await Rule.findByIdAndDelete(id);

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete rule' });
    }
};
