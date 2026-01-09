
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
      let productId = '';
      
      // 1. Create or Update basic product info
      if (editingProduct) {
        productId = editingProduct.id;
        const editRequest = {
          nameUz: data.nameUz, nameUzCyrillic: data.nameUzCyrillic, nameRu: data.nameRu, nameEn: data.nameEn,
          descriptionUz: data.descriptionUz, descriptionUzCyrillic: data.descriptionUzCyrillic, descriptionRu: data.descriptionRu, descriptionEn: data.descriptionEn,
          status: data.status, orderIndex: data.orderIndex,
          discountType: data.discountType, discountValue: data.discountValue, 
          discountStartAt: data.discountStartAt || null, discountEndAt: data.discountEndAt || null
        };
        await apiService.updateProduct(productId, editRequest);
      } else {
        // When creating, we send the whole object. The API should handle basic fields.
        const createRes = await apiService.createProduct({ ...data, types: [] });
        productId = createRes.data.id;
      }

      // 2. Handle Variants (Types) Sync
      if (productId && data.types && data.types.length > 0) {
        for (const type of data.types) {
          const isNew = type._isNew || !type.id || type.id.toString().startsWith('temp-');
          
          if (isNew) {
            // POST /api/product/add-product-type
            // Request: { ..., productId: "..." }
            await apiService.addProductType({
              imgSize: type.imgSize || 0,
              imgName: type.imgName || 'variant.png',
              imageUrl: type.imageUrl,
              nameUz: type.nameUz,
              nameUzCyrillic: type.nameUzCyrillic || type.nameUz,
              nameEn: type.nameEn || type.nameUz,
              nameRu: type.nameRu || type.nameUz,
              price: type.price,
              stock: type.stock,
              productId: productId // Required for add
            });
          } else if (type._isModified) {
            // PUT /api/product/update-product-type/{id}
            // Request: { ... } (No productId)
            await apiService.updateProductType(type.id, {
              imgSize: type.imgSize || 0,
              imgName: type.imgName || 'variant.png',
              imageUrl: type.imageUrl,
              nameUz: type.nameUz,
              nameUzCyrillic: type.nameUzCyrillic || type.nameUz,
              nameEn: type.nameEn || type.nameUz,
              nameRu: type.nameRu || type.nameUz,
              price: type.price,
              stock: type.stock
            });
          }
        }
      }
      
      showNotification(editingProduct ? "O'zgarishlar saqlandi" : "Mahsulot muvaffaqiyatli yaratildi");
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadData(currentParentId);
    } catch (err: any) {
      showNotification(err.message || "Xatolik yuz berdi", "error");
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
      showNotification(err.message || "Xatolik yuz berdi", "error");
    } finally {
      setConfirmState({ isOpen: false, id: null, type: 'category' });
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 animate-pulse">Platformaga kirish...</p>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shadow-lg">
            <ShieldAlert size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Kirish taqiqlangan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">Sizda ushbu dashboard'dan foydalanish uchun ruxsat yo'q yoki havola eskirgan.</p>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Qayta urinish</button>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => c.nameUz.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => p.nameUz.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Layout 
      theme={theme} 
      toggleTheme={toggleTheme} 
      onLogout={() => window.location.reload()}
      currentUserFirstName={currentUser?.firstname}
    >
      <div className="max-w-6xl mx-auto space-y-10 pb-32">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-8">
          <div ref={breadcrumbRef} className="flex items-center gap-3 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4 scroll-smooth">
            <button onClick={() => navigateTo(null)} className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90">
              <Home size={20} />
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 flex-shrink-0" />
                <button 
                  onClick={() => navigateTo(b.id, b.name)}
                  className={`flex-shrink-0 px-6 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 ${
                    i === breadcrumb.length - 1 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-500'
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-[1.75rem] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                {viewMode === 'category' ? <LayoutGrid size={32} /> : <ShoppingBag size={32} />}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">
                  {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Katalog'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  {isLoading ? 'Yuklanmoqda...' : `${viewMode === 'category' ? filteredCategories.length : filteredProducts.length} ta element`}
                </p>
              </div>
            </div>

            <div className="relative group flex-1 max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Qidirish..."
                className="w-full pl-14 pr-6 py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-white/40 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30 rounded-[3rem] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {viewMode === 'category' ? (
              filteredCategories.map(cat => (
                <CategoryCard key={cat.id} category={cat} onSelect={(id) => navigateTo(id, cat.nameUz)} onEdit={(c) => { setEditingCategory(c); setIsCategoryModalOpen(true); }} onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'category' })} />
              ))
            ) : (
              filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }} onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'product' })} />
              ))
            )}
          </div>
        )}

        {(viewMode === 'category' ? filteredCategories.length === 0 : filteredProducts.length === 0) && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/30 dark:bg-slate-900/30 border-2 border-dashed border-slate-200/50 dark:border-slate-800/50 rounded-[4rem]">
            <Package size={80} strokeWidth={1} className="text-slate-300 dark:text-slate-800 mb-8" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Hech narsa topilmadi</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Yangi ma'lumot qo'shish uchun + tugmasini bosing</p>
          </div>
        )}
      </div>

      {/* Fixed Action Button (FAB) */}
      <button 
        onClick={() => {
          if (viewMode === 'category') { setEditingCategory(null); setIsCategoryModalOpen(true); }
          else { setEditingProduct(null); setIsProductModalOpen(true); }
        }}
        className="fixed bottom-10 right-8 w-20 h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.25rem] flex items-center justify-center shadow-2xl active:scale-90 active:rotate-12 transition-all z-[150] border-4 border-white dark:border-slate-950 group"
      >
        <Plus size={36} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Back Button */}
      {breadcrumb.length > 0 && (
        <button 
          onClick={() => {
            const parent = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : { id: null, name: 'Asosiy' };
            navigateTo(parent.id, parent.name);
          }}
          className="fixed bottom-10 left-8 w-16 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-900 dark:text-white rounded-[1.75rem] flex items-center justify-center shadow-xl border border-slate-200/50 dark:border-slate-800/50 active:scale-90 z-[150]"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
      )}

      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSubmit={handleCategorySubmit} initialData={editingCategory} parentId={currentParentId} />
      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSubmit={handleProductSubmit} initialData={editingProduct} categoryId={currentParentId || ''} />
      <ConfirmModal isOpen={confirmState.isOpen} title="O'chirishni tasdiqlang" message={`Ushbu ${confirmState.type === 'category' ? 'bo\'lim' : 'mahsulot'} va unga tegishli barcha ma'lumotlar o'chiriladi.`} onConfirm={handleDeleteConfirmed} onCancel={() => setConfirmState({ isOpen: false, id: null, type: 'category' })} />
      <Notification {...notification} onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))} />
    </Layout>
  );
};

export default App;
