
import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Trash2, ShoppingBag, Package, Layers, ChevronRight } from 'lucide-react';
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
      const newIndex = Math.round(scrollLeft / (width * 0.85)); // 0.85 is the peek width ratio
      if (newIndex !== activeIdx && newIndex >= 0 && newIndex < variants.length) {
        setActiveIdx(newIndex);
      }
    }
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm hover:shadow-premium transition-all duration-500">
      {/* Scrollable Peek Carousel */}
      <div className="relative">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar py-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {variants.length > 0 ? variants.map((v, i) => (
            <div 
              key={v.id || i} 
              className="flex-none snap-center pl-4 first:pl-4 last:pr-12"
              style={{ width: variants.length > 1 ? '85%' : '100%' }}
            >
              <div className="aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
                <img 
                  src={v.imageUrl || 'https://via.placeholder.com/400?text=Rasm+Mavjud+Emas'} 
                  alt={v.nameUz} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )) : (
            <div className="w-full px-4">
               <div className="aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Package size={48} className="text-slate-300" />
               </div>
            </div>
          )}
        </div>

        {/* Top Badges */}
        <div className="absolute top-6 left-8 flex flex-col gap-2 z-10">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/20 ${
            product.status === 'OPEN' ? 'bg-emerald-500/80 text-white' : 
            product.status === 'CLOSED' ? 'bg-amber-500/80 text-white' : 'bg-rose-500/80 text-white'
          }`}>
            {product.status}
          </span>
          {hasDiscount && (
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600/80 text-white backdrop-blur-md border border-white/20 shadow-sm animate-pulse">
              {product.discountType === 'PERCENT' ? `-${product.discountValue}%` : `-${product.discountValue?.toLocaleString()} so'm`}
            </span>
          )}
        </div>

        {/* Variant Indicators / Dots */}
        {variants.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2 mb-2">
            {variants.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 pt-2">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
               <Package size={12} className="text-slate-400" />
               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">{currentVariant?.stock || 0} mavjud</span>
             </div>
             {variants.length > 1 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <Layers size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase">{activeIdx + 1} / {variants.length} tur</span>
                </div>
             )}
          </div>
          
          <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1 uppercase tracking-tight mb-1">
            {product.nameUz}
          </h3>
          <div className="flex items-center gap-2 mb-3">
             <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
               {currentVariant?.nameUz || 'Asosiy variant'}
             </p>
             {variants.length > 1 && <ChevronRight size={12} className="text-slate-300" />}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {product.descriptionUz}
          </p>
        </div>

        <div className="flex items-end justify-between mb-6">
          <div className="flex flex-col">
            {hasDiscount && currentVariant && (
              <span className="text-xs font-bold text-slate-400 line-through tracking-tighter decoration-rose-500/50 mb-0.5">
                {currentVariant.price.toLocaleString()} so'm
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {currentVariant ? calculateDiscountPrice(currentVariant.price).toLocaleString() : '0'}
              </span>
              <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest">so'm</span>
            </div>
          </div>
          <button className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <ShoppingBag size={20} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <button 
            onClick={() => onEdit(product)}
            className="col-span-4 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-700/50"
          >
            <Edit3 size={14} />
            Tahrirlash
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="col-span-1 py-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-100 dark:border-rose-900/30"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
