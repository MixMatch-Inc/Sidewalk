import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAuthEnv } from './auth-env';

describe('validateAuthEnv', () => {
  it('accepts JWT_SECRET alone', () => {
    const env = validateAuthEnv({ JWT_SECRET: 'supersecret' });
    assert.equal(env.JWT_SECRET, 'supersecret');
    assert.equal(env.ACCESS_TOKEN_EXPIRES_IN, '15m');
    assert.equal(env.REFRESH_TOKEN_EXPIRES_IN, '30d');
  });

  it('accepts JWT_PRIVATE_KEY + JWT_PUBLIC_KEY pair', () => {
    const env = validateAuthEnv({ JWT_PRIVATE_KEY: 'priv', JWT_PUBLIC_KEY: 'pub' });
    assert.equal(env.JWT_PRIVATE_KEY, 'priv');
    assert.equal(env.JWT_PUBLIC_KEY, 'pub');
  });

  it('respects custom token expiry values', () => {
    const env = validateAuthEnv({
      JWT_SECRET: 's',
      ACCESS_TOKEN_EXPIRES_IN: '5m',
      REFRESH_TOKEN_EXPIRES_IN: '7d',
    });
    assert.equal(env.ACCESS_TOKEN_EXPIRES_IN, '5m');
    assert.equal(env.REFRESH_TOKEN_EXPIRES_IN, '7d');
  });

  it('throws when no JWT credentials are provided', () => {
    assert.throws(
      () => validateAuthEnv({}),
      /JWT configuration missing/,
    );
  });

  it('throws when only JWT_PRIVATE_KEY is set without JWT_PUBLIC_KEY', () => {
    assert.throws(
      () => validateAuthEnv({ JWT_PRIVATE_KEY: 'priv' }),
      /JWT configuration missing/,
    );
  });

  it('throws with actionable variable names in the message', () => {
    try {
      validateAuthEnv({});
      assert.fail('expected throw');
    } catch (err) {
      assert.ok(err instanceof Error);
      const error = err as Error;
      assert.match(error.message, /Auth environment invalid/);
      assert.match(error.message, /JWT/);
    }
  });
});
