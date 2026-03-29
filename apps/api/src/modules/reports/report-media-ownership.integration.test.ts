import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import reportsRoutes from './reports.routes';
import { ReportModel } from './report.model';
import { MediaUploadModel } from '../media/media-upload.model';
import { MediaDraftModel } from '../media/media-draft.model';
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

test('POST /api/reports rejects media owned by another user', async () => {
  const originalFind = MediaUploadModel.find;
  const originalDraftFindById = MediaDraftModel.findById;
  const originalCreate = ReportModel.create;

  try {
    MediaUploadModel.find = (() => ({
      lean: async () => [
        {
          url: 'https://example.com/report.jpg',
          owner_user_id: 'someone-else',
          draft_id: null,
        },
      ],
    })) as unknown as typeof MediaUploadModel.find;

    MediaDraftModel.findById = (async () => null) as unknown as typeof MediaDraftModel.findById;
    ReportModel.create = (async () => {
      throw new Error('Report should not be created for unauthorized media');
    }) as unknown as typeof ReportModel.create;

    const token = jwt.sign(
      { sub: 'user-123', role: 'CITIZEN', tokenType: 'access' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(buildApp())
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Broken curb',
        description: 'Concrete has collapsed into the walkway.',
        category: 'INFRASTRUCTURE',
        location: { type: 'Point', coordinates: [3.44, 6.45] },
        media_urls: ['https://example.com/report.jpg'],
      });

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'MEDIA_FORBIDDEN');
  } finally {
    MediaUploadModel.find = originalFind;
    MediaDraftModel.findById = originalDraftFindById;
    ReportModel.create = originalCreate;
  }
});
