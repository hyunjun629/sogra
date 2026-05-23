import { getToken, clearAuth } from './auth';

const BASE = '/api';

async function request(method, path, body, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (email, password, business_number) => request('POST', '/auth/register', { email, password, business_number }),
  verifyBusiness: (business_number) => request('POST', '/auth/verify-business', { business_number }),
  me: () => request('GET', '/auth/me'),

  // Public store
  getPublicStore: (id, token) => request('GET', `/products/store-public/${id}?token=${encodeURIComponent(token || '')}`),

  // Products
  getPublicProduct: (id, token) => request('GET', `/products/public/${id}?token=${encodeURIComponent(token || '')}`),
  getMyProducts: () => request('GET', '/products/my'),
  createProduct: (data) => request('POST', '/products', data),
  updateProduct: (id, data) => request('PUT', `/products/${id}`, data),
  deleteProduct: (id) => request('DELETE', `/products/${id}`),

  // Stores
  getMyStores: () => request('GET', '/products/stores/my'),
  createStore: (data) => request('POST', '/products/stores', data),

  // Reports
  submitReport: (productId, reason, detail) => request('POST', `/reports/${productId}`, { reason, detail }),

  // Admin
  getStats: () => request('GET', '/admin/stats'),
  getLogs: () => request('GET', '/admin/logs'),
  getRecentLogs: (since) => request('GET', `/admin/logs/recent${since ? `?since=${since}` : ''}`),
  getAdminStores: () => request('GET', '/admin/stores'),
  updateStoreStatus: (id, status) => request('PUT', `/admin/stores/${id}/status`, { status }),
  getAdminReports: () => request('GET', '/admin/reports'),
  getAdminProducts: () => request('GET', '/admin/products'),
  resetDemo: () => request('POST', '/admin/demo/reset'),

  // Demo attacks (no auth required)
  demoSqli: () => request('POST', '/admin/demo/sqli'),
  demoBruteforce: () => request('POST', '/admin/demo/bruteforce'),
  demoXss: () => request('POST', '/admin/demo/xss'),
  demoIdor: () => request('POST', '/admin/demo/idor'),
  demoFakeQr: () => request('POST', '/admin/demo/fake-qr'),
};
