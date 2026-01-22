import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AppProvider } from '../state/AppContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/Layout';
import { tokenManager, USER_KEY } from '../utils/auth';

describe('User menu navigation', () => {
  const user = { id: 'u1', name: 'Admin User', email: 'admin@example.com', role: 'admin' };

  const renderApp = (initialPath = '/dashboard') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AppProvider initialUser={user} initialAuthenticated={true}>
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
    const toggle = screen.getAllByTestId('user-menu-toggle')[0];
    fireEvent.click(toggle);
    const settingsItems = await screen.findAllByText(/Settings/i);
    fireEvent.click(settingsItems[0]);
    await waitFor(() => {
      expect(screen.getByText(/Settings Page/i)).toBeInTheDocument();
    });
  });

  it('navigates to Admin Panel from user menu', async () => {
    renderApp('/dashboard');
    const toggle = screen.getAllByTestId('user-menu-toggle')[0];
    fireEvent.click(toggle);
    const adminItems = await screen.findAllByText(/Admin Panel/i);
    fireEvent.click(adminItems[0]);
    await waitFor(() => {
      expect(screen.getByText(/Admin Page/i)).toBeInTheDocument();
    });
  });

  it('signs out and navigates to auth', async () => {
    renderApp('/dashboard');
    const toggle = screen.getAllByTestId('user-menu-toggle')[0];
    fireEvent.click(toggle);
    const signOut = await screen.findByText(/Sign out/i);
    fireEvent.click(signOut);
    await waitFor(() => {
      expect(screen.getByText(/Auth Page/i)).toBeInTheDocument();
    });
  });
});
