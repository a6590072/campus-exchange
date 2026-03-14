const Redis = require('ioredis');

// 内存存储降级方案
const memoryStore = new Map();

let redis = null;
let useMemoryStore = false;

// 支持 Render 的 REDIS_URL 或本地配置
const redisConfig = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('Redis连接失败，切换到内存存储模式');
          useMemoryStore = true;
          return null;
        }
        return Math.min(times * 100, 1000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true
    }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('Redis连接失败，切换到内存存储模式');
          useMemoryStore = true;
          return null;
        }
        return Math.min(times * 100, 1000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };

try {
  redis = new Redis(redisConfig);

  redis.on('connect', () => {
    console.log('Redis connected successfully');
    useMemoryStore = false;
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
    useMemoryStore = true;
  });

  // 尝试连接
  redis.connect().catch(() => {
    console.log('Redis连接失败，使用内存存储模式');
    useMemoryStore = true;
  });
} catch (error) {
  console.log('Redis初始化失败，使用内存存储模式');
  useMemoryStore = true;
}

// 内存存储实现
const memorySession = {
  set(key, data, ttl) {
    const expiresAt = Date.now() + (ttl * 1000);
    memoryStore.set(key, { data, expiresAt });
  },
  get(key) {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.data;
  },
  del(key) {
    memoryStore.delete(key);
  }
};

// 会话管理
const session = {
  async set(openid, data, ttl = 7 * 24 * 60 * 60) {
    const key = `session:${openid}`;
    if (useMemoryStore || !redis) {
      memorySession.set(key, data, ttl);
    } else {
      try {
        await redis.setex(key, ttl, JSON.stringify(data));
      } catch {
        memorySession.set(key, data, ttl);
      }
    }
  },

  async get(openid) {
    const key = `session:${openid}`;
    if (useMemoryStore || !redis) {
      return memorySession.get(key);
    }
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return memorySession.get(key);
    }
  },

  async del(openid) {
    const key = `session:${openid}`;
    if (useMemoryStore || !redis) {
      memorySession.del(key);
    } else {
      try {
        await redis.del(key);
      } catch {
        memorySession.del(key);
      }
    }
  },

  async refresh(openid, ttl = 7 * 24 * 60 * 60) {
    const key = `session:${openid}`;
    if (useMemoryStore || !redis) {
      const data = memorySession.get(key);
      if (data) {
        memorySession.set(key, data, ttl);
      }
    } else {
      try {
        await redis.expire(key, ttl);
      } catch {
        const data = memorySession.get(key);
        if (data) {
          memorySession.set(key, data, ttl);
        }
      }
    }
  }
};

// 验证码管理
const verifyCode = {
  async set(phone, code, ttl = 300) {
    const key = `verify_code:${phone}`;
    if (useMemoryStore || !redis) {
      memorySession.set(key, code, ttl);
    } else {
      try {
        await redis.setex(key, ttl, code);
      } catch {
        memorySession.set(key, code, ttl);
      }
    }
  },

  async get(phone) {
    const key = `verify_code:${phone}`;
    if (useMemoryStore || !redis) {
      return memorySession.get(key);
    }
    try {
      return await redis.get(key);
    } catch {
      return memorySession.get(key);
    }
  },

  async del(phone) {
    const key = `verify_code:${phone}`;
    if (useMemoryStore || !redis) {
      memorySession.del(key);
    } else {
      try {
        await redis.del(key);
      } catch {
        memorySession.del(key);
      }
    }
  }
};

// 缓存管理
const cache = {
  async get(key) {
    if (useMemoryStore || !redis) {
      return memorySession.get(key);
    }
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return memorySession.get(key);
    }
  },

  async set(key, value, ttl = 3600) {
    if (useMemoryStore || !redis) {
      memorySession.set(key, value, ttl);
    } else {
      try {
        await redis.setex(key, ttl, JSON.stringify(value));
      } catch {
        memorySession.set(key, value, ttl);
      }
    }
  },

  async del(key) {
    if (useMemoryStore || !redis) {
      memorySession.del(key);
    } else {
      try {
        await redis.del(key);
      } catch {
        memorySession.del(key);
      }
    }
  }
};

module.exports = {
  redis: useMemoryStore ? null : redis,
  session,
  verifyCode,
  cache,
  isMemoryStore: () => useMemoryStore
};
