import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import { AppProvider } from '../state/AppContext';
import { tokenManager, USER_KEY } from '../utils/auth';

describe('Admin role access control', () => {
  it('denies access for non-admin users', async () => {
    const user = { id: 'u2', name: 'Normal User', email: 'user@example.com', role: 'user' };

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppProvider initialUser={user} initialAuthenticated={true}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Admin Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const denied = await screen.findByText(/Access Denied/i);
    expect(denied).toBeInTheDocument();
  });
});
