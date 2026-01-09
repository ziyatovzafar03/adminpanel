
import React, { useEffect, useState } from 'react';
import { X, Save, Sparkles, Loader2, Globe } from 'lucide-react';
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
        contents: `Kategoriya nomini: "${formData.nameUz}" quyidagi JSON formatda qaytar: {"cyr": "...", "ru": "...", "en": "..."}`,
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

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {initialData ? 'Tahrirlash' : 'Yangi kategoriya'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['uz', 'uzCyr', 'ru', 'en'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                >
                  {tab === 'uzCyr' ? 'Cyr' : tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <label className={labelClass}>
                {activeTab === 'uz' && 'Uzbekcha (Lotin)'}
                {activeTab === 'uzCyr' && 'Uzbekcha (Kirill)'}
                {activeTab === 'ru' && 'Ruscha'}
                {activeTab === 'en' && 'Inglizcha'}
              </label>
              
              <div className="flex gap-2">
                {activeTab === 'uz' && <input required className={inputClass} value={formData.nameUz} onChange={e => setFormData({...formData, nameUz: e.target.value})} placeholder="Masalan: Giyim-kechak" />}
                {activeTab === 'uzCyr' && <input className={inputClass} value={formData.nameUzCyrillic} onChange={e => setFormData({...formData, nameUzCyrillic: e.target.value})} placeholder="Кийим-кечак" />}
                {activeTab === 'ru' && <input className={inputClass} value={formData.nameRu} onChange={e => setFormData({...formData, nameRu: e.target.value})} placeholder="Одежда" />}
                {activeTab === 'en' && <input className={inputClass} value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} placeholder="Clothing" />}
                
                {activeTab === 'uz' && (
                  <button
                    type="button"
                    onClick={handleAiFill}
                    disabled={isAiLoading || !formData.nameUz}
                    className="px-4 rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center"
                  >
                    {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tartib raqami</label>
                <input type="number" className={inputClass} value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className={labelClass}>Holati</label>
                <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})}>
                  <option value="OPEN">Ochiq</option>
                  <option value="CLOSED">Yopiq</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              Bekor qilish
            </button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
              <Save size={18} />
              {initialData ? 'Saqlash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};