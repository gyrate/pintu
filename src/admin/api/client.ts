import router from '../router';

const API_BASE = '/api';

export async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // 从 localStorage 获取 token
  const token = localStorage.getItem('pintu_admin_token');
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('pintu_admin_token');
    localStorage.removeItem('pintu_admin_user');
    router.push('/login');
    throw new Error('Authentication required');
  }

  const text = await response.text();
  let data;
  try {
      data = text ? JSON.parse(text) : {};
  } catch (error) {
      console.error('Failed to parse response as JSON:', text);
      if (!response.ok) {
          throw new Error(response.statusText || 'Network response was not ok');
      }
      throw new Error('Invalid JSON response');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Network response was not ok');
  }

  return data;
}

export const api = {
  login: (phone: string, code?: string, password?: string, type: 'code' | 'password' = 'code') => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code, password, type })
  }),
  
  // Admin APIs (Assuming admin can see all tasks/users)
  getTasks: (userId?: string, page: number = 1, pageSize: number = 10, search?: string) => {
    let url = `/tasks?page=${page}&pageSize=${pageSize}`;
    if (userId) url += `&userId=${userId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return request(url);
  },
  
  deleteTask: (id: string) => request(`/tasks/${id}`, {
    method: 'DELETE'
  }),

  batchDeleteTasks: (ids: string[]) => request('/tasks/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids })
  }),

  getUsers: (page: number = 1, pageSize: number = 10) => request(`/users?page=${page}&pageSize=${pageSize}`),
  createUser: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  
  resetPassword: (userId: string, password: string) => request(`/users/${userId}/password`, {
    method: 'POST',
    body: JSON.stringify({ password })
  }),

  getImages: (page: number = 1, pageSize: number = 10, search?: string) => {
    let url = `/images?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return request(url);
  },
  deleteImage: (id: string) => request(`/images/${id}`, { method: 'DELETE' }),
  batchDeleteImages: (ids: string[]) => request('/images/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids })
  }),

  getResults: (page: number = 1, pageSize: number = 10, search?: string) => {
    let url = `/tasks/results?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return request(url);
  },

  getDashboardStats: () => request('/dashboard/stats'),
};
