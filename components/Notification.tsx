
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const config = {
    success: { icon: <CheckCircle2 size={20} />, bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    error: { icon: <AlertCircle size={20} />, bg: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
    info: { icon: <Info size={20} />, bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm animate-in slide-in-from-top-10 duration-300">
      <div className={`${config[type].bg} ${config[type].shadow} p-4 rounded-2xl flex items-center gap-3 text-white shadow-2xl border border-white/20`}>
        <div className="flex-shrink-0">{config[type].icon}</div>
        <p className="flex-1 text-xs font-black uppercase tracking-widest leading-tight">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
