
import React, { useEffect, useState } from 'react';
import { 
  X, Save, Sparkles, Loader2, Tag, Hash, Activity, 
  Image as ImageIcon, DollarSign, Package, Calendar, Plus, Trash2, Edit2, AlertCircle, Check, Layers
} from 'lucide-react';
import { Product, ProductType, Status, DiscountType } from '../types';
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
  const [activeTab, setActiveTab] = useState<'details' | 'variants'>('details');
  const [langTab, setLangTab] = useState<'uz' | 'ru' | 'en'>('uz');
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
    price: 0, stock: 0, imageUrl: '', imgName: '', imgSize: 0
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
      setVariantError(err.message || "Fayl yuklashda xatolik");
    } finally {
      setIsUploading(false);
    }
  };

  const addOrUpdateType = () => {
    // Basic validation
    if (!newType.nameUz.trim()) {
      setVariantError("Variant nomini kiriting");
      return;
    }
    if (!newType.imageUrl) {
      setVariantError("Rasm yuklash shart");
      return;
    }
    if (newType.price === null || newType.price === undefined || newType.price < 0) {
      setVariantError("Narxni to'g'ri kiriting");
      return;
    }

    if (editingTypeIndex !== null) {
      const updated = [...types];
      const existingId = types[editingTypeIndex].id;
      // Mark as updated if it's an existing one (doesn't start with temp-)
      updated[editingTypeIndex] = { ...newType, id: existingId, _isModified: true };
      setTypes(updated);
      setEditingTypeIndex(null);
    } else {
      // Mark as new
      setTypes([...types, { ...newType, id: `temp-${Date.now()}`, _isNew: true }]);
    }
    
    // Reset form
    setNewType({ nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '', price: 0, stock: 0, imageUrl: '', imgName: '', imgSize: 0 });
    setVariantError(null);
  };

  const cancelEditType = () => {
    setEditingTypeIndex(null);
    setNewType({ nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '', price: 0, stock: 0, imageUrl: '', imgName: '', imgSize: 0 });
    setVariantError(null);
  };

  const removeType = (index: number) => {
    const typeToRemove = types[index];
    // If it's an existing type, we might want to track deletion, but for now we just remove from local list
    setTypes(types.filter((_, i) => i !== index));
    if (editingTypeIndex === index) cancelEditType();
  };

  const handleAiTranslate = async () => {
    if (!formData.nameUz) return;
    setIsAiLoading(true);
    try {
      // Create a new instance of GoogleGenAI using the API key from environment variables.
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
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-950 sm:rounded-[3rem] rounded-t-[3rem] shadow-premium-modal overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4 border-b border-slate-200/50 dark:border-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
               {initialData ? <Edit2 size={24} /> : <Plus size={24} />}
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                 {initialData ? 'Tahrirlash' : 'Yangi Mahsulot'}
               </h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Katalog boshqaruvi</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-200/50 dark:border-slate-800/50 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-8 pt-4">
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl">
            <button type="button" onClick={() => setActiveTab('details')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <Tag size={14} /> Asosiy ma'lumotlar
            </button>
            <button type="button" onClick={() => setActiveTab('variants')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'variants' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <Layers size={14} /> Variantlar ({types.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl">
                {(['uz', 'ru', 'en'] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setLangTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${langTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                    {tab === 'uz' ? 'O\'zbekcha' : tab === 'ru' ? 'Русский' : 'English'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className={labelClass}>Mahsulot Nomi</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      required 
                      className={inputClass} 
                      value={langTab === 'uz' ? formData.nameUz : langTab === 'ru' ? formData.nameRu : formData.nameEn} 
                      onChange={e => {
                        const key = langTab === 'uz' ? 'nameUz' : langTab === 'ru' ? 'nameRu' : 'nameEn';
                        setFormData({...formData, [key]: e.target.value});
                      }}
                      placeholder="Masalan: iPhone 14 Pro Max" 
                    />
                    {langTab === 'uz' && (
                      <button type="button" onClick={handleAiTranslate} disabled={isAiLoading || !formData.nameUz} className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-indigo-600 text-white flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span className="text-[9px] font-black uppercase">AI</span>
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
                <label className={labelClass}>Mahsulot haqida (Description)</label>
                <textarea 
                  className="w-full p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold min-h-[140px]"
                  value={langTab === 'uz' ? formData.descriptionUz : langTab === 'ru' ? formData.descriptionRu : formData.descriptionEn}
                  onChange={e => {
                    const key = langTab === 'uz' ? 'descriptionUz' : langTab === 'ru' ? 'descriptionRu' : 'descriptionEn';
                    setFormData({...formData, [key]: e.target.value});
                  }}
                  placeholder="Xususiyatlar, parametrlar va h.k..."
                />
              </div>

              <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                  <Activity size={18} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Sotuv Sozlamalari</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Holati</label>
                    <select className={`${inputClass} appearance-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="OPEN">Sotuvda (Ochiq)</option>
                      <option value="CLOSED">To'xtatilgan (Yopiq)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Chegirma Turi</label>
                    <select className={`${inputClass} appearance-none`} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                      <option value="NONE">Mavjud emas</option>
                      <option value="PERCENT">Foizda (%)</option>
                      <option value="FIXED">Belgilangan summa</option>
                    </select>
                  </div>
                </div>
                {formData.discountType !== 'NONE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div>
                      <label className={labelClass}>Qiymati</label>
                      <input type="number" className={inputClass} value={formData.discountValue || ''} onChange={e => setFormData({...formData, discountValue: +e.target.value})} />
                    </div>
                    <div>
                      <label className={labelClass}>Boshlanish sanasi</label>
                      <input type="date" className={inputClass} value={formData.discountStartAt} onChange={e => setFormData({...formData, discountStartAt: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelClass}>Tugash sanasi</label>
                      <input type="date" className={inputClass} value={formData.discountEndAt} onChange={e => setFormData({...formData, discountEndAt: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Variant Editor Form */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                      <Plus size={20} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      {editingTypeIndex !== null ? 'Variantni Tahrirlash' : 'Yangi Variant qo\'shish'}
                    </h4>
                  </div>
                  {editingTypeIndex !== null && (
                    <button type="button" onClick={cancelEditType} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Bekor qilish</button>
                  )}
                </div>

                {variantError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-wide">{variantError}</span>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="w-28 h-28 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 relative flex items-center justify-center overflow-hidden group/upload">
                    {newType.imageUrl ? (
                      <>
                        <img src={newType.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="text-white" size={24} />
                        </div>
                      </>
                    ) : (
                      <ImageIcon className="text-slate-300" size={32} />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Mahsulot turi uchun rasm tanlang (Max 10MB)
                    </p>
                    <input type="file" id="type-img-input" hidden onChange={handleFileUpload} accept="image/*" />
                    <label htmlFor="type-img-input" className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                      <ImageIcon size={14} /> Rasm yuklash
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Variant Nomi (Uz)</label>
                    <input className={inputClass} placeholder="Masalan: 128GB, Qora..." value={newType.nameUz} onChange={e => setNewType({...newType, nameUz: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Narxi (So'm)</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" className={inputClass} placeholder="0" value={newType.price === 0 ? '' : newType.price} onChange={e => setNewType({...newType, price: e.target.value === '' ? 0 : +e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className={labelClass}>Variant Nomi (Ru)</label>
                    <input className={inputClass} placeholder="Например: 128ГБ, Черный..." value={newType.nameRu} onChange={e => setNewType({...newType, nameRu: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Soni (Stock)</label>
                    <div className="relative">
                      <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" className={inputClass} placeholder="0" value={newType.stock === 0 ? '' : newType.stock} onChange={e => setNewType({...newType, stock: e.target.value === '' ? 0 : +e.target.value})} />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={addOrUpdateType} 
                  disabled={isUploading}
                  className="w-full py-4.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {editingTypeIndex !== null ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  {editingTypeIndex !== null ? 'Variantni Yangilash' : 'Ro\'yxatga Qo\'shish'}
                </button>
              </div>

              {/* Current Variants List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                   <Layers size={18} className="text-slate-400" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qo'shilgan variantlar ro'yxati</h4>
                </div>
                {types.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Package size={48} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hali variantlar yo'q</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {types.map((type, idx) => (
                      <div key={type.id || idx} className={`group flex items-center gap-4 p-4 rounded-[2rem] border transition-all duration-300 ${editingTypeIndex === idx ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-500/10' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 hover:shadow-lg'}`}>
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0">
                          <img src={type.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{type.nameUz}</h5>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">{type.price.toLocaleString()} so'm</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{type.stock} dona</span>
                             {type._isNew && <span className="ml-auto text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-black uppercase">Yangi</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setNewType(type); setEditingTypeIndex(idx); setVariantError(null); }} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                          <button type="button" onClick={() => removeType(idx)} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <button type="submit" className="w-full order-1 sm:order-2 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] shadow-2xl shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-3 transition-all">
              <Save size={20} /> {initialData ? 'Saqlash' : 'Mahsulotni yaratish'}
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
