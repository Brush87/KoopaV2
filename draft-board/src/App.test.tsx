import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders draft board application loading state or title', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading drafts.../i);
  expect(loadingElement).toBeInTheDocument();
});
