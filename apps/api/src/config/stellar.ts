import { StellarService } from '@sidewalk/stellar';

import dotenv from 'dotenv';
import { getStellarEnv } from './env';

dotenv.config();

const { STELLAR_SECRET_KEY } = getStellarEnv();

export const stellarService = new StellarService(STELLAR_SECRET_KEY);
