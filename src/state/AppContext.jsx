import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  const [user, setUser] = useState(storage.get("pf_user", null));
  const [theme, setTheme] = useState(storage.get("pf_theme", "light")); // "light" | "dark"
  const [transactions, setTransactions] = useState(storage.get("pf_tx", []));
  const [cart, setCart] = useState(storage.get("pf_cart", []));

  // persist
  useEffect(() => storage.set("pf_user", user), [user]);
  useEffect(() => storage.set("pf_tx", transactions), [transactions]);
  useEffect(() => storage.set("pf_cart", cart), [cart]);
  useEffect(() => {
    storage.set("pf_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

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

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const value = useMemo(
    () => ({ 
      user, setUser, 
      theme, setTheme, 
      transactions, addTx, deleteTx, clearAll,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartItemCount
    }),
    [user, theme, transactions, cart, cartTotal, cartItemCount]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
