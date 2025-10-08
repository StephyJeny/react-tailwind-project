import axios from 'axios';
import { tokenManager } from '../utils/auth';
import { emailService } from './emailService';

// For development, we'll simulate API calls
// In production, replace with your actual API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await refreshAuthToken(refreshToken);
          tokenManager.setToken(response.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        tokenManager.clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Simulated API functions (replace with real API calls)
export const authService = {
  // Register new user
  register: async (userData) => {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const emailExists = existingUsers.some(user => user.email === userData.email);
          
          if (emailExists) {
            reject(new Error('Email already exists'));
            return;
          }
          
          // Generate verification token
          const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newUser = {
            id: Date.now().toString(),
            ...userData,
            role: 'user',
            isEmailVerified: false,
            verificationToken,
            verificationTokenExpiry: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            createdAt: new Date().toISOString(),
          };
          
          existingUsers.push(newUser);
          localStorage.setItem('users', JSON.stringify(existingUsers));
          
          // Send verification email
          await emailService.sendVerificationEmail(
            userData.email, 
            verificationToken, 
            userData.name
          );
          
          resolve({
            data: {
              user: { ...newUser, password: undefined, verificationToken: undefined },
              message: 'Registration successful! Please check your email to verify your account.'
            }
          });
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  },

  // Verify email
  verifyEmail: async (token) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => 
          u.verificationToken === token && 
          u.verificationTokenExpiry > Date.now()
        );
        
        if (userIndex === -1) {
          reject(new Error('Invalid or expired verification token'));
          return;
        }
        
        users[userIndex].isEmailVerified = true;
        users[userIndex].verificationToken = null;
        users[userIndex].verificationTokenExpiry = null;
        localStorage.setItem('users', JSON.stringify(users));
        
        resolve({
          data: { message: 'Email verified successfully! You can now log in.' }
        });
      }, 1000);
    });
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const userIndex = users.findIndex(u => u.email === email);
          
          if (userIndex === -1) {
            reject(new Error('Email not found'));
            return;
          }
          
          // Generate reset token
          const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          users[userIndex].resetToken = resetToken;
          users[userIndex].resetTokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
          localStorage.setItem('users', JSON.stringify(users));
          
          // Send password reset email
          await emailService.sendPasswordResetEmail(
            email, 
            resetToken, 
            users[userIndex].name
          );
          
          resolve({
            data: { message: 'Password reset email sent! Please check your inbox.' }
          });
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  },

  // Login user
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          reject(new Error('Invalid email or password'));
          return;
        }
        
        if (!user.isEmailVerified) {
          reject(new Error('Please verify your email before logging in'));
          return;
        }
        
        // Generate mock JWT tokens
        const accessToken = `mock.jwt.token.${Date.now()}`;
        const refreshToken = `mock.refresh.token.${Date.now()}`;
        
        resolve({
          data: {
            user: { ...user, password: undefined },
            accessToken,
            refreshToken,
            expiresIn: 3600 // 1 hour
          }
        });
      }, 1000);
    });
  },

  // Logout user
  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        tokenManager.clearAll();
        resolve({ data: { message: 'Logged out successfully' } });
      }, 500);
    });
  },

  // Verify email
  verifyEmail: async (token) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate email verification
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === token);
        
        if (userIndex === -1) {
          reject(new Error('Invalid verification token'));
          return;
        }
        
        users[userIndex].isEmailVerified = true;
        localStorage.setItem('users', JSON.stringify(users));
        
        resolve({
          data: { message: 'Email verified successfully' }
        });
      }, 1000);
    });
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user) {
          reject(new Error('Email not found'));
          return;
        }
        
        // In real app, send email with reset token
        console.log(`Password reset email sent to ${email}`);
        
        resolve({
          data: { message: 'Password reset email sent' }
        });
      }, 1000);
    });
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === token);
        
        if (userIndex === -1) {
          reject(new Error('Invalid reset token'));
          return;
        }
        
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        resolve({
          data: { message: 'Password reset successfully' }
        });
      }, 1000);
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const token = tokenManager.getToken();
        if (!token) {
          reject(new Error('No token found'));
          return;
        }
        
        // In real app, decode JWT and fetch user data
        const userData = localStorage.getItem(USER_KEY);
        if (userData) {
          resolve({ data: { user: JSON.parse(userData) } });
        } else {
          reject(new Error('User data not found'));
        }
      }, 500);
    });
  }
};

// Helper function for token refresh
const refreshAuthToken = async (refreshToken) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate token refresh
      const newAccessToken = `mock.jwt.token.${Date.now()}`;
      resolve({
        data: { accessToken: newAccessToken }
      });
    }, 500);
  });
};