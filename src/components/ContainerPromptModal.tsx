import React from 'react';
import { Box, Layers, ArrowRight, X } from 'lucide-react';
import type { Equipamento } from '../types/setgear';

interface ContainerPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipamento | null;
  onSelectOption: (includeContainerFull: boolean) => void;
}

export const ContainerPromptModal: React.FC<ContainerPromptModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onSelectOption,
}) => {
  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="ui-card w-full max-w-lg space-y-5 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B0B0B0] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00A3FF]/20 text-[#00A3FF] flex items-center justify-center font-bold text-xl">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <span className="status-badge status-badge-warning text-[10px] font-mono">
              CONTAINER / MALA DETECTADA
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {equipment.nome}
            </h3>
          </div>
        </div>

        <p className="text-sm text-[#B0B0B0] font-medium leading-relaxed">
          Este equipamento pertence a um container de equipamentos. Como você deseja adicionar à diária?
        </p>

        <div className="space-y-3 pt-2">
          
          {/* Opção 1: Adicionar MALA CONTAINER COMPLETA */}
          <button
            onClick={() => {
              onSelectOption(true);
              onClose();
            }}
            className="ui-btn-primary w-full py-4 text-sm flex items-center justify-between px-5 shadow-lg group"
          >
            <div className="flex items-center gap-3 text-left">
              <Layers className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">MALA CONTAINER COMPLETA</p>
                <p className="text-xs text-cyan-100 font-normal">Adiciona a mala + todos os acessórios vinculados</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Opção 2: Adicionar Apenas Este Item Individual */}
          <button
            onClick={() => {
              onSelectOption(false);
              onClose();
            }}
            className="ui-btn-secondary w-full py-3.5 text-sm flex items-center justify-between px-5 hover:border hover:border-[#00A3FF]"
          >
            <div className="text-left">
              <p className="font-semibold text-white">APENAS ESTE ITEM INDIVIDUAL</p>
              <p className="text-xs text-[#B0B0B0]">Adiciona somente '{equipment.nome}' avulso</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#B0B0B0]" />
          </button>

        </div>

      </div>
    </div>
  );
};
