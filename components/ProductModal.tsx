
import React, { useEffect, useState } from 'react';
import { 
  X, Save, Sparkles, Loader2, Tag, Hash, Activity, 
  Image as ImageIcon, DollarSign, Package, Plus, Trash2, Edit2, AlertCircle, Check, Layers, Globe, Calendar, Percent
} from 'lucide-react';
import { Product, Status } from '../types';
import { apiService } from '../api';
import { GoogleGenAI } from "@google/genai";
import { ConfirmModal } from './ConfirmModal';

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
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '',
    descriptionUz: '', descriptionUzCyrillic: '', descriptionRu: '', descriptionEn: '',
    status: 'OPEN', discountType: 'NONE', discountValue: null,
    discountStartAt: '', discountEndAt: '', orderIndex: 1
  });

  const [types, setTypes] = useState<any[]>([]);
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<{index: number, id?: string} | null>(null);
  
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

  const cancelEditType = () => {
    setEditingTypeIndex(null);
    setNewType({ nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '', price: 0, stock: 0, imageUrl: '', imgName: 'variant.png', imgSize: 0 });
    setVariantError(null);
  };

  const handleConfirmDeleteVariant = async () => {
    if (!variantToDelete) return;
    
    setIsDeletingVariant(true);
    try {
      if (variantToDelete.id && !variantToDelete.id.startsWith('temp-')) {
        await apiService.deleteProductType(variantToDelete.id);
      }
      setTypes(types.filter((_, i) => i !== variantToDelete.index));
    } catch (err) {
      setVariantError("Variantni o'chirishda xatolik yuz berdi");
    } finally {
      setIsDeletingVariant(false);
      setVariantToDelete(null);
    }
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

    // Format dates to YYYY-MM-DDT00:00:00 as requested by backend
    const submissionData = { ...formData };
    if (submissionData.discountStartAt && !submissionData.discountStartAt.includes('T')) {
      submissionData.discountStartAt = `${submissionData.discountStartAt}T00:00:00`;
    }
    if (submissionData.discountEndAt && !submissionData.discountEndAt.includes('T')) {
      submissionData.discountEndAt = `${submissionData.discountEndAt}T00:00:00`;
    }

    onSubmit({ ...submissionData, types, categoryId });
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
          className={`flex-1 ${isMini ? 'py-1.5 text-[8px]' : 'py-2.5 text-[9px]'} font-black uppercase tracking-widest rounded-lg transition-all ${current === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400'}`}
        >
          {tab === 'uz' ? 'Lot' : tab === 'uzCyr' ? 'Kir' : tab}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-50 dark:bg-[#020617] sm:rounded-[3rem] rounded-t-[3rem] shadow-premium-modal overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[96vh] flex flex-col border-t sm:border border-white/5 dark:border-slate-800/50">
        
        {/* Mobile Header Handle */}
        <div className="sm:hidden w-full flex justify-center py-4 bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200/50 dark:border-slate-900/50 flex items-center justify-between bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/5">
               {initialData ? <Edit2 size={24} /> : <Plus size={24} strokeWidth={3} />}
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                 {initialData ? 'Tahrirlash' : 'Yaratish'}
               </h2>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Shop Catalog Control</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-200/50 dark:border-slate-800/50 transition-all hover:rotate-90 active:scale-90 shadow-sm">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 bg-slate-50 dark:bg-[#020617]">
          <div className="flex p-2 bg-white dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl ring-1 ring-white/5">
            <button type="button" onClick={() => setActiveTab('details')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 ${activeTab === 'details' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40' : 'text-slate-500 hover:text-indigo-500'}`}>
              <Tag size={18} /> Asosiy
            </button>
            <button type="button" onClick={() => setActiveTab('variants')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 ${activeTab === 'variants' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40' : 'text-slate-500 hover:text-indigo-500'}`}>
              <Layers size={18} /> Variantlar ({types.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4 space-y-8 bg-slate-50 dark:bg-[#020617]">
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LangSwitcher current={langTab} set={setLangTab} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className={labelClass}>
                    {langTab === 'uz' ? 'Nomi (Lot)' : langTab === 'uzCyr' ? 'Nomi (Kir)' : langTab === 'ru' ? 'Nomi (Ru)' : 'Name (En)'}
                  </label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      required={langTab === 'uz'}
                      className={inputClass} 
                      value={langTab === 'uz' ? formData.nameUz : langTab === 'uzCyr' ? formData.nameUzCyrillic : langTab === 'ru' ? formData.nameRu : langTab === 'en' ? formData.nameEn : ''} 
                      onChange={e => {
                        const key = langTab === 'uz' ? 'nameUz' : langTab === 'uzCyr' ? 'nameUzCyrillic' : langTab === 'ru' ? 'nameRu' : 'nameEn';
                        setFormData({...formData, [key]: e.target.value});
                      }}
                      placeholder="Masalan: Erkaklar krossovkasi" 
                    />
                    {langTab === 'uz' && (
                      <button type="button" onClick={() => handleAiFillAll(false)} disabled={isAiLoading || !formData.nameUz} className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 text-white flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20">
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span className="text-[10px] font-black">AI</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <label className={labelClass}>Index</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className={inputClass} value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: +e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className={labelClass}>Mahsulot tavsifi</label>
                <textarea 
                  className="w-full p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold min-h-[120px] resize-none shadow-sm"
                  value={langTab === 'uz' ? formData.descriptionUz : langTab === 'uzCyr' ? formData.descriptionUzCyrillic : langTab === 'ru' ? formData.descriptionRu : langTab === 'en' ? formData.descriptionEn : ''}
                  onChange={e => {
                    const key = langTab === 'uz' ? 'descriptionUz' : langTab === 'uzCyr' ? 'descriptionUzCyrillic' : langTab === 'ru' ? 'descriptionRu' : 'descriptionEn';
                    setFormData({...formData, [key]: e.target.value});
                  }}
                  placeholder="Xususiyatlar va materiallar haqida ma'lumot..."
                />
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl ring-1 ring-white/5 space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                    <Activity size={20} />
                  </div>
                  <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Parametrlar va Chegirma</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Sotuv Holati</label>
                    <select className={`${inputClass} appearance-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="OPEN">FAOL</option>
                      <option value="CLOSED">YOPIQ</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Chegirma turi</label>
                    <select className={`${inputClass} appearance-none`} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                      <option value="NONE">YO'Q</option>
                      <option value="PERCENT">FOIZ (%)</option>
                      <option value="FIXED">SUMMA (FIX)</option>
                    </select>
                  </div>
                </div>

                {formData.discountType !== 'NONE' && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="relative group">
                      <label className={labelClass}>
                        {formData.discountType === 'PERCENT' ? 'Chegirma foizi (%)' : 'Chegirma summasi (So\'m)'}
                      </label>
                      <div className="relative">
                        {formData.discountType === 'PERCENT' ? (
                          <Percent size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                        ) : (
                          <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                        )}
                        <input 
                          type="number" 
                          className={`${inputClass} !bg-indigo-500/5 border-indigo-500/20`}
                          placeholder="0"
                          value={formData.discountValue || ''}
                          onChange={e => setFormData({...formData, discountValue: +e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="relative group">
                        <label className={labelClass}>Boshlanish sanasi</label>
                        <div className="relative">
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="date" 
                            className={inputClass}
                            value={formData.discountStartAt}
                            onChange={e => setFormData({...formData, discountStartAt: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="relative group">
                        <label className={labelClass}>Tugash sanasi</label>
                        <div className="relative">
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="date" 
                            className={inputClass}
                            value={formData.discountEndAt}
                            onChange={e => setFormData({...formData, discountEndAt: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Variant Editor Glass Card */}
              <div className="p-8 bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3.5rem] border border-indigo-500/20 dark:border-indigo-500/10 shadow-3xl space-y-8 relative overflow-hidden group/form ring-1 ring-white/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full -mr-24 -mt-24"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
                      {editingTypeIndex !== null ? <Edit2 size={24} /> : <Plus size={24} strokeWidth={3} />}
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-1">
                        {editingTypeIndex !== null ? 'Variantni tahrirlash' : 'Yangi variant'}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Ma'lumotlarni kiriting</p>
                    </div>
                  </div>
                  {editingTypeIndex !== null && (
                    <button type="button" onClick={cancelEditType} className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-200/50 transition-all active:scale-95">Bekor qilish</button>
                  )}
                </div>

                {variantError && (
                  <div className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-[1.75rem] flex items-center gap-4 animate-shake">
                    <AlertCircle size={22} />
                    <span className="text-[12px] font-black uppercase tracking-wide">{variantError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-10">
                  <div className="relative group/img flex-shrink-0">
                    <div className="w-32 h-32 rounded-[3rem] bg-slate-100 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-800 relative flex items-center justify-center overflow-hidden shadow-inner group-hover/img:border-indigo-500 transition-colors duration-500">
                      {newType.imageUrl ? (
                        <img src={newType.imageUrl} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                      ) : (
                        <ImageIcon className="text-slate-300 dark:text-slate-800" size={40} />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="animate-spin text-indigo-600" size={28} />
                        </div>
                      )}
                    </div>
                    <input type="file" id="v-img-new" hidden onChange={handleFileUpload} accept="image/*" />
                    <label htmlFor="v-img-new" className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-indigo-600 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-white shadow-2xl cursor-pointer border-2 border-slate-100 dark:border-indigo-500 hover:scale-110 transition-all active:scale-90">
                      <ImageIcon size={20} />
                    </label>
                  </div>

                  <div className="flex-1 w-full space-y-6">
                    <LangSwitcher current={variantLangTab} set={setVariantLangTab} isMini />
                    
                    <div className="relative group">
                      <label className={labelClass}>Nomi ({variantLangTab.toUpperCase()})</label>
                      <div className="relative">
                         <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" />
                         <input 
                          className={`${inputClass} !bg-slate-50 dark:!bg-slate-950/50`} 
                          value={variantLangTab === 'uz' ? newType.nameUz : variantLangTab === 'uzCyr' ? newType.nameUzCyrillic : variantLangTab === 'ru' ? newType.nameRu : variantLangTab === 'en' ? newType.nameEn : ''} 
                          onChange={e => {
                            const key = variantLangTab === 'uz' ? 'nameUz' : variantLangTab === 'uzCyr' ? 'nameUzCyrillic' : variantLangTab === 'ru' ? 'nameRu' : 'nameEn';
                            setNewType({...newType, [key]: e.target.value});
                          }}
                          placeholder="Masalan: M / Oq" 
                        />
                        {variantLangTab === 'uz' && (
                          <button type="button" onClick={() => handleAiFillAll(true)} disabled={isAiLoading || !newType.nameUz} className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 text-white flex items-center gap-2 active:scale-95 shadow-lg shadow-indigo-500/20">
                            {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            <span className="text-[10px] font-black">AI</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className={labelClass}>Variant Narxi (So'm)</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" />
                      <input type="number" className={`${inputClass} !bg-slate-50 dark:!bg-slate-950/50`} placeholder="0" value={newType.price || ''} onChange={e => setNewType({...newType, price: +e.target.value})} />
                    </div>
                  </div>
                  <div className="relative group">
                    <label className={labelClass}>Ombordagi Soni</label>
                    <div className="relative">
                      <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" />
                      <input type="number" className={`${inputClass} !bg-slate-50 dark:!bg-slate-950/50`} placeholder="0" value={newType.stock || ''} onChange={e => setNewType({...newType, stock: +e.target.value})} />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={addOrUpdateType} 
                  disabled={isUploading}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/10"
                >
                  {editingTypeIndex !== null ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                  {editingTypeIndex !== null ? 'Variantni Yangilash' : 'Ro\'yxatga Qo\'shish'}
                </button>
              </div>

              {/* Variant List Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                       <Layers size={20} />
                     </div>
                     <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500">Katalog Variantlari</h4>
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{types.length} ta element</div>
                </div>

                {types.length === 0 ? (
                  <div className="py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[4rem] flex flex-col items-center justify-center gap-6 text-slate-300 dark:text-slate-800 bg-white/20 dark:bg-slate-900/20">
                    <Package size={80} strokeWidth={1} />
                    <div className="text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-2">Variantlar mavjud emas</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sotuvni boshlash uchun variant qo'shing</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {types.map((type, idx) => (
                      <div key={type.id || idx} className={`group flex items-center gap-6 p-5 rounded-[2.5rem] border transition-all duration-500 ${editingTypeIndex === idx ? 'bg-indigo-600/10 border-indigo-500/50 shadow-indigo-500/10' : 'bg-white/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 shadow-sm hover:shadow-xl'}`}>
                        <div className="w-20 h-20 rounded-[1.75rem] overflow-hidden flex-shrink-0 shadow-lg border border-slate-100 dark:border-slate-800">
                          <img src={type.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                             <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{type.nameUz}</h5>
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{type.nameRu || '—'}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                               <DollarSign size={14} />
                               <span className="text-[11px] font-black tracking-tighter">{type.price.toLocaleString()} so'm</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500">
                               <Package size={14} />
                               <span className="text-[11px] font-black uppercase tracking-widest">{type.stock} dona</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setNewType(type); setEditingTypeIndex(idx); setVariantError(null); }} className="w-11 h-11 rounded-2xl bg-white dark:bg-indigo-600 text-slate-500 dark:text-white flex items-center justify-center transition-all shadow-lg active:scale-90"><Edit2 size={18} /></button>
                          <button type="button" onClick={() => setVariantToDelete({index: idx, id: type.id})} className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500 text-rose-500 dark:text-white flex items-center justify-center transition-all shadow-lg active:scale-90"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 pb-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <button type="submit" className="w-full order-1 sm:order-2 py-5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-[13px] uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-indigo-500/40 active:scale-95 flex items-center justify-center gap-3 transition-all border border-white/10">
              <Save size={22} /> {initialData ? 'Saqlash' : 'Yaratish'}
            </button>
            <button type="button" onClick={onClose} className="w-full order-2 sm:order-1 py-5 bg-white dark:bg-slate-900 text-slate-400 font-black text-[13px] uppercase tracking-[0.3em] rounded-3xl border border-slate-200/50 dark:border-slate-800/50 active:scale-95 transition-all shadow-sm">
              Bekor qilish
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal 
        isOpen={!!variantToDelete}
        title="Variantni o'chirmoqchimisiz?"
        message="Bu amalni qaytarib bo'lmaydi va ushbu variant butunlay o'chiriladi."
        onConfirm={handleConfirmDeleteVariant}
        onCancel={() => setVariantToDelete(null)}
        confirmText={isDeletingVariant ? "O'chirilmoqda..." : "O'chirish"}
      />
    </div>
  );
};
