import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppProvider } from '../state/AppContext';
import Products from '../pages/Products';

describe('Products sorting', () => {
  it('sorts products by ascending price', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <Products />
        </AppProvider>
      </MemoryRouter>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'price-asc' } });

    const headings = await screen.findAllByRole('heading', { level: 3 });
    expect(headings[0].textContent).toMatch(/Ceramic Coffee Mug/i);
  });
});
