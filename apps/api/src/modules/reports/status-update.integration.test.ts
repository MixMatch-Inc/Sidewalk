import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import reportsRoutes from './reports.routes';
import { ReportModel } from './report.model';
import { StatusUpdateModel } from './status-update.model';
import { stellarService } from '../../config/stellar';
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

test('POST /api/reports/status persists the report status transition', async () => {
  const originalFindOne = ReportModel.findOne;
  const originalCreate = StatusUpdateModel.create;
  const originalAnchorHash = stellarService.anchorHash;

  try {
    let savedStatus: string | undefined;
    let savedTransition:
      | { previousStatus: string; nextStatus: string; note?: string | undefined }
      | undefined;

    ReportModel.findOne = (async () =>
      ({
        _id: '507f1f77bcf86cd799439011',
        status: 'PENDING',
        save: async function save(this: { status: string }) {
          savedStatus = this.status;
        },
      }) as never) as unknown as typeof ReportModel.findOne;

    StatusUpdateModel.create = (async (payload: {
      previousStatus: string;
      nextStatus: string;
      note?: string;
    }) => {
      savedTransition = payload;
      return payload as never;
    }) as unknown as typeof StatusUpdateModel.create;

    stellarService.anchorHash = (async () => 'stellar-status-hash') as typeof stellarService.anchorHash;

    const token = jwt.sign(
      { sub: '507f191e810c19729de860ea', role: 'AGENCY_ADMIN', tokenType: 'access' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(buildApp())
      .post('/api/reports/status')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalTxHash: 'report-stellar-hash',
        status: 'ACKNOWLEDGED',
        evidence: 'Assigned to maintenance',
      });

    assert.equal(response.status, 200);
    assert.equal(savedStatus, 'ACKNOWLEDGED');
    assert.equal(savedTransition?.previousStatus, 'PENDING');
    assert.equal(savedTransition?.nextStatus, 'ACKNOWLEDGED');
    assert.equal(savedTransition?.note, 'Assigned to maintenance');
  } finally {
    ReportModel.findOne = originalFindOne;
    StatusUpdateModel.create = originalCreate;
    stellarService.anchorHash = originalAnchorHash;
  }
});
