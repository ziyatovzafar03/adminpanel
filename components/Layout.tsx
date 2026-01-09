
import React from 'react';
import { Sun, Moon, LogOut, Layers } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  currentUserFirstName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, onLogout, currentUserFirstName }) => {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Layers size={20} strokeWidth={2.5} />
            </div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Category Admin
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{currentUserFirstName || 'Admin'}</span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      
      <footer className="py-6 text-center border-t border-slate-200 dark:border-slate-800 mt-auto bg-white/50 dark:bg-slate-900/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2024 Category Admin Dashboard • Powered by Gemini AI
        </p>
      </footer>
    </div>
  );
};