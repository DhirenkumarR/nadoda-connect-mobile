import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Render backend as default for live mobile testing
export const DEFAULT_API_URL = 'https://nadoda-connect-backend.onrender.com/api';

class ApiClient {
  constructor() {
    this.baseUrl = DEFAULT_API_URL;
  }

  async setBaseUrl(url) {
    this.baseUrl = url;
    await AsyncStorage.setItem('custom_api_url', url);
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

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
