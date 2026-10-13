import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiCache {
  constructor() {
    this.memoryCache = new Map();
    // Default TTLs in milliseconds
    this.defaultTtl = 5 * 60 * 1000; // 5 minutes
  }

  // Generate a consistent cache key from endpoint and options
  getCacheKey(endpoint) {
    return `nadoda_cache_${endpoint}`;
  }

  // Get data from memory or AsyncStorage
  async get(endpoint, maxAgeMs = this.defaultTtl) {
    const key = this.getCacheKey(endpoint);

    // 1. Check memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      const isExpired = Date.now() - entry.timestamp > maxAgeMs;
      if (!isExpired) {
        return entry.data;
      }
    }

    // 2. Fall back to AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const entry = JSON.parse(stored);
        const isExpired = Date.now() - entry.timestamp > maxAgeMs;
        if (!isExpired) {
          // Re-populate memory cache for fast subsequent access
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e.message);
    }

    return null;
  }

  // Save data to memory and AsyncStorage
  async set(endpoint, data) {
    const key = this.getCacheKey(endpoint);
    const entry = {
      timestamp: Date.now(),
      data
    };

    this.memoryCache.set(key, entry);

    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Cache write error:', e.message);
    }
  }

  // Invalidate specific endpoint or pattern
  async invalidate(pattern) {
    try {
      // Clear matching keys from memory
      for (const key of this.memoryCache.keys()) {
        if (!pattern || key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }

      // Clear from storage
      const allKeys = await AsyncStorage.getAllKeys();
      const matchKeys = allKeys.filter(k => k.startsWith('nadoda_cache_') && (!pattern || k.includes(pattern)));
      if (matchKeys.length > 0) {
        await AsyncStorage.multiRemove(matchKeys);
      }
    } catch (e) {
      console.warn('Cache invalidate error:', e.message);
    }
  }

  // Clear all cached responses
  async clear() {
    this.memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith('nadoda_cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (e) {
      console.warn('Cache clear error:', e.message);
    }
  }
}

export const apiCache = new ApiCache();
