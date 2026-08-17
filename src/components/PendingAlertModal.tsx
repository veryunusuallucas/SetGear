import React from 'react';
import { AlertTriangle, Lock, Unlock, X, ArrowRight } from 'lucide-react';
import { Equipamento, DailyPhase } from '../types/setgear';

interface PendingAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPhase: DailyPhase;
  pendingItems: Equipamento[];
  onPhaseUnlocked: () => void;
}

export const PendingAlertModal: React.FC<PendingAlertModalProps> = ({
  isOpen,
  onClose,
  targetPhase,
  pendingItems,
  onPhaseUnlocked,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="ui-card w-full max-w-lg space-y-5 relative shadow-2xl border border-[#383838]">
        
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
            <span className="status-badge status-badge-warning text-[10px]">
              ATENÇÃO: ITENS PENDENTES
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Existem {pendingItems.length} equipamentos não checados
            </h3>
          </div>
        </div>

        <p className="text-sm text-[#B0B0B0] font-medium leading-relaxed">
          Para avançar para a etapa de <span className="text-white font-bold">{targetPhase.toUpperCase()}</span>, você precisa checar ou ignorar os seguintes itens:
        </p>

        <div className="bg-[#2a2a2a] p-3 rounded-2xl border border-[#383838] max-h-48 overflow-y-auto space-y-1.5 text-xs">
          {pendingItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded-xl text-white font-bold">
              <span>{item.nome}</span>
              <span className="text-[#FFB84D] text-[10px]">PENDENTE</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary w-full sm:w-auto py-2.5 px-4 text-xs font-bold"
          >
            VOLTAR E CONFERIR ITENS
          </button>
          
          <button
            type="button"
            onClick={() => {
              onPhaseUnlocked();
              onClose();
            }}
            className="ui-btn-primary w-full sm:w-auto py-2.5 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-1.5"
          >
            <Unlock className="w-4 h-4" />
            <span>IGNORAR PENDÊNCIAS E AVANÇAR</span>
          </button>
        </div>

      </div>
    </div>
  );
};
