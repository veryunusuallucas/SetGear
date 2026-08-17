import React from 'react';
import { Layers, Database, Settings, Bug } from 'lucide-react';
import { ActiveView } from '../types/setgear';

interface BottomNavigationProps {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  onChangeView,
}) => {
  const handleProjectsClick = () => {
    // Leva diretamente para o Project Manager
    onChangeView('projects');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] flex justify-around items-center h-20 z-40 px-3 font-sans shadow-2xl">
      
      {/* 1. Projetos (Navega para Project Manager) */}
      <button
        onClick={handleProjectsClick}
        onDoubleClick={() => onChangeView('projects')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${
          activeView === 'projects' || activeView === 'app'
            ? 'bg-[#00A3FF]/15 text-[#00A3FF] font-bold scale-105'
            : 'text-[#B0B0B0] hover:text-white'
        }`}
        title="Ver Lista de Projetos (Clique para Project Manager)"
      >
        <Layers className="w-5 h-5" />
        <span className="text-[11px] font-semibold">Projetos</span>
      </button>

      {/* 2. Database */}
      <button
        onClick={() => onChangeView('database')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${
          activeView === 'database'
            ? 'bg-[#00A3FF]/15 text-[#00A3FF] font-bold scale-105'
            : 'text-[#B0B0B0] hover:text-white'
        }`}
      >
        <Database className="w-5 h-5" />
        <span className="text-[11px] font-semibold">Database</span>
      </button>

      {/* 3. Bugs */}
      <button
        onClick={() => onChangeView('bugs')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${
          activeView === 'bugs'
            ? 'bg-[#00A3FF]/15 text-[#00A3FF] font-bold scale-105'
            : 'text-[#B0B0B0] hover:text-white'
        }`}
      >
        <Bug className="w-5 h-5" />
        <span className="text-[11px] font-semibold">Bugs</span>
      </button>

      {/* 4. Config */}
      <button
        onClick={() => onChangeView('settings')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all ${
          activeView === 'settings'
            ? 'bg-[#00A3FF]/15 text-[#00A3FF] font-bold scale-105'
            : 'text-[#B0B0B0] hover:text-white'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[11px] font-semibold">Config</span>
      </button>

    </footer>
  );
};
