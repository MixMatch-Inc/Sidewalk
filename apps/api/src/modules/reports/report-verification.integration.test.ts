import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import reportsRoutes from './reports.routes';
import { stellarService } from '../../config/stellar';
import { errorHandler, notFoundHandler } from '../../core/errors/error-handler';
import { buildDeterministicSnapshot, hashSnapshot } from './reports.snapshot';

process.env.JWT_SECRET = 'test-secret';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', reportsRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

test('POST /api/reports/verify accepts canonical report payload verification', async () => {
  const originalVerifyTransaction = stellarService.verifyTransaction;

  try {
    let capturedHash: string | undefined;

    stellarService.verifyTransaction = (async (_txHash: string, expectedHash: string) => {
      capturedHash = expectedHash;
      return {
        valid: true,
        timestamp: '2026-03-26T09:00:00.000Z',
        sender: 'GTESTSENDER',
      };
    }) as typeof stellarService.verifyTransaction;

    const token = jwt.sign(
      { sub: 'user-123', role: 'CITIZEN', tokenType: 'access' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const reportPayload = {
      title: 'Collapsed sidewalk slab',
      description: 'The slab has broken into the drainage path.',
      category: 'INFRASTRUCTURE',
      location: { type: 'Point', coordinates: [3.44, 6.45] as [number, number] },
      media_urls: ['https://example.com/report.jpg'],
    };

    const response = await request(buildApp())
      .post('/api/reports/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        txHash: 'stellar-hash',
        report: reportPayload,
      });

    assert.equal(response.status, 200);
    assert.equal(
      capturedHash,
      hashSnapshot(buildDeterministicSnapshot(reportPayload)),
    );
  } finally {
    stellarService.verifyTransaction = originalVerifyTransaction;
  }
});
