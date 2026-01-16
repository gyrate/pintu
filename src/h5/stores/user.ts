import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null);
  const token = ref<string | null>(null);

  // 初始化时尝试从 localStorage 读取
  const storedUser = localStorage.getItem('pintu_user');
  const storedToken = localStorage.getItem('pintu_token');
  if (storedUser) user.value = JSON.parse(storedUser);
  if (storedToken) token.value = storedToken;

  function login(userData: any, authToken: string) {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('pintu_user', JSON.stringify(userData));
    localStorage.setItem('pintu_token', authToken);
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('pintu_user');
    localStorage.removeItem('pintu_token');
  }

  return { user, token, login, logout };
});
