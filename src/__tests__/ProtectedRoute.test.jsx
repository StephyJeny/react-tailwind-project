import React from 'react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import { AppProvider } from '../state/AppContext';

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /auth', async () => {
    const { findByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <AppProvider>
                <ProtectedRoute>
                  <div>Protected</div>
                </ProtectedRoute>
              </AppProvider>
            }
          />
          <Route path="/auth" element={<div>Auth</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await findByText('Auth')).toBeInTheDocument();
  });
});
