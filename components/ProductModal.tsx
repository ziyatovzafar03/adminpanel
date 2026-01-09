
import React, { useEffect, useState } from 'react';
import { 
  X, Save, Sparkles, Loader2, Tag, Hash, Activity, 
  Image as ImageIcon, DollarSign, Package, Calendar, Plus, Trash2, Edit2
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
  }, [initialData, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const addOrUpdateType = () => {
    if (editingTypeIndex !== null) {
      const updated = [...types];
      updated[editingTypeIndex] = newType;
      setTypes(updated);
      setEditingTypeIndex(null);
    } else {
      setTypes([...types, { ...newType, id: `temp-${Date.now()}` }]);
    }
    setNewType({ nameUz: '', nameUzCyrillic: '', nameRu: '', nameEn: '', price: 0, stock: 0, imageUrl: '', imgName: '', imgSize: 0 });
  };

  const removeType = (index: number) => {
    setTypes(types.filter((_, i) => i !== index));
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, types, categoryId });
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Katalog: {categoryId.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-rose-500 border border-slate-200/50 dark:border-slate-800/50 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pt-4">
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl">
            <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'details' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Tafsilotlar</button>
            <button onClick={() => setActiveTab('variants')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'variants' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Turlar ({types.length})</button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl">
                {(['uz', 'ru', 'en'] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setLangTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${langTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-600' : 'text-slate-400'}`}>
                    {tab === 'uz' ? 'Lot' : tab === 'ru' ? 'RU' : 'EN'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className={labelClass}>Mahsulot Nomi</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    {langTab === 'uz' && <input required className={inputClass} value={formData.nameUz} onChange={e => setFormData({...formData, nameUz: e.target.value})} placeholder="iPhone 14..." />}
                    {langTab === 'ru' && <input className={inputClass} value={formData.nameRu} onChange={e => setFormData({...formData, nameRu: e.target.value})} placeholder="Айфон 14..." />}
                    {langTab === 'en' && <input className={inputClass} value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} placeholder="iPhone 14..." />}
                    {langTab === 'uz' && (
                      <button type="button" onClick={handleAiTranslate} disabled={isAiLoading || !formData.nameUz} className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-indigo-600 text-white flex items-center gap-2">
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
                <label className={labelClass}>Tavsif (Description)</label>
                <textarea 
                  className="w-full p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold min-h-[120px]"
                  value={langTab === 'uz' ? formData.descriptionUz : langTab === 'ru' ? formData.descriptionRu : formData.descriptionEn}
                  onChange={e => {
                    const key = langTab === 'uz' ? 'descriptionUz' : langTab === 'ru' ? 'descriptionRu' : 'descriptionEn';
                    setFormData({...formData, [key]: e.target.value});
                  }}
                  placeholder="Mahsulot haqida ma'lumot..."
                />
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 space-y-6">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Holat va Chegirma</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Status</label>
                    <select className={`${inputClass} appearance-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="OPEN">Ochiq</option>
                      <option value="CLOSED">Yopiq</option>
                      <option value="DELETED">O'chirilgan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Chegirma Turi</label>
                    <select className={`${inputClass} appearance-none`} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                      <option value="NONE">Yo'q</option>
                      <option value="PERCENT">Foiz (%)</option>
                      <option value="FIXED">Summa (Fix)</option>
                    </select>
                  </div>
                </div>
                {formData.discountType !== 'NONE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className={labelClass}>Qiymat</label>
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
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Type List */}
              <div className="space-y-3">
                {types.map((type, idx) => (
                  <div key={type.id || idx} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm group">
                    <img src={type.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{type.nameUz}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type.price.toLocaleString()} so'm • {type.stock} ta</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { setNewType(type); setEditingTypeIndex(idx); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => removeType(idx)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Variant Section */}
              <div className="p-6 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-900/50 space-y-6">
                <div className="flex items-center gap-3">
                  <Plus size={18} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-300">
                    {editingTypeIndex !== null ? 'Variantni Tahrirlash' : 'Yangi Variant'}
                  </h4>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-800 relative flex items-center justify-center overflow-hidden">
                    {newType.imageUrl ? <img src={newType.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-indigo-200" size={24} />}
                    {isUploading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="file" id="type-img" hidden onChange={handleFileUpload} />
                    <label htmlFor="type-img" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all active:scale-95">
                      Rasm Yuklash
                    </label>
                    <p className="text-[9px] font-bold text-slate-400 leading-none">Variant uchun rasm majburiy.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input className={inputClass} placeholder="Variant nomi (uz)..." value={newType.nameUz} onChange={e => setNewType({...newType, nameUz: e.target.value})} />
                  <input className={inputClass} placeholder="Variant nomi (ru)..." value={newType.nameRu} onChange={e => setNewType({...newType, nameRu: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className={inputClass} placeholder="Narxi..." value={newType.price || ''} onChange={e => setNewType({...newType, price: +e.target.value})} />
                  </div>
                  <div className="relative">
                    <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" className={inputClass} placeholder="Stock..." value={newType.stock || ''} onChange={e => setNewType({...newType, stock: +e.target.value})} />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={addOrUpdateType} 
                  disabled={!newType.nameUz || !newType.imageUrl || newType.price <= 0}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {editingTypeIndex !== null ? 'Variantni Saqlash' : 'Variant Qo\'shish'}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button type="submit" className="w-full order-1 sm:order-2 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3">
              <Save size={18} /> {initialData ? 'O\'zgarishlarni Saqlash' : 'Mahsulotni Yaratish'}
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
