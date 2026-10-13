import { apiClient } from './client';
export { apiClient };

export const authApi = {
  login: (mobileNumber, password) =>
    apiClient.post('/auth/login', { mobileNumber, password }),

  getMe: () => apiClient.get('/auth/me'),

  updateProfile: (payload) => apiClient.put('/auth/profile', payload),

  changePassword: (oldPassword, newPassword) =>
    apiClient.put('/auth/change-password', { oldPassword, newPassword }),

  heartbeat: () => apiClient.post('/auth/heartbeat'),

  logout: () => apiClient.post('/auth/logout'),

  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/auth/users${q ? `?${q}` : ''}`);
  },

  getEligibleMembers: (villageId, search = '') =>
    apiClient.get(`/auth/eligible-members?villageId=${villageId}&search=${encodeURIComponent(search)}`),

  createUserFromMember: (memberId, password, role = 'member', assignedVillageId = null) =>
    apiClient.post('/auth/users/create-from-member', { memberId, password, role, assignedVillageId }),

  setUserPassword: (userId, newPassword) =>
    apiClient.post(`/auth/users/${userId}/set-password`, { newPassword }),

  getActiveSessions: () => apiClient.get('/auth/active-sessions'),

  terminateSession: (sessionId) => apiClient.post(`/auth/users/${sessionId}/terminate-session`)
};

export const villageApi = {
  getAll: () => apiClient.get('/villages'),

  getById: (id) => apiClient.get(`/villages/${id}`),

  getStats: (id) => apiClient.get(`/villages/${id}/stats`),

  recalculate: (id) => apiClient.post(`/villages/${id}/recalculate`),

  update: (id, payload) => apiClient.put(`/villages/${id}`, payload),

  create: (payload) => apiClient.post('/villages', payload)
};

export const familyApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/families${q ? `?${q}` : ''}`);
  },

  getById: (id) => apiClient.get(`/families/${id}`),

  getMyFamily: () => apiClient.get('/families/my-family'),

  create: (payload) => apiClient.post('/families', payload),

  update: (id, payload) => apiClient.put(`/families/${id}`, payload),

  delete: (id) => apiClient.delete(`/families/${id}`),

  moveMembers: (payload) => apiClient.post('/families/move-members', payload)
};

export const memberApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/members${q ? `?${q}` : ''}`);
  },

  getById: (id) => apiClient.get(`/members/${id}`),

  create: (payload) => apiClient.post('/members', payload),

  update: (id, payload) => apiClient.put(`/members/${id}`, payload),

  delete: (id) => apiClient.delete(`/members/${id}`)
};
