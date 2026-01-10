
import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, Home, Search, ShieldAlert, Package, LayoutGrid, ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';
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
  const [theme] = useState<'light' | 'dark'>('dark');
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
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (breadcrumbRef.current) breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
  }, [breadcrumb]);

  const showNotification = (message: string, type: NotificationType = 'success') => {
    setNotification({ isVisible: true, message, type });
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        // Barqaror routing mantiqi: Path segments yoki Query params
        const urlParams = new URLSearchParams(window.location.search);
        const queryChatId = urlParams.get('chat_id');
        
        // Pathdan chat_id ni olish (masalan: /7882316826)
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
        console.error("Auth error:", err);
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
          const isNew = type._isNew || !type.id || type.id.toString().startsWith('temp-');
          if (isNew) {
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
              productId: productId
            });
          } else if (type._isModified) {
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

  const handleLogout = () => {
    window.location.href = window.location.origin;
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-8 border-indigo-900/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-24 h-24 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-indigo-500">
            <Sparkles size={32} className="animate-pulse" />
          </div>
        </div>
        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  if (authStatus === 'unauthorized' || authStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-slate-900/50 backdrop-blur-xl rounded-[4rem] p-12 text-center shadow-2xl border border-white/5">
          <div className="w-24 h-24 mx-auto mb-10 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
            <ShieldAlert size={56} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Kirish rad etildi</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">Havola noto'g'ri yoki sizga ruxsat berilmagan. Iltimos, qayta urinib ko'ring.</p>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-white text-slate-950 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Qayta yuklash</button>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => c.nameUz.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => p.nameUz.toLowerCase().includes(searchQuery.toLowerCase()));
  const fullName = currentUser ? `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() : 'Admin';

  return (
    <Layout 
      theme={theme} 
      onLogout={handleLogout}
      currentUserName={fullName || 'Admin'}
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-32">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-10">
          <div ref={breadcrumbRef} className="flex items-center gap-4 overflow-x-auto hide-scrollbar py-4 -mx-4 px-4 scroll-smooth">
            <button onClick={() => navigateTo(null)} className="flex-shrink-0 w-14 h-14 rounded-[1.75rem] bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all shadow-xl active:scale-90">
              <Home size={22} />
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={16} className="text-slate-800 flex-shrink-0" />
                <button 
                  onClick={() => navigateTo(b.id, b.name)}
                  className={`flex-shrink-0 px-8 py-4 rounded-[1.75rem] border transition-all text-[11px] font-black uppercase tracking-widest shadow-2xl active:scale-95 ${
                    i === breadcrumb.length - 1 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20' 
                    : 'bg-slate-900 border-white/5 text-slate-500'
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-[2.25rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-8 ring-indigo-500/5">
                {viewMode === 'category' ? <LayoutGrid size={36} /> : <ShoppingBag size={36} />}
              </div>
              <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                  {breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'Katalog'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-indigo-500/10 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      {isLoading ? 'Yangilanmoqda' : `${viewMode === 'category' ? filteredCategories.length : filteredProducts.length} TA ELEMENT`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group flex-1 max-w-lg">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={24} />
              <input 
                type="text"
                placeholder="Nomi bo'yicha qidirish..."
                className="w-full pl-16 pr-8 py-6 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-base font-bold shadow-2xl text-white placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 bg-slate-900/30 border border-white/5 rounded-[4rem] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {viewMode === 'category' ? (
              filteredCategories.map(cat => (
                <CategoryCard key={cat.id} category={cat} onSelect={(id) => navigateTo(id, cat.nameUz)} onEdit={(c) => { setEditingCategory(c); setIsCategoryModalOpen(true); }} onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'category' })} />
              ))
            ) : (
              filteredProducts.map(prod => (
                <ProductCard 
                  key={prod.id} 
                  product={prod} 
                  currentUserChatId={currentUser?.chatId}
                  onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }} 
                  onDelete={(id) => setConfirmState({ isOpen: true, id, type: 'product' })} 
                />
              ))
            )}
          </div>
        )}

        {(viewMode === 'category' ? filteredCategories.length === 0 : filteredProducts.length === 0) && !isLoading && (
          <div className="flex flex-col items-center justify-center py-40 text-center bg-slate-900/20 border-4 border-dashed border-white/5 rounded-[5rem] backdrop-blur-sm">
            <Package size={96} strokeWidth={1} className="text-slate-800 mb-10" />
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Ma'lumot topilmadi</h3>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Yangi ma'lumot qo'shish uchun + tugmasini bosing</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          if (viewMode === 'category') { setEditingCategory(null); setIsCategoryModalOpen(true); }
          else { setEditingProduct(null); setIsProductModalOpen(true); }
        }}
        className="fixed bottom-12 right-10 w-24 h-24 bg-white text-slate-950 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)] active:scale-90 active:rotate-12 transition-all z-[150] border-[6px] border-[#020617] group overflow-hidden"
      >
        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        <Plus size={44} strokeWidth={3} className="relative z-10 group-hover:text-white transition-colors duration-300" />
      </button>

      {breadcrumb.length > 0 && (
        <button 
          onClick={() => {
            const parent = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : { id: null, name: 'Asosiy' };
            navigateTo(parent.id, parent.name);
          }}
          className="fixed bottom-12 left-10 w-20 h-20 bg-slate-900/80 backdrop-blur-2xl text-white rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/5 active:scale-90 z-[150]"
        >
          <ArrowLeft size={32} strokeWidth={2} />
        </button>
      )}

      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSubmit={handleCategorySubmit} initialData={editingCategory} parentId={currentParentId} />
      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSubmit={handleProductSubmit} initialData={editingProduct} categoryId={currentParentId || ''} />
      <ConfirmModal isOpen={confirmState.isOpen} title="O'chirishni tasdiqlang" message={`Ushbu ${confirmState.type === 'category' ? 'bo\'lim' : 'mahsulot'} va unga tegishli barcha ma'lumotlar butunlay o'chiriladi.`} onConfirm={handleDeleteConfirmed} onCancel={() => setConfirmState({ isOpen: false, id: null, type: 'category' })} />
      <Notification {...notification} onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))} />
    </Layout>
  );
};

export default App;
