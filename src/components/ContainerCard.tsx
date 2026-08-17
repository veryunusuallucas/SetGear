import React, { useState } from 'react';
import { 
  Box, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  QrCode, 
  Truck, 
  CheckCircle2,
  EyeOff,
  RotateCcw,
  Check
} from 'lucide-react';
import { Equipamento, ItemLocationStatus, BatteryStatus, UserRole, DailyPhase } from '../types/setgear';
import { TacticalCard } from './TacticalCard';

interface ContainerCardProps {
  container: Equipamento;
  childItems: Equipamento[];
  userRole: UserRole;
  activePhase?: DailyPhase;
  onUpdateLocation: (id: string, status: ItemLocationStatus) => void;
  onBatteryCheckPrompt?: (equipment: Equipamento) => void;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  childItems,
  userRole,
  activePhase = 'saida',
  onUpdateLocation,
  onBatteryCheckPrompt,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const isReadOnly = userRole === 'visualizador';

  const allInCarVolta = childItems.length > 0 && childItems.every(c => c.status_locacao === 'no_carro_volta' || c.status_locacao === 'ignorado');
  const allInSaida = childItems.length > 0 && childItems.every(c => c.status_locacao === 'no_carro_ida' || c.status_locacao === 'ignorado');
  const allIgnored = childItems.length > 0 && childItems.every(c => c.status_locacao === 'ignorado');

  return (
    <div className="ui-card border-2 border-[#00A3FF] space-y-4 font-sans relative overflow-hidden">
      
      {/* Etiqueta de Grupo */}
      <div className="absolute top-0 right-0 bg-[#00A3FF] text-white text-[10px] font-bold px-3 py-1 rounded-bl-2xl uppercase tracking-wider">
        CONTAINER / MALA PELICAN
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 pb-3 border-b border-[#2a2a2a]">
        <div className="flex items-start gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-[#00A3FF]/15 text-[#00A3FF] rounded-2xl hover:bg-[#00A3FF] hover:text-white transition-all"
            title={isOpen ? "Recolher Mala" : "Expandir Conteúdo da Mala"}
          >
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="status-badge bg-[#00A3FF] text-white text-[11px]">
                <Box className="w-3.5 h-3.5" /> CONTAINER
              </span>
              <span className="status-badge bg-[#2a2a2a] text-[#00A3FF] text-[11px]">
                <QrCode className="w-3.5 h-3.5" /> {container.qr_code_id}
              </span>
              {container.validado_por_qr && (
                <span className="status-badge status-badge-success text-[11px]">
                  <Check className="w-3.5 h-3.5" /> VERIFICADO ✓
                </span>
              )}
              <span className="status-badge status-badge-done text-[11px]">
                <Layers className="w-3.5 h-3.5 text-[#00A3FF]" /> {childItems.length} ITENS INTERNOS
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {container.nome}
              {allInSaida && activePhase === 'saida' && !allIgnored && (
                <span className="status-badge bg-[#00A3FF] text-white text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SAÍDA OK
                </span>
              )}
              {allInCarVolta && activePhase === 'volta' && !allIgnored && (
                <span className="status-badge status-badge-success text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VOLTA OK
                </span>
              )}
              {allIgnored && (
                <span className="status-badge status-badge-warning text-xs">
                  <EyeOff className="w-3.5 h-3.5" /> MALA IGNORADA
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Check em Cascata One UI */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 flex-wrap bg-[#2a2a2a] p-2.5 rounded-2xl">
            <span className="text-[11px] text-[#B0B0B0] font-semibold block w-full mb-1">
              ⚡ CHECK EM CASCATA DA MALA ({activePhase.toUpperCase()}):
            </span>
            
            {activePhase === 'saida' ? (
              <button
                onClick={() => onUpdateLocation(container.id, 'no_carro_ida')}
                className="px-3 py-1.5 rounded-xl bg-[#00A3FF] text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                <Truck className="w-3.5 h-3.5" /> SAÍDA TUDO (OK)
              </button>
            ) : (
              <button
                onClick={() => onUpdateLocation(container.id, 'no_carro_volta')}
                className="px-3 py-1.5 rounded-xl bg-[#2ED5A0] text-[#0f0f0f] font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" /> VOLTA TUDO (OK)
              </button>
            )}

            <button
              onClick={() => onUpdateLocation(container.id, 'ignorado')}
              className="px-3 py-1.5 rounded-xl bg-[#FFB84D] text-[#0f0f0f] font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-md"
            >
              <EyeOff className="w-3.5 h-3.5" /> IGNORAR MALA
            </button>
          </div>
        )}
      </div>

      {/* Lista de Itens Contidos */}
      {isOpen && (
        <div className="pl-2 sm:pl-4 border-l-2 border-[#00A3FF]/50 space-y-3 pt-2">
          {childItems.length === 0 ? (
            <p className="text-xs text-[#B0B0B0] py-2 italic">
              Nenhum acessório ou equipamento vinculado a este container.
            </p>
          ) : (
            childItems.map(item => (
              <TacticalCard
                key={item.id}
                item={item}
                userRole={userRole}
                activePhase={activePhase}
                onUpdateLocation={onUpdateLocation}
                onBatteryCheckPrompt={onBatteryCheckPrompt}
                isNested={true}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
