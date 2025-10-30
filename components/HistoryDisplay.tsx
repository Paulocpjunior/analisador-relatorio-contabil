import React, { useRef, useState } from 'react';
import { type AnalysisHistoryItem } from '../types.ts';
import { History, FileClock, Trash2, Info, Download, Upload, Search, X, User, Building, Rows, CheckSquare, Square } from 'lucide-react';

interface HistoryDisplayProps {
  history: AnalysisHistoryItem[];
  onSelectItem: (item: AnalysisHistoryItem) => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
  onImportHistory: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedIds: string[];
  onToggleId: (id: string) => void;
  onStartComparison: () => void;
  isComparisonLoading: boolean;
}

export const HistoryDisplay: React.FC<HistoryDisplayProps> = ({ 
  history, 
  onSelectItem, 
  onClearHistory, 
  onExportHistory, 
  onImportHistory,
  selectedIds,
  onToggleId,
  onStartComparison,
  isComparisonLoading
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [filterText, setFilterText] = useState('');
  const [dateFilter, setDateFilter] = useState('');


  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleClearFilters = () => {
    setFilterText('');
    setDateFilter('');
  };

  const filteredHistory = history.filter(item => {
    const itemText = `${item.fileName} ${item.employeeName || ''} ${item.companyName || ''}`.toLowerCase();
    const textMatch = itemText.includes(filterText.toLowerCase());
    
    const dateMatch = dateFilter
      ? new Date(item.analysisDate).toISOString().startsWith(dateFilter)
      : true;
    return textMatch && dateMatch;
  });

  const hasFilters = filterText || dateFilter;
  const canCompare = selectedIds.length >= 2;

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-100" />
            <h2 className="text-2xl font-bold text-white">Histórico de Análises</h2>
        </div>
        <div className="flex items-center gap-2">
             {canCompare && (
              <button
                  onClick={onStartComparison}
                  disabled={isComparisonLoading}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-slate-500 disabled:cursor-wait"
              >
                  <Rows className="w-4 h-4 mr-2" />
                  {isComparisonLoading ? 'Comparando...' : `Comparar (${selectedIds.length})`}
              </button>
            )}
            <input
                type="file"
                ref={importInputRef}
                className="hidden"
                accept=".json"
                onChange={onImportHistory}
            />
            <button
                onClick={handleImportClick}
                className="flex items-center px-3 py-1.5 text-sm bg-white/20 text-white font-semibold rounded-lg shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
                <Upload className="w-4 h-4 mr-2" />
                Importar
            </button>
            {history.length > 0 && (
            <>
                <button
                    onClick={onExportHistory}
                    className="flex items-center px-3 py-1.5 text-sm bg-cyan-500 text-white font-semibold rounded-lg shadow-sm hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                </button>
                <button
                    onClick={onClearHistory}
                    className="flex items-center px-3 py-1.5 text-sm bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:bg-slate-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                </button>
            </>
            )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="flex flex-wrap gap-4 items-end mb-6 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
          <div className="flex-grow min-w-[200px]">
            <label htmlFor="text-filter" className="block text-sm font-medium text-blue-100 mb-1">
              Buscar no histórico
            </label>
            <div className="relative">
              <input
                id="text-filter"
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Nome do arquivo, colaborador..."
                className="w-full bg-transparent border border-white/30 rounded-md pl-3 pr-10 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
              />
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
            </div>
          </div>
          <div className="flex-grow min-w-[150px]">
             <label htmlFor="date-filter" className="block text-sm font-medium text-blue-100 mb-1">
              Filtrar por data
            </label>
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-transparent border border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
            />
          </div>
          {hasFilters && (
            <button
                onClick={handleClearFilters}
                className="flex items-center px-3 py-2 text-sm bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
                <X className="w-4 h-4 mr-1.5" />
                Limpar Filtros
            </button>
          )}
        </div>
      )}


      {history.length === 0 ? (
        <div className="text-center py-8 px-4 bg-white/10 backdrop-blur-md rounded-lg border border-dashed border-white/20">
            <Info className="w-8 h-8 mx-auto mb-3 text-blue-300" />
            <p className="font-semibold text-white">
                Seu histórico de análises aparecerá aqui.
            </p>
            <p className="text-sm text-blue-200 mt-1">
                Complete sua primeira análise para começar.
            </p>
        </div>
      ) : filteredHistory.length === 0 ? (
         <div className="text-center py-8 px-4 bg-white/10 backdrop-blur-md rounded-lg border border-dashed border-white/20">
            <Search className="w-8 h-8 mx-auto mb-3 text-blue-300" />
            <p className="font-semibold text-white">
                Nenhum resultado encontrado.
            </p>
            <p className="text-sm text-blue-200 mt-1">
                Tente ajustar seus filtros de busca.
            </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
             const isSelected = selectedIds.includes(item.id);
             return (
                <div
                    key={item.id}
                    className={`flex items-center w-full text-left p-4 bg-white/10 backdrop-blur-md rounded-lg shadow-sm border transition-all duration-200 ${
                        isSelected
                        ? 'border-cyan-400 bg-white/20 ring-2 ring-cyan-400'
                        : 'border-white/20 hover:border-cyan-400'
                    }`}
                >
                    <label htmlFor={`select-${item.id}`} className="flex items-center cursor-pointer p-2 -ml-2">
                        <input
                            id={`select-${item.id}`}
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => onToggleId(item.id)}
                            disabled={isComparisonLoading}
                        />
                        {isSelected ? <CheckSquare className="w-6 h-6 text-cyan-400" /> : <Square className="w-6 h-6 text-blue-200" />}
                    </label>

                    <button
                        onClick={() => onSelectItem(item)}
                        disabled={isComparisonLoading}
                        className="flex-grow ml-4 disabled:cursor-not-allowed"
                    >
                    <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
                        <div className="flex items-center gap-4">
                            <FileClock className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-white">{item.fileName}</p>
                                <p className="text-sm text-blue-200">
                                    Analisado em: {new Date(item.analysisDate).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-blue-200">
                                {item.companyName && (
                                    <div className="flex items-center gap-1.5">
                                        <Building className="w-4 h-4" />
                                        <span>{item.companyName}</span>
                                    </div>
                                )}
                                {item.employeeName && (
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        <span>{item.employeeName}</span>
                                    </div>
                                )}
                        </div>
                    </div>
                    </button>
                </div>
             );
          })}
        </div>
      )}
    </div>
  );
};