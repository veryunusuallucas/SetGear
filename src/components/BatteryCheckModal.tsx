import React from 'react';
import { BatteryCharging, Check, AlertTriangle, X } from 'lucide-react';
import type { Equipamento } from '../types/setgear';

interface BatteryCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipamento | null;
  onAnswer100Percent: (is100: boolean) => void;
}

export const BatteryCheckModal: React.FC<BatteryCheckModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onAnswer100Percent,
}) => {
  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="ui-card w-full max-w-md space-y-5 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B0B0B0] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB84D]/20 text-[#FFB84D] flex items-center justify-center font-bold text-xl">
            <BatteryCharging className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="status-badge status-badge-warning text-[10px] font-mono">
              CONFERÊNCIA DE BATERIA
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {equipment.nome}
            </h3>
          </div>
        </div>

        <p className="text-sm text-white font-semibold leading-relaxed text-center py-2">
          ⚡ Esta bateria está 100% CARREGADA para ir ao set?
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          
          {/* Sim: 100% Carregada */}
          <button
            onClick={() => {
              onAnswer100Percent(true);
              onClose();
            }}
            className="ui-btn-primary py-3.5 text-sm flex items-center justify-center gap-2 bg-[#2ED5A0] text-[#0f0f0f] font-bold shadow-lg"
          >
            <Check className="w-5 h-5" />
            <span>SIM, 100% CARREGADA</span>
          </button>

          {/* Não: Deixar Alerta Amarelo/Laranja */}
          <button
            onClick={() => {
              onAnswer100Percent(false);
              onClose();
            }}
            className="ui-btn-secondary py-3.5 text-sm flex items-center justify-center gap-2 bg-[#FFB84D] text-[#0f0f0f] font-bold"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>NÃO ESTÁ 100% (ALERTA)</span>
          </button>

        </div>

      </div>
    </div>
  );
};
