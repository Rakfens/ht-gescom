// src/modules/shared/utils/cache.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 300000; // 5 minutes
  }

  async get(key, fetchFn, ttl = this.defaultTTL) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`🟢 Cache hit: ${key}`);
      return cached.data;
    }

    console.log(`🟡 Cache miss: ${key}`);
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(keyPattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
        console.log(`🗑️ Cache invalidated: ${key}`);
      }
    }
  }

  clear() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }
}

export const cache = new CacheService();