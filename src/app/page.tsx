'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer, HeroSection } from '@/components/layout';
import { SessionSetup } from '@/components/chat';
import { MultiPromptForm } from '@/components/forms';
import { ErrorAlert } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Layers } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async (category: string, brands: string[]) => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Create session in database
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, brands }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      if (!data.sessionId) {
        throw new Error('No session ID returned from server');
      }

      // Store session data in localStorage with database ID
      const sessionData = {
        sessionId: data.sessionId,
        category,
        brands,
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem('ai-tracker-session', JSON.stringify(sessionData));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session. Make sure the database is running.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMultiPromptSubmit = async (category: string, brands: string[], prompts: string[]) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // First create a session
      const sessionResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, brands }),
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || 'Failed to create session');
      }

      // Store session data
      const session = {
        sessionId: sessionData.sessionId,
        category,
        brands,
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem('ai-tracker-session', JSON.stringify(session));
      
      // Call the multi-prompt analyze endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      const analyzeResponse = await fetch('/api/analyze-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          brands,
          prompts,
          sessionId: sessionData.sessionId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await analyzeResponse.text();
      if (!text) {
        throw new Error('Empty response from server. The request may have timed out.');
      }

      let analyzeData;
      try {
        analyzeData = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!analyzeResponse.ok) {
        throw new Error(analyzeData.error || 'Analysis failed');
      }

      // Store results and redirect to dashboard
      localStorage.setItem('ai-tracker-multi-results', JSON.stringify(analyzeData.data));
      router.push('/dashboard');
    } catch (err) {
      console.error('Multi-prompt analysis error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Try running fewer prompts at once.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to analyze prompts.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isLoading = isCreating || isAnalyzing;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Main gradient background wrapper */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 to-slate-900 -z-10">
        {/* Dot Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <Header />
      
      {/* Modern Hero Section */}
      
 <HeroSection />
      
     
      
      <main className="flex-1 w-full px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="space-y-12 sm:space-y-16">
          
            {/* Main Interaction Area */}
            <div className="w-full">
              {/* Error Alert */}
              {error && (
                <div className="max-w-2xl mx-auto mb-8">
                  <ErrorAlert message={error} />
                </div>
              )}

              <Tabs defaultValue="single" className="w-full flex flex-col items-center" data-tab-trigger="single">
                <TabsList className="grid w-full max-w-sm sm:max-w-md grid-cols-2 h-12 sm:h-14 bg-slate-900/80 backdrop-blur-sm p-1 sm:p-1.5 rounded-2xl border border-slate-800 shadow-lg mb-8 sm:mb-10">
                  <TabsTrigger 
                    value="single" 
                    disabled={isLoading}
                    className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-900/20 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-none h-full"
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline font-semibold">Interactive Chat</span>
                      <span className="inline sm:hidden font-semibold text-xs">Chat</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="multi" 
                    disabled={isLoading}
                    className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-900/20 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-none h-full"
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline font-semibold">Batch Analysis</span>
                      <span className="inline sm:hidden font-semibold text-xs">Batch</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="w-full max-w-xl px-0 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SessionSetup onStart={handleStartSession} disabled={isCreating} />
                </TabsContent>

                <TabsContent value="multi" className="w-full max-w-2xl sm:max-w-3xl px-0 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MultiPromptForm onSubmit={handleMultiPromptSubmit} isLoading={isAnalyzing} />
                </TabsContent>
              </Tabs>
            </div>
            


          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}