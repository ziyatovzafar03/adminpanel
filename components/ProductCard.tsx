
import React, { useState, useRef } from 'react';
import { Edit3, Trash2, ShoppingBag, Package, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const variants = product.types || [];
  const currentVariant = variants[activeIdx];
  
  const calculateDiscountPrice = (basePrice: number) => {
    if (product.discountType === 'NONE' || !product.discountValue) return basePrice;
    if (product.discountType === 'PERCENT') return basePrice - (basePrice * product.discountValue / 100);
    if (product.discountType === 'FIXED') return Math.max(basePrice - product.discountValue, 0);
    return basePrice;
  };

  const hasDiscount = product.discountType !== 'NONE' && product.discountValue;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      // Precise calculation for peek carousel (85% width)
      const newIndex = Math.round(scrollLeft / (width * 0.82)); 
      if (newIndex !== activeIdx && newIndex >= 0 && newIndex < variants.length) {
        setActiveIdx(newIndex);
      }
    }
  };

  return (
    <div className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10">
      
      {/* Dynamic Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      {/* Media Section with Peek Carousel */}
      <div className="relative pt-4 px-4">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {variants.length > 0 ? variants.map((v, i) => (
            <div 
              key={v.id || i} 
              className="flex-none snap-center first:ml-0 last:mr-12"
              style={{ width: variants.length > 1 ? '82%' : '100%' }}
            >
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner group/img">
                <img 
                  src={v.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'} 
                  alt={v.nameUz} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
              </div>
            </div>
          )) : (
            <div className="w-full">
               <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-4 text-slate-300">
                  <Package size={64} strokeWidth={1} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rasm mavjud emas</span>
               </div>
            </div>
          )}
        </div>

        {/* Floating Badges */}
        <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/20 shadow-xl flex items-center gap-2 ${
            product.status === 'OPEN' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-white ${product.status === 'OPEN' ? 'animate-pulse' : ''}`}></div>
            {product.status}
          </div>
          {hasDiscount && (
            <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600/80 text-white backdrop-blur-xl border border-white/20 shadow-xl flex items-center gap-2 animate-bounce">
              <Sparkles size={12} />
              {product.discountType === 'PERCENT' ? `${product.discountValue}% OFF` : `CHEGIRMA`}
            </div>
          )}
        </div>

        {/* Modern Progress Line */}
        {variants.length > 1 && (
          <div className="absolute bottom-8 left-12 right-12 h-1.5 bg-white/20 backdrop-blur-md rounded-full overflow-hidden z-20">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ width: `${((activeIdx + 1) / variants.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Content Section */}
      <div className="p-8 pt-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 overflow-hidden">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
               <Package size={14} className="text-indigo-600 dark:text-indigo-400" />
               <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-tight">
                 {currentVariant?.stock || 0} ta qoldi
               </span>
             </div>
             {variants.length > 1 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <Layers size={14} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-tight">
                    {activeIdx + 1} / {variants.length} variant
                  </span>
                </div>
             )}
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-1 uppercase tracking-tighter mb-1">
            {product.nameUz}
          </h3>
          
          {/* Animated Variant Name & Price Section */}
          <div className="min-h-[90px] flex flex-col justify-between">
            <div key={`name-${activeIdx}`} className="animate-in fade-in slide-in-from-left-4 duration-500">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                {currentVariant?.nameUz || 'Standart Variant'}
              </p>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                "{product.descriptionUz}"
              </p>
            </div>

            <div key={`price-${activeIdx}`} className="flex items-end justify-between mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col">
                {hasDiscount && currentVariant && (
                  <span className="text-xs font-bold text-slate-400 line-through tracking-tighter decoration-rose-500/50 mb-1">
                    {currentVariant.price.toLocaleString()} so'm
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {currentVariant ? calculateDiscountPrice(currentVariant.price).toLocaleString() : '0'}
                  </span>
                  <span className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">so'm</span>
                </div>
              </div>
              
              <button className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/30 active:scale-90 transition-all hover:rotate-6">
                <ShoppingBag size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-6 gap-3">
          <button 
            onClick={() => onEdit(product)}
            className="col-span-5 py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
          >
            <Edit3 size={16} />
            Tahrirlash
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="col-span-1 py-5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-[1.75rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-100 dark:border-rose-900/30"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
