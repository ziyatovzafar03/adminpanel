
import React from 'react';
import { ChevronRight, Edit3, Trash2, Folder, Globe } from 'lucide-react';
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
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/30 cursor-pointer category-card-gradient overflow-hidden"
      onClick={() => onSelect(category.id)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {category.nameUz}
          </h3>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${category.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
            <span className={`w-1 h-1 rounded-full ${category.status === 'OPEN' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {category.status}
          </div>
        </div>
        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">
          #{category.orderIndex}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Globe size={14} className="text-indigo-500/50" />
          <span className="font-medium truncate">RU: {category.nameRu || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Globe size={14} className="text-indigo-500/50" />
          <span className="font-medium truncate">EN: {category.nameEn || '—'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
            title="Tahrirlash"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-all"
            title="O'chirish"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
          Batafsil
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};