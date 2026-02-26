import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { stellarService } from '../config/stellar';
import { logger } from '../core/logging/logger';
import { startStellarAnchorWorker } from '../modules/reports/reports.anchor.queue';

dotenv.config();

const startWorker = async () => {
  await connectDB();
  await stellarService.ensureFunded();
  startStellarAnchorWorker();
  logger.info('Stellar anchor worker started');
};

startWorker().catch((error) => {
  logger.error('Stellar anchor worker failed to start', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
