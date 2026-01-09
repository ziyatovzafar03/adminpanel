
import React from 'react';
import { ChevronRight, Edit3, Trash2, Globe, ArrowRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onSelect: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelect, onEdit, onDelete }) => {
  return (
    <div 
      className="category-card group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-glass hover:shadow-premium hover:border-indigo-500/30 dark:hover:border-indigo-500/20 cursor-pointer overflow-hidden"
      onClick={() => onSelect(category.id)}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-[4rem] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
      
      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
              #{category.orderIndex}
            </span>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
              category.status === 'OPEN' 
              ? 'text-emerald-600 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/30' 
              : 'text-rose-600 bg-rose-50/50 dark:text-rose-400 dark:bg-rose-950/30'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${category.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              {category.status}
            </div>
          </div>
          <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {category.nameUz}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-8 relative z-10">
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/30">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-400 shadow-sm">
            <Globe size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ruscha</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{category.nameRu || '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/30">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-400 shadow-sm">
            <Globe size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Inglizcha</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{category.nameEn || '—'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform uppercase tracking-widest">
          Ochish
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};