import Redis from 'ioredis';
import { logger } from '../../core/logging/logger';

const OTP_KEY_PREFIX = 'otp:';
const OTP_LOCK_PREFIX = 'otp_lock:';
const OTP_COOLDOWN_PREFIX = 'otp_cooldown:';

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? new Redis(redisUrl, { lazyConnect: true }) : null;

type Entry = {
  value: string;
  expiresAt: number;
};

const memoryStore = new Map<string, Entry>();

const nowMs = () => Date.now();

const isExpired = (entry: Entry | undefined) => !entry || entry.expiresAt <= nowMs();

const setMemory = async (key: string, ttlSeconds: number, value: string) => {
  memoryStore.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 });
};

const getMemory = async (key: string): Promise<string | null> => {
  const entry = memoryStore.get(key);
  if (isExpired(entry)) {
    memoryStore.delete(key);
    return null;
  }
  return entry!.value;
};

const delMemory = async (key: string) => {
  memoryStore.delete(key);
};

const ttlMemory = async (key: string): Promise<number> => {
  const entry = memoryStore.get(key);
  if (isExpired(entry)) {
    memoryStore.delete(key);
    return -2;
  }
  return Math.ceil((entry!.expiresAt - nowMs()) / 1000);
};

const withRedisFallback = async <T>(
  action: (client: Redis) => Promise<T>,
  fallback: () => Promise<T>,
) => {
  if (!redis) {
    return fallback();
  }

  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
    return await action(redis);
  } catch (error) {
    logger.warn('Redis OTP operation failed, using memory fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback();
  }
};

export const otpStore = {
  async setOtp(email: string, value: string, ttlSeconds: number) {
    const key = `${OTP_KEY_PREFIX}${email}`;
    await withRedisFallback(
      async (client) => {
        await client.set(key, value, 'EX', ttlSeconds);
      },
      () => setMemory(key, ttlSeconds, value),
    );
  },

  async getOtp(email: string) {
    const key = `${OTP_KEY_PREFIX}${email}`;
    return withRedisFallback(
      async (client) => client.get(key),
      () => getMemory(key),
    );
  },

  async clearOtp(email: string) {
    const key = `${OTP_KEY_PREFIX}${email}`;
    await withRedisFallback(
      async (client) => {
        await client.del(key);
      },
      () => delMemory(key),
    );
  },

  async setLock(email: string, ttlSeconds: number) {
    const key = `${OTP_LOCK_PREFIX}${email}`;
    await withRedisFallback(
      async (client) => {
        await client.set(key, '1', 'EX', ttlSeconds);
      },
      () => setMemory(key, ttlSeconds, '1'),
    );
  },

  async getLockTTL(email: string) {
    const key = `${OTP_LOCK_PREFIX}${email}`;
    return withRedisFallback(
      async (client) => client.ttl(key),
      () => ttlMemory(key),
    );
  },

  async setCooldown(email: string, ttlSeconds: number) {
    const key = `${OTP_COOLDOWN_PREFIX}${email}`;
    await withRedisFallback(
      async (client) => {
        await client.set(key, '1', 'EX', ttlSeconds);
      },
      () => setMemory(key, ttlSeconds, '1'),
    );
  },

  async getCooldownTTL(email: string) {
    const key = `${OTP_COOLDOWN_PREFIX}${email}`;
    return withRedisFallback(
      async (client) => client.ttl(key),
      () => ttlMemory(key),
    );
  },
};
