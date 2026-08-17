import React, { useState } from 'react';
import { Shield, UserCheck, Lock, ArrowRight, Eye, Film, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types/setgear';

interface LockScreenProps {
  onAuthenticate: (role: UserRole, userName: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onAuthenticate }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('operador');
  const [operatorName, setOperatorName] = useState('Eugenio');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedRole === 'admin') {
      if (password !== 'admin123') {
        setErrorMessage('Senha incorreta para acesso ADMINISTRADOR! (Senha padrão: admin123)');
        return;
      }
    } else if (selectedRole === 'operador') {
      if (password !== 'op123') {
        setErrorMessage('Senha incorreta para acesso OPERADOR! (Senha padrão: op123)');
        return;
      }
      if (!operatorName.trim()) {
        setErrorMessage('Por favor, informe seu nome de Operador para registrar no set.');
        return;
      }
    }

    const finalName = selectedRole === 'admin' ? 'Administrador Lumavi' : selectedRole === 'visualizador' ? 'Visualizador (Convidado)' : operatorName.trim();
    onAuthenticate(selectedRole, finalName);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 font-sans text-white antialiased">
      <div className="ui-card w-full max-w-md space-y-6 relative overflow-hidden shadow-2xl border border-[#2a2a2a]">
        
        {/* Badge Versão One UI */}
        <div className="absolute top-4 right-4 bg-[#2a2a2a] text-[#00A3FF] border border-[#383838] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          v1.2.0
        </div>

        {/* Marca Lumavi SetGear com ÍCONE DE ROLO DE FILME SOLICITADO */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 bg-[#00A3FF] text-white rounded-2xl flex items-center justify-center font-bold shadow-lg mx-auto transform hover:rotate-6 transition-transform">
            <Film className="w-9 h-9" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-white mt-3">
            Lumavi SetGear
          </h1>
          <p className="text-xs text-[#B0B0B0] font-medium">
            Selecione o nível de acesso e digite a senha para entrar.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="bg-red-950/80 border border-red-500/80 p-3.5 rounded-2xl text-xs text-red-300 flex items-center gap-2 animate-fadeIn">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Seleção de Perfil (Role Cards) */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium">
          
          <div className="space-y-2">
            <label className="block text-[#B0B0B0] font-bold">1. Escolha o Modo de Acesso:</label>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Admin */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'admin' 
                    ? 'bg-[#1a1a1a] border-[#00A3FF] text-[#00A3FF] font-bold ring-2 ring-[#00A3FF]/30 shadow-lg' 
                    : 'bg-[#2a2a2a] border-[#383838] text-[#B0B0B0] hover:text-white'
                }`}
              >
                <Shield className="w-5 h-5 text-[#00A3FF]" />
                <span className="text-[11px] font-bold">ADMIN</span>
                <span className="text-[9px] text-[#B0B0B0]">(Com Senha)</span>
              </button>

              {/* Operador */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('operador');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'operador' 
                    ? 'bg-[#1a1a1a] border-[#2ED5A0] text-[#2ED5A0] font-bold ring-2 ring-[#2ED5A0]/30 shadow-lg' 
                    : 'bg-[#2a2a2a] border-[#383838] text-[#B0B0B0] hover:text-white'
                }`}
              >
                <UserCheck className="w-5 h-5 text-[#2ED5A0]" />
                <span className="text-[11px] font-bold">OPERADOR</span>
                <span className="text-[9px] text-[#B0B0B0]">(Com Senha)</span>
              </button>

              {/* Visualização */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('visualizador');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'visualizador' 
                    ? 'bg-[#1a1a1a] border-[#FFB84D] text-[#FFB84D] font-bold ring-2 ring-[#FFB84D]/30 shadow-lg' 
                    : 'bg-[#2a2a2a] border-[#383838] text-[#B0B0B0] hover:text-white'
                }`}
              >
                <Eye className="w-5 h-5 text-[#FFB84D]" />
                <span className="text-[11px] font-bold">READ-ONLY</span>
                <span className="text-[9px] text-[#2ED5A0] font-bold">(SEM SENHA)</span>
              </button>

            </div>
          </div>

          {/* Nome do Operador */}
          {selectedRole === 'operador' && (
            <div>
              <label className="block text-white mb-1 font-bold">Seu Nome de Operador:</label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="ex: Eugenio..."
                className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-2.5 rounded-2xl focus:border-[#00A3FF] outline-none font-bold text-sm"
              />
              <span className="text-[10px] text-[#B0B0B0] mt-1 block">
                * Você poderá marcar o status apenas dos equipamentos vinculados ao seu nome.
              </span>
            </div>
          )}

          {/* Campo de Senha (para Admin ou Operador) */}
          {(selectedRole === 'admin' || selectedRole === 'operador') && (
            <div>
              <label className="block text-white mb-1 font-bold flex items-center justify-between">
                <span>Senha de Acesso:</span>
                <span className="text-[10px] text-[#B0B0B0]">
                  {selectedRole === 'admin' ? '(admin123)' : '(op123)'}
                </span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={selectedRole === 'admin' ? 'Digite a senha do Admin...' : 'Digite a senha do Operador...'}
                className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-2.5 rounded-2xl focus:border-[#00A3FF] outline-none text-sm"
              />
            </div>
          )}

          {/* Banner informativo de Visualização */}
          {selectedRole === 'visualizador' && (
            <div className="bg-[#FFB84D]/15 border border-[#FFB84D] p-3.5 rounded-2xl text-[#FFB84D] text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> MODO VISUALIZAÇÃO LIBERADO
              </p>
              <p className="mt-1 text-[11px] text-amber-200">
                Você entrará no aplicativo sem senha em modo apenas leitura. Não será possível alterar diárias nem mudar status.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="ui-btn-primary w-full py-4 text-sm font-bold shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <span>ENTRAR NO LUMAVI SETGEAR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

        <div className="text-center pt-2 border-t border-[#2a2a2a] text-[11px] font-mono text-[#B0B0B0]">
          Lumavi SetGear • Autenticação de Entrada v1.2.0
        </div>

      </div>
    </div>
  );
};
