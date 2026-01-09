
import React from 'react';
import { Sun, Moon, LogOut, Layers, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  currentUserFirstName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, onLogout, currentUserFirstName }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-[60] glass-panel border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Layers size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase">
                Category Pro
              </h1>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/30 dark:border-slate-700/30">
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User size={14} />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentUserFirstName || 'Admin'}</span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200/30 dark:border-slate-700/30"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-rose-500 bg-rose-50/50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white transition-all border border-rose-200/30 dark:border-rose-800/30"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mt-16 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      
      <footer className="py-8 text-center mt-auto border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
            &copy; 2024 SHOP CATEGORY ADMIN PRO
          </p>
          <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-30"></div>
        </div>
      </footer>
    </div>
  );
};