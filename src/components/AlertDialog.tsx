import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  cancelText?: string;
  actionText?: string;
  onAction: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  cancelText = 'Cancelar',
  actionText = 'Confirmar',
  onAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="ui-card w-full max-w-md space-y-5 relative shadow-2xl border border-[#383838]">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B0B0B0] hover:text-white p-1 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB84D]/20 text-[#FFB84D] flex items-center justify-center font-bold text-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-[#B0B0B0] font-medium leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary py-2.5 px-4 text-xs font-bold"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onAction();
              onClose();
            }}
            className="ui-btn-primary py-2.5 px-4 text-xs font-bold shadow-lg"
          >
            {actionText}
          </button>
        </div>

      </div>
    </div>
  );
};
