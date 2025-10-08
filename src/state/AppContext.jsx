import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { authService } from "../services/authService";
import { tokenManager, isTokenValid, startSessionTimer, clearSessionTimer, resetSessionTimer } from "../utils/auth";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const storage = {
  get: (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [theme, setTheme] = useState(storage.get("pf_theme", "light"));
  const [transactions, setTransactions] = useState(storage.get("pf_tx", []));
  const [cart, setCart] = useState(storage.get("pf_cart", []));

  // Session timeout handler
  const handleSessionTimeout = useCallback(() => {
    logout();
    setAuthError('Your session has expired. Please log in again.');
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken();
      
      if (token && isTokenValid(token)) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
          setIsAuthenticated(true);
          startSessionTimer(handleSessionTimeout);
        } catch (error) {
          console.error('Failed to get current user:', error);
          tokenManager.clearAll();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();

    // Cleanup session timer on unmount
    return () => clearSessionTimer();
  }, [handleSessionTimeout]);

  // Reset session timer on user activity
  useEffect(() => {
    if (isAuthenticated) {
      const resetTimer = () => resetSessionTimer(handleSessionTimeout);
      
      // Add event listeners for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetTimer, true);
        });
      };
    }
  }, [isAuthenticated, handleSessionTimeout]);

  // Theme persistence
  useEffect(() => {
    storage.set("pf_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // Data persistence
  useEffect(() => storage.set("pf_tx", transactions), [transactions]);
  useEffect(() => storage.set("pf_cart", cart), [cart]);

  // Authentication functions
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await authService.login(email, password);
      const { user: userData, accessToken, refreshToken } = response.data;
      
      tokenManager.setToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
      storage.set("user_data", userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      startSessionTimer(handleSessionTimeout);
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await authService.register(userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearAll();
      setUser(null);
      setIsAuthenticated(false);
      clearSessionTimer();
      setAuthError(null);
    }
  };

  const verifyEmail = async (token) => {
    try {
      setIsLoading(true);
      const response = await authService.verifyEmail(token);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      setIsLoading(true);
      const response = await authService.requestPasswordReset(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      const response = await authService.resetPassword(token, newPassword);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthError = () => setAuthError(null);

  // Transaction functions
  const addTx = (tx) =>
    setTransactions((prev) => [{ id: crypto.randomUUID(), ...tx }, ...prev]);
  const deleteTx = (id) => setTransactions((prev) => prev.filter((t) => t.id !== id));
  const clearAll = () => setTransactions([]);

  // Cart functions
  const addToCart = (product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const value = {
    // Auth state
    user,
    isAuthenticated,
    isLoading,
    authError,
    
    // Auth functions
    login,
    register,
    logout,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    clearAuthError,
    
    // App state
    theme,
    setTheme,
    transactions,
    cart,
    cartTotal,
    cartItemsCount,
    
    // App functions
    addTx,
    deleteTx,
    clearAll,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
