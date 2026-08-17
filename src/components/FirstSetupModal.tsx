import React, { useState } from 'react';
import { Shield, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { store } from '../services/store';

interface FirstSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const FirstSetupModal: React.FC<FirstSetupModalProps> = ({ isOpen, onComplete }) => {
  const [adminPass, setAdminPass] = useState('admin123');
  const [opPass, setOpPass] = useState('op123');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPass.trim() || !opPass.trim()) return;

    store.setupInitialPasswords(adminPass.trim(), opPass.trim());
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
      <div className="ui-card w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#00A3FF] rounded-full flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg">
            SG
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Bem-vindo ao Lumavi SetGear
          </h2>
          <p className="text-sm text-[#B0B0B0] font-medium">
            Primeira Inicialização: Crie as senhas que serão usadas para os acessos ADMIN e OPERADOR.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
          
          <div>
            <label className="block text-white mb-1.5 font-semibold">
              🔐 Defina a Senha de ADMINISTRADOR (Acesso Total):
            </label>
            <input
              type="text"
              required
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              placeholder="ex: admin123"
              className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-3 rounded-2xl focus:border-[#00A3FF] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-white mb-1.5 font-semibold">
              🛠️ Defina a Senha de OPERADOR (Uso no Set):
            </label>
            <input
              type="text"
              required
              value={opPass}
              onChange={e => setOpPass(e.target.value)}
              placeholder="ex: op123"
              className="w-full bg-[#2a2a2a] border border-[#383838] text-white px-4 py-3 rounded-2xl focus:border-[#00A3FF] outline-none font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="ui-btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <span>SALVAR SENHAS E INICIAR APP</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
