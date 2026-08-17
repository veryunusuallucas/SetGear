import React from 'react';
import { Lock, Unlock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface WrapProgressBarProps {
  percent: number;
  inCarVoltaCount: number;
  totalCount: number;
  pendingCount: number;
  canWrapComplete: boolean;
  onFinishDaily: () => void;
}

export const WrapProgressBar: React.FC<WrapProgressBarProps> = ({
  percent,
  inCarVoltaCount,
  totalCount,
  pendingCount,
  canWrapComplete,
  onFinishDaily,
}) => {
  return (
    <div className="bg-card-bg border-2 border-win-gray p-4 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-slate-100 uppercase tracking-wide">
              📊 PROGRAÇÃO DE WRAP (RETORNO AO VEÍCULO)
            </h2>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${
              canWrapComplete 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                : 'bg-amber-950 text-amber-300 border-amber-500'
            }`}>
              {percent}% CONCLUÍDO
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            {inCarVoltaCount} de {totalCount} itens conferidos e carregados no veículo de volta.
          </p>
        </div>

        {/* Trava de Segurança & Botão de Encerrar Diária */}
        <div className="flex items-center gap-2">
          {!canWrapComplete ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/80 px-3 py-2 text-amber-200 font-mono text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>TRAVA ATIVA: {pendingCount} ITEM(NS) PENDENTE(S) FORA DO CARRO</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500 px-3 py-2 text-emerald-300 font-mono text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% NO VEÍCULO - PRONTO PARA FECHAR</span>
            </div>
          )}

          <button
            disabled={!canWrapComplete}
            onClick={onFinishDaily}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold transition-all border ${
              canWrapComplete
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-lg cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
            }`}
            title={canWrapComplete ? "Encerrar Diária com Segurança" : "Bloqueado: Carregue todos os itens no carro para encerrar"}
          >
            {canWrapComplete ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>ENCERRAR DIÁRIA</span>
          </button>
        </div>
      </div>

      {/* Barra de Progresso Estilo Tático */}
      <div className="w-full bg-slate-950 h-5 border border-slate-700 p-0.5 relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            canWrapComplete ? 'bg-emerald-500' : 'bg-win-teal'
          }`}
          style={{ width: `${percent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
          {inCarVoltaCount} / {totalCount} ITENS RETORNADOS ({percent}%)
        </div>
      </div>
    </div>
  );
};
