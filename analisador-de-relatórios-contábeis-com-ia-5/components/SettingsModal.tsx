import React, { useState, useEffect } from 'react';
import { type AppSettings } from '../types.ts';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [model, setModel] = useState(currentSettings.model);
  const [timeout, setTimeoutValue] = useState(currentSettings.timeout);

  useEffect(() => {
    setModel(currentSettings.model);
    setTimeoutValue(currentSettings.timeout);
  }, [currentSettings, isOpen]);

  const handleSave = () => {
    onSave({ model, timeout });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 border border-white/20 rounded-xl shadow-2xl w-full max-w-md m-4 p-6 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Configurações de Análise</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="ai-model" className="block text-sm font-medium text-blue-100 mb-2">
              Modelo de IA
            </label>
            <select
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value as AppSettings['model'])}
              className="w-full bg-transparent border border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
            >
              <option value="gemini-2.5-pro" className="bg-slate-800">Gemini 2.5 Pro (Recomendado)</option>
              <option value="gemini-2.5-flash" className="bg-slate-800">Gemini 2.5 Flash (Mais Rápido)</option>
            </select>
            <p className="text-xs text-blue-300 mt-2">O modelo Pro oferece análises mais detalhadas, enquanto o Flash é mais rápido para resultados preliminares.</p>
          </div>
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium text-blue-100 mb-2">
              Tempo Limite da Análise (segundos)
            </label>
            <input
              id="timeout"
              type="number"
              value={timeout}
              onChange={(e) => setTimeoutValue(Math.max(30, parseInt(e.target.value, 10) || 30))}
              min="30"
              className="w-full bg-transparent border border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
            />
            <p className="text-xs text-blue-300 mt-2">Define o tempo máximo que a IA pode levar para responder. Mínimo de 30 segundos.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-2 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 ease-in-out"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};