
import React, { useEffect, useState } from 'react';
import { X, Save, Info } from 'lucide-react';
import { Category, CategoryCreateRequest, CategoryEditRequest, Status } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Category | null;
  parentId: string | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSubmit, initialData, parentId }) => {
  const [formData, setFormData] = useState({
    nameUz: '',
    nameUzCyrillic: '',
    nameRu: '',
    nameEn: '',
    orderIndex: 0,
    status: 'OPEN' as Status,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nameUz: initialData.nameUz || '',
        nameUzCyrillic: initialData.nameUzCyrillic || '',
        nameRu: initialData.nameRu || '',
        nameEn: initialData.nameEn || '',
        orderIndex: initialData.orderIndex || 0,
        status: initialData.status || 'OPEN',
      });
    } else {
      setFormData({
        nameUz: '',
        nameUzCyrillic: '',
        nameRu: '',
        nameEn: '',
        orderIndex: 0,
        status: 'OPEN',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parentId: initialData ? initialData.parentId : parentId,
    };
    onSubmit(payload);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 px-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl glass rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {initialData ? 'Edit Category' : 'Create Category'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className={labelClass}>Name (Uzbek)</label>
              <input 
                required
                className={inputClass}
                value={formData.nameUz}
                onChange={(e) => setFormData({...formData, nameUz: e.target.value})}
                placeholder="Masalan: Dasturlash"
              />
            </div>
            <div>
              <label className={labelClass}>Name (Uzbek Cyrillic)</label>
              <input 
                className={inputClass}
                value={formData.nameUzCyrillic}
                onChange={(e) => setFormData({...formData, nameUzCyrillic: e.target.value})}
                placeholder="Масалан: Дастурлаш"
              />
            </div>
            <div>
              <label className={labelClass}>Name (Russian)</label>
              <input 
                className={inputClass}
                value={formData.nameRu}
                onChange={(e) => setFormData({...formData, nameRu: e.target.value})}
                placeholder="Например: Программирование"
              />
            </div>
            <div>
              <label className={labelClass}>Name (English)</label>
              <input 
                className={inputClass}
                value={formData.nameEn}
                onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                placeholder="Example: Programming"
              />
            </div>
            <div>
              <label className={labelClass}>Order Index</label>
              <input 
                type="number"
                className={inputClass}
                value={formData.orderIndex}
                onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as Status})}
              >
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 mb-6 flex gap-3">
             <Info className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
             <p className="text-sm text-indigo-700 dark:text-indigo-300">
               Categorizing correctly helps users find content faster. Parent ID will be set to <b>{parentId ? 'Child' : 'Root'}</b> level.
             </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Save size={18} />
              {initialData ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
