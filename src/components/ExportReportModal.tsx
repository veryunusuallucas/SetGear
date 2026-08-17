import React, { useRef } from 'react';
import { FileText, Download, Printer, X, Check, Truck, Box } from 'lucide-react';
import { Projeto, Equipamento, DailyPhase } from '../types/setgear';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Projeto;
  dailyDate: string;
  equipments: Equipamento[];
  activePhase: DailyPhase;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  project,
  dailyDate,
  equipments,
  activePhase,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Agrupamento por Carros e Containers
  const containers = equipments.filter(e => e.e_container);
  const orphanItems = equipments.filter(e => !e.e_container && !e.container_pai_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="ui-card w-full max-w-3xl space-y-5 relative max-h-[90vh] flex flex-col shadow-2xl border border-[#2a2a2a]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A3FF]/15 text-[#00A3FF] flex items-center justify-center font-bold text-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Relatório de Embarque & Logística
              </h3>
              <p className="text-xs text-[#B0B0B0] font-medium">
                Projeto: <span className="text-white font-bold">{project.nome}</span> • Diária: {dailyDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="ui-btn-primary py-2 px-3 text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>IMPRIMIR / GERAR PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#B0B0B0] hover:text-white p-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTEÚDO DO RELATÓRIO PDF (PARA LEITURA E IMPRESSÃO) */}
        <div ref={printRef} className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs text-white">
          
          <div className="bg-[#2a2a2a] p-4 rounded-2xl border border-[#383838] space-y-2">
            <h4 className="text-sm font-bold text-[#00A3FF] uppercase tracking-wide">
              🎬 Lumavi SetGear — Relatório Técnico de Diária
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#B0B0B0] pt-1">
              <div><span className="text-white font-bold">Diretor:</span> {project.diretor || 'N/I'}</div>
              <div><span className="text-white font-bold">DP:</span> {project.dp_fotografia || 'N/I'}</div>
              <div><span className="text-white font-bold">Arte:</span> {project.diretor_arte || 'N/I'}</div>
              <div><span className="text-white font-bold">Gaffer:</span> {project.gaffer || 'N/I'}</div>
            </div>
          </div>

          {/* LISTA DE MALAS CONTAINER */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase text-xs flex items-center gap-2">
              <Box className="w-4 h-4 text-[#00A3FF]" /> MALAS CONTAINER & CONTEÚDO EMBARCADO ({containers.length})
            </h5>

            {containers.map(cont => {
              const children = equipments.filter(e => e.container_pai_id === cont.id);
              return (
                <div key={cont.id} className="bg-[#1a1a1a] p-3.5 rounded-2xl border border-[#2a2a2a] space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{cont.nome} ({cont.qr_code_id})</span>
                    <span className="status-badge bg-[#00A3FF] text-white text-[10px]">
                      {cont.carro_nome || 'Van Câmera'}
                    </span>
                  </div>

                  <div className="pl-3 border-l-2 border-[#00A3FF] space-y-1">
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between text-[#B0B0B0] text-[11px]">
                        <span>• {child.nome} ({child.qr_code_id})</span>
                        <span className="text-white font-semibold">
                          Status: {child.status_locacao || 'OK'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ITENS AVULSOS */}
          <div className="space-y-2 pt-2">
            <h5 className="font-bold text-white uppercase text-xs flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#2ED5A0]" /> ITENS AVULSOS DE SUPORTE & TRIPE
            </h5>

            <div className="bg-[#1a1a1a] p-3.5 rounded-2xl border border-[#2a2a2a] space-y-2">
              {orphanItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-[#B0B0B0] text-[11px] py-1 border-b border-[#2a2a2a] last:border-0">
                  <span className="font-bold text-white">{item.nome} ({item.qr_code_id})</span>
                  <span>Dono: {item.proprietario_nome}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
