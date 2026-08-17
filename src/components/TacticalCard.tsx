import React from 'react';
import { 
  BatteryCharging, 
  Battery, 
  Truck, 
  RotateCcw, 
  QrCode,
  Tag,
  EyeOff,
  Lock,
  Check,
  AlertTriangle
} from 'lucide-react';
import type { Equipamento, ItemLocationStatus, DailyPhase } from '../types/setgear';
import { store } from '../services/store';

/**
 * Nota: este card recebia `userRole` e nunca o usava — quem decide se pode
 * editar é `store.canUserEditEquipment(item)`, logo abaixo. A prop foi removida
 * porque dava a impressão de haver controle por papel aqui, e não havia.
 *
 * O controle real ainda é fraco: o store compara o nome do dono com o nome do
 * usuário por substring ("Ana" casa com "Mariana"). Corrigir isso é da Fase 2,
 * quando entra autenticação de verdade — ver §1.3 e Fase 2 do PLANO.md.
 */
interface TacticalCardProps {
  item: Equipamento;
  activePhase?: DailyPhase;
  onUpdateLocation: (id: string, status: ItemLocationStatus) => void;
  onBatteryCheckPrompt?: (equipment: Equipamento) => void;
  isNested?: boolean;
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
  item,
  activePhase = 'saida',
  onUpdateLocation,
  onBatteryCheckPrompt,
  isNested = false,
}) => {
  const canEdit = store.canUserEditEquipment(item);
  const isBatteryCategory = item.categoria_id === 'cat-3' || item.nome.toLowerCase().includes('bateria');
  const isIgnored = item.status_locacao === 'ignorado';
  const isSaidaOk = item.status_locacao === 'no_carro_ida';
  const isVoltaOk = item.status_locacao === 'no_carro_volta';

  const handleSaidaClick = () => {
    if (!canEdit) return;
    onUpdateLocation(item.id, 'no_carro_ida');
    if (isBatteryCategory && onBatteryCheckPrompt) {
      onBatteryCheckPrompt(item);
    }
  };

  return (
    <div className={`ui-card transition-all font-sans ${isNested ? 'bg-[#151515] border border-[#2a2a2a] p-4 rounded-2xl' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Informações do Equipamento */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            
            {/* Categoria */}
            <span className="status-badge status-badge-done text-[11px]">
              {item.categoria_nome || 'Equipamento'}
            </span>

            {/* Dono / Proprietário */}
            {item.proprietario_nome && (
              <span className={`status-badge text-[11px] ${
                canEdit ? 'bg-[#2a2a2a] text-[#B0B0B0]' : 'bg-[#FFB84D]/20 text-[#FFB84D]'
              }`}>
                <Tag className="w-3 h-3" />
                {item.proprietario_nome}
                {!canEdit && <Lock className="w-2.5 h-2.5 ml-0.5" />}
              </span>
            )}

            {/* QR Code */}
            <span className="status-badge bg-[#00A3FF]/15 text-[#00A3FF] text-[11px]">
              <QrCode className="w-3 h-3" />
              {item.qr_code_id}
            </span>

            {/* SELO VERIFICADO ✓ */}
            {item.validado_por_qr && (
              <span className="status-badge status-badge-success text-[11px]">
                <Check className="w-3.5 h-3.5 font-bold" /> VERIFICADO ✓
              </span>
            )}

            {/* Carro Atribuído */}
            {item.carro_nome && (
              <span className="status-badge bg-[#2a2a2a] text-[#00A3FF] text-[11px]">
                <Truck className="w-3 h-3" /> {item.carro_nome}
              </span>
            )}

            {/* Badge de Ignorado */}
            {isIgnored && (
              <span className="status-badge status-badge-warning text-[11px]">
                <EyeOff className="w-3 h-3" /> IGNORADO
              </span>
            )}

            {/* Alerta de Bateria Não 100% */}
            {item.bateria_alerta_100 && (
              <span className="status-badge bg-[#FFB84D] text-[#0f0f0f] text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3" /> NÃO ESTÁ 100%
              </span>
            )}
          </div>

          <h3 className={`text-base font-bold ${isIgnored ? 'text-[#B0B0B0] line-through' : 'text-white'} tracking-tight`}>
            {item.nome}
          </h3>
        </div>

        {/* Carga de Bateria */}
        {isBatteryCategory && (
          <div className="flex items-center gap-1.5 bg-[#2a2a2a] px-2.5 py-1.5 rounded-2xl self-start sm:self-center">
            <span className="text-xs text-[#B0B0B0] font-semibold pr-1">CARGA:</span>
            
            {/* Toggle Carga Carregando */}
            <button
              disabled={!canEdit}
              onClick={() => store.toggleBatteryCharging(item.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                item.bateria_carregando 
                  ? 'bg-[#FFB84D] text-[#0f0f0f] shadow-md animate-pulse' 
                  : 'bg-[#1a1a1a] text-[#B0B0B0] hover:text-white'
              }`}
              title="Alternar Colocado para Carregar"
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>{item.bateria_carregando ? 'CARREGANDO' : 'CARREGAR'}</span>
            </button>

            {/* Status 100% */}
            {item.status_carga === '100_porcento' && (
              <span className="status-badge status-badge-success text-[10px]">
                <Battery className="w-3.5 h-3.5" /> 100%
              </span>
            )}
          </div>
        )}
      </div>

      {/* BOTÕES DE AÇÃO ESTILO MANAGEMENT BAR (ÍCONE VISÍVEL COM EXPANSÃO DO TEXTO NO HOVER) */}
      <div className="mt-4 pt-3 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-2 justify-end">
          
          {activePhase === 'saida' ? (
            <>
              {/* SAÍDA (OK) - MANAGEMENT BAR HOVER BUTTON */}
              <button
                disabled={!canEdit}
                onClick={handleSaidaClick}
                className={`group flex items-center gap-2 py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all overflow-hidden ${
                  isSaidaOk 
                    ? 'bg-[#00A3FF] text-white shadow-lg' 
                    : 'bg-[#2a2a2a] text-[#00A3FF] hover:bg-[#00A3FF] hover:text-white'
                } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                title="Saída (OK)"
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
                  SAÍDA (OK)
                </span>
              </button>

              {/* IGNORAR - MANAGEMENT BAR HOVER BUTTON */}
              <button
                disabled={!canEdit}
                onClick={() => onUpdateLocation(item.id, 'ignorado')}
                className={`group flex items-center gap-2 py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all overflow-hidden ${
                  isIgnored 
                    ? 'bg-[#FFB84D] text-[#0f0f0f] shadow-lg' 
                    : 'bg-[#2a2a2a] text-[#FFB84D] hover:bg-[#FFB84D] hover:text-[#0f0f0f]'
                } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                title="Ignorar Item"
              >
                <EyeOff className="w-4 h-4 shrink-0" />
                <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
                  IGNORAR
                </span>
              </button>
            </>
          ) : (
            <>
              {/* VOLTA (OK) - MANAGEMENT BAR HOVER BUTTON */}
              <button
                disabled={!canEdit}
                onClick={() => onUpdateLocation(item.id, 'no_carro_volta')}
                className={`group flex items-center gap-2 py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all overflow-hidden ${
                  isVoltaOk 
                    ? 'bg-[#2ED5A0] text-[#0f0f0f] shadow-lg' 
                    : 'bg-[#2a2a2a] text-[#2ED5A0] hover:bg-[#2ED5A0] hover:text-[#0f0f0f]'
                } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                title="Volta (OK)"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
                  VOLTA (OK)
                </span>
              </button>

              {/* IGNORAR - MANAGEMENT BAR HOVER BUTTON */}
              <button
                disabled={!canEdit}
                onClick={() => onUpdateLocation(item.id, 'ignorado')}
                className={`group flex items-center gap-2 py-2.5 px-3.5 rounded-2xl font-bold text-xs transition-all overflow-hidden ${
                  isIgnored 
                    ? 'bg-[#FFB84D] text-[#0f0f0f] shadow-lg' 
                    : 'bg-[#2a2a2a] text-[#FFB84D] hover:bg-[#FFB84D] hover:text-[#0f0f0f]'
                } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                title="Ignorar Item"
              >
                <EyeOff className="w-4 h-4 shrink-0" />
                <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
                  IGNORAR
                </span>
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
