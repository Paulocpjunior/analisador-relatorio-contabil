
import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="text-center mb-10">
      <div className="flex justify-between items-center w-full">
        {/* Invisible spacer to balance the settings icon */}
        <div className="w-10 h-10"></div>

        {/* Centered Title */}
        <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold text-white mb-4">Analisador Contábil com IA</h1>
          <p className="text-lg text-blue-200">
            Faça upload de seus relatórios (.pdf, .xlsx) e obtenha uma análise completa e inteligente.
          </p>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Configurações"
          title="Configurações"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
};
