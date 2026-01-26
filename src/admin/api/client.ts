const API_BASE = '/api';

export async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // 从 localStorage 获取 token
  const token = localStorage.getItem('pintu_admin_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network response was not ok');
  }

  return data;
}

export const api = {
  login: (phone: string, code: string) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code })
  }),
  
  // Admin APIs (Assuming admin can see all tasks/users)
  getTasks: (userId?: string, page: number = 1, pageSize: number = 10) => {
    let url = `/tasks?page=${page}&pageSize=${pageSize}`;
    if (userId) url += `&userId=${userId}`;
    return request(url);
  },
  
  deleteTask: (id: string) => request(`/tasks/${id}`, {
    method: 'DELETE'
  }),

  getUsers: (page: number = 1, pageSize: number = 10) => request(`/users?page=${page}&pageSize=${pageSize}`),
  createUser: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  
  resetPassword: (userId: string, password: string) => request(`/users/${userId}/password`, {
    method: 'POST',
    body: JSON.stringify({ password })
  }),

  getImages: (page: number = 1, pageSize: number = 10) => request(`/images?page=${page}&pageSize=${pageSize}`),
  deleteImage: (id: string) => request(`/images/${id}`, { method: 'DELETE' }),

  getResults: (page: number = 1, pageSize: number = 10) => request(`/tasks/results?page=${page}&pageSize=${pageSize}`),

  getDashboardStats: () => request('/dashboard/stats'),
};
