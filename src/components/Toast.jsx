import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = 'info' } = toast;

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald" />,
    error: <AlertCircle size={18} className="text-rose" />,
    warning: <AlertCircle size={18} className="text-amber" />,
    info: <Info size={18} className="text-blue" />,
  };

  return (
    <div className={`toast-banner toast-${type} animate-fade-in`}>
      <div className="toast-icon">{icons[type] || icons.info}</div>
      <div className="toast-message">{message}</div>
      <button 
        type="button" 
        className="toast-close" 
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
