import Cookies from 'js-cookie';

// Token management
export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user_data';

export const tokenManager = {
  getToken: () => Cookies.get(TOKEN_KEY),
  setToken: (token) => Cookies.set(TOKEN_KEY, token, { expires: 1 }), // 1 day
  removeToken: () => Cookies.remove(TOKEN_KEY),
  
  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => Cookies.set(REFRESH_TOKEN_KEY, token, { expires: 7 }), // 7 days
  removeRefreshToken: () => Cookies.remove(REFRESH_TOKEN_KEY),
  
  clearAll: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// JWT token validation
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Password validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Session timeout handling
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimer = null;

export const startSessionTimer = (onTimeout) => {
  clearSessionTimer();
  sessionTimer = setTimeout(() => {
    onTimeout();
  }, SESSION_TIMEOUT);
};

export const clearSessionTimer = () => {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
};

export const resetSessionTimer = (onTimeout) => {
  startSessionTimer(onTimeout);
};