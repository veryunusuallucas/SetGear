import React, { useState } from 'react';
import { 
  Shield, 
  UserCheck, 
  Eye, 
  Lock, 
  ArrowLeft,
  CheckCircle2,
  Key
} from 'lucide-react';
import { UserRole, Profile } from '../types/setgear';
import { store } from '../services/store';

interface SettingsViewProps {
  activeUser: Profile;
  onBackToApp: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeUser,
  onBackToApp,
}) => {
  const [userName, setUserName] = useState(activeUser.nome);
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeUser.cargo);
  const [passwordInput, setPasswordInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validação de Senha para troca de perfil
    if (selectedRole === 'admin') {
      if (!store.validatePassword('admin', passwordInput)) {
        setFeedback({ type: 'error', message: 'Senha incorreta para alterar para ADMIN!' });
        return;
      }
    } else if (selectedRole === 'operador') {
      if (!store.validatePassword('operador', passwordInput)) {
        setFeedback({ type: 'error', message: 'Senha incorreta para alterar para OPERADOR!' });
        return;
      }
    }

    store.setActiveUserName(userName.trim() || 'Usuário');
    store.setUserRole(selectedRole);
    setPasswordInput('');
    setFeedback({ type: 'success', message: 'Configurações salvas com sucesso!' });
  };

  return (
    <div className="ui-card space-y-6 font-sans">
      
      {/* CABEÇALHO CONFIGURAÇÕES ONE UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2a2a2a]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#00A3FF]" /> Configurações & Perfil de Acesso
          </h2>
          <p className="text-xs text-[#B0B0B0] font-medium mt-0.5">
            Gerencie seu nome de proprietário e altere seu nível de acesso.
          </p>
        </div>

        <button
          onClick={onBackToApp}
          className="ui-btn-primary py-2 px-4 text-xs flex items-center gap-1.5 shadow-lg active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLTAR À DIÁRIA</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
          feedback.type === 'success' ? 'bg-[#2ED5A0]/15 text-[#2ED5A0] border border-[#2ED5A0]' : 'bg-red-950/80 text-red-300 border border-red-500'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 text-xs font-medium">
        
        {/* NOME DO USUÁRIO */}
        <div>
          <label className="block text-white font-bold mb-1.5 text-sm">
            Seu Nome / Usuário (Proprietário no Set):
          </label>
          <input
            type="text"
            required
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="ex: Eugenio..."
            className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-3 rounded-2xl focus:border-[#00A3FF] outline-none font-bold text-sm"
          />
          <p className="text-[11px] text-[#B0B0B0] mt-1">
            * Ao ativar como Operador ou Visualizador, você poderá interagir com equipamentos atribuídos a este nome.
          </p>
        </div>

        {/* NÍVEIS DE ACESSO */}
        <div className="space-y-2">
          <label className="block text-white font-bold mb-1.5 text-sm">
            Selecione o Nível de Acesso (Role):
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Admin */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-4 rounded-2xl border-2 flex flex-col justify-between text-left transition-all ${
                selectedRole === 'admin'
                  ? 'bg-[#1a1a1a] border-[#00A3FF] shadow-lg ring-1 ring-[#00A3FF]'
                  : 'bg-[#2a2a2a] border-[#383838] text-[#B0B0B0] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">ADMINISTRADOR</span>
                <Shield className="w-5 h-5 text-[#00A3FF]" />
              </div>
              <p className="text-[11px] text-[#B0B0B0] mt-2">
                Acesso total. Pode marcar equipamentos de todos os proprietários e gerenciar projetos.
              </p>
            </button>

            {/* Operador */}
            <button
              type="button"
              onClick={() => setSelectedRole('operador')}
              className={`p-4 rounded-2xl border-2 flex flex-col justify-between text-left transition-all ${
                selectedRole === 'operador'
                  ? 'bg-[#1a1a1a] border-[#00A3FF] shadow-lg ring-1 ring-[#00A3FF]'
                  : 'bg-[#2a2a2a] border-[#383838] text-[#B0B0B0] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">OPERADOR</span>
                <UserCheck className="w-5 h-5 text-[#2ED5A0]" />
              </div>
              <p className="text-[11px] text-[#B0B0B0] mt-2">
                Pode adicionar equipamentos no banco. Marca status nos equipamentos do seu próprio usuário.
              </p>
            </button>

            {/* Visualizador */}
            <button
              type="button"
              onClick={() => setSelectedRole('visualizador')}
              className={`p-4 rounded-2xl border-2 flex flex-col justify-between text-left transition-all ${
                selectedRole === 'visualizador'
                  ? 'bg-[#1a1a1a] border-[#FFB84D] shadow-lg ring-1 ring-[#FFB84D]'
                  : 'bg-[#2a2a2a] border-[#383838] text-[#B0B0B0] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">VISUALIZADOR (READ)</span>
                <Eye className="w-5 h-5 text-[#FFB84D]" />
              </div>
              <p className="text-[11px] text-[#B0B0B0] mt-2">
                Apenas leitura do banco e das diárias. Sem permissão de alteração.
              </p>
            </button>

          </div>
        </div>

        {/* VALIDAÇÃO DE SENHA PARA TROCA */}
        {(selectedRole === 'admin' || selectedRole === 'operador') && (
          <div>
            <label className="block text-white font-bold mb-1">
              🔑 Senha de Validação para alterar o Perfil:
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder={`Digite a senha do perfil ${selectedRole.toUpperCase()}...`}
              className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-2.5 rounded-2xl focus:border-[#00A3FF] outline-none"
            />
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="ui-btn-primary w-full py-3.5 text-sm font-bold shadow-lg"
          >
            SALVAR CONFIGURAÇÕES DE PERFIL
          </button>
        </div>

      </form>

    </div>
  );
};
