import React, { useState } from 'react';
import { Bug, Send, CheckCircle2, Copy, FileText } from 'lucide-react';
import { store } from '../services/store';
import { BugReport } from '../types/setgear';

interface BugReportViewProps {
  onBackToApp: () => void;
}

export const BugReportView: React.FC<BugReportViewProps> = () => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [bugList, setBugList] = useState<BugReport[]>(store.getBugReports());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) return;

    store.saveBugReport(titulo.trim(), descricao.trim());
    setBugList(store.getBugReports());
    setTitulo('');
    setDescricao('');
    setFeedback('Bug salvo e empacotado para o desenvolvedor com sucesso!');
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopyLogs = () => {
    const jsonStr = JSON.stringify(bugList, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setFeedback('Copiado para a área de transferência! Cole nas mensagens para enviar ao dev.');
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 font-sans pb-24">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2a2a2a]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-[#FFB84D] animate-pulse" /> RECLAMAÇÕES & REPORTAR BUGS
          </h2>
          <p className="text-sm text-[#B0B0B0] font-medium mt-0.5">
            Relate qualquer erro. Os bugs são salvos localmente e no banco para depuração imediata.
          </p>
        </div>

        {bugList.length > 0 && (
          <button
            onClick={handleCopyLogs}
            className="ui-btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 shadow-lg active:scale-95 shrink-0"
          >
            <Copy className="w-4 h-4" />
            <span>COPIAR RELATÓRIO DE BUGS</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="bg-[#2ED5A0]/15 border border-[#2ED5A0] p-4 rounded-2xl text-sm font-semibold text-[#2ED5A0] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Form de Registro */}
      <form onSubmit={handleSubmit} className="ui-card space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wide">
          📝 Registrar Novo Relatório de Bug
        </h3>

        <div>
          <label className="block text-sm text-[#B0B0B0] mb-1 font-medium">Título do Problema:</label>
          <input
            type="text"
            required
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="ex: Leitura de QR Code falhou na mala Pelican..."
            className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-3 rounded-2xl focus:border-[#00A3FF] outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-[#B0B0B0] mb-1 font-medium">Descrição Detalhada do Erro:</label>
          <textarea
            required
            rows={4}
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o que aconteceu, qual botão foi clicado e qual equipamento apresentou o erro..."
            className="w-full bg-[#2a2a2a] border border-[#383838] text-white p-4 rounded-2xl focus:border-[#00A3FF] outline-none text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            className="ui-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>ENVIAR RELATÓRIO DE BUG</span>
          </button>
        </div>
      </form>

      {/* Lista de Bugs Salvos */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00A3FF]" /> RELATÓRIOS SALVOS ({bugList.length})
        </h3>

        {bugList.length === 0 ? (
          <div className="ui-card text-center text-sm text-[#B0B0B0]">
            Nenhum relato de bug registrado ainda.
          </div>
        ) : (
          bugList.map(bug => (
            <div key={bug.id} className="ui-card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-white text-base">{bug.titulo}</h4>
                <span className="status-badge status-badge-warning text-[10px]">
                  {bug.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-[#B0B0B0] whitespace-pre-wrap">{bug.descricao}</p>
              <div className="text-[11px] text-[#777777] pt-2 border-t border-[#2a2a2a] flex justify-between">
                <span>Autor: {bug.autor}</span>
                <span>Data: {bug.data_criacao}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
