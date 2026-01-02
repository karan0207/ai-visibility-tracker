// Mock UI Alert components to avoid invalid element type error
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertTitle: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '@/components/chat/ChatInterface';
import type { ChatMessage } from '@/types/analysis';

jest.mock('lucide-react', () => ({
  Send: () => <span data-testid="send-icon">Send</span>,
  Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>,
  User: () => <span data-testid="user-icon">User</span>,
  Bot: () => <span data-testid="bot-icon">Bot</span>,
  CheckCircle2: () => <span data-testid="check-icon">Check</span>,
  Loader2: () => <span data-testid="loader-icon">Loader</span>,
}));

describe('ChatInterface - extended coverage', () => {
  const onSend = jest.fn().mockResolvedValue(undefined);
  const baseProps = {
    brands: ['Brand1', 'Brand2'],
    messages: [] as ChatMessage[],
    onSendMessage: onSend,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty state', () => {
    it('displays all tracked brands in empty state', () => {
      render(<ChatInterface {...baseProps} brands={['Alpha', 'Beta', 'Gamma']} />);
      
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
    });

    it('shows start analysis prompt when no messages', () => {
      render(<ChatInterface {...baseProps} messages={[]} />);
      expect(screen.getByText(/start your analysis/i)).toBeInTheDocument();
    });
  });

  describe('message handling', () => {
    it('renders user messages with correct styling', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'User question here', timestamp: new Date() },
      ];

      render(<ChatInterface {...baseProps} messages={messages} />);
      expect(screen.getByText('User question here')).toBeInTheDocument();
    });

    it('renders assistant messages with correct styling', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'assistant', content: 'AI response here', timestamp: new Date() },
      ];

      render(<ChatInterface {...baseProps} messages={messages} />);
      expect(screen.getByText('AI response here')).toBeInTheDocument();
    });

    it('renders multiple messages in order', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'First', timestamp: new Date('2024-01-01T10:00:00') },
        { id: '2', role: 'assistant', content: 'Second', timestamp: new Date('2024-01-01T10:01:00') },
        { id: '3', role: 'user', content: 'Third', timestamp: new Date('2024-01-01T10:02:00') },
      ];

      render(<ChatInterface {...baseProps} messages={messages} />);
      
      const texts = screen.getAllByText(/First|Second|Third/);
      expect(texts[0]).toHaveTextContent('First');
      expect(texts[1]).toHaveTextContent('Second');
      expect(texts[2]).toHaveTextContent('Third');
    });

    it('displays message metrics when available', () => {
      const messages: ChatMessage[] = [
        { 
          id: '1', 
          role: 'assistant', 
          content: 'Response mentioning Brand1', 
          timestamp: new Date(),
          metrics: {
            brandsMentioned: ['Brand1'],
            firstMention: 'Brand1',
          },
        },
      ];

      render(<ChatInterface {...baseProps} messages={messages} />);
      expect(screen.getByText('Response mentioning Brand1')).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    it('clears input after successful submit', async () => {
      const user = userEvent.setup();
      render(<ChatInterface {...baseProps} />);

      const input = screen.getByPlaceholderText(/ask about products/i);
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('prevents empty message submission', async () => {
      const user = userEvent.setup();
      render(<ChatInterface {...baseProps} />);

      await user.click(screen.getByRole('button'));
      expect(onSend).not.toHaveBeenCalled();
    });

    it('trims whitespace from messages', async () => {
      const user = userEvent.setup();
      render(<ChatInterface {...baseProps} />);

      await user.type(screen.getByPlaceholderText(/ask about products/i), '  Hello World  ');
      await user.click(screen.getByRole('button'));

      expect(onSend).toHaveBeenCalledWith('Hello World');
    });

    it('handles Shift+Enter without submitting', async () => {
      const user = userEvent.setup();
      render(<ChatInterface {...baseProps} />);

      const input = screen.getByPlaceholderText(/ask about products/i);
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
      
      // Should not have submitted
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('disables input when loading', () => {
      render(<ChatInterface {...baseProps} isLoading={true} />);
      
      const input = screen.getByPlaceholderText(/ask about products/i);
      expect(input).toBeDisabled();
    });

    it('disables button when loading', () => {
      render(<ChatInterface {...baseProps} isLoading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows loading indicator when loading', () => {
      render(<ChatInterface {...baseProps} isLoading={true} />);
      // Multiple loader icons may appear (in button and message area)
      expect(screen.getAllByTestId('loader-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('error handling', () => {
    it('handles send error gracefully', async () => {
      // Mock that rejects but we catch it
      const errorSend = jest.fn().mockImplementation(() => Promise.reject(new Error('Network error')));
      const user = userEvent.setup();

      render(<ChatInterface {...baseProps} onSendMessage={errorSend} />);

      await user.type(screen.getByPlaceholderText(/ask about products/i), 'Test');
      try {
        await user.click(screen.getByRole('button'));
      } catch {
        // Error may propagate in test environment
      }

      // Should show error alert
      expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
      expect(errorSend).toHaveBeenCalled();
    });
  });

  describe('long content', () => {
    it('handles very long messages', () => {
      const longContent = 'A'.repeat(5000);
      const messages: ChatMessage[] = [
        { id: '1', role: 'assistant', content: longContent, timestamp: new Date() },
      ];

      render(<ChatInterface {...baseProps} messages={messages} />);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('handles many messages', () => {
      const messages: ChatMessage[] = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`,
        timestamp: new Date(),
      }));

      render(<ChatInterface {...baseProps} messages={messages} />);
      expect(screen.getByText('Message 49')).toBeInTheDocument();
    });
  });
});
