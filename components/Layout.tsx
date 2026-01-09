
import React from 'react';
import { Sun, Moon, LogOut, LayoutDashboard, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <header className="sticky top-0 z-50 glass border-b-2 border-slate-100/50 dark:border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[0.8rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 transform hover:scale-110 transition-transform cursor-pointer">
              <LayoutDashboard size={24} strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-xl tracking-tighter leading-none">AdminPro</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-0.5">Category Control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-600 hover:text-white transition-all duration-300"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
            <button
              onClick={onLogout}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm"
              aria-label="Logout"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {children}
      </main>
      
      {/* Footer Branding */}
      <footer className="py-8 text-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2024 AdminPro • Barcha huquqlar himoyalangan
        </p>
      </footer>
    </div>
  );
};
