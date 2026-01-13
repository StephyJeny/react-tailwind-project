import React from 'react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../state/AppContext';
import AuthForm from '../components/auth/AuthForm';

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>
  );
}

describe('AuthForm', () => {
  it('switches to forgot password mode', async () => {
    renderWithProviders(<AuthForm />);
    const forgotBtn = screen.getByText(/Forgot your password\?/i);
    fireEvent.click(forgotBtn);
    expect(await screen.findByText(/Send Reset Email/i)).toBeInTheDocument();
  });
});
