import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import reportsRoutes from './reports.routes';
import { ReportModel } from './report.model';
import { UserModel } from '../users/user.model';
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

test('GET /api/reports returns paginated summaries for authenticated users', async () => {
  const originalFind = ReportModel.find;
  const originalCountDocuments = ReportModel.countDocuments;
  const originalUserFind = UserModel.find;

  try {
    ReportModel.find = (() => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: '507f1f77bcf86cd799439011',
                title: 'Streetlight outage',
                category: 'LIGHTING',
                status: 'PENDING',
                location: { type: 'Point', coordinates: [3.4, 6.5] },
                reporter_user_id: 'user-1',
                anchor_status: 'ANCHOR_QUEUED',
                stellar_tx_hash: null,
                integrity_flag: 'NORMAL',
                createdAt: new Date('2026-03-25T12:00:00.000Z'),
                updatedAt: new Date('2026-03-25T12:30:00.000Z'),
              },
            ],
          }),
        }),
      }),
    })) as unknown as typeof ReportModel.find;

    ReportModel.countDocuments = (async () => 1) as unknown as typeof ReportModel.countDocuments;
    UserModel.find = (() => ({
      select: () => ({
        lean: async () => [],
      }),
    })) as unknown as typeof UserModel.find;

    const token = jwt.sign(
      { sub: 'user-1', role: 'CITIZEN', tokenType: 'access' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(buildApp())
      .get('/api/reports?page=1&pageSize=10&mine=true')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.pagination.total, 1);
    assert.equal(response.body.data[0].title, 'Streetlight outage');
  } finally {
    ReportModel.find = originalFind;
    ReportModel.countDocuments = originalCountDocuments;
    UserModel.find = originalUserFind;
  }
});
