import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { getHealth } from './modules/health/health.controller';
import { stellarService } from './config/stellar';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', getHealth);

const startServer = async () => {
  await connectDB();

  console.log('🌟 Initializing Stellar Service...');
  await stellarService.ensureFunded();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
