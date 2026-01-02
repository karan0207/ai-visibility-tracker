'use client';

import { useState, useRef, useEffect } from 'react';
import { ErrorAlert } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, User, Bot, CheckCircle2, Loader2 } from 'lucide-react';
import type { ChatMessage, BrandResult } from '@/types/analysis';

interface ChatInterfaceProps {
  brands: string[];
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInterface({ 
  brands, 
  messages, 
  onSendMessage, 
  isLoading,
  disabled = false 
}: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || disabled) return;

    const currentPrompt = prompt.trim();
    setPrompt('');
    setError(null);
    try {
      await onSendMessage(currentPrompt);
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 flex flex-col h-full rounded-xl overflow-hidden">
      <CardContent className="p-0 flex flex-col h-full overflow-hidden bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-950/50">
        {/* Error Alert */}
        {error && (
          <div className="px-3 sm:px-6 pt-3 sm:pt-4">
            <ErrorAlert message={error} />
          </div>
        )}
        {/* Messages Area */}
        <div data-testid="messages-area" className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 pb-6 sm:pb-6 space-y-4 sm:space-y-5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-5 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 mb-6">
                <Sparkles className="h-10 w-10 text-indigo-400 dark:text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Ready to Analyze
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                Ask questions about your brands. We&apos;ll track mentions and update metrics in real-time.
              </p>
              {brands.length > 0 && (
                <div data-testid="tracked-brands" className="flex flex-wrap gap-2 mt-8 justify-center">
                  {brands.map((brand) => (
                    <Badge key={brand} variant="secondary" className="text-xs px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 font-medium">
                      ✓ {brand}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} brands={brands} />
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 items-end animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="font-medium">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-3 sm:pt-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="relative flex flex-col gap-3">
            <div className="flex items-end gap-2 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
              <Textarea
                ref={textareaRef}
                placeholder={disabled ? "Set up brands first..." : "Ask questions about your brands..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || disabled}
                rows={1}
                className="flex-1 min-h-[36px] sm:min-h-[44px] max-h-32 py-2 sm:py-3 px-1 resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
              <Button
                type="submit"
                disabled={!prompt.trim() || isLoading || disabled}
                size="icon"
                className="h-9 w-9 rounded-xl flex-shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium uppercase tracking-wide">
              ↵ Send • Shift+↵ New line
            </p>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  brands: string[];
}

/**
 * Simple markdown renderer for chat messages
 */
function renderChatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, lineIndex) => {
    let processedLine: React.ReactNode = line;
    
    // Handle bullet lists
    if (line.match(/^\s*[-*]\s/)) {
      const content = line.replace(/^\s*[-*]\s/, '');
      processedLine = (
        <span key={lineIndex} className="flex gap-2">
          <span className="opacity-50">•</span>
          <span>{renderInlineMarkdown(content)}</span>
        </span>
      );
    }
    // Handle numbered lists
    else if (line.match(/^\s*\d+\.\s/)) {
      const match = line.match(/^(\s*\d+\.)\s(.*)$/);
      if (match) {
        processedLine = (
          <span key={lineIndex} className="flex gap-2">
            <span className="opacity-70 font-medium min-w-[1.5rem]">{match[1]}</span>
            <span>{renderInlineMarkdown(match[2])}</span>
          </span>
        );
      }
    }
    // Regular line with inline formatting
    else {
      processedLine = <span key={lineIndex}>{renderInlineMarkdown(line)}</span>;
    }
    
    elements.push(
      <div key={lineIndex} className={line === '' ? 'h-2' : ''}>
        {processedLine}
      </div>
    );
  });
  
  return <div className="space-y-1">{elements}</div>;
}

/**
 * Render inline markdown (bold, italic)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;
  
  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before match
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      parts.push(<strong key={keyIndex++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  
  return <>{parts}</>;
}

function MessageBubble({ message, brands }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div data-testid={`message-${message.id}`} className={`flex gap-3 items-end group ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
        isUser 
          ? 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800' 
          : 'bg-gradient-to-br from-indigo-500 to-violet-600'
      }`}>
        {isUser ? (
          <User className={`h-4 w-4 ${isUser ? 'text-slate-700 dark:text-slate-200' : 'text-white'}`} />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
        <div data-testid={`message-content-${message.id}`} className={`text-sm leading-relaxed max-w-prose ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-3xl rounded-br-sm px-4 py-2.5 shadow-sm' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-3xl rounded-bl-sm px-5 py-3 shadow-sm'
        }`}>
          <div className={`${isUser ? 'text-white' : ''}`}>
            {isUser ? message.content : renderChatMarkdown(message.content)}
          </div>
        </div>
        
        {/* Show metrics for assistant messages */}
        {!isUser && message.metrics && message.metrics.brandsMentioned.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2.5 ml-1">
            {message.metrics.brandsMentioned.map((brand) => (
              <Badge 
                key={brand} 
                className={`text-xs py-1 px-2.5 border rounded-full font-medium transition-all ${
                  message.metrics?.firstMention === brand
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {message.metrics?.firstMention === brand ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1 inline" />
                    {brand}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1.5 inline" />
                    {brand}
                  </>
                )}
              </Badge>
            ))}
          </div>
        )}
        
        <p className={`text-[9px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? 'text-right pr-1 text-slate-400' : 'text-left pl-1 text-slate-400 dark:text-slate-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
