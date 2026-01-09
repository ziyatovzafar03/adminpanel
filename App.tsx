
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, Search, ShieldAlert, Loader2, Sparkles, LayoutGrid } from 'lucide-react';
import { apiService } from './api';
import { Category, UserAuthData } from './types';
import { Layout } from './components/Layout';
import { CategoryCard } from './components/CategoryCard';
import { CategoryModal } from './components/CategoryModal';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize Theme
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

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Default chat_id as requested: 7882316826
      const chatId = urlParams.get('chat_id') || '7882316826';
      
      try {
        const response = await apiService.fetchUserByChatId(chatId);
        if (response.success && response.data.exists) {
          setAuthStatus('authorized');
          loadCategories(null);
        } else {
          setAuthStatus('unauthorized');
        }
      } catch (err) {
        setAuthStatus('unauthorized');
      }
    };

    checkAuth();
  }, []);

  const loadCategories = async (parentId: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = parentId 
        ? await apiService.getCategoryChildren(parentId)
        : await apiService.getParentCategories();
      
      if (response.success) {
        setCategories(response.data.sort((a, b) => a.orderIndex - b.orderIndex));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = async (id: string) => {
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
      let response;
      if (editingCategory) {
        response = await apiService.editCategory(editingCategory.id, data);
      } else {
        response = await apiService.addCategory(data);
      }

      if (response.success) {
        setIsModalOpen(false);
        setEditingCategory(null);
        loadCategories(currentParentId);
      } else {
        alert(response.message);
      }
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Haqiqatdan ham ushbu kategoriyani oʻchirib tashlamoqchimisiz?')) {
      try {
        const response = await apiService.deleteCategory(id);
        if (response.success) {
          loadCategories(currentParentId);
        }
      } catch (err) {
        alert('Oʻchirishda xatolik yuz berdi');
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.nameUz.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.nameEn && c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950">
        <div className="relative">
           <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 border-2 border-indigo-600 dark:border-indigo-400 animate-spin" />
           <Loader2 size={32} className="absolute inset-0 m-auto animate-pulse text-indigo-600" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Kuting...</p>
          <p className="text-slate-400 text-sm">Ma'lumotlar tekshirilmoqda</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-6 shadow-xl shadow-red-500/10">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-3 tracking-tight">Kirish taqiqlangan</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
          Ushbu admin panelga kirish uchun URL manzilingizda yaroqli <b>chat_id</b> ko'rsatilgan bo'lishi shart.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme} onLogout={() => window.location.href = '/'}>
      <div className="flex flex-col gap-8 pb-10">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
                <LayoutGrid className="text-indigo-600" size={28} />
                Kategoriyalar
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {currentParentId ? 'Kichik kategoriyalar boshqaruvi' : 'Asosiy kategoriyalar roʻyxati'}
              </p>
            </div>
            {currentParentId && (
              <button 
                onClick={handleGoBack}
                className="group flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl glass hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Orqaga
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Qidirish..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl glass border-transparent focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-600/30 whitespace-nowrap"
            >
              <Plus size={22} strokeWidth={3} />
              Kategoriya qo'shish
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-44 glass rounded-3xl animate-pulse bg-slate-200/20 dark:bg-slate-800/20" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filteredCategories.map((category, idx) => (
              <div key={category.id} className="animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <CategoryCard 
                  category={category} 
                  onSelect={handleSelectCategory}
                  onEdit={(cat) => { setEditingCategory(cat); setIsModalOpen(true); }}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-[2.5rem] border-dashed border-2 border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-400 mb-6 animate-bounce">
              <Sparkles size={40} />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">Hech narsa topilmadi</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto px-4 font-medium leading-relaxed">
              {searchQuery ? `"${searchQuery}" bo'yicha ma'lumot mavjud emas.` : 'Bu bo'lim hozircha bo'sh. Yangi kategoriya qo'shishni boshlang!'}
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

      {/* Persistent Mobile Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 sm:hidden z-40">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-90 transition-all shadow-[0_20px_50px_rgba(79,70,229,0.4)] backdrop-blur-md"
          >
            <Plus size={24} strokeWidth={3} />
            Yangi Kategoriya
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default App;
