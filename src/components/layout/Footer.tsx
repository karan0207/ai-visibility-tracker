import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-12 sm:mt-16 md:mt-20 pt-6 sm:pt-8 px-3 sm:px-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-col items-center gap-3 sm:gap-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span>Built with</span>
          <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 fill-rose-500 shrink-0" />
          <span>for the</span>
          <a
            href="https://writesonic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Writesonic
          </a>
          <span>Engineering Challenge</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} AI Visibility Tracker
        </p>
      </div>
    </footer>
  );
}
