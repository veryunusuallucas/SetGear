import React, { useState } from 'react';
import { 
  Plus, 
  Truck, 
  Calendar, 
  Check, 
  ArrowRight,
  Search,
  Lock,
  Layers
} from 'lucide-react';
import type { Projeto, Veiculo } from '../types/setgear';
import { APP_VERSAO_LABEL } from '../config/app';
import { store } from '../services/store';

interface ProjectManagerViewProps {
  projects: Projeto[];
  activeProject: Projeto;
  onSelectProject: (id: string) => void;
  onEnterProjectDaily: (projectId: string) => void;
  onLockApp: () => void;
}

export const ProjectManagerView: React.FC<ProjectManagerViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onEnterProjectDaily,
  onLockApp,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [diretor, setDiretor] = useState('');
  const [dpFotografia, setDpFotografia] = useState('');
  const [diretorArte, setDiretorArte] = useState('');
  const [gaffer, setGaffer] = useState('');
  // Sem setter de propósito: o formulário não tem campo para a quantidade de
  // diárias, então ela é sempre 2. A Fase 2 passa a receber as diárias do
  // SetProd — este campo tende a sair.
  const [diariasCount] = useState(2);
  const [veiculosList] = useState<Veiculo[]>([
    { id: 'v-1', nome: 'Carro 1 - Van Câmera & Luz' },
    { id: 'v-2', nome: 'Carro 2 - Van Grip & Suportes' },
  ]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const datas: string[] = [];
    const today = new Date();
    for (let i = 0; i < diariasCount; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      datas.push(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    }

    store.createProject({
      nome,
      descricao,
      diretor,
      dp_fotografia: dpFotografia,
      diretor_arte: diretorArte,
      gaffer,
      veiculos: veiculosList,
      diarias_datas: datas,
    });

    setShowForm(false);
  };

  const filteredProjects = projects.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.descricao || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ui-card space-y-6 font-sans">
      
      {/* CABEÇALHO PROJECT MANAGER ONE UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00A3FF]/15 text-[#00A3FF] flex items-center justify-center font-bold text-2xl shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Project Manager
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#2a2a2a] text-[#00A3FF] border border-[#383838] rounded-full font-bold">
                {APP_VERSAO_LABEL}
              </span>
            </div>
            <p className="text-xs text-[#B0B0B0] font-medium mt-0.5">
              Selecione um projeto/diária para abrir ou crie um novo projeto.
            </p>
          </div>
        </div>

        {/* AÇÕES DE CABEÇALHO */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className="ui-btn-primary py-2.5 px-4 text-xs flex items-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'FECHAR' : '➕ NOVO PROJETO / DIÁRIA'}</span>
          </button>

          <button
            onClick={onLockApp}
            className="ui-btn-secondary py-2.5 px-3 text-xs flex items-center gap-1.5 text-[#FFB84D]"
            title="Travar / Reautenticar perfil"
          >
            <Lock className="w-4 h-4" />
            <span>TRAVAR</span>
          </button>
        </div>
      </div>

      {/* FERRAMENTAS DE BUSCA E ORDENAÇÃO ONE UI */}
      <div className="bg-[#2a2a2a] p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-[#B0B0B0] shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar por nome do projeto..."
            className="bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl w-full sm:w-80 focus:outline-none focus:border-[#00A3FF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[#B0B0B0]">Ordenar:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="date">Mais recentes</option>
            <option value="name">Nome (A→Z)</option>
          </select>
        </div>
      </div>

      {/* FORMULÁRIO DE NOVO PROJETO */}
      {showForm && (
        <form onSubmit={handleCreateProject} className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#00A3FF] space-y-4 text-xs font-medium animate-fadeIn">
          <h3 className="text-[#00A3FF] font-bold uppercase text-sm border-b border-[#2a2a2a] pb-2">
            ➕ Cadastrar Novo Projeto de Filmagem
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#B0B0B0] mb-1">Nome do Projeto:</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="ex: Comercial O ÚLTIMO TROPEIRO..."
                className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-3 py-2 rounded-xl focus:border-[#00A3FF] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[#B0B0B0] mb-1">Descrição / Locação:</label>
              <input
                type="text"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="ex: Filmagem noturna em estúdio..."
                className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-3 py-2 rounded-xl focus:border-[#00A3FF] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#2a2a2a]">
            <span className="text-white font-bold block mb-2 uppercase">🎬 Equipe do Set & Chefias:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[#B0B0B0] text-[11px]">Diretor:</label>
                <input
                  type="text"
                  value={diretor}
                  onChange={e => setDiretor(e.target.value)}
                  placeholder="Nome do Diretor..."
                  className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-2.5 py-1.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#B0B0B0] text-[11px]">DP (Fotografia):</label>
                <input
                  type="text"
                  value={dpFotografia}
                  onChange={e => setDpFotografia(e.target.value)}
                  placeholder="Nome do DP..."
                  className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-2.5 py-1.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#B0B0B0] text-[11px]">Direção de Arte:</label>
                <input
                  type="text"
                  value={diretorArte}
                  onChange={e => setDiretorArte(e.target.value)}
                  placeholder="Nome do Arte..."
                  className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-2.5 py-1.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[#B0B0B0] text-[11px]">Gaffer:</label>
                <input
                  type="text"
                  value={gaffer}
                  onChange={e => setGaffer(e.target.value)}
                  placeholder="Nome do Gaffer..."
                  className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-2.5 py-1.5 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="ui-btn-secondary px-4 py-2 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ui-btn-primary px-5 py-2 text-xs shadow-lg"
            >
              CRIAR PROJETO
            </button>
          </div>
        </form>
      )}

      {/* GRID DE PROJETOS ONE UI */}
      <div className="space-y-3">
        <h3 className="text-xs text-[#B0B0B0] uppercase font-bold flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#00A3FF]" /> PROJETOS CADASTRADOS ({filteredProjects.length}):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(proj => {
            const isSelected = proj.id === activeProject.id;
            return (
              <div
                key={proj.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-[#1a1a1a] border-[#00A3FF] shadow-lg ring-1 ring-[#00A3FF]' 
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#383838]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="status-badge bg-[#00A3FF] text-white text-[10px]">
                        PROJETO
                      </span>
                      <h4 className="text-xl font-bold text-white mt-1">
                        {proj.nome}
                      </h4>
                      <p className="text-xs text-[#B0B0B0] mt-0.5">
                        {proj.descricao || 'Sem descrição cadastrada.'}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="status-badge status-badge-success text-xs shrink-0">
                        <Check className="w-3.5 h-3.5" /> SELECIONADO
                      </span>
                    )}
                  </div>

                  {/* Equipe do Set */}
                  <div className="pt-3 border-t border-[#2a2a2a] grid grid-cols-2 gap-2 text-xs text-[#B0B0B0] mb-3 font-medium">
                    <div><span className="text-white font-semibold">Diretor:</span> {proj.diretor || 'N/I'}</div>
                    <div><span className="text-white font-semibold">DP:</span> {proj.dp_fotografia || 'N/I'}</div>
                    <div><span className="text-white font-semibold">Arte:</span> {proj.diretor_arte || 'N/I'}</div>
                    <div><span className="text-white font-semibold">Gaffer:</span> {proj.gaffer || 'N/I'}</div>
                  </div>

                  {/* Diárias e Veículos */}
                  <div className="flex items-center justify-between text-xs text-[#B0B0B0] bg-[#2a2a2a] p-2.5 rounded-xl mb-4 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#FFB84D]" /> Diária: {proj.diarias_datas[0] || '18/07'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#00A3FF]" /> {proj.veiculos.length} Carros
                    </span>
                  </div>
                </div>

                {/* BOTÃO ABRIR PROJETO */}
                <button
                  onClick={() => {
                    onSelectProject(proj.id);
                    onEnterProjectDaily(proj.id);
                  }}
                  className="ui-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase font-bold"
                >
                  <span>ENTRAR NO PROJETO / DIÁRIA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
