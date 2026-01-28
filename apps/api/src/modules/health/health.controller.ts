import { Request, Response } from 'express';

import { stellarService } from '../../config/stellar';

export const getHealth = async (req: Request, res: Response) => {
  const stellarStatus = await stellarService.getHealth();

  res.status(200).json({
    status: 'ok',
    service: 'sidewalk-api',
    stellar_connected: stellarStatus,
    timestamp: new Date().toISOString(),
  });
};
