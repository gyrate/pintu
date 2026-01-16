import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('admin-user', () => {
  const user = ref<any>(null);
  const token = ref<string | null>(null);

  const storedUser = localStorage.getItem('pintu_admin_user');
  const storedToken = localStorage.getItem('pintu_admin_token');
  if (storedUser) user.value = JSON.parse(storedUser);
  if (storedToken) token.value = storedToken;

  function login(userData: any, authToken: string) {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('pintu_admin_user', JSON.stringify(userData));
    localStorage.setItem('pintu_admin_token', authToken);
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('pintu_admin_user');
    localStorage.removeItem('pintu_admin_token');
  }

  return { user, token, login, logout };
});
