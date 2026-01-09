
import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, ShieldAlert, Loader2, Sparkles, LayoutGrid } from 'lucide-react';
import { apiService } from './api';
import { Category, UserAuthData } from './types';
import { Layout } from './components/Layout';
import { CategoryCard } from './components/CategoryCard';
import { CategoryModal } from './components/CategoryModal';

const DEFAULT_CHAT_ID = '7882316826';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get('chat_id') || DEFAULT_CHAT_ID;
        
        const response = await apiService.fetchUserByChatId(chatId);
        
        // API javobi ResponseDto formatida bo'lsa (success/data) yoki to'g'ridan-to'g'ri ob'ekt bo'lsa ham tekshiramiz
        const userData = response.success ? response.data : (response as any);

        if (userData && userData.status === 'CONFIRMED') {
          setCurrentUser(userData);
          setAuthStatus('authorized');
          loadCategories(null);
        } else {
          console.warn("Auth check failed. User data:", userData);
          setAuthStatus('unauthorized');
        }
      } catch (err) {
        console.error("Auth process error:", err);
        setAuthStatus('unauthorized');
      }
    };

    initApp();
  }, []);

  const loadCategories = async (parentId: string | null) => {
    setIsLoading(true);
    try {
      const response = parentId 
        ? await apiService.getCategoryChildren(parentId)
        : await apiService.getParentCategories();
      
      if (response && response.success) {
        setCategories(response.data.sort((a, b) => a.orderIndex - b.orderIndex));
      }
    } catch (err) {
      console.error("Categories load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (id: string) => {
    setHistory(prev => [...prev, currentParentId as string].filter(i => i !== null));
    setCurrentParentId(id);
    loadCategories(id);
  };

  const handleGoBack = () => {
    const newHistory = [...history];
    const prevParentId = newHistory.pop() || null;
    setHistory(newHistory);
    setCurrentParentId(prevParentId);
    loadCategories(prevParentId);
  };

  const handleAddOrEdit = async (data: any) => {
    try {
      const response = editingCategory 
        ? await apiService.editCategory(editingCategory.id, data)
        : await apiService.addCategory(data);

      if (response && response.success) {
        setIsModalOpen(false);
        setEditingCategory(null);
        loadCategories(currentParentId);
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Kategoriyani o‘chirmoqchimisiz?')) {
      try {
        const response = await apiService.deleteCategory(id);
        if (response && response.success) {
          loadCategories(currentParentId);
        }
      } catch (err) {
        alert("O'chirishda xatolik");
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.nameUz.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.nameEn && c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6 text-center">
        <div className="relative mb-8 w-24 h-24">
          <div className="absolute inset-0 border-4 border-indigo-600/10 dark:border-indigo-400/10 rounded-[2.5rem]"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-600 dark:border-t-indigo-400 rounded-[2.5rem] animate-spin"></div>
          <Loader2 className="absolute inset-0 m-auto text-indigo-600 dark:text-indigo-400 animate-pulse" size={40} />
        </div>
        <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2">Tizim yuklanmoqda</h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Xavfsiz ulanish tekshirilmoqda...</p>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-8 shadow-2xl">
          <ShieldAlert size={56} />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight">Ruxsat berilmagan</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-12 text-lg">
          Sizning statusiningiz 'CONFIRMED' emas yoki chat_id noto'g'ri. Iltimos, administrator bilan bog'laning.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme} onLogout={() => window.location.reload()}>
      <div className="flex flex-col gap-10 pb-20">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] text-white shadow-xl flex items-center justify-center">
                <LayoutGrid size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Kategoriyalar</h2>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                     {currentUser?.firstname || 'Admin'}
                   </div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                     • {currentParentId ? 'Ichki bo\'limlar' : 'Asosiy menyu'}
                   </span>
                </div>
              </div>
            </div>
            {currentParentId && (
              <button 
                onClick={handleGoBack}
                className="flex items-center gap-2 text-sm font-black bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all"
              >
                <ArrowLeft size={20} />
                Orqaga
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input 
                type="text"
                placeholder="Qidiruv..."
                className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/50 outline-none transition-all font-bold text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
              className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30"
            >
              <Plus size={28} />
              Qo'shish
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredCategories.map((category) => (
              <CategoryCard 
                key={category.id}
                category={category} 
                onSelect={handleSelectCategory}
                onEdit={(cat) => { setEditingCategory(cat); setIsModalOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center glass rounded-[4rem] border-dashed border-4 border-slate-200 dark:border-slate-800">
            <Sparkles size={64} className="text-indigo-400 mb-6" />
            <h3 className="text-3xl font-black mb-4">Ma'lumot topilmadi</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto px-8 text-xl">
              Hali bu bo'limda hech qanday kategoriya yaratilmagan.
            </p>
          </div>
        )}
      </div>

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrEdit}
        initialData={editingCategory}
        parentId={currentParentId}
      />

      <div className="fixed bottom-10 left-0 right-0 px-8 sm:hidden z-40">
        <button 
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform"
        >
          <Plus size={32} />
          Yangi Bo'lim
        </button>
      </div>
    </Layout>
  );
};

export default App;
