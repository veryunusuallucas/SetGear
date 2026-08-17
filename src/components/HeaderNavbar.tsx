import React from 'react';
import { 
  Lock,
  ArrowLeft,
  Eye,
  UserCheck
} from 'lucide-react';
import { UserRole, ActiveView } from '../types/setgear';

interface HeaderNavbarProps {
  userRole: UserRole;
  userName: string;
  projectName: string;
  dailyDate: string;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onLockApp: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  userRole,
  userName,
  projectName,
  dailyDate,
  activeView,
  onChangeView,
  onLockApp,
}) => {
  const isReadOnly = userRole === 'visualizador';

  return (
    <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 sticky top-0 z-30 font-sans shadow-md">
      
      {/* BANNER MODO VISUALIZAÇÃO */}
      {isReadOnly && (
        <div className="bg-[#FFB84D] text-[#0f0f0f] text-xs font-bold text-center py-1 px-4 mb-2 -mx-4 -mt-3 flex items-center justify-center gap-1.5">
          <Eye className="w-4 h-4" /> MODO VISUALIZAÇÃO — APENAS LEITURA (SEM SENHA DE OP/ADMIN)
        </div>
      )}

      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        
        {/* LOGO + VERSÃO v1.2.0 + BOTÃO ← PROJETOS */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onChangeView('projects')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-[#00A3FF] rounded-2xl flex items-center justify-center font-bold text-white shadow-md group-hover:bg-cyan-400 transition-colors">
              SG
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg text-white tracking-tight">SetGear</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#2a2a2a] text-[#00A3FF] border border-[#383838] rounded-full font-bold">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-[#B0B0B0] truncate max-w-[160px] sm:max-w-[260px]">
                {projectName} • {dailyDate}
              </p>
            </div>
          </div>

          {/* BOTÃO ← PROJETOS */}
          <button
            onClick={() => onChangeView('projects')}
            className="hidden sm:flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#383838] text-white font-medium text-xs px-3 py-1.5 rounded-2xl transition-all border border-[#383838] active:scale-95"
            title="Voltar ao Project Manager"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00A3FF]" />
            <span>Projetos</span>
          </button>
        </div>

        {/* USUÁRIO & BOTÃO TRAVAR */}
        <div className="flex items-center gap-2">
          
          <div className="hidden md:flex items-center gap-1.5 bg-[#2a2a2a] px-3 py-1 rounded-full text-xs text-[#B0B0B0]">
            <UserCheck className="w-3.5 h-3.5 text-[#2ED5A0]" />
            <span className="font-bold text-white">{userName}</span>
            <span className="text-[10px] uppercase font-mono text-[#00A3FF]">({userRole})</span>
          </div>

          {/* BOTÃO LOCK / SAIR */}
          <button
            onClick={onLockApp}
            className="flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#383838] text-[#FFB84D] border border-[#383838] text-xs px-3 py-1.5 rounded-2xl font-bold transition-all active:scale-95"
            title="Travar / Reautenticar"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>TRAVAR</span>
          </button>
        </div>

      </div>
    </header>
  );
};
