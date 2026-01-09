
import React from 'react';
import { ChevronRight, Edit3, Trash2, Folder, Layers } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onSelect: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelect, onEdit, onDelete }) => {
  return (
    <div className="group relative glass rounded-[2rem] p-5 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 hover:border-indigo-500/20 border-transparent border-2">
      <div className="flex items-start justify-between">
        <div 
          className="flex-1 cursor-pointer" 
          onClick={() => onSelect(category.id)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-2xl transition-colors duration-300 ${category.status === 'OPEN' ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <Folder size={22} strokeWidth={2.5} />
            </div>
            <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full ${category.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
              {category.status}
            </span>
          </div>
          
          <h3 className="font-black text-xl mb-1 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {category.nameUz}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-1 opacity-80">
            {category.nameEn || category.nameRu || 'Tavsif mavjud emas'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all shadow-sm"
            title="Tahrirlash"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
            className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all shadow-sm"
            title="O'chirish"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-4 border-t border-slate-100/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
          <Layers size={14} className="text-indigo-500/50" />
          Tartib: {category.orderIndex}
        </div>
        <button 
           onClick={() => onSelect(category.id)}
           className="flex items-center gap-1.5 text-sm font-black text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95 transition-transform"
        >
          Kichik bo'limlar
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
