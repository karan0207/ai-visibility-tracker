'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface, SessionSetup } from '@/components/chat';
import { MetricsPanel, Leaderboard, PromptList, CitedPages } from '@/components/dashboard';
import { MultiPromptForm } from '@/components/forms';
import { ErrorAlert } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RotateCcw, 
  BarChart3, 
  MessageSquare, 
  Link2, 
  Settings, 
  Sparkles,
  Home,
  PanelLeftClose,
  PanelLeft,
  Send,
  Layers
} from 'lucide-react';
import type { ChatMessage, BrandResult, PromptResult, CitationResult, ConfidenceLevel } from '@/types/analysis';

type MainView = 'chat' | 'multi-prompt' | 'analytics';
type AnalyticsTab = 'overview' | 'prompts' | 'citations';

/**
 * Determine confidence level based on sample size
 */
function getConfidenceLevel(totalPrompts: number): ConfidenceLevel {
  if (totalPrompts < 5) return 'low';
  if (totalPrompts < 30) return 'directional';
  return 'high';
}

interface SessionData {
  sessionId?: string;
  category: string;
  brands: string[];
  startedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainView, setMainView] = useState<MainView>('chat');
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  // Cumulative results
  const [brandResults, setBrandResults] = useState<BrandResult[]>([]);
  const [promptResults, setPromptResults] = useState<PromptResult[]>([]);
  const [citations, setCitations] = useState<CitationResult[]>([]);
  const [totalMentions, setTotalMentions] = useState(0);

  // Create a new session in the database
  const createSessionInDb = async (cat: string, brandList: string[]): Promise<string | null> => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, brands: brandList }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create session in DB:', data.error);
        return null;
      }
      
      return data.sessionId || null;
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  };

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ai-tracker-session');
    if (stored) {
      try {
        const sessionData: SessionData = JSON.parse(stored);
        setCategory(sessionData.category);
        setBrands(sessionData.brands);
        
        // If no sessionId, try to create one in the database
        if (!sessionData.sessionId && sessionData.category && sessionData.brands?.length > 0) {
          createSessionInDb(sessionData.category, sessionData.brands).then((newSessionId) => {
            if (newSessionId) {
              setSessionId(newSessionId);
              // Update localStorage with the new sessionId
              const updatedSession = { ...sessionData, sessionId: newSessionId };
              localStorage.setItem('ai-tracker-session', JSON.stringify(updatedSession));
              console.log('Created new session ID:', newSessionId);
            }
            setSessionLoaded(true);
          });
        } else {
          setSessionId(sessionData.sessionId || null);
          setSessionLoaded(true);
          
          // If we have a sessionId, load data from database
          if (sessionData.sessionId) {
            loadSessionData(sessionData.sessionId);
          }
        }
      } catch {
        // Invalid session, redirect to home
        router.push('/');
      }
    } else {
      // No session, redirect to home
      router.push('/');
    }
  }, [router]);

  // Load session data from database
  const loadSessionData = async (sid: string) => {
    try {
      const response = await fetch(`/api/session?id=${sid}`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      // Restore brand results
      if (data.brands && data.brands.length > 0) {
        const totalMentionsCalc = data.brands.reduce((sum: number, b: { mentions: number }) => sum + b.mentions, 0);
        const totalPromptsCalc = data.prompts?.length || 0;
        
        const restoredBrands: BrandResult[] = data.brands.map((b: { 
          name: string; 
          mentions: number; 
          visibility: number; 
          citationShare: number; 
          firstMentions: number 
        }) => {
          // Calculate new metrics from stored data
          const promptsWithBrand = totalPromptsCalc > 0 
            ? Math.round((b.visibility / 100) * totalPromptsCalc)
            : 0;
          const missedPrompts = totalPromptsCalc - promptsWithBrand;
          const mentionsPerPrompt = promptsWithBrand > 0 ? b.mentions / promptsWithBrand : 0;
          const firstMentionRate = promptsWithBrand > 0 ? (b.firstMentions / promptsWithBrand) * 100 : 0;
          
          return {
            name: b.name,
            // Core metrics
            promptCoverage: b.visibility, // visibility is the same as prompt coverage
            mentionShare: b.citationShare, // citationShare is the same as mention share
            mentionsPerPrompt: Math.round(mentionsPerPrompt * 100) / 100,
            firstMentionRate: Math.round(firstMentionRate * 10) / 10,
            missedPrompts,
            // Raw counts
            mentions: b.mentions,
            promptsWithBrand,
            firstMentions: b.firstMentions,
            // Legacy aliases
            visibility: b.visibility,
            citationShare: b.citationShare,
            contexts: [],
          };
        });
        // Sort by promptCoverage desc, mentions desc, name asc
        restoredBrands.sort((a, b) => {
          if (b.promptCoverage !== a.promptCoverage) return b.promptCoverage - a.promptCoverage;
          if (b.mentions !== a.mentions) return b.mentions - a.mentions;
          return a.name.localeCompare(b.name);
        });
        setBrandResults(restoredBrands);
        setTotalMentions(totalMentionsCalc);
      }
      
      // Restore prompt results and chat messages
      if (data.prompts && data.prompts.length > 0) {
        const restoredPrompts: PromptResult[] = data.prompts.map((p: { prompt: string; response: string; brandsMentioned: string[]; firstMention: string | null }) => ({
          prompt: p.prompt,
          response: p.response,
          brandsMentioned: p.brandsMentioned || [],
          brandContexts: {},
          urls: [],
          firstMention: p.firstMention,
        }));
        setPromptResults(restoredPrompts);
        
        // Restore chat messages from prompts
        const restoredMessages: ChatMessage[] = [];
        data.prompts.forEach((p: { prompt: string; response: string; brandsMentioned: string[]; firstMention: string | null }, index: number) => {
          restoredMessages.push({
            id: `restored-user-${index}`,
            role: 'user',
            content: p.prompt,
            timestamp: new Date(),
          });
          restoredMessages.push({
            id: `restored-assistant-${index}`,
            role: 'assistant',
            content: p.response,
            timestamp: new Date(),
            metrics: {
              brandsMentioned: p.brandsMentioned || [],
              firstMention: p.firstMention,
            },
          });
        });
        setMessages(restoredMessages);
      }
      
      // Restore citations
      if (data.citations && data.citations.length > 0) {
        const restoredCitations: CitationResult[] = data.citations.map((c: { url: string; domain: string; count: number }) => ({
          url: c.url,
          domain: c.domain,
          count: c.count,
        }));
        setCitations(restoredCitations);
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  };

  // Reset session and go back to home
  const handleResetSession = useCallback(() => {
    localStorage.removeItem('ai-tracker-session');
    router.push('/');
  }, [router]);

  // Update session brands in localStorage
  const handleBrandsChange = useCallback((newBrands: string[]) => {
    setBrands(newBrands);
    const stored = localStorage.getItem('ai-tracker-session');
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      sessionData.brands = newBrands;
      localStorage.setItem('ai-tracker-session', JSON.stringify(sessionData));
    }
  }, []);

  // Send a message/prompt
  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || brands.length === 0) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build previous prompts for cumulative analysis
      const previousPrompts = promptResults.map(p => ({
        prompt: p.prompt,
        response: p.response,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          brands,
          previousPrompts,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.hint 
          ? `${errorData.error}\n\n${errorData.hint}`
          : errorData.error || 'Failed to get response';
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metrics: {
          brandsMentioned: data.metrics.brandsMentioned,
          firstMention: data.metrics.firstMention,
        },
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update cumulative results
      setBrandResults(data.metrics.updatedBrands);
      setTotalMentions(data.metrics.totalMentions);
      setCitations(data.metrics.citations || []);
      
      // Add to prompt results for history
      const newPromptResult: PromptResult = {
        prompt,
        response: data.response,
        brandsMentioned: data.metrics.brandsMentioned,
        brandContexts: data.metrics.brandContexts || {},
        urls: data.metrics.urls || [],
        firstMention: data.metrics.firstMention,
      };
      setPromptResults(prev => [...prev, newPromptResult]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      // Remove the user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [brands, promptResults, sessionId]);

  // Handle multi-prompt submission
  const handleMultiPromptSubmit = useCallback(async (formCategory: string, formBrands: string[], prompts: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory || category,
          brands: formBrands.length > 0 ? formBrands : brands,
          prompts,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Multi-prompt analysis failed');
      }

      // Update results with the analysis data
      if (data.data) {
        setBrandResults(data.data.brands || []);
        setTotalMentions(data.data.totalMentions || 0);
        setCitations(data.data.citations || []);
        setPromptResults(prev => [...prev, ...(data.data.prompts || [])]);
        
        // Add messages for each prompt/response pair
        const newMessages: ChatMessage[] = [];
        (data.data.prompts || []).forEach((p: PromptResult, idx: number) => {
          newMessages.push({
            id: `multi-user-${Date.now()}-${idx}`,
            role: 'user',
            content: p.prompt,
            timestamp: new Date(),
          });
          newMessages.push({
            id: `multi-assistant-${Date.now()}-${idx}`,
            role: 'assistant',
            content: p.response,
            timestamp: new Date(),
            metrics: {
              brandsMentioned: p.brandsMentioned,
              firstMention: p.firstMention,
            },
          });
        });
        setMessages(prev => [...prev, ...newMessages]);
        
        // Switch to analytics view to see results
        setMainView('analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [category, brands, sessionId]);

  // Show loading while checking session
  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">AI Tracker</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-500 hover:text-slate-700"
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Session Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Category</p>
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-3">{category}</p>
            
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Tracking</p>
            <div className="flex flex-wrap gap-1">
              {brands.map((brand) => (
                <span 
                  key={brand} 
                  className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full"
                >
                  {brand}
                </span>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400">
                {promptResults.length} prompts • {totalMentions} mentions
              </p>
            </div>
          </div>
        )}

        {/* Main Navigation - Chat vs Multi-Prompt vs Analytics */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'chat' as MainView, icon: Send, label: 'Chat' },
            { id: 'multi-prompt' as MainView, icon: Layers, label: 'Multi-Prompt' },
            { id: 'analytics' as MainView, icon: BarChart3, label: 'Analytics' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setMainView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                mainView === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </button>
          ))}
        </div>

        {/* Analytics Sub-navigation */}
        {mainView === 'analytics' && (
          <nav className="flex-1 p-2 space-y-1 overflow-auto">
            <p className={`text-xs text-slate-400 uppercase tracking-wide px-3 py-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
              Views
            </p>
            {[
              { id: 'overview' as AnalyticsTab, icon: BarChart3, label: 'Overview' },
              { id: 'prompts' as AnalyticsTab, icon: MessageSquare, label: 'Prompts', count: promptResults.length },
              { id: 'citations' as AnalyticsTab, icon: Link2, label: 'Citations', count: citations.length },
            ].map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => setAnalyticsTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  analyticsTab === id
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span>{label}</span>
                    {count !== undefined && count > 0 && (
                      <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* Chat or Multi-Prompt view - show add brands */}
        {(mainView === 'chat' || mainView === 'multi-prompt') && !sidebarCollapsed && (
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-3 w-3 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Add Brands</span>
            </div>
            <SessionSetup 
              onStart={() => {}}
              onBrandsChange={handleBrandsChange}
              initialBrands={brands}
              initialCategory={category}
              isActive={true}
              compact={true}
            />
          </div>
        )}

        {/* Spacer for analytics view */}
        {mainView === 'analytics' && sidebarCollapsed && <div className="flex-1" />}

        {/* Bottom Actions */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetSession}
                className="flex-1 text-xs"
              >
                <Home className="h-3 w-3 mr-1" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setMessages([]);
                  setBrandResults([]);
                  setPromptResults([]);
                  setCitations([]);
                  setTotalMentions(0);
                }}
                className="text-xs text-slate-500"
                title="Clear data"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Collapsed Actions */}
        {sidebarCollapsed && (
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetSession}
              className="w-full justify-center"
              title="Go Home"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content Area - Full Width */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Chat View */}
        {mainView === 'chat' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
              <ChatInterface
                brands={brands}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={brands.length === 0}
              />
              {error && (
                <div className="mt-4">
                  <ErrorAlert message={error} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multi-Prompt View */}
        {mainView === 'multi-prompt' && (
          <div className="flex-1 flex flex-col p-6 overflow-auto">
            <div className="max-w-2xl mx-auto w-full">
              <MultiPromptForm 
                onSubmit={handleMultiPromptSubmit} 
                isLoading={isLoading}
                initialCategory={category}
                initialBrands={brands}
              />
              {error && (
                <div className="mt-4">
                  <ErrorAlert message={error} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {mainView === 'analytics' && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {brandResults.length === 0 && promptResults.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 inline-block mb-4">
                      <BarChart3 className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      No Analytics Yet
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                      Switch to the Chat tab and ask some questions. Your brand analytics will appear here.
                    </p>
                    <Button onClick={() => setMainView('chat')}>
                      <Send className="h-4 w-4 mr-2" />
                      Go to Chat
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {analyticsTab === 'overview' && (
                    <>
                      <MetricsPanel
                        totalPrompts={promptResults.length}
                        totalMentions={totalMentions}
                        brands={brandResults}
                        confidenceLevel={getConfidenceLevel(promptResults.length)}
                      />
                      <Leaderboard brands={brandResults} />
                    </>
                  )}
                  {analyticsTab === 'prompts' && (
                    <PromptList prompts={promptResults} />
                  )}
                  {analyticsTab === 'citations' && (
                    citations.length > 0 ? (
                      <CitedPages citations={citations} />
                    ) : (
                      <Card className="border-0 shadow-sm">
                        <CardContent className="py-12 text-center">
                          <Link2 className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No citations found yet</p>
                          <p className="text-xs text-slate-400 mt-1">Citations will appear when AI responses contain URLs</p>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
