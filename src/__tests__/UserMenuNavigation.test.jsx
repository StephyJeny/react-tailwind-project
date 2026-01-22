import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AppProvider } from '../state/AppContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/Layout';
import { tokenManager, USER_KEY } from '../utils/auth';

describe('User menu navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    const user = { id: 'u1', name: 'Admin User', email: 'admin@example.com', role: 'admin' };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = `header.${btoa(JSON.stringify(payload))}.sig`;
    tokenManager.setToken(token);
  });

  const renderApp = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AppProvider>
          <Routes>
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<div>Dashboard Page</div>} />
              <Route path="/settings" element={<div>Settings Page</div>} />
              <Route path="/admin" element={<div>Admin Page</div>} />
            </Route>
            <Route path="/auth" element={<div>Auth Page</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );
  };

  it('navigates to Settings from user menu', async () => {
    renderApp('/dashboard');
    const toggle = await screen.findByTestId('user-menu-toggle');
    fireEvent.click(toggle);
    const settingsItems = await screen.findAllByText(/Settings/i);
    fireEvent.click(settingsItems[0]);
    await waitFor(() => {
      expect(screen.getByText(/Settings Page/i)).toBeInTheDocument();
    });
  });

  it('navigates to Admin Panel from user menu', async () => {
    renderApp('/dashboard');
    const toggle = await screen.findByTestId('user-menu-toggle');
    fireEvent.click(toggle);
    const adminItems = await screen.findAllByText(/Admin Panel/i);
    fireEvent.click(adminItems[0]);
    await waitFor(() => {
      expect(screen.getByText(/Admin Page/i)).toBeInTheDocument();
    });
  });

  it('signs out and navigates to auth', async () => {
    renderApp('/dashboard');
    const toggle = await screen.findByTestId('user-menu-toggle');
    fireEvent.click(toggle);
    const signOut = await screen.findByText(/Sign out/i);
    fireEvent.click(signOut);
    await waitFor(() => {
      expect(screen.getByText(/Auth Page/i)).toBeInTheDocument();
    });
  });
});
