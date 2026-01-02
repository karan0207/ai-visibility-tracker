import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { SessionSetup } from '@/components/chat/SessionSetup';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Target: () => <span data-testid="target-icon">Target</span>,
  Zap: () => <span data-testid="zap-icon">Zap</span>,
  ArrowRight: () => <span data-testid="arrow-icon">Arrow</span>,
  Settings2: () => <span data-testid="settings-icon">Settings</span>,
}));

describe('SessionSetup', () => {
  const onStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds brands from input', async () => {
    const user = userEvent.setup();
    render(<SessionSetup onStart={onStart} />);

    await user.type(screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i), 'BrandOne');
    await user.click(screen.getByRole('button', { name: /plus/i }));

    expect(screen.getByText('BrandOne')).toBeInTheDocument();
  });

  it('requires category before start', async () => {
    const user = userEvent.setup();
    render(<SessionSetup onStart={onStart} initialBrands={['A', 'B']} />);

    await user.click(screen.getByRole('button', { name: /start/i }));

    expect(screen.getByText(/enter a product category/i)).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('fires onStart with data', async () => {
    const user = userEvent.setup();
    render(<SessionSetup onStart={onStart} initialBrands={['A', 'B']} />);

    await user.type(screen.getByPlaceholderText(/CRM software/i), 'CRM');
    await user.click(screen.getByRole('button', { name: /start/i }));

    expect(onStart).toHaveBeenCalledWith('CRM', ['A', 'B']);
  });
});
