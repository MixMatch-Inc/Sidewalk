import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { getLiveness, getReadiness } from './health.controller';
import { stellarService } from '../../config/stellar';

// We cannot use jest.mock in the node test runner.
// We will mock the required methods on the stellarService object itself for this test scope.

describe('Health Endpoints', () => {
    let app: express.Express;

    before(() => {
        app = express();
        app.get('/live', getLiveness);
        app.get('/ready', getReadiness);
    });

    describe('GET /live', () => {
        it('should return 200 OK and uptime', async () => {
            const response = await request(app).get('/live');

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.status, 'ok');
            assert.ok('uptime' in response.body);
            assert.ok('timestamp' in response.body);
        });
    });

    describe('GET /ready', () => {
        it('should return 200 OK when dependencies are healthy', async () => {
            // Mock mongoose ready state for this test
            const originalReadyState = mongoose.connection.readyState;
            Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

            // Mock stellarService
            const originalGetHealth = stellarService.getHealth;
            stellarService.getHealth = async () => true;

            const response = await request(app).get('/ready');

            assert.strictEqual(response.status, 200);
            assert.strictEqual(response.body.status, 'ok');
            assert.strictEqual(response.body.integrations.db, 'up');
            assert.strictEqual(response.body.integrations.stellar, 'up');

            // restore
            Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
            stellarService.getHealth = originalGetHealth;
        });

        it('should return 503 Service Unavailable when DB is down', async () => {
            const originalReadyState = mongoose.connection.readyState;
            // Mock mongoose disconnected
            Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

            const originalGetHealth = stellarService.getHealth;
            stellarService.getHealth = async () => true;

            const response = await request(app).get('/ready');

            assert.strictEqual(response.status, 503);
            assert.strictEqual(response.body.status, 'error');
            assert.strictEqual(response.body.integrations.db, 'down');
            assert.strictEqual(response.body.integrations.stellar, 'up');

            // restore
            Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
            stellarService.getHealth = originalGetHealth;
        });

        it('should return 503 Service Unavailable when Stellar is down', async () => {
            const originalReadyState = mongoose.connection.readyState;
            Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

            const originalGetHealth = stellarService.getHealth;
            stellarService.getHealth = async () => { throw new Error('Stellar down'); };

            const response = await request(app).get('/ready');

            assert.strictEqual(response.status, 503);
            assert.strictEqual(response.body.status, 'error');
            assert.strictEqual(response.body.integrations.db, 'up');
            assert.strictEqual(response.body.integrations.stellar, 'down');

            Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
            stellarService.getHealth = originalGetHealth;
        });
    });
});
