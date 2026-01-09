
import React, { useEffect, useState } from 'react';
import { 
  X, Save, Sparkles, Loader2, Tag, Hash, Activity, 
  Image as ImageIcon, DollarSign, Package, Plus, Trash2, Edit2, AlertCircle, Check, Layers, Globe
} from 'lucide-react';
import { Product, Status } from '../types';
import { apiService } from '../api';
import { GoogleGenAI } from "@google/genai";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Product | null;
  categoryId: string;
}

type LangType = 'uz' | 'uzCyr' | 'ru' | 'en';

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, initialData, categoryId }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'variants'>('details');
  const [langTab, setLangTab] = useState<LangType>('uz');
  const [variantLangTab, setVariantLangTab] = useState<LangType>('uz');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '',
    descriptionUz: '', descriptionUzCyrillic: '', descriptionRu: '', descriptionEn: '',
    status: 'OPEN', discountType: 'NONE', discountValue: null,
    discountStartAt: '', discountEndAt: '', orderIndex: 1
  });

  const [types, setTypes] = useState<any[]>([]);
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [newType, setNewType] = useState<any>({
    nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '',
    price: 0, stock: 0, imageUrl: '', imgName: 'variant.png', imgSize: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nameUz: initialData.nameUz || '',
        nameUzCyrillic: initialData.nameUzCyrillic || '',
        nameRu: initialData.nameRu || '',
        nameEn: initialData.nameEn || '',
        descriptionUz: initialData.descriptionUz || '',
        descriptionUzCyrillic: initialData.descriptionUzCyrillic || '',
        descriptionRu: initialData.descriptionRu || '',
        descriptionEn: initialData.descriptionEn || '',
        status: initialData.status || 'OPEN',
        discountType: initialData.discountType || 'NONE',
        discountValue: initialData.discountValue,
        discountStartAt: initialData.discountStartAt?.split('T')[0] || '',
        discountEndAt: initialData.discountEndAt?.split('T')[0] || '',
        orderIndex: initialData.orderIndex || 1
      });
      setTypes(initialData.types || []);
    } else {
      setFormData({
        nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '',
        descriptionUz: '', descriptionUzCyrillic: '', descriptionRu: '', descriptionEn: '',
        status: 'OPEN', discountType: 'NONE', discountValue: null,
        discountStartAt: '', discountEndAt: '', orderIndex: 1
      });
      setTypes([]);
    }
    setActiveTab('details');
    setEditingTypeIndex(null);
    setVariantError(null);
  }, [initialData, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setVariantError(null);
    try {
      const res = await apiService.uploadFile(file);
      if (res.success) {
        setNewType((prev: any) => ({ 
          ...prev, 
          imageUrl: res.data.fileUrl,
          imgName: res.data.fileName,
          imgSize: res.data.size
        }));
      }
    } catch (err: any) {
      setVariantError("Rasm yuklashda xatolik yuz berdi");
    } finally {
      setIsUploading(false);
    }
  };

  const addOrUpdateType = () => {
    if (!newType.nameUz.trim()) { setVariantError("Kamida O'zbekcha nomni kiriting"); return; }
    if (!newType.imageUrl) { setVariantError("Rasm yuklang"); return; }

    if (editingTypeIndex !== null) {
      const updated = [...types];
      const existing = types[editingTypeIndex];
      updated[editingTypeIndex] = { ...newType, id: existing.id, _isModified: true };
      setTypes(updated);
      setEditingTypeIndex(null);
    } else {
      setTypes([...types, { ...newType, _isNew: true, id: `temp-${Date.now()}` }]);
    }
    
    setNewType({ nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '', price: 0, stock: 0, imageUrl: '', imgName: 'variant.png', imgSize: 0 });
    setVariantError(null);
  };

  // Fix: Added missing cancelEditType function to clear the editing state
  const cancelEditType = () => {
    setEditingTypeIndex(null);
    setNewType({ nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '', price: 0, stock: 0, imageUrl: '', imgName: 'variant.png', imgSize: 0 });
    setVariantError(null);
  };

  const handleAiFillAll = async (isForVariant = false) => {
    const sourceText = isForVariant ? newType.nameUz : formData.nameUz;
    const sourceDesc = isForVariant ? "" : formData.descriptionUz;
    
    if (!sourceText) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = isForVariant 
        ? `Translate and transliterate this variant name: "${sourceText}". Return JSON: {"cyr": "...", "ru": "...", "en": "..."}`
        : `Translate and transliterate product name: "${sourceText}" and description: "${sourceDesc}". Return JSON: {"cyrName": "...", "ruName": "...", "enName": "...", "cyrDesc": "...", "ruDesc": "...", "enDesc": "..."}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text || '{}');
      
      if (isForVariant) {
        setNewType(prev => ({
          ...prev,
          nameUzCyrillic: result.cyr || prev.nameUzCyrillic,
          nameRu: result.ru || prev.nameRu,
          nameEn: result.en || prev.nameEn
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          nameUzCyrillic: result.cyrName || prev.nameUzCyrillic,
          nameRu: result.ruName || prev.nameRu,
          nameEn: result.enName || prev.nameEn,
          descriptionUzCyrillic: result.cyrDesc || prev.descriptionUzCyrillic,
          descriptionRu: result.ruDesc || prev.descriptionRu,
          descriptionEn: result.enDesc || prev.descriptionEn
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (types.length === 0) {
      setActiveTab('variants');
      setVariantError("Kamida bitta variant qo'shing");
      return;
    }
    onSubmit({ ...formData, types, categoryId });
  };

  if (!isOpen) return null;

  const inputClass = "w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  const LangSwitcher = ({ current, set, isMini = false }: { current: LangType, set: (l: LangType) => void, isMini?: boolean }) => (
    <div className={`flex p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300/30 dark:border-slate-800/30 ${isMini ? 'mb-2' : 'mb-6'}`}>
      {(['uz', 'uzCyr', 'ru', 'en'] as const).map(tab => (
        <button 
          key={tab} 
          type="button" 
          onClick={() => set(tab)} 
          className={`flex-1 ${isMini ? 'py-1.5 text-[8px]' : 'py-2.5 text-[9px]'} font-black uppercase tracking-widest rounded-lg transition-all ${current === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          {tab === 'uz' ? 'Lot' : tab === 'uzCyr' ? 'Kir' : tab}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-950 sm:rounded-[3rem] rounded-t-[3rem] shadow-premium-modal overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[94vh] flex flex-col border-t sm:border border-white/10 dark:border-slate-800/50">
        
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-full flex justify-center py-4">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-8 pb-4 border-b border-slate-200/50 dark:border-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
               {initialData ? <Edit2 size={22} /> : <Plus size={22} strokeWidth={3} />}
             </div>
             <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                 {initialData ? 'Tahrirlash' : 'Yaratish'}
               </h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Catalog</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-200/50 dark:border-slate-800/50 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="px-8 pt-6">
          <div className="flex p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <button type="button" onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              <Tag size={14} /> Asosiy
            </button>
            <button type="button" onClick={() => setActiveTab('variants')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'variants' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              <Layers size={14} /> Variantlar ({types.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4 space-y-8">
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <LangSwitcher current={langTab} set={setLangTab} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative group">
                  <label className={labelClass}>
                    {langTab === 'uz' ? 'Nomi (Lot)' : langTab === 'uzCyr' ? 'Nomi (Kir)' : langTab === 'ru' ? 'Nomi (Ru)' : 'Name (En)'}
                  </label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      required={langTab === 'uz'}
                      className={inputClass} 
                      value={langTab === 'uz' ? formData.nameUz : langTab === 'uzCyr' ? formData.nameUzCyrillic : langTab === 'ru' ? formData.nameRu : formData.nameEn} 
                      onChange={e => {
                        const key = langTab === 'uz' ? 'nameUz' : langTab === 'uzCyr' ? 'nameUzCyrillic' : langTab === 'ru' ? 'nameRu' : 'nameEn';
                        setFormData({...formData, [key]: e.target.value});
                      }}
                      placeholder="Mahsulot nomi..." 
                    />
                    {langTab === 'uz' && (
                      <button type="button" onClick={() => handleAiFillAll(false)} disabled={isAiLoading || !formData.nameUz} className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-indigo-600 text-white flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span className="text-[9px] font-black">AI</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <label className={labelClass}>Tartib (Index)</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className={inputClass} value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: +e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className={labelClass}>Tavsif (Description)</label>
                <textarea 
                  className="w-full p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold min-h-[100px] resize-none"
                  value={langTab === 'uz' ? formData.descriptionUz : langTab === 'uzCyr' ? formData.descriptionUzCyrillic : langTab === 'ru' ? formData.descriptionRu : formData.descriptionEn}
                  onChange={e => {
                    const key = langTab === 'uz' ? 'descriptionUz' : langTab === 'uzCyr' ? 'descriptionUzCyrillic' : langTab === 'ru' ? 'descriptionRu' : 'descriptionEn';
                    setFormData({...formData, [key]: e.target.value});
                  }}
                  placeholder="Batafsil ma'lumot..."
                />
              </div>

              <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                  <Activity size={18} className="text-indigo-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Parametrlar</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Holati</label>
                    <select className={`${inputClass} appearance-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="OPEN">Ochiq</option>
                      <option value="CLOSED">Yopiq</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Chegirma</label>
                    <select className={`${inputClass} appearance-none`} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                      <option value="NONE">Yo'q</option>
                      <option value="PERCENT">%</option>
                      <option value="FIXED">Fix</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Variant Editor Card */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-indigo-500/10 dark:border-indigo-500/5 shadow-xl space-y-6 relative overflow-hidden group/form">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      {editingTypeIndex !== null ? 'Variantni tahrirlash' : 'Variant qo\'shish'}
                    </h4>
                  </div>
                  {editingTypeIndex !== null && (
                    <button type="button" onClick={cancelEditType} className="text-[10px] font-black uppercase text-rose-500 hover:opacity-70">Bekor qilish</button>
                  )}
                </div>

                {variantError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center gap-3 border border-rose-200/50">
                    <AlertCircle size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-wide">{variantError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 relative flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                    {newType.imageUrl ? (
                      <img src={newType.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300 dark:text-slate-800" size={32} />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    <input type="file" id="v-img" hidden onChange={handleFileUpload} accept="image/*" />
                    <label htmlFor="v-img" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                      <ImageIcon size={14} /> Rasm yuklash
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <LangSwitcher current={variantLangTab} set={setVariantLangTab} isMini />
                  <div className="relative group">
                    <label className={labelClass}>Variant Nomi</label>
                    <div className="relative">
                       <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                        className={inputClass} 
                        value={variantLangTab === 'uz' ? newType.nameUz : variantLangTab === 'uzCyr' ? newType.nameUzCyrillic : variantLangTab === 'ru' ? newType.nameRu : newType.nameEn} 
                        onChange={e => {
                          const key = variantLangTab === 'uz' ? 'nameUz' : variantLangTab === 'uzCyr' ? 'nameUzCyrillic' : variantLangTab === 'ru' ? 'nameRu' : 'nameEn';
                          setNewType({...newType, [key]: e.target.value});
                        }}
                        placeholder="Variant nomi..." 
                      />
                      {variantLangTab === 'uz' && (
                        <button type="button" onClick={() => handleAiFillAll(true)} disabled={isAiLoading || !newType.nameUz} className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 flex items-center gap-2 active:scale-95 transition-all">
                          {isAiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          <span className="text-[8px] font-black">AI</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Narxi</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="number" className={inputClass} value={newType.price || ''} onChange={e => setNewType({...newType, price: +e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Soni</label>
                      <div className="relative">
                        <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="number" className={inputClass} value={newType.stock || ''} onChange={e => setNewType({...newType, stock: +e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={addOrUpdateType} 
                  disabled={isUploading}
                  className="w-full py-4.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Check size={18} strokeWidth={3} />
                  {editingTypeIndex !== null ? 'Yangilash' : 'Variantni saqlash'}
                </button>
              </div>

              {/* List */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 ml-2">
                   <Layers size={18} className="text-indigo-600" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mavjud variantlar</h4>
                </div>
                {types.map((type, idx) => (
                  <div key={type.id || idx} className={`group flex items-center gap-4 p-4 rounded-[2rem] border transition-all duration-300 ${editingTypeIndex === idx ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50'}`}>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                      <img src={type.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{type.nameUz}</h5>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                        <span className="text-indigo-600 dark:text-indigo-400">{type.price.toLocaleString()} so'm</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{type.stock} dona</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setNewType(type); setEditingTypeIndex(idx); }} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => setTypes(types.filter((_, i) => i !== idx))} className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <button type="submit" className="w-full order-1 sm:order-2 py-5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] shadow-2xl active:scale-95 flex items-center justify-center gap-3 transition-all">
              <Save size={20} /> Saqlash
            </button>
            <button type="button" onClick={onClose} className="w-full order-2 sm:order-1 py-5 bg-white dark:bg-slate-900 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] border border-slate-200/50 dark:border-slate-800/50 active:scale-95 transition-all">
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
