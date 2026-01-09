
import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, Home, Search, ShieldAlert, Loader2, Package, WifiOff, RefreshCcw, LayoutGrid } from 'lucide-react';
import { apiService } from './api';
import { Category, UserAuthData } from './types';
import { Layout } from './components/Layout';
import { CategoryCard } from './components/CategoryCard';
import { CategoryModal } from './components/CategoryModal';

const DEFAULT_CHAT_ID = '7882316826';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{id: string | null, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const breadcrumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const activeTheme = savedTheme || 'light';
    setTheme(activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, []);

  useEffect(() => {
    if (breadcrumbRef.current) {
      breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
    }
  }, [breadcrumb]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const pathSegments = window.location.pathname.split('/').filter(s => s && s !== 'admin');
        const pathChatId = pathSegments[0];
        const urlParams = new URLSearchParams(window.location.search);
        const queryChatId = urlParams.get('chat_id');
        const chatId = pathChatId || queryChatId || DEFAULT_CHAT_ID;
        
        const response = await apiService.fetchUserByChatId(chatId);
        const userData = response.success ? response.data : (response as any);

        if (userData && (userData.status === 'CONFIRMED' || userData.exists === true)) {
          setCurrentUser(userData);
          setAuthStatus('authorized');
          loadCategories(null);
        } else {
          setAuthStatus('unauthorized');
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Internet bilan aloqa yo'q");
        setAuthStatus('error');
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (id: string | null, name: string = 'Asosiy') => {
    if (id === null) {
      setBreadcrumb([]);
    } else {
      const existingIdx = breadcrumb.findIndex(b => b.id === id);
      if (existingIdx !== -1) {
        setBreadcrumb(breadcrumb.slice(0, existingIdx + 1));
      } else {
        setBreadcrumb([...breadcrumb, { id, name }]);
      }
    }
    setCurrentParentId(id);
    loadCategories(id);
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

  const filteredCategories = categories.filter(c => 
    c.nameUz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-2xl bg-indigo-600 animate-ping opacity-20"></div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Yuklanmoqda</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-mesh text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[1.5rem] flex items-center justify-center mb-6">
          <WifiOff size={40} />
        </div>
        <h1 className="text-2xl font-black mb-2 uppercase">Xatolik</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs">{errorMessage}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full max-w-xs py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-mesh text-center">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[1.5rem] flex items-center justify-center mb-6">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black mb-2 uppercase">Ruxsat yo'q</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">Sizning chat ID tizimda ro'yxatdan o'tmagan.</p>
        <button onClick={() => window.location.href = '/'} className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Bosh sahifaga qaytish</button>
      </div>
    );
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme} onLogout={() => window.location.reload()} currentUserFirstName={currentUser?.firstname}>
      <div className="flex flex-col gap-6 sm:gap-8 max-w-5xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs - Native Mobile Feel */}
          <div ref={breadcrumbRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4 scroll-smooth">
            <button 
              onClick={() => navigateTo(null)} 
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-indigo-600 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
            >
              <Home size={14} />
              Root
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 flex-shrink-0" />
                <button 
                  onClick={() => navigateTo(b.id, b.name)}
                  className={`flex-shrink-0 px-4 py-2 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 ${
                    i === breadcrumb.length - 1 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-[1.25rem] shadow-soft-glow">
                <LayoutGrid size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Bo\'limlar'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isLoading ? 'Yangilanmoqda' : `${categories.length} ta element topildi`}
                </p>
              </div>
            </div>
            
            <div className="relative group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Qidiruv..."
                className="w-full pl-14 pr-5 py-5 rounded-[1.75rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold shadow-sm placeholder:font-normal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-200/30 dark:border-slate-800/30" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCategories.map(cat => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                onSelect={(id) => navigateTo(id, cat.nameUz)}
                onEdit={(c) => { setEditingCategory(c); setIsModalOpen(true); }}
                onDelete={async (id) => {
                  if (confirm('Ushbu kategoriyani o\'chirmoqchimisiz?')) {
                    const res = await apiService.deleteCategory(id);
                    if (res.success) loadCategories(currentParentId);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center glass-panel rounded-[3rem] border-dashed border-2 border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-3xl flex items-center justify-center mb-6">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Bo'lim bo'sh</h3>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Yangi kategoriya qo'shing</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
        className="fixed bottom-10 right-8 w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 active:scale-90 active:rotate-12 transition-all z-50 border-4 border-white dark:border-slate-950"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrEdit}
        initialData={editingCategory}
        parentId={currentParentId}
      />
    </Layout>
  );
};

export default App;