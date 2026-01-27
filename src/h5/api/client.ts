import router from '../router';

const API_BASE = '/api';

export async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const token = localStorage.getItem('pintu_token');
  
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
    localStorage.removeItem('pintu_token');
    localStorage.removeItem('pintu_user');
    router.push('/login');
    throw new Error('Authentication required');
  }

  const text = await response.text();
  let data;
  try {
      data = text ? JSON.parse(text) : {};
  } catch (error) {
      console.error('Failed to parse response as JSON:', text);
      // Even if JSON parsing fails, check if response was ok (though unlikely for API)
      if (!response.ok) {
          throw new Error(response.statusText || 'Network response was not ok');
      }
      // If ok but not JSON, maybe return text? Or empty object?
      // For this API, we expect JSON.
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
  
  getTasks: (userId: string) => request(`/tasks?userId=${userId}`),
  
  getTask: (id: string) => request(`/tasks/${id}`),
  
  createTask: (data: any) => request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  updateTask: (id: string, data: any) => request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  deleteTask: (id: string) => request(`/tasks/${id}`, {
    method: 'DELETE'
  }),
  
  uploadImage: async (file: File, taskId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (taskId) formData.append('taskId', taskId);
    
    const token = localStorage.getItem('pintu_token');
    const headers: HeadersInit = {};
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('pintu_token');
      localStorage.removeItem('pintu_user');
      router.push('/login');
      throw new Error('Authentication required');
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  deleteImage: (id: string) => request(`/images/${id}`, {
    method: 'DELETE'
  }),
  
  exportTask: (id: string) => request(`/tasks/${id}/export`, {
    method: 'POST'
  })
};
