
import React, { useEffect, useState } from 'react';
import { 
  X, Save, Sparkles, Loader2, Tag, Hash, Activity, 
  Image as ImageIcon, DollarSign, Package, Plus, Trash2, Edit2, AlertCircle, Check, Layers, ChevronRight
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
    if (!newType.nameUz.trim()) { setVariantError("Nomni kiriting"); return; }
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

  const handleAiTranslate = async () => {
    if (!formData.nameUz) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate and transliterate product name: "${formData.nameUz}" and description: "${formData.descriptionUz}". Return JSON: {"cyrName": "...", "ruName": "...", "enName": "...", "cyrDesc": "...", "ruDesc": "...", "enDesc": "..."}`,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setFormData((prev: any) => ({
        ...prev,
        nameUzCyrillic: result.cyrName || prev.nameUzCyrillic,
        nameRu: result.ruName || prev.nameRu,
        nameEn: result.enName || prev.nameEn,
        descriptionUzCyrillic: result.cyrDesc || prev.descriptionUzCyrillic,
        descriptionRu: result.ruDesc || prev.descriptionRu,
        descriptionEn: result.enDesc || prev.descriptionEn
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

  const inputClass = "w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold placeholder:font-normal";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-950 sm:rounded-[3rem] rounded-t-[3rem] shadow-premium-modal overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[92vh] flex flex-col border-t sm:border border-white/10 dark:border-slate-800/50">
        
        {/* Mobile Handle */}
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
                 {initialData ? 'Tahrirlash' : 'Yangi Mahsulot'}
               </h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Category Dashboard</p>
             </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-200/50 dark:border-slate-800/50 transition-all active:scale-90 shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6">
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-300/30 dark:border-slate-800/30">
            <button type="button" onClick={() => setActiveTab('details')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Tag size={14} /> Asosiy ma'lumotlar
            </button>
            <button type="button" onClick={() => setActiveTab('variants')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'variants' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Layers size={14} /> Variantlar ({types.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4 space-y-8">
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex p-1 bg-slate-200/30 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                {(['uz', 'ru', 'en'] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setLangTab(tab)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${langTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                    {tab === 'uz' ? 'Lot' : tab === 'ru' ? 'Ru' : 'En'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      placeholder="Masalan: Erkaklar ko'ylagi" 
                    />
                    {langTab === 'uz' && (
                      <button type="button" onClick={handleAiTranslate} disabled={isAiLoading || !formData.nameUz} className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-indigo-600 text-white flex items-center gap-2 hover:bg-indigo-700 active:scale-95 disabled:opacity-50">
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
                <label className={labelClass}>Mahsulot tavsifi</label>
                <textarea 
                  className="w-full p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold min-h-[120px] resize-none"
                  value={langTab === 'uz' ? formData.descriptionUz : langTab === 'ru' ? formData.descriptionRu : formData.descriptionEn}
                  onChange={e => {
                    const key = langTab === 'uz' ? 'descriptionUz' : langTab === 'ru' ? 'descriptionRu' : 'descriptionEn';
                    setFormData({...formData, [key]: e.target.value});
                  }}
                  placeholder="Xususiyatlar va materiallar haqida..."
                />
              </div>

              <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                  <Activity size={18} className="text-indigo-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Status va Chegirma</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Holati</label>
                    <select className={`${inputClass} appearance-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="OPEN">Sotuvda</option>
                      <option value="CLOSED">Yopiq</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Chegirma</label>
                    <select className={`${inputClass} appearance-none`} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                      <option value="NONE">Mavjud emas</option>
                      <option value="PERCENT">Foizda (%)</option>
                      <option value="FIXED">Summada (Fix)</option>
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
                      <label className={labelClass}>Boshlanish</label>
                      <input type="date" className={inputClass} value={formData.discountStartAt} onChange={e => setFormData({...formData, discountStartAt: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelClass}>Tugash</label>
                      <input type="date" className={inputClass} value={formData.discountEndAt} onChange={e => setFormData({...formData, discountEndAt: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Variant Editor */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-6 relative overflow-hidden group/form">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover/form:bg-indigo-600/10 transition-colors"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      {editingTypeIndex !== null ? 'Variantni Tahrirlash' : 'Yangi Variant Qo\'shish'}
                    </h4>
                  </div>
                  {editingTypeIndex !== null && (
                    <button type="button" onClick={cancelEditType} className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-all active:scale-95">Bekor qilish</button>
                  )}
                </div>

                {variantError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center gap-3 border border-rose-200/50 dark:border-rose-800/50">
                    <AlertCircle size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-wide">{variantError}</span>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 relative flex items-center justify-center overflow-hidden shadow-inner">
                    {newType.imageUrl ? (
                      <img src={newType.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300 dark:text-slate-800" size={36} />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Variant uchun rasm (Max 10MB)</p>
                    <input type="file" id="type-img-input" hidden onChange={handleFileUpload} accept="image/*" />
                    <label htmlFor="type-img-input" className="inline-flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                      <ImageIcon size={14} /> Rasm tanlash
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nomi (Lot)</label>
                    <input className={inputClass} placeholder="Masalan: M, Qizil" value={newType.nameUz} onChange={e => setNewType({...newType, nameUz: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Narxi (So'm)</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" className={inputClass} placeholder="0" value={newType.price || ''} onChange={e => setNewType({...newType, price: +e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                    <label className={labelClass}>Nomi (Ru)</label>
                    <input className={inputClass} placeholder="Например: M, Красный" value={newType.nameRu} onChange={e => setNewType({...newType, nameRu: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Soni (Omborda)</label>
                    <div className="relative">
                      <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" className={inputClass} placeholder="0" value={newType.stock || ''} onChange={e => setNewType({...newType, stock: +e.target.value})} />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={addOrUpdateType} 
                  disabled={isUploading}
                  className="w-full py-4.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 border border-white/10 dark:border-slate-800/50"
                >
                  {editingTypeIndex !== null ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  {editingTypeIndex !== null ? 'Variantni Saqlash' : 'Ro\'yxatga Qo\'shish'}
                </button>
              </div>

              {/* List */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                   <Layers size={18} className="text-indigo-600" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mavjud variantlar ro'yxati</h4>
                </div>
                {types.length === 0 ? (
                  <div className="p-16 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3.5rem] flex flex-col items-center justify-center gap-4 text-slate-400 bg-white/30 dark:bg-slate-900/30">
                    <Package size={56} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hali variantlar yo'q</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {types.map((type, idx) => (
                      <div key={type.id || idx} className={`group flex items-center gap-4 p-4 rounded-[2.25rem] border-2 transition-all duration-300 ${editingTypeIndex === idx ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-lg'}`}>
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 shadow-sm">
                          <img src={type.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{type.nameUz}</h5>
                          <div className="flex items-center gap-3 mt-1.5">
                             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{type.price.toLocaleString()} so'm</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type.stock} dona</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setNewType(type); setEditingTypeIndex(idx); setVariantError(null); }} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition-all hover:bg-indigo-600 hover:text-white shadow-sm"><Edit2 size={16} /></button>
                          <button type="button" onClick={() => setTypes(types.filter((_, i) => i !== idx))} className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-400 flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white shadow-sm"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <button type="submit" className="w-full order-1 sm:order-2 py-5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] shadow-2xl shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-3 transition-all border border-white/10">
              <Save size={20} /> {initialData ? 'O\'zgarishlarni Saqlash' : 'Mahsulotni yaratish'}
            </button>
            <button type="button" onClick={onClose} className="w-full order-2 sm:order-1 py-5 bg-white dark:bg-slate-900 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] border border-slate-200/50 dark:border-slate-800/50 active:scale-95 transition-all shadow-sm">
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
