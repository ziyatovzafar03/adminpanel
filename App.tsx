
import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, Home, Search, ShieldAlert, Loader2, Package, WifiOff, RefreshCcw, LayoutGrid, ShoppingBag, ArrowLeft } from 'lucide-react';
import { apiService } from './api';
import { DEFAULT_CHAT_ID } from './consts';
import { Category, Product, UserAuthData } from './types';
import { Layout } from './components/Layout';
import { CategoryCard } from './components/CategoryCard';
import { CategoryModal } from './components/CategoryModal';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { ConfirmModal } from './components/ConfirmModal';
import { Notification, NotificationType } from './components/Notification';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'category' | 'product'>('category');
  const [breadcrumb, setBreadcrumb] = useState<{id: string | null, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, id: string | null, type: 'category' | 'product'}>({ isOpen: false, id: null, type: 'category' });
  const [notification, setNotification] = useState<{isVisible: boolean, message: string, type: NotificationType}>({
    isVisible: false, message: '', type: 'success'
  });

  const breadcrumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const activeTheme = savedTheme || 'light';
    setTheme(activeTheme);
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
  }, []);

  useEffect(() => {
    if (breadcrumbRef.current) breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
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
        const pathSegments = window.location.pathname.split('/').filter(s => s && s !== 'admin');
        const pathChatId = pathSegments[0];
        const chatId = queryChatId || pathChatId || DEFAULT_CHAT_ID;
        
        const response = await apiService.fetchUserByChatId(chatId);
        const userData = response.success ? response.data : (response as any);

        if (userData && (userData.status === 'CONFIRMED' || userData.exists === true)) {
          setCurrentUser(userData);
          setAuthStatus('authorized');
          loadData(null);
        } else {
          setAuthStatus('unauthorized');
        }
      } catch (err) {
        setAuthStatus('error');
      }
    };
    initApp();
  }, []);

  const loadData = async (parentId: string | null) => {
    setIsLoading(true);
    try {
      if (parentId) {
        const hasChildrenRes = await apiService.hasChildren(parentId);
        if (hasChildrenRes.data) {
          setViewMode('category');
          const res = await apiService.getCategoryChildren(parentId);
          setCategories(res.data.sort((a, b) => a.orderIndex - b.orderIndex));
        } else {
          setViewMode('product');
          const res = await apiService.getProductsByCategoryId(parentId);
          setProducts(res.data.sort((a, b) => a.orderIndex - b.orderIndex));
        }
      } else {
        setViewMode('category');
        const res = await apiService.getParentCategories();
        setCategories(res.data.sort((a, b) => a.orderIndex - b.orderIndex));
      }
    } catch (err) {
      showNotification("Ma'lumotlarni yuklashda xatolik", "error");
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
    loadData(id);
  };

  const handleCategorySubmit = async (data: any) => {
    try {
      const response = editingCategory 
        ? await apiService.editCategory(editingCategory.id, data)
        : await apiService.addCategory(data);
      if (response.success) {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        loadData(currentParentId);
        showNotification(editingCategory ? "Kategoriya yangilandi" : "Kategoriya yaratildi");
      }
    } catch (err: any) {
      showNotification(err.message || "Xatolik yuz berdi", "error");
    }
  };

  const handleProductSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (editingProduct) {
        // 1. Update product basic details
        const editRequest = {
          nameUz: data.nameUz, nameUzCyrillic: data.nameUzCyrillic, nameRu: data.nameRu, nameEn: data.nameEn,
          descriptionUz: data.descriptionUz, descriptionUzCyrillic: data.descriptionUzCyrillic, descriptionRu: data.descriptionRu, descriptionEn: data.descriptionEn,
          status: data.status, orderIndex: data.orderIndex,
          discountType: data.discountType, discountValue: data.discountValue, 
          discountStartAt: data.discountStartAt || null, discountEndAt: data.discountEndAt || null
        };
        await apiService.updateProduct(editingProduct.id, editRequest);

        // 2. Sync Variants (Types)
        // Note: For a real production app, we'd handle deletions too.
        for (const type of data.types) {
          if (type._isNew || type.id.startsWith('temp-')) {
            await apiService.addProductType({
              imgSize: type.imgSize, imgName: type.imgName, imageUrl: type.imageUrl,
              nameUz: type.nameUz, nameUzCyrillic: type.nameUzCyrillic || type.nameUz, 
              nameEn: type.nameEn || type.nameUz, nameRu: type.nameRu || type.nameUz,
              price: type.price, stock: type.stock, productId: editingProduct.id
            });
          } else if (type._isModified) {
            await apiService.updateProductType(type.id, {
              imgSize: type.imgSize, imgName: type.imgName, imageUrl: type.imageUrl,
              nameUz: type.nameUz, nameUzCyrillic: type.nameUzCyrillic || type.nameUz,
              nameEn: type.nameEn || type.nameUz, nameRu: type.nameRu || type.nameUz,
              price: type.price, stock: type.stock
            });
          }
        }
        showNotification("Mahsulot va variantlar saqlandi");
      } else {
        // Create new product
        await apiService.createProduct(data);
        showNotification("Yangi mahsulot yaratildi");
      }
      
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadData(currentParentId);
    } catch (err: any) {
      showNotification(err.message || "Mahsulotni saqlashda xatolik", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmState.id) return;
    try {
      const res = confirmState.type === 'category' 
        ? await apiService.deleteCategory(confirmState.id)
        : await apiService.deleteProduct(confirmState.id);
      if (res.success) {
        loadData(currentParentId);
        showNotification(`${confirmState.type === 'category' ? 'Kategoriya' : 'Mahsulot'} o'chirildi`);
      }
    } catch (err: any) {
      showNotification(err.message || "O'chirishda xatolik", "error");
    } finally {
      setConfirmState({ isOpen: false, id: null, type: 'category' });
    }
  };

  const filteredItems = viewMode === 'category' 
    ? categories.filter(c => c.nameUz.toLowerCase().includes(searchQuery.toLowerCase()))
    : products.filter(p => p.nameUz.toLowerCase().includes(searchQuery.toLowerCase()));

  if (authStatus === 'loading') return <div className="min-h-screen flex items-center justify-center bg-mesh"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  if (authStatus === 'error') return <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-mesh text-center"><WifiOff size={64} className="text-rose-500 mb-6" /><h1 className="text-2xl font-black mb-4">Ulanish Xatosi</h1><button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl uppercase font-black tracking-widest text-[10px]">Qayta urinish</button></div>;

  return (
    <Layout theme={theme} toggleTheme={toggleTheme} onLogout={() => window.location.reload()} currentUserFirstName={currentUser?.firstname}>
      <Notification {...notification} onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))} />

      <div className="flex flex-col gap-6 sm:gap-10 max-w-6xl mx-auto pb-24">
        <div className="flex flex-col gap-8">
          {/* Breadcrumbs */}
          <div ref={breadcrumbRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4 scroll-smooth">
            <button onClick={() => navigateTo(null)} className="flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:text-indigo-600 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Home size={16} /> Root
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 flex-shrink-0" />
                <button onClick={() => navigateTo(b.id, b.name)} className={`flex-shrink-0 px-6 py-3.5 rounded-[1.5rem] border transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm ${i === breadcrumb.length - 1 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-500'}`}>
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-[1.75rem] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                {viewMode === 'category' ? <LayoutGrid size={32} /> : <ShoppingBag size={32} />}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                  {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Katalog'}
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {isLoading ? 'Yangilanmoqda...' : `${filteredItems.length} ta ${viewMode === 'category' ? 'bo\'lim' : 'mahsulot'}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative group w-full lg:max-w-md">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text"
                placeholder={`${viewMode === 'category' ? 'Bo\'limlar' : 'Mahsulotlar'}dan qidirish...`}
                className="w-full pl-16 pr-6 py-5 rounded-[2.25rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold shadow-glass placeholder:text-slate-300 uppercase tracking-wide"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/20 dark:border-slate-800/20" />)}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewMode === 'category' ? (
              (filteredItems as Category[]).map(cat => <CategoryCard key={cat.id} category={cat} onSelect={(id) => navigateTo(id, cat.nameUz)} onEdit={(c) => { setEditingCategory(c); setIsCategoryModalOpen(true); }} onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'category' })} />)
            ) : (
              (filteredItems as Product[]).map(prod => <ProductCard key={prod.id} product={prod} onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }} onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'product' })} />)
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Package size={64} className="text-slate-300 dark:text-slate-800 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ma'lumot topilmadi</h3>
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Hali hech narsa qo'shilmagan</p>
          </div>
        )}
      </div>

      {/* FAB Button */}
      <button 
        onClick={() => {
          if (viewMode === 'category') { setEditingCategory(null); setIsCategoryModalOpen(true); }
          else { setEditingProduct(null); setIsProductModalOpen(true); }
        }}
        className="fixed bottom-10 right-8 w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] flex items-center justify-center shadow-2xl active:scale-90 active:rotate-12 transition-all z-50 border-4 border-white dark:border-slate-950 group"
      >
        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]"></div>
        <Plus size={36} strokeWidth={3} className="relative z-10 group-hover:text-white" />
      </button>

      {/* Back button for deep views */}
      {breadcrumb.length > 0 && (
        <button 
          onClick={() => {
            const parent = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : { id: null, name: 'Root' };
            navigateTo(parent.id, parent.name);
          }}
          className="fixed bottom-10 left-8 w-16 h-16 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[1.75rem] flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-800 active:scale-90 z-50"
        >
          <ArrowLeft size={24} />
        </button>
      )}

      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSubmit={handleCategorySubmit} initialData={editingCategory} parentId={currentParentId} />
      {currentParentId && <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSubmit={handleProductSubmit} initialData={editingProduct} categoryId={currentParentId} />}
      <ConfirmModal isOpen={confirmState.isOpen} title="O'chirish" message={`Siz rostdan ham ushbu ${confirmState.type === 'category' ? 'bo\'limni' : 'mahsulotni'} o'chirmoqchimisiz?`} onConfirm={handleDeleteConfirmed} onCancel={() => setConfirmState({ isOpen: false, id: null, type: 'category' })} />
    </Layout>
  );
};

export default App;
