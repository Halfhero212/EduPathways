import API_URL from './config.js';

class Auth {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.setToken(data.token);
        this.setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  static async register(full_name, email, password, role) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password, role })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  static logout() {
    this.clearAuth();
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
      window.location.href = './login.html';
    } else {
      window.location.href = './pages/login.html';
    }
  }

  static requireAuth() {
    if (!this.isAuthenticated()) {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/pages/')) {
        window.location.href = './login.html';
      } else {
        window.location.href = './pages/login.html';
      }
      return false;
    }
    return true;
  }
}

export default Auth;
