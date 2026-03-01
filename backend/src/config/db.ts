import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cyepro-notifications';
        console.log(`[DATABASE] Attempting connection to: ${mongoUri.split('@').pop()}`); // Log host only for security
        const conn = await mongoose.connect(mongoUri);
        console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error: any) {
        console.error(`[DATABASE] ERROR: Failed to connect to MongoDB. Check MONGO_URI. Error: ${error.message}`);
        // Do NOT exit process. This allows the API to serve health checks and show "disconnected" status to recruiters.
        return false;
    }
};
