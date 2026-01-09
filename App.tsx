
import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, Home, Search, ShieldAlert, Loader2, Package, WifiOff, RefreshCcw, LayoutGrid } from 'lucide-react';
import { apiService } from './api';
import { Category, UserAuthData } from './types';
import { Layout } from './components/Layout';
import { CategoryCard } from './components/CategoryCard';
import { CategoryModal } from './components/CategoryModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Notification, NotificationType } from './components/Notification';

const DEFAULT_CHAT_ID = '7882316826';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{id: string | null, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Alert/Confirm States
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });
  const [notification, setNotification] = useState<{isVisible: boolean, message: string, type: NotificationType}>({
    isVisible: false,
    message: '',
    type: 'success'
  });

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

  const showNotification = (message: string, type: NotificationType = 'success') => {
    setNotification({ isVisible: true, message, type });
  };

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
        const queryChatId = urlParams.get('chat_id');
        
        // Also check if it's baseUrl/{chat_id}
        const pathSegments = window.location.pathname.split('/').filter(s => s && s !== 'admin');
        const pathChatId = pathSegments[0];
        
        const chatId = queryChatId || pathChatId || DEFAULT_CHAT_ID;
        
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
      showNotification("Kategoriyalarni yuklashda xatolik", "error");
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
        showNotification(editingCategory ? "Kategoriya yangilandi" : "Kategoriya yaratildi", "success");
      } else {
        showNotification("Saqlashda xatolik yuz berdi", "error");
      }
    } catch (err) {
      showNotification("Tizimda xatolik", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmState.id) return;
    try {
      const res = await apiService.deleteCategory(confirmState.id);
      if (res.success) {
        loadCategories(currentParentId);
        showNotification("Kategoriya o'chirildi", "success");
      } else {
        showNotification("O'chirishda xatolik yuz berdi", "error");
      }
    } catch (err) {
      showNotification("Xatolik: Tarmoq bilan muammo", "error");
    } finally {
      setConfirmState({ isOpen: false, id: null });
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Dashboardga ulanilmoqda</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-mesh text-center">
        <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-rose-500/5">
          <WifiOff size={48} />
        </div>
        <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">Tarmoq Xatosi</h1>
        <p className="text-slate-500 text-sm mb-10 leading-relaxed max-w-xs uppercase font-bold tracking-widest">Internet aloqasini tekshiring yoki serverni yangilang</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full max-w-xs py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <RefreshCcw size={16} />
            Qayta urinish
          </div>
        </button>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-mesh text-center">
        <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-8">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">Ruxsat Berilmadi</h1>
        <p className="text-slate-500 text-sm mb-10 leading-relaxed uppercase font-bold tracking-widest">Sizning Chat ID tizimda tasdiqlanmagan</p>
        <button onClick={() => window.location.href = '/'} className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">Bosh sahifaga qaytish</button>
      </div>
    );
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme} onLogout={() => window.location.reload()} currentUserFirstName={currentUser?.firstname}>
      <Notification 
        {...notification} 
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))} 
      />

      <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-6">
          <div ref={breadcrumbRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4 scroll-smooth">
            <button 
              onClick={() => navigateTo(null)} 
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-indigo-600 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm"
            >
              <Home size={14} strokeWidth={2.5} />
              Root
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 flex-shrink-0" />
                <button 
                  onClick={() => navigateTo(b.id, b.name)}
                  className={`flex-shrink-0 px-5 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm ${
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-soft-glow">
                  <LayoutGrid size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">
                    {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Katalog'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {isLoading ? 'Yangilanmoqda' : `${categories.length} bo'lim mavjud`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative group w-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                <Search size={22} />
              </div>
              <input 
                type="text"
                placeholder="Bo'lim nomini yozing..."
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold shadow-glass placeholder:font-bold placeholder:text-slate-300 uppercase placeholder:tracking-widest"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] animate-pulse border border-slate-200/30 dark:border-slate-800/30" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map(cat => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                onSelect={(id) => navigateTo(id, cat.nameUz)}
                onEdit={(c) => { setEditingCategory(c); setIsModalOpen(true); }}
                onDelete={(id) => setConfirmState({ isOpen: true, id })}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 rounded-[2rem] flex items-center justify-center mb-8">
              <Package size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Topilmadi</h3>
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Ro'yxat bo'sh yoki qidiruvda xato</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
        className="fixed bottom-10 right-8 w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] flex items-center justify-center shadow-2xl active:scale-90 active:rotate-12 transition-all z-50 border-4 border-white dark:border-slate-950 group"
      >
        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]"></div>
        <Plus size={36} strokeWidth={3} className="relative z-10 group-hover:text-white" />
      </button>

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrEdit}
        initialData={editingCategory}
        parentId={currentParentId}
      />

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title="O'chirish"
        message="Siz rostdan ham ushbu bo'limni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
      />
    </Layout>
  );
};

export default App;
