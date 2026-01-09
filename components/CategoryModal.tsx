
import React, { useEffect, useState } from 'react';
import { X, Save, Sparkles, Loader2, Globe, Hash, Activity, ChevronDown } from 'lucide-react';
import { Category, Status } from '../types';
import { GoogleGenAI } from "@google/genai";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Category | null;
  parentId: string | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSubmit, initialData, parentId }) => {
  const [activeTab, setActiveTab] = useState<'uz' | 'uzCyr' | 'ru' | 'en'>('uz');
  const [formData, setFormData] = useState({
    nameUz: '',
    nameUzCyrillic: '',
    nameRu: '',
    nameEn: '',
    orderIndex: 0,
    status: 'OPEN' as Status,
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const handleAiFill = async () => {
    if (!formData.nameUz) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate and transliterate category name: "${formData.nameUz}". Return only JSON: {"cyr": "...", "ru": "...", "en": "..."}`,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        nameUzCyrillic: result.cyr || prev.nameUzCyrillic,
        nameRu: result.ru || prev.nameRu,
        nameEn: result.en || prev.nameEn
      }));
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, parentId: initialData ? initialData.parentId : parentId });
  };

  const inputClass = "w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold placeholder:font-normal placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg bg-slate-50 dark:bg-slate-950 sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-premium-modal overflow-hidden animate-in slide-in-from-bottom duration-300 border-t sm:border border-white/10 dark:border-slate-800/50 max-h-[90vh] overflow-y-auto">
        {/* Handle for mobile */}
        <div className="sm:hidden flex justify-center py-4">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
        </div>

        <div className="p-8 pb-4 border-b border-slate-200/50 dark:border-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {initialData ? 'Tahrirlash' : 'Yaratish'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kategoriya ma'lumotlari</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-200/50 dark:border-slate-800/50 active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Custom Tabs */}
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl">
            {(['uz', 'uzCyr', 'ru', 'en'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  activeTab === tab 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'uz' ? 'Lot' : tab === 'uzCyr' ? 'Kir' : tab}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className={labelClass}>Kategoriya Nomi</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Globe size={18} />
                </div>
                {activeTab === 'uz' && <input required className={inputClass} value={formData.nameUz} onChange={e => setFormData({...formData, nameUz: e.target.value})} placeholder="Masalan: Uy jihozlari" />}
                {activeTab === 'uzCyr' && <input className={inputClass} value={formData.nameUzCyrillic} onChange={e => setFormData({...formData, nameUzCyrillic: e.target.value})} placeholder="Уй жиhozlari" />}
                {activeTab === 'ru' && <input className={inputClass} value={formData.nameRu} onChange={e => setFormData({...formData, nameRu: e.target.value})} placeholder="Мебель" />}
                {activeTab === 'en' && <input className={inputClass} value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} placeholder="Furniture" />}
                
                {activeTab === 'uz' && (
                  <button
                    type="button"
                    onClick={handleAiFill}
                    disabled={isAiLoading || !formData.nameUz}
                    className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-all flex items-center gap-2 group/ai"
                  >
                    {isAiLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles className="group-hover/ai:animate-pulse" size={14} />}
                    <span className="text-[10px] font-black tracking-widest">AI</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tartib</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" className={inputClass} value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                  <Activity size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select 
                    className={`${inputClass} appearance-none`} 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as Status})}
                  >
                    <option value="OPEN">Ochiq</option>
                    <option value="CLOSED">Yopiq</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              type="submit" 
              className="w-full order-1 sm:order-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {initialData ? 'Yangilash' : 'Yaratish'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full order-2 sm:order-1 py-4 bg-white dark:bg-slate-900 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 transition-all active:scale-95"
            >
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};