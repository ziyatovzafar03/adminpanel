
import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Home, Search, ShieldAlert, Loader2, Package, WifiOff } from 'lucide-react';
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const activeTheme = savedTheme || 'light';
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
        // Path variable orqali chat_id ni olish (masalan: /12345678)
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const pathChatId = pathSegments[0];
        
        // Query param orqali ham tekshirib ko'ramiz (backward compatibility)
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
        setErrorMessage(err.message);
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

  const navigateTo = (id: string | null, name: string = 'Bosh sahifa') => {
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
      alert("Xato yuz berdi");
    }
  };

  const filteredCategories = categories.filter(c => 
    c.nameUz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <ShieldAlert size={64} className="text-rose-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Ruxsat yo'q</h1>
        <p className="text-slate-500 mb-8 max-w-xs">Admin panelga kirish uchun maxsus linkdan foydalaning.</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Qayta yuklash</button>
      </div>
    );
  }

  return (
    <Layout theme={theme} toggleTheme={toggleTheme} onLogout={() => window.location.reload()} currentUserFirstName={currentUser?.firstname}>
      <div className="flex flex-col gap-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-4">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <button onClick={() => navigateTo(null)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Home size={14} />
              <span>Root</span>
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={12} className="text-slate-300" />
                <button 
                  onClick={() => navigateTo(b.id, b.name)}
                  className={`hover:text-indigo-600 transition-colors ${i === breadcrumb.length - 1 ? 'text-indigo-600 font-bold' : ''}`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Kategoriyalar'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Jami {categories.length} ta bo'lim mavjud</p>
            </div>
            
            <div className="relative group max-w-xs w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Bo'limni qidirish..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />
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
                onDelete={async (id) => {
                  if (confirm('O\'chirmoqchimisiz?')) {
                    const res = await apiService.deleteCategory(id);
                    if (res.success) loadCategories(currentParentId);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={64} className="text-slate-200 dark:text-slate-800 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Bo'limlar mavjud emas</h3>
            <p className="text-sm text-slate-400">Yangi bo'lim yaratish uchun + tugmasini bosing</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white dark:border-slate-950"
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
