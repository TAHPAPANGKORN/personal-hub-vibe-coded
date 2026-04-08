"use client";

import { useEffect } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone. Please confirm to proceed.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: "bg-red-600 hover:bg-red-700",
      icon: <Trash2 className="text-red-500" size={24} />,
      shadow: "shadow-red-900/30",
    },
    warning: {
      bg: "bg-yellow-600 hover:bg-yellow-700",
      icon: <AlertTriangle className="text-yellow-500" size={24} />,
      shadow: "shadow-yellow-900/30",
    },
    primary: {
      bg: "bg-purple-600 hover:bg-purple-700",
      icon: <AlertTriangle className="text-purple-500" size={24} />,
      shadow: "shadow-purple-900/30",
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {style.icon}
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-8">
          <p className="text-zinc-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 ${style.bg} text-white text-sm font-bold rounded-xl transition-all shadow-lg ${style.shadow} active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose} />
    </div>
  );
}
