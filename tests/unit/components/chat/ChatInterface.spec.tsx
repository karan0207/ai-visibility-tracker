import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '@/components/chat/ChatInterface';
import type { ChatMessage } from '@/types/analysis';
import { within as rtlWithin } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Send: () => <span data-testid="send-icon">Send</span>,
  Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>,
  User: () => <span data-testid="user-icon">User</span>,
  Bot: () => <span data-testid="bot-icon">Bot</span>,
  CheckCircle2: () => <span data-testid="check-icon">Check</span>,
  Loader2: () => <span data-testid="loader-icon">Loader</span>,
}));

describe('ChatInterface', () => {
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

  it('shows empty state with brands', () => {
    render(<ChatInterface {...baseProps} />);
    expect(screen.getByText(/start your analysis/i)).toBeInTheDocument();
    expect(within(screen.getByTestId('tracked-brands')).getByText('Brand1')).toBeInTheDocument();
  });

  it('submits prompt on click', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/ask about products/i), 'Hello');
    await user.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('submits prompt on Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/ask about products/i), 'Enter test{enter}');
    expect(onSend).toHaveBeenCalledWith('Enter test');
  });

  it('renders messages', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Q', timestamp: new Date() },
      { id: '2', role: 'assistant', content: 'A', timestamp: new Date() },
    ];

    render(<ChatInterface {...baseProps} messages={messages} />);
    expect(within(screen.getByTestId('message-1')).getByText('Q')).toBeInTheDocument();
    expect(within(screen.getByTestId('message-2')).getByText('A')).toBeInTheDocument();
  });
});
function within(element: HTMLElement) {
  return rtlWithin(element);
}

