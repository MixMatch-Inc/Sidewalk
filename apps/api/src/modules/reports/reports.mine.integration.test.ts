import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import reportsRoutes from './reports.routes';
import { ReportModel } from './report.model';
import { errorHandler, notFoundHandler } from '../../core/errors/error-handler';

process.env.JWT_SECRET = 'test-secret';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', reportsRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

test('GET /api/reports/mine returns only the current user report summaries', async () => {
  const originalFind = ReportModel.find;
  const originalCountDocuments = ReportModel.countDocuments;

  try {
    ReportModel.find = (() => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: '507f1f77bcf86cd799439011',
                title: 'Flooded walkway',
                category: 'DRAINAGE',
                status: 'PENDING',
                anchor_status: 'ANCHOR_QUEUED',
                integrity_flag: 'NORMAL',
                createdAt: new Date('2026-03-26T08:00:00.000Z'),
                updatedAt: new Date('2026-03-26T08:10:00.000Z'),
              },
            ],
          }),
        }),
      }),
    })) as unknown as typeof ReportModel.find;

    ReportModel.countDocuments = (async () => 1) as unknown as typeof ReportModel.countDocuments;

    const token = jwt.sign(
      { sub: 'user-123', role: 'CITIZEN', tokenType: 'access' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(buildApp())
      .get('/api/reports/mine?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].title, 'Flooded walkway');
    assert.equal(response.body.pagination.total, 1);
  } finally {
    ReportModel.find = originalFind;
    ReportModel.countDocuments = originalCountDocuments;
  }
});
