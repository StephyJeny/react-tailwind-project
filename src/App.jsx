import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AuthForm from "./components/auth/AuthForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import { useApp } from "./state/AppContext";

export default function App() {
  const { isAuthenticated } = useApp();

  return (
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
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="settings" element={<Settings />} />
                
                {/* Admin-only route example */}
                <Route 
                  path="admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p>This is only accessible to admin users.</p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Redirect root to dashboard if authenticated, otherwise to auth */}
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />
        } 
      />
    </Routes>
  );
}
