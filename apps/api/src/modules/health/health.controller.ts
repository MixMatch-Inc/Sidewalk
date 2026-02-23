import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';

import { stellarService } from '../../config/stellar';
import { AppError } from '../../core/errors/app-error';

// Optional Redis client for health checks
const redisUrl = process.env.REDIS_URL;
const redisClient = redisUrl ? new Redis(redisUrl, { lazyConnect: true }) : null;

export const getLiveness = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    next(new AppError('Liveness check failed', 500, 'LIVENESS_CHECK_FAILED'));
  }
};

export const getReadiness = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Check DB
    const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';

    // Check Stellar
    let stellarStatusStr = 'down';
    try {
      const isStellarUp = await stellarService.getHealth();
      stellarStatusStr = isStellarUp ? 'up' : 'down';
    } catch {
      stellarStatusStr = 'down';
    }

    // Check Redis
    let redisStatus = 'not_configured';
    if (redisClient) {
      try {
        if (redisClient.status === 'wait') {
          await redisClient.connect();
        }
        await redisClient.ping();
        redisStatus = 'up';
      } catch {
        redisStatus = 'down';
      }
    }

    const integrations = {
      db: dbStatus,
      stellar: stellarStatusStr,
      redis: redisStatus,
    };

    const isReady =
      dbStatus === 'up' &&
      stellarStatusStr === 'up' &&
      (redisStatus === 'not_configured' || redisStatus === 'up');

    if (isReady) {
      res.status(200).json({
        status: 'ok',
        integrations,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'error',
        integrations,
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    next(new AppError('Readiness check failed', 500, 'READINESS_CHECK_FAILED'));
  }
};
