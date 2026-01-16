const API_BASE = '/api';

export async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
    
    const response = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData
    });
    
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
