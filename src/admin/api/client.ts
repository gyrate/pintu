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
  
  // Admin APIs (Assuming admin can see all tasks/users)
  getTasks: (userId?: string) => request(userId ? `/tasks?userId=${userId}` : '/tasks'),
  
  deleteTask: (id: string) => request(`/tasks/${id}`, {
    method: 'DELETE'
  }),

  getUsers: () => request('/users'),
};
