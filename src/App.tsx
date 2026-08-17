import { useState, useEffect } from 'react';
import { 
  HeaderNavbar 
} from './components/HeaderNavbar';
import { 
  TacticalCard 
} from './components/TacticalCard';
import { 
  ContainerCard 
} from './components/ContainerCard';
import { 
  ScannerModal 
} from './components/ScannerModal';
import { 
  InventoryManager 
} from './components/InventoryManager';
import { 
  PendingAlertModal 
} from './components/PendingAlertModal';
import { 
  ProjectManagerView 
} from './components/ProjectManagerView';
import { 
  SettingsView 
} from './components/SettingsView';
import { 
  BugReportView 
} from './components/BugReportView';
import { 
  ExportReportModal 
} from './components/ExportReportModal';
import { 
  LockScreen 
} from './components/LockScreen';
import { 
  FirstSetupModal 
} from './components/FirstSetupModal';
import { 
  ContainerPromptModal 
} from './components/ContainerPromptModal';
import { 
  BatteryCheckModal 
} from './components/BatteryCheckModal';
import { 
  BottomNavigation 
} from './components/BottomNavigation';
import {
  AlertDialog
} from './components/AlertDialog';
import {
  SeletorDiaria
} from './components/SeletorDiaria';

import { store } from './services/store';
import type { 
  Equipamento, 
  DailyPhase, 
  ItemLocationStatus,
  UserRole,
  ActiveView,
  Diaria
} from './types/setgear';
import { 
  Truck, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  QrCode, 
  FileText, 
  Plus, 
  Box,
  Check
} from 'lucide-react';

export function App() {
  // Verificação de 1ª Inicialização (Criação Inicial de Senhas)
  const [isFirstSetupOpen, setIsFirstSetupOpen] = useState<boolean>(!store.hasConfiguredPasswords());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [equipments, setEquipments] = useState<Equipamento[]>(store.getDailyEquipments());
  const [masterEquipments, setMasterEquipments] = useState<Equipamento[]>(store.getMasterEquipments());
  const [dailies, setDailies] = useState<Diaria[]>(store.getDailiesForActiveProject());
  const [activeUser, setActiveUser] = useState(store.getActiveUser());
  const [userRole, setUserRole] = useState<UserRole>(store.getActiveUser().cargo);
  const [activePhase, setActivePhase] = useState<DailyPhase>('saida');
  
  // Visão Inicial Pós-Login: ProjectManager
  const [activeView, setActiveView] = useState<ActiveView>('projects');
  
  // Sem setter de propósito: não existe UI para trocar a categoria, então o
  // filtro é sempre 'all'. Deixar o setter aqui sugeria uma feature que não há.
  const [selectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modais de Prompt e Interação
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isExportIncompleteAlertOpen, setIsExportIncompleteAlertOpen] = useState<boolean>(false);

  const [isPendingModalOpen, setIsPendingModalOpen] = useState<boolean>(false);
  const [pendingTargetPhase, setPendingTargetPhase] = useState<DailyPhase>('volta');
  const [pendingItemsModalList, setPendingItemsModalList] = useState<Equipamento[]>([]);
  
  // Prompt de Container Completo
  const [containerPromptEquipment, setContainerPromptEquipment] = useState<Equipamento | null>(null);
  
  // Prompt de Bateria 100%
  const [batteryPromptEquipment, setBatteryPromptEquipment] = useState<Equipamento | null>(null);

  const [dailyStatusMessage, setDailyStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setEquipments(store.getDailyEquipments());
      setMasterEquipments(store.getMasterEquipments());
      setDailies(store.getDailiesForActiveProject());
      setActiveUser(store.getActiveUser());
      setUserRole(store.getActiveUser().cargo);
    });
    return unsubscribe;
  }, []);

  const projects = store.getProjects();
  const project = store.getActiveProject();
  const daily = store.getActiveDaily();

  const saidaDone = store.isSaidaComplete();
  const voltaDone = store.isVoltaComplete();
  const isDailyFinished = saidaDone && voltaDone;

  // Handlers de Autenticação
  const handleAuthenticate = (role: UserRole, userName: string) => {
    store.setUserRole(role);
    store.setActiveUserName(userName);
    setIsAuthenticated(true);
    setActiveView('projects');
  };

  const handleLockApp = () => {
    setIsAuthenticated(false);
  };

  // Handlers de Ações em Equipamentos
  const handleUpdateLocation = (id: string, newStatus: ItemLocationStatus) => {
    store.updateItemLocationStatus(id, newStatus);
  };

  // Prompt ao Selecionar Item / Container no Busca ou Scanner
  const handleAddEquipmentOnDemand = (equipment: Equipamento) => {
    if (equipment.e_container || equipment.container_pai_id) {
      setContainerPromptEquipment(equipment);
    } else {
      store.addEquipmentToDaily(equipment.id, false);
      setSearchQuery('');
    }
  };

  // Resposta do Prompt de Container
  const handleContainerPromptSelection = (includeFullContainer: boolean) => {
    if (containerPromptEquipment) {
      store.addEquipmentToDaily(containerPromptEquipment.id, includeFullContainer);
      setContainerPromptEquipment(null);
      setSearchQuery('');
    }
  };

  // Resposta do Prompt de Bateria 100%
  const handleBatteryCheckAnswer = (is100: boolean) => {
    if (batteryPromptEquipment) {
      store.setBattery100(batteryPromptEquipment.id, is100);
      setBatteryPromptEquipment(null);
    }
  };

  // Handler do Botão Exportar PDF Azul Inteligente
  const handleExportClick = () => {
    if (isDailyFinished) {
      setIsExportOpen(true);
    } else {
      setIsExportIncompleteAlertOpen(true);
    }
  };

  // Navegação de Fases (Saída <-> Volta)
  const handlePhaseClick = (targetPhase: DailyPhase) => {
    if (targetPhase === 'saida') {
      setActivePhase('saida');
      return;
    }

    if (targetPhase === 'volta') {
      if (saidaDone) {
        setActivePhase('volta');
      } else {
        const pending = store.getPendingItemsForPhase('saida');
        setPendingItemsModalList(pending);
        setPendingTargetPhase('volta');
        setIsPendingModalOpen(true);
      }
      return;
    }
  };

  const handleFinishDaily = () => {
    if (voltaDone) {
      setDailyStatusMessage('🎉 DIÁRIA CONCLUÍDA COM SUCESSO! Todos os equipamentos foram auditados e travados.');
      setTimeout(() => setDailyStatusMessage(null), 9000);
    } else {
      const pending = store.getPendingItemsForPhase('volta');
      setPendingItemsModalList(pending);
      setPendingTargetPhase('volta');
      setIsPendingModalOpen(true);
    }
  };

  // Separação de Containers vs Avulsos
  const containers = equipments.filter(e => e.e_container);
  const orphanOrRootItems = equipments.filter(e => !e.e_container && !e.container_pai_id);

  const filterMatches = (e: Equipamento) => {
    const matchesSearch = e.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.qr_code_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || e.categoria_id === selectedCategory;
    return matchesSearch && matchesCat;
  };

  // Itens do Master Não Adicionados à Diária Ativa (para busca sob demanda)
  const availableToAddMaster = masterEquipments.filter(e => 
    !equipments.some(active => active.id === e.id) &&
    (e.nome.toLowerCase().includes(searchQuery.toLowerCase()) || e.qr_code_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 1. TELA DE PRIMEIRA CONFIGURAÇÃO DE SENHAS
  if (isFirstSetupOpen) {
    return (
      <FirstSetupModal
        isOpen={isFirstSetupOpen}
        onComplete={() => setIsFirstSetupOpen(false)}
      />
    );
  }

  // 2. TELA DE BLOQUEIO E AUTENTICAÇÃO
  if (!isAuthenticated) {
    return <LockScreen onAuthenticate={handleAuthenticate} />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col font-sans antialiased pb-24">
      
      {/* Header One UI Navbar sem botão Menu */}
      <HeaderNavbar
        userRole={userRole}
        userName={activeUser.nome}
        projectName={project.nome}
        dailyDate={daily.data_diaria}
        onChangeView={(view) => setActiveView(view)}
        onLockApp={handleLockApp}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-4 space-y-6">

        {/* NAVEGAÇÃO POR VISÕES */}
        {activeView === 'projects' && (
          <ProjectManagerView
            projects={projects}
            activeProject={project}
            onSelectProject={(id) => store.setActiveProject(id)}
            onEnterProjectDaily={(id) => {
              store.setActiveProject(id);
              setActiveView('app');
            }}
            onLockApp={handleLockApp}
          />
        )}

        {activeView === 'database' && (
          <InventoryManager equipments={masterEquipments} userRole={userRole} />
        )}

        {activeView === 'settings' && (
          <SettingsView activeUser={activeUser} onBackToApp={() => setActiveView('app')} />
        )}

        {activeView === 'bugs' && (
          <BugReportView onBackToApp={() => setActiveView('app')} />
        )}

        {/* VISÃO DA DIÁRIA ATIVA DO PROJETO */}
        {activeView === 'app' && (
          <>
            {/* CABEÇALHO LIMPO ONE UI: NOME ÚNICO DO PROJETO E DIÁRIA */}
            <div className="ui-card space-y-3 relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="status-badge bg-[#00A3FF] text-white text-[11px]">
                      DIÁRIA: {daily.data_diaria}
                    </span>
                    <span className="status-badge status-badge-warning text-[11px]">
                      SAÍDA: {daily.horario_saida}
                    </span>
                    {isDailyFinished && (
                      <span className="status-badge status-badge-success text-[11px]">
                        <Check className="w-3.5 h-3.5" /> CONCLUÍDA
                      </span>
                    )}
                  </div>

                  {/* NOME DO PROJETO EM DESTAQUE ÚNICO GRANDE SOLICITADO */}
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                    {project.nome}
                  </h1>

                  <p className="text-sm text-[#B0B0B0] font-medium mt-0.5">
                    DP: {project.dp_fotografia || 'N/I'} • Diretor: {project.diretor || 'N/I'}
                  </p>
                </div>


                {/* BOTÃO EXPORTAR PDF AZUL VIBRANTE #00A3FF INTELIGENTE */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportClick}
                    className="ui-btn-primary py-3 px-4 text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 uppercase tracking-wide"
                    title="Exportar Relatório PDF da Diária"
                  >
                    <FileText className="w-4 h-4" />
                    <span>EXPORTAR RELATÓRIO PDF</span>
                  </button>
                </div>
              </div>

              {/* TROCA DE DIÁRIA DENTRO DO PROJETO */}
              <div className="pt-1 border-t border-[#2a2a2a]">
                <SeletorDiaria
                  datasPrevistas={project.diarias_datas ?? []}
                  diariasExistentes={dailies}
                  dataAtiva={daily.data_diaria}
                  onSelecionar={(data) => {
                    store.setDailyDate(data);
                    // A fase volta para SAÍDA: a diária escolhida tem a própria
                    // conferência, e herdar "estou na volta" da anterior faria a
                    // tela abrir numa fase que esta diária talvez nem alcançou.
                    setActivePhase('saida');
                  }}
                />
              </div>

            </div>

            {/* MENSAGEM DE STATUS DA DIÁRIA */}
            {dailyStatusMessage && (
              <div className="bg-[#2ED5A0]/15 border border-[#2ED5A0] p-4 rounded-2xl text-sm font-semibold text-[#2ED5A0] flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>{dailyStatusMessage}</span>
              </div>
            )}

            {/* NAVEGAÇÃO DAS 2 FASES (SAÍDA vs VOLTA) - PILLS ONE UI */}
            <section className="ui-card p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3 font-semibold text-xs">
                
                {/* SAÍDA */}
                <button
                  onClick={() => handlePhaseClick('saida')}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all ${
                    activePhase === 'saida'
                      ? 'ui-pill-active shadow-lg'
                      : 'ui-pill-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>SAÍDA (CASA → SET)</span>
                  </div>
                  {saidaDone && <span className="text-[10px] text-white">✓ OK</span>}
                </button>

                {/* VOLTA */}
                <button
                  onClick={() => handlePhaseClick('volta')}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all ${
                    activePhase === 'volta'
                      ? 'bg-[#2ED5A0] text-[#0f0f0f] font-bold rounded-2xl shadow-lg'
                      : saidaDone 
                        ? 'ui-pill-inactive'
                        : 'bg-[#2a2a2a]/50 text-[#666666] cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {saidaDone ? <RotateCcw className="w-4 h-4" /> : <Lock className="w-4 h-4 text-[#666666]" />}
                    <span className={!saidaDone ? 'line-through' : ''}>VOLTA (SET → CASA)</span>
                  </div>
                  {voltaDone && <span className="text-[10px]">✓ OK</span>}
                </button>

              </div>
            </section>

            {/* ADIÇÃO SOB DEMANDA: BARRA DE PESQUISA + SCANNER QR REPOSICIONADO LADO A LADO */}
            <div className="ui-card space-y-3">
              
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#B0B0B0] absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Adicionar ou buscar equipamento/QR..."
                    className="w-full bg-[#2a2a2a] border border-[#383838] text-white pl-11 pr-4 py-3 rounded-2xl text-sm focus:border-[#00A3FF] outline-none"
                  />
                </div>

                {/* SCANNER QR LADO A LADO COM A BUSCA SOLICITADO */}
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="ui-btn-primary py-3 px-4 text-xs font-bold flex items-center gap-2 shadow-lg shrink-0"
                  title="Escanear QR Code"
                >
                  <QrCode className="w-4 h-4" />
                  <span>SCANNER QR</span>
                </button>
              </div>

              {/* Sugestões de Itens do Master Não Adicionados */}
              {searchQuery.trim() !== '' && availableToAddMaster.length > 0 && (
                <div className="bg-[#2a2a2a] p-3 rounded-2xl space-y-2 border border-[#383838] font-sans">
                  <span className="text-xs font-semibold text-[#00A3FF] block">
                    ⚡ INCLUIR NA DIÁRIA ZERADA (CLIQUE PARA ADICIONAR):
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {availableToAddMaster.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleAddEquipmentOnDemand(item)}
                        className="flex items-center justify-between p-2.5 bg-[#1a1a1a] hover:bg-[#333333] rounded-xl cursor-pointer transition-all text-xs"
                      >
                        <span className="font-bold text-white">{item.nome} ({item.qr_code_id})</span>
                        <span className="text-[10px] text-[#00A3FF] font-semibold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> ADICIONAR
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* BANNER DINÂMICO DE VISUALIZAÇÃO DE FASE */}
            <div className={`ui-card transition-all ${
              activePhase === 'saida' 
                ? 'border border-[#00A3FF] bg-gradient-to-r from-[#1a1a1a] to-[#00A3FF]/20' 
                : 'border border-[#2ED5A0] bg-gradient-to-r from-[#1a1a1a] to-[#2ED5A0]/20'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl text-[#0f0f0f] font-bold ${
                    activePhase === 'saida' ? 'bg-[#00A3FF]' : 'bg-[#2ED5A0]'
                  }`}>
                    {activePhase === 'saida' ? <Truck className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#B0B0B0] block uppercase">
                      STATUS DA CONFERÊNCIA
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      FASE ATIVA: {activePhase === 'saida' ? 'SAÍDA (CASA → SET)' : 'VOLTA (SET → CASA)'}
                    </h3>
                  </div>
                </div>

                {activePhase === 'volta' && (
                  <button
                    onClick={handleFinishDaily}
                    className={`py-3 px-4 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg ${
                      voltaDone ? 'bg-[#2ED5A0] text-[#0f0f0f]' : 'bg-[#FFB84D] text-[#0f0f0f]'
                    }`}
                  >
                    {voltaDone ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{voltaDone ? 'ENCERRAR DIÁRIA' : 'CONCLUIR VOLTA'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* LISTAGEM DE CONTAINERS E EQUIPAMENTOS NA DIÁRIA */}
            <section className="space-y-4">
              {equipments.length === 0 ? (
                <div className="ui-card text-center py-10 space-y-3">
                  <Box className="w-12 h-12 text-[#B0B0B0] mx-auto opacity-50" />
                  <h3 className="text-lg font-bold text-white">Diária Zerada</h3>
                  <p className="text-sm text-[#B0B0B0] max-w-sm mx-auto">
                    Nenhum equipamento adicionado para esta diária ainda. Digite na barra acima ou escaneie o QR Code para incluir itens.
                  </p>
                </div>
              ) : (
                <>
                  {/* Containers */}
                  {containers.filter(filterMatches).map((container) => {
                    const children = equipments.filter(e => e.container_pai_id === container.id);
                    return (
                      <ContainerCard
                        key={container.id}
                        container={container}
                        childItems={children}
                        userRole={userRole}
                        activePhase={activePhase}
                        onUpdateLocation={handleUpdateLocation}
                        onBatteryCheckPrompt={(equip) => setBatteryPromptEquipment(equip)}
                      />
                    );
                  })}

                  {/* Itens Avulsos */}
                  <div className="space-y-3">
                    {orphanOrRootItems.filter(filterMatches).map((item) => (
                      <TacticalCard
                        key={item.id}
                        item={item}
                        activePhase={activePhase}
                        onUpdateLocation={handleUpdateLocation}
                        onBatteryCheckPrompt={(equip) => setBatteryPromptEquipment(equip)}
                        isNested={false}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}

      </main>

      {/* BARRA DE NAVEGAÇÃO INFERIOR ONE UI COM NAVEGAÇÃO PARA PROJECT MANAGER */}
      <BottomNavigation
        activeView={activeView}
        onChangeView={(view) => setActiveView(view)}
      />

      {/* ALERT DIALOG - ALERTA DE EXPORTAÇÃO INCOMPLETA */}
      <AlertDialog
        isOpen={isExportIncompleteAlertOpen}
        onClose={() => setIsExportIncompleteAlertOpen(false)}
        title="Relatório Parcial de Diária"
        description="Atenção: Algumas informações e checagens da diária ainda não foram concluídas. Deseja exportar o relatório parcial mesmo assim?"
        cancelText="Cancelar"
        actionText="Exportar Mesmo Assim"
        onAction={() => {
          setIsExportIncompleteAlertOpen(false);
          setIsExportOpen(true);
        }}
      />

      {/* Modais de Prompt */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        activePhase={activePhase}
        onScanSuccess={() => {}}
      />

      <PendingAlertModal
        isOpen={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
        targetPhase={pendingTargetPhase}
        pendingItems={pendingItemsModalList}
        onPhaseUnlocked={() => {
          setActivePhase(pendingTargetPhase);
        }}
      />

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        dailyDate={daily.data_diaria}
        equipments={equipments}
      />

      <ContainerPromptModal
        isOpen={!!containerPromptEquipment}
        onClose={() => setContainerPromptEquipment(null)}
        equipment={containerPromptEquipment}
        onSelectOption={handleContainerPromptSelection}
      />

      <BatteryCheckModal
        isOpen={!!batteryPromptEquipment}
        onClose={() => setBatteryPromptEquipment(null)}
        equipment={batteryPromptEquipment}
        onAnswer100Percent={handleBatteryCheckAnswer}
      />

    </div>
  );
}
