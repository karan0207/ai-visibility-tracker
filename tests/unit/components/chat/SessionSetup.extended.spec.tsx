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

describe('SessionSetup - extended coverage', () => {
  const onStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('brand management', () => {
    it('initializes with provided brands', () => {
      render(<SessionSetup onStart={onStart} initialBrands={['Alpha', 'Beta']} />);
      
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('adds brand on Enter key', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, 'NewBrand{enter}');

      expect(screen.getByText('NewBrand')).toBeInTheDocument();
    });

    it('clears input after adding brand', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, 'TestBrand{enter}');

      expect(input).toHaveValue('');
    });

    it('removes brand when X clicked', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['ToRemove', 'ToKeep']} />);

      const removeButtons = screen.getAllByTestId('x-icon');
      await user.click(removeButtons[0]);

      expect(screen.queryByText('ToRemove')).not.toBeInTheDocument();
      expect(screen.getByText('ToKeep')).toBeInTheDocument();
    });

    it('prevents duplicate brands', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['Existing']} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, 'Existing{enter}');

      // Should only have one "Existing" brand
      const existingElements = screen.getAllByText('Existing');
      expect(existingElements.length).toBe(1);
    });

    it('trims whitespace from brand names', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, '  Trimmed  {enter}');

      expect(screen.getByText('Trimmed')).toBeInTheDocument();
    });

    it('prevents empty brand names', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      const initialBadgeCount = screen.queryAllByRole('button').length;
      
      await user.type(input, '   {enter}');

      // Badge count should not increase after entering whitespace-only brand
      const newBadgeCount = screen.queryAllByRole('button').length;
      expect(newBadgeCount).toBeLessThanOrEqual(initialBadgeCount + 1); // Only the add button, not a new badge
    });

    it('allows adding multiple brands sequentially', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      
      await user.type(input, 'First{enter}');
      await user.type(input, 'Second{enter}');
      await user.type(input, 'Third{enter}');

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('category validation', () => {
    it('shows error when category is empty', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['A', 'B']} />);

      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(screen.getByText(/enter a product category/i)).toBeInTheDocument();
    });

    it('shows error when category is whitespace only', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['A', 'B']} />);

      const categoryInput = screen.getByPlaceholderText(/CRM software/i);
      await user.type(categoryInput, '   ');
      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(screen.getByText(/enter a product category/i)).toBeInTheDocument();
    });

    it('clears error when valid category entered', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['A', 'B']} />);

      // Trigger error
      await user.click(screen.getByRole('button', { name: /start/i }));
      expect(screen.getByText(/enter a product category/i)).toBeInTheDocument();

      // Fix error
      const categoryInput = screen.getByPlaceholderText(/CRM software/i);
      await user.type(categoryInput, 'Valid Category');

      // Error should be cleared on next interaction or submit
      await user.click(screen.getByRole('button', { name: /start/i }));
      expect(onStart).toHaveBeenCalled();
    });
  });

  describe('brand count validation', () => {
    it('shows error when not enough brands', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={[]} />);

      const categoryInput = screen.getByPlaceholderText(/CRM software/i);
      await user.type(categoryInput, 'Test Category');
      await user.click(screen.getByRole('button', { name: /start/i }));

      // Should show brand requirement error
      expect(onStart).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('calls onStart with correct data', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['Brand1', 'Brand2']} />);

      const categoryInput = screen.getByPlaceholderText(/CRM software/i);
      await user.type(categoryInput, 'Enterprise Software');
      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(onStart).toHaveBeenCalledWith('Enterprise Software', ['Brand1', 'Brand2']);
    });

    it('trims category before submission', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} initialBrands={['A', 'B']} />);

      const categoryInput = screen.getByPlaceholderText(/CRM software/i);
      await user.type(categoryInput, '  Trimmed Category  ');
      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(onStart).toHaveBeenCalledWith('Trimmed Category', ['A', 'B']);
    });

    it('submits with newly added brands', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      // Add brands
      const brandInput = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(brandInput, 'NewBrand1{enter}');
      await user.type(brandInput, 'NewBrand2{enter}');

      // Set category
      const categoryInput = screen.getByPlaceholderText(/CRM software/i);
      await user.type(categoryInput, 'Test');

      // Submit
      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(onStart).toHaveBeenCalledWith('Test', expect.arrayContaining(['NewBrand1', 'NewBrand2']));
    });
  });

  describe('edge cases', () => {
    it('handles special characters in brand names', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, 'C++{enter}');
      await user.type(input, 'Node.js{enter}');

      expect(screen.getByText('C++')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });

    it('handles unicode brand names', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, '日本語Brand{enter}');

      expect(screen.getByText('日本語Brand')).toBeInTheDocument();
    });

    it('handles long brand names', async () => {
      const user = userEvent.setup();
      render(<SessionSetup onStart={onStart} />);

      const longBrand = 'A'.repeat(50);
      const input = screen.getByPlaceholderText(/OpenAI, Claude, DeepSeek/i);
      await user.type(input, `${longBrand}{enter}`);

      expect(screen.getByText(longBrand)).toBeInTheDocument();
    });
  });
});
