import mongoose from 'mongoose';
import { logger } from '../core/logging/logger';
import { getApiEnv } from './env';

export const connectDB = async () => {
  try {
    const { MONGO_URI } = getApiEnv();
    const conn = await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('MongoDB connection failed', { error: (error as Error).message });
    throw error;
  }
};
