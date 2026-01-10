
import React, { useState } from 'react';
import { 
  X, User, Hash, Phone, Globe, Calendar, 
  ShieldCheck, BadgeCheck, Clock, UserCheck, AtSign, Send, Loader2
} from 'lucide-react';
import { Seller } from '../types';
import { apiService } from '../api';

interface SellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: Seller | null;
  currentUserChatId?: number;
}

export const SellerModal: React.FC<SellerModalProps> = ({ isOpen, onClose, seller, currentUserChatId }) => {
  const [isContacting, setIsContacting] = useState(false);

  if (!isOpen || !seller) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'YEARLY_PAID':
        return { label: 'VIP (Yillik)', color: 'bg-amber-500', icon: <ShieldCheck size={24} /> };
      case 'MONTHLY_PAID':
        return { label: 'Pro (Oylik)', color: 'bg-indigo-500', icon: <BadgeCheck size={24} /> };
      case 'EXPIRED':
        return { label: 'Muddati o\'tgan', color: 'bg-rose-50', icon: <Clock size={24} /> };
      default:
        return { label: 'Trial (Sinov)', color: 'bg-slate-500', icon: <UserCheck size={24} /> };
    }
  };

  const status = getStatusConfig(seller.status || 'TRIAL');

  const handleContact = async () => {
    if (seller.username) {
      window.open(`https://t.me/${seller.username}`, '_blank');
      return;
    }

    if (!currentUserChatId) {
      console.warn("Hozirgi user chat id topilmadi.");
      return;
    }

    setIsContacting(true);
    try {
      const tokenRes = await apiService.getAdminBotToken();
      if (tokenRes.success) {
        const { token, username: botUrl } = tokenRes.data;
        // Telegram Bot API orqali contact yuborish
        const contactUrl = `https://api.telegram.org/bot${token}/sendContact?chat_id=${currentUserChatId}&phone_number=${seller.phoneTelegram || seller.phone}&first_name=${encodeURIComponent(seller.firstname)}&last_name=${encodeURIComponent(seller.lastname || '')}`;
        
        await fetch(contactUrl);
        // Botga yo'naltirish
        window.open(botUrl, '_blank');
      }
    } catch (err) {
      console.error("Kontakt yuborishda xatolik:", err);
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#020617] sm:rounded-[3rem] rounded-t-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border-t sm:border border-white/10 dark:border-slate-800/50">
        {/* Header/Cover */}
        <div className={`h-32 ${status.color} relative`}>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/40 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-10 -mt-16 relative z-10">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 p-2 shadow-2xl mx-auto mb-6">
            <div className={`w-full h-full rounded-[2rem] ${status.color} flex items-center justify-center text-white text-4xl font-black uppercase ring-4 ring-white dark:ring-slate-950`}>
              {seller.firstname?.[0] || 'U'}{seller.lastname?.[0] || ''}
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
              {seller.firstname || 'Noma\'lum'} {seller.lastname || ''}
            </h3>
            <div className="flex items-center justify-center gap-2 text-indigo-500 font-bold text-sm">
              <AtSign size={14} />
              <span>{seller.username || 'private_user'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <InfoItem icon={<Hash size={16} />} label="Chat ID" value={seller.chatId?.toString() || '—'} />
            <InfoItem icon={<Phone size={16} />} label="Asosiy Telefon" value={seller.phone || '—'} />
            <InfoItem icon={<Send size={16} className="text-sky-500" />} label="Telegram" value={seller.phoneTelegram || seller.phone || '—'} />
            <InfoItem icon={<ShieldCheck size={16} />} label="Status" value={status.label} badgeColor={status.color} />
            <InfoItem icon={<Globe size={16} />} label="Til" value={seller.lang ? seller.lang.replace('_', ' ') : 'Kiritilmagan'} />
            <InfoItem icon={<Calendar size={16} />} label="Ro'yxatdan o'tgan" value={seller.created ? new Date(seller.created).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
          </div>

          <div className="grid grid-cols-1 gap-3 mt-8">
            <button 
              onClick={handleContact}
              disabled={isContacting}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isContacting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} fill="currentColor" />
              )}
              {isContacting ? "Bog'lanilmoqda..." : "Bog'lanish (TG)"}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-5 bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all border border-slate-200/50 dark:border-slate-800/50"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value, badgeColor }: { icon: React.ReactNode, label: string, value: string, badgeColor?: string }) => (
  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
    <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
      <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-[13px] font-bold ${badgeColor ? `${badgeColor} text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest` : 'text-slate-700 dark:text-slate-200'}`}>
      {value}
    </span>
  </div>
);
