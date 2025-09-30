import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import ThemeToggle from "./ThemeToggle";
import Cart from "./Cart";
import { 
  ChartBarIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon, 
  BanknotesIcon,
  ShoppingBagIcon 
} from "@heroicons/react/24/outline";

export default function Layout({ children }) {
  const nav = useNavigate();
  const { user, setUser } = useApp();

  const linkCls = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
      isActive ? "bg-gray-100 dark:bg-gray-800" : ""
    }`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <BanknotesIcon className="h-6 w-6" />
            <span>Personal Finance & Store</span>
          </div>
          <div className="flex items-center gap-3">
            <Cart />
            <ThemeToggle />
            <div className="text-sm opacity-80">Hi, {user?.name}</div>
            <button
              onClick={() => { localStorage.clear(); setUser(null); nav("/login"); }}
              className="inline-flex items-center gap-1 text-sm rounded px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[220px,1fr] gap-6">
        <aside className="md:sticky md:top-16 h-max">
          <nav className="space-y-2">
            <NavLink to="/" end className={linkCls}>
              <ChartBarIcon className="h-5 w-5" /> Dashboard
            </NavLink>
            <NavLink to="/products" className={linkCls}>
              <ShoppingBagIcon className="h-5 w-5" /> Products
            </NavLink>
            <NavLink to="/transactions" className={linkCls}>
              <BanknotesIcon className="h-5 w-5" /> Transactions
            </NavLink>
            <NavLink to="/settings" className={linkCls}>
              <Cog6ToothIcon className="h-5 w-5" /> Settings
            </NavLink>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
