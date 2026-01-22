import axios from 'axios';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { auth, db, googleProvider } from './firebase';
import { tokenManager, USER_KEY } from '../utils/auth';
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
  async (config) => {
    // If we have a current user, get the latest token
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      const token = tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Firebase SDK handles token refresh automatically
    return Promise.reject(error);
  }
);

export const authService = {
  // Register new user
  register: async (userData) => {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      // 2. Update profile name
      await updateProfile(user, {
        displayName: userData.name
      });

      // 3. Create user document in Firestore
      const newUser = {
        id: user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        isEmailVerified: false // Will be updated when they verify
      };

      await setDoc(doc(db, 'users', user.uid), newUser);

      // 4. Send verification email
      // Use Firebase's native verification
      await sendEmailVerification(user);

      return {
        data: {
          user: newUser,
          message: 'Registration successful! Please check your email to verify your account.'
        }
      };
    } catch (error) {
      console.error("Registration Error:", error);
      throw new Error(error.message);
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData = userDoc.exists() ? userDoc.data() : null;

      if (!userData) {
        // Fallback if firestore doc missing
        userData = {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'user',
          status: 'active'
        };
      }

      const token = await user.getIdToken();
      const refreshToken = user.refreshToken; 

      return {
        data: {
          user: userData,
          accessToken: token,
          refreshToken: refreshToken,
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Google Login
  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      let userData;

      if (!userDoc.exists()) {
        // Create new user doc
        userData = {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'user',
          createdAt: new Date().toISOString(),
          isEmailVerified: user.emailVerified
        };
        await setDoc(userRef, userData);
      } else {
        userData = userDoc.data();
      }

      const token = await user.getIdToken();

      return {
        data: {
          user: userData,
          accessToken: token,
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Logout user
  logout: async () => {
    try {
      await signOut(auth);
      tokenManager.clearAll();
      return { data: { message: 'Logged out successfully' } };
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        data: { message: 'Password reset email sent! Please check your inbox.' }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Resend verification email
  resendVerification: async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return {
          data: { message: 'Verification email resent! Please check your inbox.' }
        };
      }
      throw new Error('No user logged in');
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Get current user (One-off check)
  getCurrentUser: async () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              resolve({ data: { user: userDoc.data() } });
            } else {
              // Basic info if doc doesn't exist
              resolve({ 
                data: { 
                  user: {
                    id: user.uid,
                    email: user.email,
                    name: user.displayName,
                   role: 'user',
                   status: 'active'
                  } 
                } 
              });
            }
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No user logged in'));
        }
      });
    });
  },

  // Subscribe to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
             callback(userDoc.data());
          } else {
             callback({
                id: user.uid,
                email: user.email,
                name: user.displayName,
                role: 'user'
             });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
  
  // Deprecated/Not needed with Firebase Auth (handled by Firebase links)
  verifyEmail: async (token) => {
    console.warn("verifyEmail called but Firebase handles this via link");
    return { data: { message: 'Please check your email to verify.' } };
  },
  
  resetPassword: async (token, newPassword) => {
     console.warn("resetPassword called but Firebase handles this via link");
     return { data: { message: 'Please follow the link in your email to reset password.' } };
  }
};
