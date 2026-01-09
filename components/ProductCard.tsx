
import React from 'react';
import { Edit3, Trash2, Tag, ShoppingBag, Layers, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const primaryType = product.types?.[0];
  
  const calculateDiscountPrice = (basePrice: number) => {
    if (product.discountType === 'NONE' || !product.discountValue) return basePrice;
    if (product.discountType === 'PERCENT') return basePrice - (basePrice * product.discountValue / 100);
    if (product.discountType === 'FIXED') return Math.max(basePrice - product.discountValue, 0);
    return basePrice;
  };

  const hasDiscount = product.discountType !== 'NONE' && product.discountValue;
  const totalStock = product.types?.reduce((acc, t) => acc + t.stock, 0) || 0;
  
  // Find min/max price for multi-variant products
  const prices = product.types?.map(t => t.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img 
          src={primaryType?.imageUrl || 'https://via.placeholder.com/400?text=No+Variants'} 
          alt={product.nameUz} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/20 ${
            product.status === 'OPEN' ? 'bg-emerald-500/80 text-white' : 
            product.status === 'CLOSED' ? 'bg-amber-500/80 text-white' : 'bg-rose-500/80 text-white'
          }`}>
            {product.status}
          </span>
          {hasDiscount && (
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600/80 text-white backdrop-blur-md border border-white/20 shadow-sm">
              {product.discountType === 'PERCENT' ? `-${product.discountValue}%` : `-${product.discountValue?.toLocaleString()} so'm`}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order: {product.orderIndex}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {totalStock}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variants: {product.types?.length || 0}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1 uppercase tracking-tight">{product.nameUz}</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 min-h-[2.5rem]">{product.descriptionUz}</p>
        </div>

        <div className="flex items-end justify-between mb-6">
          <div className="flex flex-col">
            {hasDiscount && prices.length > 0 && (
              <span className="text-xs font-bold text-slate-400 line-through tracking-tighter decoration-rose-500/50">
                {minPrice === maxPrice ? minPrice.toLocaleString() : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`} so'm
              </span>
            )}
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {prices.length > 0 ? (
                minPrice === maxPrice 
                  ? `${calculateDiscountPrice(minPrice).toLocaleString()}` 
                  : `${calculateDiscountPrice(minPrice).toLocaleString()} - ${calculateDiscountPrice(maxPrice).toLocaleString()}`
              ) : '0'} <span className="text-xs uppercase ml-1">so'm</span>
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400">
            <ShoppingBag size={18} />
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(product)}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Edit3 size={14} />
            Tahrirlash
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="w-14 py-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
