import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';
import eventRoutes from './routes/eventRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import queueRoutes from './routes/queueRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

import { aiCircuitBreaker } from './services/aiService.js';
import { startAgenda } from './engine/backgroundJobs.js';

// Database Connection
connectDB().then(() => {
    // Start Agenda only after DB connects
    startAgenda().catch(console.error);
});

// Health Check Endpoint (Honest reporting required by specs)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'up',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        ai_circuit: {
            status: aiCircuitBreaker.opened ? 'OPEN (Failing)' : 'CLOSED (Healthy)',
            failures_recorded: aiCircuitBreaker.stats.failures,
            fallbacks_triggered: aiCircuitBreaker.stats.fallbacks
        },
        timestamp: new Date().toISOString()
    });
});

// Import Routes (To be created)
// Routes
app.use('/api/events', eventRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/metrics', metricsRoutes);

// General Error Handler

app.listen(port, () => {
    console.log(`MERN Backend Engine running on port ${port}`);
});
