import React, { useState } from 'react';
import { QrCode, X, Check, Camera, Box, Layers, Zap } from 'lucide-react';
import { store } from '../services/store';
import type { DailyPhase } from '../types/setgear';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePhase: DailyPhase;
  onScanSuccess?: (message: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  activePhase,
  onScanSuccess,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const targetStatus = activePhase === 'saida' ? 'no_carro_ida' : 'no_carro_volta';

  const handleSimulateScan = (code: string) => {
    const res = store.updateByQRCode(code, targetStatus);
    setScanResult(res);
    if (res.success && onScanSuccess) {
      onScanSuccess(res.message);
    }
    setTimeout(() => {
      setScanResult(null);
    }, 4000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSimulateScan(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="ui-card w-full max-w-lg space-y-5 relative shadow-2xl border border-[#2a2a2a]">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#B0B0B0] hover:text-white p-1 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho One UI */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00A3FF]/15 text-[#00A3FF] flex items-center justify-center font-bold text-xl shrink-0">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Scanner QR Code
              </h3>
              <span className="status-badge status-badge-success text-[10px]">
                <Check className="w-3.5 h-3.5" /> VERIFICADO ✓
              </span>
            </div>
            <p className="text-xs text-[#B0B0B0] font-medium">
              Fase Ativa: <span className="text-white font-bold">{activePhase.toUpperCase()}</span> → Definir: <span className="text-[#00A3FF] font-bold">{targetStatus}</span>
            </p>
          </div>
        </div>

        {/* Visor de Leitura da Câmera (One UI Style) */}
        <div className="bg-[#2a2a2a] p-6 rounded-2xl border border-[#383838] flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-[#00A3FF]/10 border-2 border-[#00A3FF] flex items-center justify-center text-[#00A3FF] shadow-lg animate-pulse">
            <QrCode className="w-10 h-10" />
          </div>
          <p className="text-xs text-[#B0B0B0] font-medium max-w-xs">
            Aponte a câmera do dispositivo para a etiqueta QR Code do equipamento ou container.
          </p>
        </div>

        {/* Feedback do Scanner */}
        {scanResult && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            scanResult.success ? 'bg-[#2ED5A0]/15 text-[#2ED5A0] border border-[#2ED5A0]' : 'bg-red-950/80 text-red-300 border border-red-500'
          }`}>
            <Check className="w-4 h-4 shrink-0" />
            <span>{scanResult.message}</span>
          </div>
        )}

        {/* Digitação Manual de QR */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            placeholder="Digite o código QR (ex: CONTAINER-RED-01)..."
            className="flex-1 bg-[#2a2a2a] border border-[#383838] text-white px-4 py-2.5 rounded-2xl text-xs focus:border-[#00A3FF] outline-none"
          />
          <button
            type="submit"
            className="ui-btn-primary py-2.5 px-4 text-xs font-bold shadow-lg shrink-0"
          >
            LEITURA
          </button>
        </form>

        {/* Atalhos Rápidos para Simular Escaneamento */}
        <div className="space-y-2 pt-2 border-t border-[#2a2a2a]">
          <span className="text-[11px] text-[#B0B0B0] font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#FFB84D]" /> SIMULAR LEITURA QR CODE DE ETIQUETA:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleSimulateScan('CONTAINER-RED-01')}
              className="ui-btn-secondary py-2.5 px-3 flex items-center gap-2 justify-start hover:border hover:border-[#00A3FF]"
            >
              <Box className="w-4 h-4 text-[#00A3FF]" />
              <span className="truncate">Mala RED Komodo</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateScan('CONTAINER-BAT-02')}
              className="ui-btn-secondary py-2.5 px-3 flex items-center gap-2 justify-start hover:border hover:border-[#00A3FF]"
            >
              <Box className="w-4 h-4 text-[#00A3FF]" />
              <span className="truncate">Case Baterias</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateScan('EQ-CAM-6K-01')}
              className="ui-btn-secondary py-2.5 px-3 flex items-center gap-2 justify-start hover:border hover:border-[#00A3FF]"
            >
              <Layers className="w-4 h-4 text-[#2ED5A0]" />
              <span className="truncate">Corpo RED Komodo</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateScan('BAT-VM-98-01')}
              className="ui-btn-secondary py-2.5 px-3 flex items-center gap-2 justify-start hover:border hover:border-[#00A3FF]"
            >
              <Layers className="w-4 h-4 text-[#FFB84D]" />
              <span className="truncate">Bateria V-Mount #01</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
