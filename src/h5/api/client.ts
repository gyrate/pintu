import router from '../router';
import { showLoadingToast, closeToast } from 'vant';

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
    loading?: boolean; // 扩展选项：是否显示 loading，默认 true
}

export async function request(endpoint: string, options: RequestOptions = {}) {
  const { loading = true, ...fetchOptions } = options;
  const url = `${API_BASE}${endpoint}`;
  
  const token = localStorage.getItem('pintu_token');
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let toast = null;
  if (loading) {
      toast = showLoadingToast({
          message: '加载中...',
          forbidClick: true,
          duration: 0 // 持续展示
      });
  }

  try {
    const response = await fetch(url, {
        ...fetchOptions,
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
        if (!response.ok) {
            throw new Error(response.statusText || 'Network response was not ok');
        }
        throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
        throw new Error(data.error || 'Network response was not ok');
    }

    return data;
  } finally {
      if (toast) {
          toast.close();
      }
  }
}

export const api = {
  login: (phone: string, code?: string, password?: string, type: 'code' | 'password' = 'code') => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, code, password, type })
  }),
  
  getTasks: (userId: string, page = 1, pageSize = 10, search = '', sort = 'desc') => {
    let url = `/tasks?userId=${userId}&page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sort) url += `&sort=${sort}`;
    return request(url);
  },
  
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

    const toast = showLoadingToast({
        message: '上传中...',
        forbidClick: true,
        duration: 0
    });

    try {
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
    } finally {
        toast.close();
    }
  },

  deleteImage: (id: string) => request(`/images/${id}`, {
    method: 'DELETE'
  }),
  
  exportTask: (id: string) => request(`/tasks/${id}/export`, {
    method: 'POST'
  }),

  getDashboardStats: (range: number = 12, taskRange: number = 30) => request(`/dashboard/stats?range=${range}&taskRange=${taskRange}`),
};
