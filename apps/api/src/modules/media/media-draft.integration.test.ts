import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mediaRoutes from './media.routes';
import { MediaDraftModel } from './media-draft.model';
import { errorHandler, notFoundHandler } from '../../core/errors/error-handler';

process.env.JWT_SECRET = 'test-secret';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/media', mediaRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

test('POST /api/media/drafts creates an owned media draft', async () => {
  const originalCreate = MediaDraftModel.create;

  try {
    MediaDraftModel.create = (async (payload: { owner_user_id: string; status: string; expires_at: Date }) =>
      ({
        _id: '507f1f77bcf86cd799439011',
        ...payload,
      }) as never) as unknown as typeof MediaDraftModel.create;

    const token = jwt.sign(
      { sub: 'user-123', role: 'CITIZEN', tokenType: 'access' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(buildApp())
      .post('/api/media/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    assert.equal(response.status, 201);
    assert.equal(response.body.draftId, '507f1f77bcf86cd799439011');
    assert.equal(response.body.status, 'OPEN');
  } finally {
    MediaDraftModel.create = originalCreate;
  }
});
