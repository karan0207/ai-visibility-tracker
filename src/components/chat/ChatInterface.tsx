'use client';

import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import { ErrorAlert } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, User, Bot, CheckCircle2, Loader2, Copy } from 'lucide-react';
import type { ChatMessage } from '@/types/analysis';

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
    } catch (err: unknown) {
      setError((err as Error)?.message || 'An error occurred');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-none lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto w-full h-full">
      <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex flex-col h-full rounded-3xl overflow-hidden">
        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          
          {/* Error Alert */}
          {error && (
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <ErrorAlert message={error} />
            </div>
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-8 sm:space-y-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <h2 className="text-2xl font-medium text-slate-800 dark:text-slate-100 mb-4">
                  AI-Powered Brand Intelligence
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10">
                  Transform your brand strategy with real-time insights, competitive analysis, and market intelligence powered by advanced AI.
                </p>
                {brands.length > 0 && (
                  <div className="flex flex-wrap gap-4 justify-center max-w-3xl">
                    {brands.map((brand) => (
                      <Badge 
                        key={brand} 
                        className="text-base px-5 py-3 rounded-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-500 text-slate-800 dark:text-slate-200"
                      >
                        <CheckCircle2 className="h-5 w-5 mr-3 text-emerald-500" />
                        {brand}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-6 items-end">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '200ms' }}></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '400ms' }}></span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">
                      Analyzing your query...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-6 sm:px-8 pb-6 pt-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-400 transition-all">
                <Textarea
                  ref={textareaRef}
                  placeholder={disabled ? "Set up brands first..." : "Ask about market trends, competitor analysis, brand performance..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || disabled}
                  rows={1}
                  className="flex-1 min-h-[48px] max-h-40 py-3 px-2 resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none text-base placeholder:text-slate-400"
                  style={{ height: 'auto', overflow: 'hidden' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                  }}
                />
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading || disabled}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Simple markdown renderer for chat messages
 */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      elements.push(
        React.createElement(`h${level}`, { key: index, className: "font-semibold my-2" }, renderInline(content))
      );
      return;
    }
    
    // Bullet lists
    if (line.match(/^\s*[-*]\s/)) {
      const content = line.replace(/^\s*[-*]\s/, '');
      elements.push(
        <div key={index} className="flex gap-2 my-1">
          <span>•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      return;
    }
    
    // Numbered lists
    if (line.match(/^\s*\d+\.\s/)) {
      const match = line.match(/^(\s*\d+\.)\s(.*)$/);
      if (match) {
        elements.push(
          <div key={index} className="flex gap-2 my-1">
            <span className="font-semibold">{match[1]}</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
        return;
      }
    }
    
    // Regular line
    elements.push(
      <div key={index} className={line === '' ? 'h-2' : ''}>
        {renderInline(line)}
      </div>
    );
  });
  
  return <div>{elements}</div>;
}

/**
 * Render inline markdown (bold, italic, code, links)
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.substring(0, codeMatch.index));
      }
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
      continue;
    }
    
    // Links
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        parts.push(remaining.substring(0, linkMatch.index));
      }
      parts.push(
        <a 
          key={key++} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.substring(linkMatch.index + linkMatch[0].length);
      continue;
    }
    
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.substring(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      continue;
    }
    
    // Italic
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.substring(0, italicMatch.index));
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
      continue;
    }
    
    parts.push(remaining);
    break;
  }
  
  return <>{parts}</>;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`flex gap-4 items-end group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
        isUser 
          ? 'bg-slate-300 dark:bg-slate-600' 
          : 'bg-gradient-to-br from-indigo-500 to-violet-600'
      }`}>
        {isUser ? (
          <User className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-2xl px-5 py-4 shadow-lg ${
          isUser 
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-sm' 
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
        }`}>
          {isUser ? message.content : renderMarkdown(message.content)}
        </div>
        
        {/* Copy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="mt-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        
        {/* Brand Mentions */}
        {!isUser && message.metrics && message.metrics.brandsMentioned.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.metrics.brandsMentioned.map((brand) => (
              <Badge 
                key={brand} 
                className={`text-sm px-3 py-1 rounded-full ${
                  message.metrics?.firstMention === brand
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {message.metrics?.firstMention === brand && (
                  <Sparkles className="h-4 w-4 mr-1 inline" />
                )}
                {brand}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}