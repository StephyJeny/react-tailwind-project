import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AppProvider } from '../state/AppContext';
import AuthForm from '../components/auth/AuthForm';

describe('Auth success flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logs in and navigates to dashboard', async () => {
    const email = 'verified@example.com';
    const password = 'Password123!';
    const name = 'Verified User';

    const users = [
      { id: 'u1', name, email, password, role: 'user', isEmailVerified: true }
    ];
    localStorage.setItem('users', JSON.stringify(users));

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <AppProvider>
          <Routes>
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const emailInput = await screen.findByPlaceholderText(/Email address/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
