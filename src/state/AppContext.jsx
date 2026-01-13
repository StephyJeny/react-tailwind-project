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
  const [language, setLanguage] = useState(storage.get("pf_lang", "en"));
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [reducedMotionOverride, setReducedMotionOverride] = useState(storage.get("pf_reduce_motion", "auto")); // 'auto' | 'on' | 'off'
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

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    storage.set("pf_lang", language);
  }, [language]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    storage.set("pf_reduce_motion", reducedMotionOverride);
  }, [reducedMotionOverride]);

  const reducedMotion = useMemo(() => {
    if (reducedMotionOverride === "on") return true;
    if (reducedMotionOverride === "off") return false;
    return systemReducedMotion;
  }, [reducedMotionOverride, systemReducedMotion]);

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

  const cartItemCount = cartItemsCount;

  const dict = {
    en: {
      app_title: "Personal Finance & Store",
      nav_dashboard: "Dashboard",
      nav_products: "Products",
      nav_transactions: "Transactions",
      nav_settings: "Settings",
      nav_search: "Search",
      sign_out: "Sign out",
      title_dashboard: "Dashboard — Personal Finance & Store",
      title_products: "Products — Personal Finance & Store",
      title_transactions: "Transactions — Personal Finance & Store",
      title_settings: "Settings — Personal Finance & Store",
      title_search: "Search — Personal Finance & Store",
      title_admin: "Admin — Personal Finance & Store",
      products_heading: "Our Products",
      products_subtitle: "Discover amazing products at great prices",
      search_products_placeholder: "Search products...",
      balance_history: "Balance History",
      spending_distribution: "Spending Distribution",
      recent_transactions: "Recent Transactions",
      appearance: "Appearance",
      language: "Language",
      dark_mode: "Dark Mode",
      adjust_appearance: "Adjust the appearance of the application",
      danger_zone: "Danger Zone",
      delete_all_data: "Delete all data",
      delete_all_data_confirm: "Are you sure you want to delete all data?",
      clear_all_data_button: "Clear All Data",
      reduce_motion: "Reduce Motion",
      reduce_motion_desc: "Minimize animations for comfort",
      reduce_motion_auto: "Auto",
      reduce_motion_on: "On",
      reduce_motion_off: "Off"
    },
    fr: {
      app_title: "Finances personnelles et Boutique",
      nav_dashboard: "Tableau de bord",
      nav_products: "Produits",
      nav_transactions: "Transactions",
      nav_settings: "Paramètres",
      nav_search: "Recherche",
      sign_out: "Se déconnecter",
      title_dashboard: "Tableau de bord — Finances personnelles & Boutique",
      title_products: "Produits — Finances personnelles & Boutique",
      title_transactions: "Transactions — Finances personnelles & Boutique",
      title_settings: "Paramètres — Finances personnelles & Boutique",
      title_search: "Recherche — Finances personnelles & Boutique",
      title_admin: "Admin — Finances personnelles & Boutique",
      products_heading: "Nos Produits",
      products_subtitle: "Découvrez des produits incroyables à des prix avantageux",
      search_products_placeholder: "Rechercher des produits...",
      balance_history: "Historique du solde",
      spending_distribution: "Répartition des dépenses",
      recent_transactions: "Transactions récentes",
      appearance: "Apparence",
      language: "Langue",
      dark_mode: "Mode sombre",
      adjust_appearance: "Ajuster l’apparence de l’application",
      danger_zone: "Zone de danger",
      delete_all_data: "Supprimer toutes les données",
      delete_all_data_confirm: "Êtes-vous sûr de vouloir supprimer toutes les données ?",
      clear_all_data_button: "Effacer toutes les données",
      reduce_motion: "Réduire les animations",
      reduce_motion_desc: "Minimiser les animations pour le confort",
      reduce_motion_auto: "Auto",
      reduce_motion_on: "Activé",
      reduce_motion_off: "Désactivé"
    },
    es: {
      app_title: "Finanzas personales y Tienda",
      nav_dashboard: "Panel",
      nav_products: "Productos",
      nav_transactions: "Transacciones",
      nav_settings: "Configuración",
      nav_search: "Buscar",
      sign_out: "Cerrar sesión",
      title_dashboard: "Panel — Finanzas personales y Tienda",
      title_products: "Productos — Finanzas personales y Tienda",
      title_transactions: "Transacciones — Finanzas personales y Tienda",
      title_settings: "Configuración — Finanzas personales y Tienda",
      title_search: "Buscar — Finanzas personales y Tienda",
      title_admin: "Admin — Finanzas personales y Tienda",
      products_heading: "Nuestros Productos",
      products_subtitle: "Descubre productos increíbles a excelentes precios",
      search_products_placeholder: "Buscar productos...",
      balance_history: "Historial de balance",
      spending_distribution: "Distribución de gastos",
      recent_transactions: "Transacciones recientes",
      appearance: "Apariencia",
      language: "Idioma",
      dark_mode: "Modo oscuro",
      adjust_appearance: "Ajusta la apariencia de la aplicación",
      danger_zone: "Zona de peligro",
      delete_all_data: "Eliminar todos los datos",
      delete_all_data_confirm: "¿Seguro que quieres eliminar todos los datos?",
      clear_all_data_button: "Borrar todos los datos",
      reduce_motion: "Reducir movimiento",
      reduce_motion_desc: "Minimiza las animaciones para mayor comodidad",
      reduce_motion_auto: "Auto",
      reduce_motion_on: "Activado",
      reduce_motion_off: "Desactivado"
    }
  };

  const t = (key) => {
    const d = dict[language] || dict.en;
    return d[key] || key;
  };

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
    toggleTheme,
    language,
    setLanguage,
    t,
    reducedMotion,
    systemReducedMotion,
    reducedMotionOverride,
    setReducedMotionOverride,
    transactions,
    cart,
    cartTotal,
    cartItemsCount,
    cartItemCount,
    
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
