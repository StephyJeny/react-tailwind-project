import React, { useState } from "react";
import { NavLink, useNavigate, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  ChartBarIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon, 
  BanknotesIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

import { useApp } from "../state/AppContext";
import ThemeToggle from "./ThemeToggle";
import Cart from "./Cart";
import LoadingSpinner from "./ui/LoadingSpinner";
import { products } from "../data/products";
export default function Layout({ children }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user, logout, authError, t, reducedMotion, language } = useApp();
  const location = useLocation();
  const outlet = useOutlet();

  React.useEffect(() => {
    const path = location.pathname;
    const titles = {
      "/": t("title_dashboard"),
      "/dashboard": t("title_dashboard"),
      "/products": t("title_products"),
      "/transactions": t("title_transactions"),
      "/settings": t("title_settings"),
      "/search": t("title_search"),
      "/admin": t("title_admin"),
      "/auth": t("title_settings") // fallback
    };
    const descriptions = {
      "/": t("desc_dashboard"),
      "/dashboard": t("desc_dashboard"),
      "/products": t("desc_products"),
      "/transactions": t("desc_transactions"),
      "/settings": t("desc_settings"),
      "/search": t("desc_search"),
      "/admin": t("desc_admin"),
      "/auth": t("desc_settings")
    };
    let title = titles[path] || t("app_title");
    let description = descriptions[path] || t("app_title");
    if (path.startsWith("/products/category/")) {
      const cat = decodeURIComponent(path.split("/")[3] || "");
      if (cat) {
        title = `${cat} — ${t("title_products")}`;
        description = `${t("products_subtitle")} ${cat}`;
      }
    } else if (path.startsWith("/products/")) {
      const id = Number(path.split("/")[2]);
      const p = products.find((x) => x.id === id);
      if (p) {
        title = `${p.name} — ${t("app_title")}`;
        description = p.description || descriptions["/products"];
      }
    } else if (path === "/search") {
      const params = new URLSearchParams(location.search || "");
      const q = params.get("q");
      if (q) {
        title = `${t("title_search")} — ${q}`;
        description = `${t("desc_search")} "${q}"`;
      }
    }
    document.title = title;

    const upsertMeta = (attrName, attrValue, content) => {
      let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const upsertJsonLd = (id, data) => {
      let el = document.head.querySelector(`script[type="application/ld+json"]#${id}`);
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };

    const query = location.search || "";
    const canonical = window.location.origin + window.location.pathname + query;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    const homeName = t("app_title");
    const crumbMap = {
      "/": [],
      "/dashboard": [{ name: t("nav_dashboard"), item: window.location.origin + "/dashboard" }],
      "/products": [{ name: t("nav_products"), item: window.location.origin + "/products" }],
      "/transactions": [{ name: t("nav_transactions"), item: window.location.origin + "/transactions" }],
      "/settings": [{ name: t("nav_settings"), item: window.location.origin + "/settings" }],
      "/search": [{ name: t("nav_search"), item: window.location.origin + "/search" }],
      "/admin": [{ name: t("admin_panel"), item: window.location.origin + "/admin" }]
    };
    let crumbs = crumbMap[path] || [];
    if (path.startsWith("/products/category/")) {
      const cat = decodeURIComponent(path.split("/")[3] || "");
      if (cat) {
        crumbs = [
          { name: t("nav_products"), item: window.location.origin + "/products" },
          { name: cat, item: window.location.origin + "/products/category/" + encodeURIComponent(cat) }
        ];
      }
    }
    if (path.startsWith("/products/")) {
      const id = Number(path.split("/")[2]);
      const p = products.find((x) => x.id === id);
      if (p) {
        crumbs = [
          { name: t("nav_products"), item: window.location.origin + "/products" },
          { name: p.category, item: window.location.origin + "/products" },
          { name: p.name, item: canonical }
        ];
      }
    }
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", position: 1, name: homeName, item: window.location.origin + "/" },
        ...crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.name, item: c.item }))
      ]
    };
    upsertJsonLd("ld-breadcrumb", breadcrumb);

    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": homeName,
      "url": window.location.origin + "/",
      "inLanguage": language || "en",
      "potentialSearchAction": {
        "@type": "SearchAction",
        "target": window.location.origin + "/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
    upsertJsonLd("ld-website", website);

    const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": homeName,
      "url": window.location.origin + "/",
      "logo": {
        "@type": "ImageObject",
        "url": window.location.origin + "/logo192.png"
      }
    };
    organization.sameAs = [
      window.location.origin + "/",
      "https://StephyJeny.github.io/react-tailwind-project",
      "https://github.com/StephyJeny"
    ];
    upsertJsonLd("ld-organization", organization);
  }, [location.pathname, location.search, t, language]);

  React.useEffect(() => {
    document.documentElement.lang = language || "en";
  }, [language]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
      isActive ? "bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400" : ""
    }`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Session timeout notification */}
      {authError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <p className="text-sm text-red-800 dark:text-red-200 text-center">
              {authError}
            </p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <BanknotesIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>{t('app_title')}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Cart />
            <ThemeToggle />
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <UserCircleIcon className="h-5 w-5" />
                <span className="hidden sm:block">{user?.name}</span>
                {user?.role === 'admin' && (
                  <ShieldCheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                    {user?.role && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                        user.role === 'admin' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </div>
                  
                  <NavLink
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Cog6ToothIcon className="h-4 w-4" />
                      {t('nav_settings')}
                    </div>
                  </NavLink>
                  
                  {user?.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="h-4 w-4" />
                      {t('admin_panel')}
                    </div>
                  </NavLink>
                )}
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      {isLoggingOut ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      )}
                      {isLoggingOut ? 'Signing out...' : t('sign_out')}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[220px,1fr] gap-6">
        <aside className="md:sticky md:top-16 h-max">
          <nav className="space-y-2">
            <NavLink to="/" end className={linkCls}>
              <ChartBarIcon className="h-5 w-5" /> {t('nav_dashboard')}
            </NavLink>
            <NavLink to="/products" className={linkCls}>
              <ShoppingBagIcon className="h-5 w-5" /> {t('nav_products')}
            </NavLink>
            <NavLink to="/transactions" className={linkCls}>
              <BanknotesIcon className="h-5 w-5" /> {t('nav_transactions')}
            </NavLink>
            <NavLink to="/settings" className={linkCls}>
              <Cog6ToothIcon className="h-5 w-5" /> {t('nav_settings')}
            </NavLink>
            <NavLink to="/search" className={linkCls}>
              <MagnifyingGlassIcon className="h-5 w-5" /> {t('nav_search')}
            </NavLink>
            
            {/* Admin-only navigation */}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkCls}>
                <ShieldCheckIcon className="h-5 w-5" /> {t('admin_panel')}
              </NavLink>
            )}
          </nav>
        </aside>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="h-full"
            >
              {outlet || children}
            </motion.div>
          </AnimatePresence>
        
        <main>{children}</main>
      </div>
    </div>
  );
}
