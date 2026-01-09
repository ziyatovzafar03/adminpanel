
import React, { useEffect, useState } from 'react';
// Added Tag to lucide-react imports
import { X, Save, Sparkles, Loader2, Globe, Hash, Activity, Image as ImageIcon, DollarSign, Package, Calendar, Tag } from 'lucide-react';
// Fixed incorrect 'ProductStatus' import; replaced with 'Status'
import { Product, Status, DiscountType } from '../types';
import { apiService } from '../api';
import { GoogleGenAI } from "@google/genai";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Product | null;
  categoryId: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, initialData, categoryId }) => {
  const [activeTab, setActiveTab] = useState<'uz' | 'ru' | 'en'>('uz');
  const [isUploading, setIsUploading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '',
    descriptionUz: '', descriptionUzCyrillic: '', descriptionRu: '', descriptionEn: '',
    price: 0, stock: 0, imageUrl: '', orderIndex: 1,
    status: 'OPEN', discountType: 'NONE', discountValue: null,
    discountStartAt: '', discountEndAt: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        discountStartAt: initialData.discountStartAt?.split('T')[0] || '',
        discountEndAt: initialData.discountEndAt?.split('T')[0] || ''
      });
    } else {
      setFormData({
        nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '',
        descriptionUz: '', descriptionUzCyrillic: '', descriptionRu: '', descriptionEn: '',
        price: 0, stock: 0, imageUrl: '', orderIndex: 1,
        status: 'OPEN', discountType: 'NONE', discountValue: null,
        discountStartAt: '', discountEndAt: ''
      });
    }
  }, [initialData, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await apiService.uploadFile(file);
      if (res.success) {
        setFormData((prev: any) => ({ ...prev, imageUrl: res.data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiTranslate = async () => {
    if (!formData.nameUz) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Translate this product: "${formData.nameUz}". 
      Description: "${formData.descriptionUz}". 
      Return JSON: {"cyr": {"name": "...", "desc": "..."}, "ru": {"name": "...", "desc": "..."}, "en": {"name": "...", "desc": "..."}}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setFormData((prev: any) => ({
        ...prev,
        nameUzCyrillic: result.cyr?.name || prev.nameUzCyrillic,
        descriptionUzCyrillic: result.cyr?.desc || prev.descriptionUzCyrillic,
        nameRu: result.ru?.name || prev.nameRu,
        descriptionRu: result.ru?.desc || prev.descriptionRu,
        nameEn: result.en?.name || prev.nameEn,
        descriptionEn: result.en?.desc || prev.descriptionEn
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-950 sm:rounded-[3rem] rounded-t-[3rem] shadow-premium-modal overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
        <div className="p-8 pb-4 border-b border-slate-200/50 dark:border-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {initialData ? 'Tahrirlash' : 'Yangi Mahsulot'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategoriya ID: {categoryId.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-200/50 dark:border-slate-800/50 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...formData, categoryId }); }} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
          {/* Image Upload */}
          <div className="relative group">
            <label className={labelClass}>Mahsulot Rasmi</label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-slate-300" />
                )}
                {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
              </div>
              <div className="flex-1 space-y-3">
                <input type="file" id="prod-img" hidden onChange={handleFileUpload} accept="image/*" />
                <label htmlFor="prod-img" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                  <ImageIcon size={14} /> {formData.imageUrl ? 'Rasm O\'zgartirish' : 'Rasm Yuklash'}
                </label>
                <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">Max: 10MB. Format: JPG, PNG, WEBP.</p>
              </div>
            </div>
          </div>

          {/* Lang Tabs */}
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl">
            {(['uz', 'ru', 'en'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}>
                {tab === 'uz' ? 'O\'zbekcha' : tab === 'ru' ? 'Ruscha' : 'Inglizcha'}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative group">
                <label className={labelClass}>Nomi</label>
                <div className="relative">
                  <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  {activeTab === 'uz' && <input required className={inputClass} value={formData.nameUz} onChange={e => setFormData({...formData, nameUz: e.target.value})} placeholder="Futbolka..." />}
                  {activeTab === 'ru' && <input className={inputClass} value={formData.nameRu} onChange={e => setFormData({...formData, nameRu: e.target.value})} placeholder="Футболка..." />}
                  {activeTab === 'en' && <input className={inputClass} value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} placeholder="T-shirt..." />}
                  {activeTab === 'uz' && (
                    <button type="button" onClick={handleAiTranslate} disabled={isAiLoading || !formData.nameUz} className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-indigo-600 text-white flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                      {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span className="text-[9px] font-black uppercase">AI</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative group">
                <label className={labelClass}>Order & Stock</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className="w-full pl-9 pr-3 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold outline-none" value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: +e.target.value})} />
                  </div>
                  <div className="relative">
                    <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className="w-full pl-9 pr-3 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: +e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <label className={labelClass}>Tavsif (Description)</label>
              <textarea 
                className="w-full p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold min-h-[100px]"
                value={activeTab === 'uz' ? formData.descriptionUz : activeTab === 'ru' ? formData.descriptionRu : formData.descriptionEn}
                onChange={e => {
                  const key = activeTab === 'uz' ? 'descriptionUz' : activeTab === 'ru' ? 'descriptionRu' : 'descriptionEn';
                  setFormData({...formData, [key]: e.target.value});
                }}
                placeholder="Mahsulot haqida batafsil ma'lumot..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div>
                <label className={labelClass}>Narxi (Price)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" className={inputClass} value={formData.price} onChange={e => setFormData({...formData, price: +e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                  <Activity size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select className={`${inputClass} appearance-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="OPEN">Ochiq</option>
                    <option value="CLOSED">Yopiq</option>
                    <option value="DELETED">O'chirilgan</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Tag size={18} className="text-indigo-600" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Chegirma Sozlamalari</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Turi</label>
                  <select className={`${inputClass} h-[58px] appearance-none`} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                    <option value="NONE">Yo'q</option>
                    <option value="PERCENT">Foiz (%)</option>
                    <option value="FIXED">Summa (Fix)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Qiymati</label>
                  <input type="number" disabled={formData.discountType === 'NONE'} className={inputClass} value={formData.discountValue || ''} onChange={e => setFormData({...formData, discountValue: +e.target.value})} placeholder="0" />
                </div>
              </div>

              {formData.discountType !== 'NONE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className={labelClass}>Boshlanish</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="date" className={inputClass} value={formData.discountStartAt} onChange={e => setFormData({...formData, discountStartAt: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Tugash</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="date" className={inputClass} value={formData.discountEndAt} onChange={e => setFormData({...formData, discountEndAt: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="submit" className="w-full order-1 sm:order-2 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3">
              <Save size={18} /> {initialData ? 'Saqlash' : 'Yaratish'}
            </button>
            <button type="button" onClick={onClose} className="w-full order-2 sm:order-1 py-5 bg-white dark:bg-slate-900 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200/50 dark:border-slate-800/50 active:scale-95">
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
