import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { authService } from "../services/authService";
import { db } from "../services/firebase";
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
  const [cart, setCart] = useState(storage.get("pf_cart_guest", []));
  const firestoreEnabled = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

  // Session timeout handler
  const handleSessionTimeout = useCallback(() => {
    logout();
    setAuthError('Your session has expired. Please log in again.');
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const token = tokenManager.getToken && tokenManager.getToken();
    const storedUser = storage.get("user_data", null);
    if (!isAuthenticated && token && isTokenValid(token) && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
      startSessionTimer(handleSessionTimeout);
      setIsLoading(false);
    }

    const unsubscribe = authService.onAuthStateChanged((userData) => {
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        startSessionTimer(handleSessionTimeout);
      } else {
        const token2 = tokenManager.getToken && tokenManager.getToken();
        const storedUser2 = storage.get("user_data", null);
        if (token2 && isTokenValid(token2) && storedUser2) {
          setUser(storedUser2);
          setIsAuthenticated(true);
          startSessionTimer(handleSessionTimeout);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          tokenManager.clearAll();
          clearSessionTimer();
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
  useEffect(() => {
    const key = user?.id ? `pf_cart_${user.id}` : "pf_cart_guest";
    storage.set(key, cart);
  }, [cart, user]);

  // Load cart per user
  useEffect(() => {
    if (user?.id) {
      const key = `pf_cart_${user.id}`;
      const localCart = storage.get(key, []);
      setCart(localCart);
      if (firestoreEnabled) {
        try {
          const cartRef = doc(db, "carts", user.id);
          const unsub = onSnapshot(cartRef, (snap) => {
            const data = snap.data();
            if (data && Array.isArray(data.items)) {
              setCart(data.items);
            }
          });
          return () => unsub();
        } catch {}
      }
    } else {
      const guestCart = storage.get("pf_cart_guest", []);
      setCart(guestCart);
    }
  }, [user]);

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

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await authService.loginWithGoogle();
      const { user: userData, accessToken } = response.data;
      
      tokenManager.setToken(accessToken);
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

  const resendVerification = async (email) => {
    try {
      setIsLoading(true);
      const response = await authService.resendVerification(email);
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
  
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      const response = await authService.changePassword(currentPassword, newPassword);
      return { success: true, message: response.data.message };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

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
        const updated = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        if (user?.id && firestoreEnabled) {
          try { setDoc(doc(db, "carts", user.id), { items: updated }, { merge: true }); } catch {}
        }
        return updated;
      }
      const next = [...prev, { ...product, quantity: 1 }];
      if (user?.id && firestoreEnabled) {
        try { setDoc(doc(db, "carts", user.id), { items: next }, { merge: true }); } catch {}
      }
      return next;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== productId);
      if (user?.id && firestoreEnabled) {
        try { setDoc(doc(db, "carts", user.id), { items: next }, { merge: true }); } catch {}
      }
      return next;
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prev) => {
      const next = prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
      if (user?.id && firestoreEnabled) {
        try { setDoc(doc(db, "carts", user.id), { items: next }, { merge: true }); } catch {}
      }
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user?.id && firestoreEnabled) {
      try { setDoc(doc(db, "carts", user.id), { items: [] }, { merge: true }); } catch {}
    }
  };

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
      desc_dashboard: "Track expenses, income, and balances with charts and insights.",
      desc_products: "Browse and shop curated products with filters and sorting.",
      desc_transactions: "Add, edit, and review your transaction history with ease.",
      desc_settings: "Customize theme, language, motion preferences, and security.",
      desc_search: "Find products by name, category, and more.",
      desc_admin: "Manage users, security settings, and system analytics in the admin panel.",
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
      ,
      settings_tab_profile: "Profile",
      settings_tab_security: "Security",
      settings_tab_preferences: "Preferences",
      transactions: "Transactions",
      date: "Date",
      type: "Type",
      category_label: "Category",
      note: "Note",
      amount: "Amount",
      add: "Add",
      note_optional: "Note (optional)",
      delete: "Delete",
      no_transactions_yet: "No transactions yet.",
      admin_panel: "Admin Panel",
      admin_access: "Admin Access",
      admin_tab_users: "Users",
      admin_tab_security: "Security",
      admin_tab_analytics: "Analytics",
      admin_tab_settings: "Settings",
      user_management: "User Management",
      table_user: "User",
      table_role: "Role",
      table_status: "Status",
      table_actions: "Actions",
      edit: "Edit",
      security_settings: "Security Settings",
      two_factor_authentication: "Two-Factor Authentication",
      require_2fa: "Require 2FA for all admin accounts",
      configure: "Configure",
      session_timeout: "Session Timeout",
      auto_logout_inactive: "Automatically log out inactive users",
      system_analytics: "System Analytics",
      total_users: "Total Users",
      active_sessions: "Active Sessions",
      failed_logins: "Failed Logins",
      system_settings: "System Settings",
      application_name: "Application Name",
      maintenance_mode: "Maintenance Mode",
      enable_maintenance_mode: "Enable maintenance mode"
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
      desc_dashboard: "Suivez dépenses, revenus et soldes avec graphiques et analyses.",
      desc_products: "Parcourez et achetez des produits avec filtres et tri.",
      desc_transactions: "Ajoutez, modifiez et consultez votre historique de transactions.",
      desc_settings: "Personnalisez thème, langue, animations et sécurité.",
      desc_search: "Trouvez des produits par nom, catégorie et plus.",
      desc_admin: "Gérez utilisateurs, sécurité et analyses système dans l’admin.",
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
      ,
      settings_tab_profile: "Profil",
      settings_tab_security: "Sécurité",
      settings_tab_preferences: "Préférences",
      transactions: "Transactions",
      date: "Date",
      type: "Type",
      category_label: "Catégorie",
      note: "Note",
      amount: "Montant",
      add: "Ajouter",
      note_optional: "Note (optionnelle)",
      delete: "Supprimer",
      no_transactions_yet: "Aucune transaction pour le moment.",
      admin_panel: "Panneau d’administration",
      admin_access: "Accès administrateur",
      admin_tab_users: "Utilisateurs",
      admin_tab_security: "Sécurité",
      admin_tab_analytics: "Analyses",
      admin_tab_settings: "Paramètres",
      user_management: "Gestion des utilisateurs",
      table_user: "Utilisateur",
      table_role: "Rôle",
      table_status: "Statut",
      table_actions: "Actions",
      edit: "Modifier",
      security_settings: "Paramètres de sécurité",
      two_factor_authentication: "Authentification à deux facteurs",
      require_2fa: "Exiger la 2FA pour tous les comptes admin",
      configure: "Configurer",
      session_timeout: "Expiration de session",
      auto_logout_inactive: "Déconnexion automatique des utilisateurs inactifs",
      system_analytics: "Analyses système",
      total_users: "Nombre d’utilisateurs",
      active_sessions: "Sessions actives",
      failed_logins: "Connexions échouées",
      system_settings: "Paramètres du système",
      application_name: "Nom de l’application",
      maintenance_mode: "Mode maintenance",
      enable_maintenance_mode: "Activer le mode maintenance"
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
      desc_dashboard: "Controla gastos, ingresos y saldo con gráficos y análisis.",
      desc_products: "Explora y compra productos con filtros y ordenamiento.",
      desc_transactions: "Añade, edita y revisa tu historial de transacciones fácilmente.",
      desc_settings: "Personaliza tema, idioma, movimiento y seguridad.",
      desc_search: "Encuentra productos por nombre, categoría y más.",
      desc_admin: "Administra usuarios, seguridad y analítica del sistema en admin.",
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
      ,
      settings_tab_profile: "Perfil",
      settings_tab_security: "Seguridad",
      settings_tab_preferences: "Preferencias",
      transactions: "Transacciones",
      date: "Fecha",
      type: "Tipo",
      category_label: "Categoría",
      note: "Nota",
      amount: "Monto",
      add: "Agregar",
      note_optional: "Nota (opcional)",
      delete: "Eliminar",
      no_transactions_yet: "Aún no hay transacciones.",
      admin_panel: "Panel de administración",
      admin_access: "Acceso de administrador",
      admin_tab_users: "Usuarios",
      admin_tab_security: "Seguridad",
      admin_tab_analytics: "Analítica",
      admin_tab_settings: "Configuración",
      user_management: "Gestión de usuarios",
      table_user: "Usuario",
      table_role: "Rol",
      table_status: "Estado",
      table_actions: "Acciones",
      edit: "Editar",
      security_settings: "Configuración de seguridad",
      two_factor_authentication: "Autenticación de dos factores",
      require_2fa: "Requerir 2FA para todas las cuentas admin",
      configure: "Configurar",
      session_timeout: "Tiempo de sesión",
      auto_logout_inactive: "Cerrar sesión automáticamente a usuarios inactivos",
      system_analytics: "Analítica del sistema",
      total_users: "Usuarios totales",
      active_sessions: "Sesiones activas",
      failed_logins: "Inicios de sesión fallidos",
      system_settings: "Configuración del sistema",
      application_name: "Nombre de la aplicación",
      maintenance_mode: "Modo mantenimiento",
      enable_maintenance_mode: "Habilitar modo mantenimiento"
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
    loginWithGoogle,
    register,
    logout,
    verifyEmail,
    requestPasswordReset,
    resendVerification,
    resetPassword,
    clearAuthError,
    changePassword,
    
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
