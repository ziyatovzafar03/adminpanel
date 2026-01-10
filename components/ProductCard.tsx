
import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, Trash2, ShoppingBag, Package, Layers, Sparkles, 
  Globe, Zap, User, Phone, BadgeCheck, ShieldCheck, Clock, Info 
} from 'lucide-react';
import { Product, Seller } from '../types';
import { apiService } from '../api';
import { SellerModal } from './SellerModal';

interface ProductCardProps {
  product: Product;
  currentUserChatId?: number;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, currentUserChatId, onEdit, onDelete }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [langIdx, setLangIdx] = useState(0); // 0: Uz, 1: Cyr, 2: Ru, 3: En
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isSellerLoading, setIsSellerLoading] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const variants = product.types || [];
  const currentVariant = variants[activeIdx];
  
  const langs = [
    { name: product.nameUz, desc: product.descriptionUz, code: 'Lot' },
    { name: product.nameUzCyrillic, desc: product.descriptionUzCyrillic, code: 'Kir' },
    { name: product.nameRu, desc: product.descriptionRu, code: 'Ru' },
    { name: product.nameEn, desc: product.descriptionEn, code: 'En' }
  ];

  const currentLang = langs[langIdx];

  // Chegirma vaqtini tekshirish mantig'i
  const isDiscountActive = () => {
    if (product.discountType === 'NONE' || !product.discountValue) return false;
    
    const now = new Date();
    
    if (product.discountStartAt) {
      const start = new Date(product.discountStartAt);
      if (now < start) return false;
    }
    
    if (product.discountEndAt) {
      const end = new Date(product.discountEndAt);
      if (now > end) return false;
    }
    
    return true;
  };

  const hasDiscount = isDiscountActive();

  useEffect(() => {
    const fetchSellerInfo = async () => {
      setIsSellerLoading(true);
      try {
        const response = await apiService.getSellerByProductId(product.id);
        if (response.success) {
          setSeller(response.data);
        }
      } catch (err) {
        console.error("Seller info error:", err);
      } finally {
        setIsSellerLoading(false);
      }
    };
    fetchSellerInfo();
  }, [product.id]);

  const calculateDiscountPrice = (basePrice: number) => {
    if (!hasDiscount || !product.discountValue) return basePrice;
    if (product.discountType === 'PERCENT') return basePrice - (basePrice * product.discountValue / 100);
    if (product.discountType === 'FIXED') return Math.max(basePrice - product.discountValue, 0);
    return basePrice;
  };

  const getDiscountLabel = () => {
    if (product.discountType === 'PERCENT') return `-${product.discountValue}%`;
    if (product.discountType === 'FIXED') return `-${product.discountValue?.toLocaleString()}`;
    return '';
  };

  const getSellerBadge = () => {
    if (!seller) return null;
    switch (seller.status) {
      case 'YEARLY_PAID':
        return { icon: <ShieldCheck size={12} />, label: 'VIP Seller', color: 'text-amber-500 bg-amber-500/10' };
      case 'MONTHLY_PAID':
        return { icon: <BadgeCheck size={12} />, label: 'Pro Seller', color: 'text-indigo-500 bg-indigo-500/10' };
      case 'EXPIRED':
        return { icon: <Clock size={12} />, label: 'Expired', color: 'text-rose-500 bg-rose-500/10' };
      default:
        return { icon: <User size={12} />, label: 'Trial', color: 'text-slate-500 bg-slate-500/10' };
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / (width * 0.82)); 
      if (newIndex !== activeIdx && newIndex >= 0 && newIndex < variants.length) {
        setActiveIdx(newIndex);
      }
    }
  };

  const badge = getSellerBadge();

  return (
    <>
      <div className={`group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[3rem] border overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 ${hasDiscount ? 'border-emerald-500/30 dark:border-emerald-500/20 ring-1 ring-emerald-500/5' : 'border-slate-200/50 dark:border-slate-800/50'}`}>
        
        {/* Media Section */}
        <div className="relative pt-4 px-4">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-2"
          >
            {variants.length > 0 ? variants.map((v, i) => (
              <div 
                key={v.id || i} 
                className="flex-none snap-center first:ml-0 last:mr-12"
                style={{ width: variants.length > 1 ? '82%' : '100%' }}
              >
                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                  <img 
                    src={v.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
              </div>
            )) : (
              <div className="w-full aspect-[4/5] rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-300">
                 <Package size={64} strokeWidth={1} />
                 <span className="text-[10px] font-black uppercase mt-2 tracking-widest">Rasm yo'q</span>
              </div>
            )}
          </div>

          {/* Floating Badges */}
          <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); setLangIdx((langIdx + 1) % 4); }}
              className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-400 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <Globe size={12} /> {currentLang.code}
            </button>
            
            {hasDiscount && (
              <div className="flex flex-col gap-1.5">
                <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 flex items-center gap-2 animate-pulse">
                  <Zap size={12} fill="currentColor" />
                  {getDiscountLabel()}
                </div>
              </div>
            )}
          </div>

          {/* Seller Info Mini Badge */}
          {seller && (
            <div className="absolute top-8 right-8 z-20">
               <div className={`px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg ${badge?.color || 'bg-white/80 dark:bg-slate-900/80 text-slate-500'}`}>
                  {badge?.icon}
                  <span className="text-[9px] font-black uppercase tracking-widest">{badge?.label}</span>
               </div>
            </div>
          )}
        </div>

        {/* Info Content */}
        <div className="p-8 pt-4">
          {/* Seller Bar */}
          <div 
            onClick={() => seller && setIsSellerModalOpen(true)}
            className="flex items-center justify-between mb-5 px-1 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all active:scale-[0.98] group/seller"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner group-hover/seller:border-indigo-500 transition-colors">
                 {seller ? (
                   <span className="text-xs font-black uppercase">{seller.firstname[0]}{seller.lastname[0]}</span>
                 ) : (
                   <User size={16} />
                 )}
              </div>
              <div>
                 {isSellerLoading ? (
                   <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1"></div>
                 ) : seller ? (
                   <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none group-hover/seller:text-indigo-500 transition-colors">
                     {seller.firstname} {seller.lastname}
                   </h4>
                 ) : (
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-tight leading-none italic">Sotuvchi aniqlanmadi</h4>
                 )}
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                   <Phone size={8} /> {seller?.phone || 'Raqamsiz'}
                 </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center group-hover/seller:bg-indigo-600 group-hover/seller:text-white transition-all">
              <Info size={14} />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                 <Package size={14} className="text-indigo-600 dark:text-indigo-400" />
                 <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase">{currentVariant?.stock || 0} ta qoldi</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                 <Layers size={14} className="text-purple-600 dark:text-purple-400" />
                 <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase">{variants.length} variant</span>
               </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-1 uppercase tracking-tighter mb-1">
              {currentLang.name || product.nameUz}
            </h3>
            
            <div className="min-h-[110px] flex flex-col justify-between">
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                  {currentVariant ? (
                    langIdx === 0 ? currentVariant.nameUz : 
                    langIdx === 1 ? currentVariant.nameUzCyrillic : 
                    langIdx === 2 ? currentVariant.nameRu : currentVariant.nameEn
                  ) || currentVariant?.nameUz : 'Tanlanmagan'}
                </p>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                  "{currentLang.desc || 'Tavsif mavjud emas'}"
                </p>
              </div>

              <div className="flex items-end justify-between mt-6">
                <div className="flex flex-col">
                  {hasDiscount && currentVariant && (
                     <span className="text-[11px] font-black text-slate-400 line-through tracking-tight mb-1">
                       {currentVariant.price.toLocaleString()} so'm
                     </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black tracking-tighter leading-none ${hasDiscount ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {currentVariant ? calculateDiscountPrice(currentVariant.price).toLocaleString() : '0'}
                    </span>
                    <span className={`text-[10px] uppercase font-black tracking-widest ${hasDiscount ? 'text-emerald-500/70' : 'text-slate-400'}`}>so'm</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(product)}
                    className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={() => onDelete(product.id)}
                    className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-90 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SellerModal 
        isOpen={isSellerModalOpen} 
        onClose={() => setIsSellerModalOpen(false)} 
        seller={seller} 
        currentUserChatId={currentUserChatId}
      />
    </>
  );
};
