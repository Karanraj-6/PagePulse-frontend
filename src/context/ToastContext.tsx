import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserPlus, X, MessageCircle } from 'lucide-react';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            <style>{`
        .toast-popup {
          position: fixed; top: 120px; right: 30px; z-index: 9999;
          background-color: #111; color: #fff; padding: 16px 24px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex; align-items: center; gap: 12px; animation: slideIn 0.3s ease-out;
        }
        .toast-success { border-left: 4px solid #d4af37; }
        .toast-error { border-left: 4px solid #ef4444; }
        .toast-info { border-left: 4px solid #3b82f6; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

            {children}

            {toast && (
                <div className={`toast-popup ${toast.type === 'success' ? 'toast-success' : toast.type === 'error' ? 'toast-error' : 'toast-info'}`}>
                    {toast.type === 'success' && <UserPlus size={20} className="text-[#d4af37]" />}
                    {toast.type === 'error' && <X size={20} className="text-red-500" />}
                    {toast.type === 'info' && <MessageCircle size={20} className="text-blue-500" />}
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
};
