
import React, { useEffect, useState } from 'react';
import { X, Save, Info, Sparkles, Loader2 } from 'lucide-react';
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
    if (!formData.nameUz) {
      alert("Iltimos, avval o'zbekcha nomni kiriting!");
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Quyidagi o'zbekcha shop kategoriyasi nomini boshqa tillarga tarjima qilib JSON formatda qaytar: "${formData.nameUz}". 
        Format: {"cyrillic": "...", "ru": "...", "en": "..."}`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        nameUzCyrillic: result.cyrillic || prev.nameUzCyrillic,
        nameRu: result.ru || prev.nameRu,
        nameEn: result.en || prev.nameEn
      }));
    } catch (error) {
      console.error("AI Fill error:", error);
      alert("AI bilan to'ldirishda xatolik yuz berdi.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parentId: initialData ? initialData.parentId : parentId,
    };
    onSubmit(payload);
  };

  const inputClass = "w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-base font-medium";
  const labelClass = "block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 px-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border-t-2 border-white/20 dark:border-white/5">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-1">
              {initialData ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim yaratish'}
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Shop Kategoriya Boshqaruvi</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all shadow-inner">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="relative">
              <label className={labelClass}>Nom (O'zbekcha)</label>
              <div className="flex gap-3">
                <input 
                  required
                  className={inputClass}
                  value={formData.nameUz}
                  onChange={(e) => setFormData({...formData, nameUz: e.target.value})}
                  placeholder="Masalan: Maishiy texnika"
                />
                <button
                  type="button"
                  onClick={handleAiFill}
                  disabled={isAiLoading}
                  className="px-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black hover:shadow-lg hover:shadow-indigo-600/30 transition-all active:scale-90 disabled:opacity-50 flex items-center justify-center min-w-[64px]"
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Kirillcha (O'zbekcha)</label>
                <input 
                  className={inputClass}
                  value={formData.nameUzCyrillic}
                  onChange={(e) => setFormData({...formData, nameUzCyrillic: e.target.value})}
                  placeholder="Маиший техника"
                />
              </div>
              <div>
                <label className={labelClass}>Ruscha (Russian)</label>
                <input 
                  className={inputClass}
                  value={formData.nameRu}
                  onChange={(e) => setFormData({...formData, nameRu: e.target.value})}
                  placeholder="Бытовая техника"
                />
              </div>
              <div>
                <label className={labelClass}>Inglizcha (English)</label>
                <input 
                  className={inputClass}
                  value={formData.nameEn}
                  onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                  placeholder="Home Appliances"
                />
              </div>
              <div>
                <label className={labelClass}>Tartib (Index)</label>
                <input 
                  type="number"
                  className={inputClass}
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Holat (Status)</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, status: 'OPEN'})}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${formData.status === 'OPEN' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  Ochiq (Open)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, status: 'CLOSED'})}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${formData.status === 'CLOSED' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400'}`}
                >
                  Yopiq (Closed)
                </button>
              </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100/50 dark:border-indigo-800/30 flex gap-4 items-start">
               <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
                 <Info size={20} />
               </div>
               <p className="text-sm font-bold text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                 Kategoriya darajasi: <span className="underline decoration-indigo-400">{parentId ? 'Pastki bo\'lim' : 'Asosiy bo\'lim'}</span>. 
                 AI tugmasidan foydalanib tarjimalarni avtomatik to'ldirishingiz mumkin.
               </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-5 px-8 rounded-2xl bg-slate-100 dark:bg-slate-800 font-black uppercase tracking-widest text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Bekor qilish
            </button>
            <button 
              type="submit"
              className="flex-[2] py-5 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 border-t border-white/20"
            >
              <Save size={20} strokeWidth={3} />
              {initialData ? 'O\'zgarishlarni saqlash' : 'Bo\'limni yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
