'use client';

import { ChevronRight } from 'lucide-react';

// ============== COLORFUL SPARKLE ICON ==============
const ColorfulSparkle = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="none">
    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="url(#sparkle-gradient)" />
    <defs>
      <linearGradient id="sparkle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="33%" stopColor="#10B981" />
        <stop offset="66%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
  </svg>
);

// ============== HERO SECTION COMPONENT ==============
interface HeroSectionProps {
  onStartTrial?: () => void;
  onBookDemo?: () => void;
}

export function HeroSection({ onStartTrial, onBookDemo }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-0">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900" />
      
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

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 sm:mb-8">
          Track & Boost Your Brand's Visibility in
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 flex-wrap">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-lg">
              <ColorfulSparkle />
            </div>
            <span className="text-white">AI Search</span>
          </div>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-10 mb-8 sm:mb-12">
          See exactly how your brand performs in AI search results. Then take precise actions to boost 
          visibility create new content, refresh existing pages, or reach out to sites that mention 
          competitors but not you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={onStartTrial}
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-white text-slate-950 font-semibold text-sm sm:text-base flex items-center gap-2 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            Start Free Trial
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onBookDemo}
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-white/10 text-white font-semibold text-sm sm:text-base border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
          >
            Book a Demo
          </button>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Floating Animation Style */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </section>
  );
}
