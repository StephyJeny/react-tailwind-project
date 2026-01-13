import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useApp } from "./state/AppContext";
import { Toaster } from "sonner";
import LoadingSpinner from "./components/ui/LoadingSpinner";

const AuthForm = lazy(() => import("./components/auth/AuthForm"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Search = lazy(() => import("./pages/Search"));

export default function App() {
  const { isAuthenticated } = useApp();

  return (
    <>
      <Toaster position="top-center" richColors />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading content...</p>
            </div>
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route 
            path="/auth" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <AuthForm />
            } 
          />
          
          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/search" element={<Search />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Redirect root to dashboard if authenticated, otherwise to auth */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />
            } 
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
