import { StellarService } from '@sidewalk/stellar';

import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.STELLAR_SECRET_KEY;

if (!secret) {
  throw new Error('❌ Missing STELLAR_SECRET_KEY in .env file');
}

export const stellarService = new StellarService(secret);
