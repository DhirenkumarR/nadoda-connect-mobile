import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiCache } from './cache';

// Production Render backend as default for live mobile testing
export const DEFAULT_API_URL = 'https://nadoda-connect-backend.onrender.com/api';

class ApiClient {
  constructor() {
    this.baseUrl = DEFAULT_API_URL;
  }

  async setBaseUrl(url) {
    this.baseUrl = url;
    await AsyncStorage.setItem('custom_api_url', url);
    await apiCache.clear();
  }

  async init() {
    try {
      const stored = await AsyncStorage.getItem('custom_api_url');
      if (stored && stored.startsWith('https://') && !stored.includes('ngrok') && !stored.includes('localhost') && !stored.includes('192.168.')) {
        this.baseUrl = stored;
      } else {
        this.baseUrl = DEFAULT_API_URL;
        await AsyncStorage.removeItem('custom_api_url');
      }
    } catch {
      this.baseUrl = DEFAULT_API_URL;
    }
  }

  async getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const token = await AsyncStorage.getItem('nadoda_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const userStr = await AsyncStorage.getItem('nadoda_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?._id || u?.id) {
          headers['x-user-id'] = u._id || u.id;
        }
      }
    } catch {}

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...(await this.getHeaders()),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.response = data;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API ${options.method || 'GET'} ${endpoint}] Error:`, err.message);
      throw err;
    }
  }

  async get(endpoint, headers = {}, options = {}) {
    const { forceRefresh = false, ttlMs } = options;

    // Check cache first if not force refreshed
    if (!forceRefresh) {
      const cached = await apiCache.get(endpoint, ttlMs);
      if (cached) {
        return cached;
      }
    }

    const data = await this.request(endpoint, { method: 'GET', headers });

    // Cache successful GET responses
    if (data && (data.success !== false)) {
      await apiCache.set(endpoint, data);
    }

    return data;
  }

  async post(endpoint, body = {}, headers = {}) {
    const data = await this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    // Invalidate related caches
    if (endpoint.includes('/members')) await apiCache.invalidate('/members');
    if (endpoint.includes('/families')) await apiCache.invalidate('/families');
    if (endpoint.includes('/villages')) await apiCache.invalidate('/villages');
    if (endpoint.includes('/auth/users') || endpoint.includes('session')) {
      await apiCache.invalidate('/auth');
    }

    return data;
  }

  async put(endpoint, body = {}, headers = {}) {
    const data = await this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    // Invalidate related caches
    if (endpoint.includes('/members')) await apiCache.invalidate('/members');
    if (endpoint.includes('/families')) await apiCache.invalidate('/families');
    if (endpoint.includes('/villages')) await apiCache.invalidate('/villages');
    if (endpoint.includes('/auth')) await apiCache.invalidate('/auth');

    return data;
  }

  async delete(endpoint, headers = {}) {
    const data = await this.request(endpoint, { method: 'DELETE', headers });

    // Invalidate related caches
    if (endpoint.includes('/members')) await apiCache.invalidate('/members');
    if (endpoint.includes('/families')) await apiCache.invalidate('/families');
    if (endpoint.includes('/villages')) await apiCache.invalidate('/villages');
    if (endpoint.includes('/auth')) await apiCache.invalidate('/auth');

    return data;
  }
}

export const apiClient = new ApiClient();
