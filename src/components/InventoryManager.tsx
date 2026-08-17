import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Search, 
  Layers,
  Tag,
  QrCode,
  Box
} from 'lucide-react';
import type { Equipamento, UserRole } from '../types/setgear';
import { store } from '../services/store';

interface InventoryManagerProps {
  equipments: Equipamento[];
  userRole: UserRole;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  equipments,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('cat-1');
  const [proprietarioNome, setProprietarioNome] = useState('Eugenio (DP)');
  const [eContainer, setEContainer] = useState(false);
  const [containerPaiId, setContainerPaiId] = useState<string | null>(null);

  const canManage = userRole === 'admin' || userRole === 'operador';
  const isAdmin = userRole === 'admin';

  const containersList = equipments.filter(e => e.e_container);

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !canManage) return;

    const qrCodeId = `EQ-${Date.now().toString().slice(-6)}`;
    const catMap: Record<string, string> = {
      'cat-1': 'Câmeras & Corpos',
      'cat-2': 'Lentes & Cine Primes',
      'cat-3': 'Baterias & Energia',
      'cat-4': 'Suportes & Grips',
      'cat-5': 'Containers & Cases',
    };

    store.addEquipment({
      nome: nome.trim(),
      categoria_id: categoriaId,
      categoria_nome: catMap[categoriaId] || 'Geral',
      proprietario_nome: proprietarioNome.trim(),
      qr_code_id: qrCodeId,
      e_container: eContainer,
      container_pai_id: eContainer ? null : containerPaiId,
      carro_id: 'v-1',
      carro_nome: 'Carro 1 - Van Câmera & Luz',
    });

    setNome('');
    setShowAddForm(false);
  };

  const filteredEquipments = equipments.filter(e => {
    const matchesSearch = e.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.qr_code_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.proprietario_nome || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || e.categoria_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="ui-card space-y-6 font-sans">
      
      {/* CABEÇALHO DATABASE MASTER ONE UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00A3FF]/15 text-[#00A3FF] flex items-center justify-center font-bold text-2xl shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Database Master & Cadastros
            </h2>
            <p className="text-xs text-[#B0B0B0] font-medium mt-0.5">
              Acervo global de equipamentos. Edição liberada para ADMIN e OPERADOR.
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="ui-btn-primary py-2.5 px-4 text-xs flex items-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'FECHAR' : '➕ ADICIONAR ITEM AO BANCO'}</span>
          </button>
        )}
      </div>

      {/* DASHBOARD DE CARDS INFORMATIVOS ONE UI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
        <div className="bg-[#2a2a2a] p-3.5 rounded-2xl border border-[#383838]">
          <span className="text-[#B0B0B0] block text-[11px]">DATABASE COMPLETO</span>
          <span className="text-lg font-bold text-white mt-0.5 block">{equipments.length} Itens</span>
        </div>
        <div className="bg-[#2a2a2a] p-3.5 rounded-2xl border border-[#383838]">
          <span className="text-[#B0B0B0] block text-[11px]">CONTAINERS / MALAS</span>
          <span className="text-lg font-bold text-[#00A3FF] mt-0.5 block">{containersList.length} Malas</span>
        </div>
        <div className="bg-[#2a2a2a] p-3.5 rounded-2xl border border-[#383838]">
          <span className="text-[#B0B0B0] block text-[11px]">ACESSÓRIOS VINCULADOS</span>
          <span className="text-lg font-bold text-[#2ED5A0] mt-0.5 block">
            {equipments.filter(e => !!e.container_pai_id).length} Itens
          </span>
        </div>
        <div className="bg-[#2a2a2a] p-3.5 rounded-2xl border border-[#383838]">
          <span className="text-[#B0B0B0] block text-[11px]">PERMISSÃO ATUAL</span>
          <span className="text-xs font-bold text-[#00A3FF] mt-1 block uppercase">
            {userRole.toUpperCase()}
          </span>
        </div>
      </div>

      {/* FORMULÁRIO DE CADASTRO ONE UI */}
      {showAddForm && (
        <form onSubmit={handleAddEquipment} className="bg-[#2a2a2a] p-5 rounded-2xl border border-[#00A3FF] space-y-4 text-xs font-medium animate-fadeIn">
          <h3 className="text-[#00A3FF] font-bold uppercase text-sm border-b border-[#383838] pb-2">
            ➕ Cadastrar Novo Equipamento no Acervo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#B0B0B0] mb-1 font-semibold">Nome do Equipamento:</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="ex: Monitor SmallHD Cine 7..."
                className="w-full bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl focus:border-[#00A3FF] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[#B0B0B0] mb-1 font-semibold">Categoria:</label>
              <select
                value={categoriaId}
                onChange={e => setCategoriaId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl outline-none"
              >
                <option value="cat-1">Câmeras & Corpos</option>
                <option value="cat-2">Lentes & Cine Primes</option>
                <option value="cat-3">Baterias & Energia</option>
                <option value="cat-4">Suportes & Grips</option>
                <option value="cat-5">Containers & Cases</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#B0B0B0] mb-1 font-semibold">Proprietário / Dono:</label>
              <input
                type="text"
                required
                value={proprietarioNome}
                onChange={e => setProprietarioNome(e.target.value)}
                placeholder="ex: Eugenio (DP) ou CineRent..."
                className="w-full bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl focus:border-[#00A3FF] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="checkContainer"
                checked={eContainer}
                onChange={e => setEContainer(e.target.checked)}
                className="w-4 h-4 accent-[#00A3FF]"
              />
              <label htmlFor="checkContainer" className="text-white font-bold cursor-pointer">
                Este item é uma MALA CONTAINER?
              </label>
            </div>
          </div>

          {!eContainer && (
            <div>
              <label className="block text-[#B0B0B0] mb-1 font-semibold">Vincular a qual Container? (Opcional):</label>
              <select
                value={containerPaiId || ''}
                onChange={e => setContainerPaiId(e.target.value || null)}
                className="w-full bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl outline-none"
              >
                <option value="">Nenhum (Item Avulso)</option>
                {containersList.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.qr_code_id})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="ui-btn-secondary px-4 py-2 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ui-btn-primary px-5 py-2 text-xs shadow-lg"
            >
              CADASTRA NO BANCO
            </button>
          </div>
        </form>
      )}

      {/* FERRAMENTA DE BUSCA E FILTRO ONE UI */}
      <div className="bg-[#2a2a2a] p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-[#B0B0B0] shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar no banco por nome, QR ou dono..."
            className="bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl w-full sm:w-80 focus:outline-none focus:border-[#00A3FF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[#B0B0B0]">Categoria:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[#1a1a1a] border border-[#383838] text-white px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="all">TODAS AS CATEGORIAS</option>
            <option value="cat-1">Câmeras & Corpos</option>
            <option value="cat-2">Lentes & Cine Primes</option>
            <option value="cat-3">Baterias & Energia</option>
            <option value="cat-4">Suportes & Grips</option>
            <option value="cat-5">Containers & Cases</option>
          </select>
        </div>
      </div>

      {/* TABELA DE EQUIPAMENTOS DO BANCO ONE UI */}
      <div className="space-y-2">
        {filteredEquipments.map(item => (
          <div
            key={item.id}
            className="bg-[#2a2a2a] p-4 rounded-2xl border border-[#383838] hover:border-[#00A3FF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1a1a1a] text-[#00A3FF] shrink-0">
                {item.e_container ? <Box className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="status-badge status-badge-done text-[10px]">
                    {item.categoria_nome || 'Equipamento'}
                  </span>
                  <span className="status-badge bg-[#00A3FF]/15 text-[#00A3FF] text-[10px]">
                    <QrCode className="w-3 h-3" /> {item.qr_code_id}
                  </span>
                  {item.proprietario_nome && (
                    <span className="status-badge bg-[#1a1a1a] text-[#B0B0B0] text-[10px]">
                      <Tag className="w-3 h-3 text-[#FFB84D]" /> {item.proprietario_nome}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white text-sm">{item.nome}</h4>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  if (confirm(`Excluir '${item.nome}' do acervo master?`)) {
                    store.deleteEquipment(item.id);
                  }
                }}
                className="p-2 text-[#FFB84D] hover:bg-red-950 hover:text-red-400 rounded-xl transition-all self-end sm:self-center"
                title="Excluir item (Apenas Admin)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
