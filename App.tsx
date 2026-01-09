
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

// Fix: Correctly define and export the App component to resolve FC type error and default export error.
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
        const createRes = await apiService.createProduct({ ...data, types: [] });
        productId = createRes.data.id;
      }

      if (productId && data.types && data.types.length > 0) {
        for (const type of data.types) {
          const isNew = type._isNew || type.id?.toString().startsWith('temp-');
          
          if (isNew) {
            await apiService.addProductType({
              imgSize: type.imgSize || 0, 
              imgName: type.imgName || "image.png", 
              imageUrl: type.imageUrl,
              nameUz: type.nameUz, 
              nameUzCyrillic: type.nameUzCyrillic || type.nameUz, 
              nameEn: type.nameEn || type.nameUz, 
              nameRu: type.nameRu || type.nameUz,
              price: type.price, 
              stock: type.stock, 
              productId: productId
            });
          } else if (type._isModified) {
            await apiService.updateProductType(type.id, {
              imgSize: type.imgSize || 0, 
              imgName: type.imgName || "image.png", 
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
      
      showNotification(editingProduct ? "Mahsulot yangilandi" : "Yangi mahsulot yaratildi");
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Kirish taqiqlangan</h2>
          <p className="text-slate-500 dark:text-slate-400">Sizda ushbu dashboardga kirish huquqi yo'q yoki foydalanuvchi topilmadi.</p>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => 
    c.nameUz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.nameUz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout 
      theme={theme} 
      toggleTheme={toggleTheme} 
      onLogout={() => window.location.reload()}
      currentUserFirstName={currentUser?.firstname}
    >
      <div className="space-y-8 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 overflow-hidden">
            <button 
              onClick={() => navigateTo(null)}
              className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <Home size={20} />
            </button>
            <div ref={breadcrumbRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap pr-4">
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b.id}>
                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                  <button 
                    onClick={() => navigateTo(b.id, b.name)}
                    className={`text-sm font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                      i === breadcrumb.length - 1 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                      : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {b.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (viewMode === 'category') {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                } else {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }
              }}
              className="flex-1 sm:flex-none px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus size={18} strokeWidth={3} />
              Qo'shish
            </button>
          </div>
        </div>

        <div className="relative group max-w-2xl">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Qidirish..."
            className="w-full pl-14 pr-6 py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-semibold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {viewMode === 'category' ? (
              <>
                {filteredCategories.length > 0 ? filteredCategories.map(category => (
                  <CategoryCard 
                    key={category.id} 
                    category={category}
                    onSelect={(id) => navigateTo(id, category.nameUz)}
                    onEdit={(cat) => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                    onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'category' })}
                  />
                )) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <LayoutGrid size={64} strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-widest">Kategoriyalar topilmadi</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    onEdit={(prod) => { setEditingProduct(prod); setIsProductModalOpen(true); }}
                    onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'product' })}
                  />
                )) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <ShoppingBag size={64} strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-widest">Mahsulotlar topilmadi</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        onSubmit={handleCategorySubmit}
        initialData={editingCategory}
        parentId={currentParentId}
      />

      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
        onSubmit={handleProductSubmit}
        initialData={editingProduct}
        categoryId={currentParentId || ''}
      />

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title="O'chirishni tasdiqlaysizmi?"
        message="Ushbu ma'lumotni o'chirib bo'lmaydi. Davom etishni xohlaysizmi?"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmState({ isOpen: false, id: null, type: 'category' })}
      />

      <Notification 
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </Layout>
  );
};

export default App;
