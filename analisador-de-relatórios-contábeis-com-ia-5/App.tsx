
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { FileUpload } from './components/FileUpload.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { AnalysisResultDisplay } from './components/AnalysisResultDisplay.tsx';
import { ComparisonDisplay } from './components/ComparisonDisplay.tsx';
import { ErrorDisplay } from './components/ErrorDisplay.tsx';
import { HistoryDisplay } from './components/HistoryDisplay.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { parseFile } from './utils/fileParser.ts';
import { analyzeReport, compareAnalyses } from './services/geminiService.ts';
import { type AnalysisResult, type AnalysisHistoryItem, type AppSettings, type ComparisonResult } from './types.ts';
import { ArrowLeft } from 'lucide-react';


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<AnalysisHistoryItem | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // States for comparison feature
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [itemsBeingCompared, setItemsBeingCompared] = useState<AnalysisHistoryItem[]>([]);


  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    model: 'gemini-2.5-pro',
    timeout: 120,
  });

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('analiseContabilHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      localStorage.removeItem('analiseContabilHistory');
    }

    try {
      const storedSettings = localStorage.getItem('analiseContabilSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings.model && parsedSettings.timeout) {
          setSettings(parsedSettings);
        }
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
      localStorage.removeItem('analiseContabilSettings');
    }
  }, []);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (activeResult) {
       handleStartNewAnalysis();
    }
    setError(null);
  };
  
  const handleStartNewAnalysis = () => {
    setActiveResult(null);
    setViewingHistoryItem(null);
    setComparisonResult(null);
    setSelectedHistoryIds([]);
    setItemsBeingCompared([]);
    setFile(null);
    setError(null);
    setLoadingMessage('');
    setCustomFields([]);
    setEmployeeName('');
    setCompanyName('');
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!file) {
      setError("Por favor, selecione um arquivo para analisar.");
      return;
    }

    setLoadingMessage('Iniciando análise...');
    setError(null);
    setActiveResult(null);
    setViewingHistoryItem(null);
    setComparisonResult(null);
    setSelectedHistoryIds([]);
    setItemsBeingCompared([]);

    try {
      const fileContent = await parseFile(file, setLoadingMessage);
      const result = await analyzeReport(fileContent, customFields, setLoadingMessage, settings);
      
      const newHistoryItem: AnalysisHistoryItem = {
        id: new Date().toISOString(),
        fileName: file.name,
        analysisDate: new Date().toISOString(),
        result,
        employeeName: employeeName.trim(),
        companyName: companyName.trim(),
      };

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('analiseContabilHistory', JSON.stringify(updatedHistory));
      
      setActiveResult(result);
    } catch (err) {
      console.error("Analysis failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido durante a análise.";
      setError(`Falha na análise: ${errorMessage}`);
    } finally {
      setLoadingMessage('');
    }
  }, [file, history, customFields, employeeName, companyName, settings]);

  const handleSelectHistoryItem = (item: AnalysisHistoryItem) => {
    setActiveResult(item.result);
    setViewingHistoryItem(item);
    setComparisonResult(null);
    setItemsBeingCompared([]);
    setSelectedHistoryIds([]);
    setError(null);
    setLoadingMessage('');
    window.scrollTo(0, 0);
  };
  
  const handleClearHistory = () => {
    if (window.confirm("Tem certeza de que deseja apagar todo o histórico de análises? Esta ação não pode ser desfeita.")) {
      setHistory([]);
      setSelectedHistoryIds([]);
      localStorage.removeItem('analiseContabilHistory');
    }
  };

  const handleExportHistory = () => {
    if (history.length === 0) {
      setError("Não há histórico para exportar.");
      return;
    }
    try {
      const historyJson = JSON.stringify(history, null, 2);
      const blob = new Blob([historyJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `historico-analise-contabil-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Falha ao exportar histórico:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao exportar o histórico.";
      setError(`Falha na exportação: ${errorMessage}`);
    }
  };

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError("Por favor, selecione um arquivo .json válido.");
      return;
    }

    if (history.length > 0 && !window.confirm("Isso substituirá seu histórico de análises atual. Deseja continuar?")) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Não foi possível ler o conteúdo do arquivo.");
        
        const importedHistory = JSON.parse(text);

        if (!Array.isArray(importedHistory) || (importedHistory.length > 0 && (!importedHistory[0].id || !importedHistory[0].fileName || !importedHistory[0].result))) {
           throw new Error("O arquivo JSON não está no formato de histórico esperado.");
        }

        setHistory(importedHistory);
        setSelectedHistoryIds([]);
        localStorage.setItem('analiseContabilHistory', JSON.stringify(importedHistory));
        setError(null);
        alert("Histórico importado com sucesso!");
      } catch (err) {
        console.error("Falha ao importar histórico:", err);
        const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao importar o histórico.";
        setError(`Falha na importação: ${errorMessage}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      setError("Ocorreu um erro ao ler o arquivo selecionado.");
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('analiseContabilSettings', JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
      setError("Não foi possível salvar as configurações.");
    }
  };

  const handleToggleHistoryId = (id: string) => {
    setSelectedHistoryIds(prev =>
      prev.includes(id) ? prev.filter(prevId => prevId !== id) : [...prev, id]
    );
  };

  const handleStartComparison = useCallback(async () => {
    if (selectedHistoryIds.length < 2) {
      setError("Selecione pelo menos dois itens para comparar.");
      return;
    }
    const itemsToCompare = history.filter(item => selectedHistoryIds.includes(item.id));
    setItemsBeingCompared(itemsToCompare);

    setLoadingMessage('Comparando análises...');
    setError(null);
    setActiveResult(null);
    setViewingHistoryItem(null);
    setComparisonResult(null);

    try {
      const result = await compareAnalyses(itemsToCompare, settings);
      setComparisonResult(result);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Comparison failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido durante a comparação.";
      setError(`Falha na comparação: ${errorMessage}`);
    } finally {
      setLoadingMessage('');
      setSelectedHistoryIds([]);
    }
  }, [selectedHistoryIds, history, settings]);

  const isLoading = loadingMessage !== '';
  const isComparisonLoading = isLoading && !activeResult && !comparisonResult;


  const handleCloseComparison = () => {
    setComparisonResult(null);
    setItemsBeingCompared([]);
  }

  return (
    <div className="min-h-screen font-sans text-white flex flex-col">
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={settings}
        onSave={handleSaveSettings}
      />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Header onOpenSettings={() => setIsSettingsModalOpen(true)} />
          <main>
            {comparisonResult && itemsBeingCompared.length > 0 ? (
              <ComparisonDisplay 
                result={comparisonResult} 
                comparedItemsFull={itemsBeingCompared}
                onClose={handleCloseComparison} 
              />
            ) : activeResult ? (
              <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-white">
                    {viewingHistoryItem 
                      ? `Análise de: ${viewingHistoryItem.fileName}` 
                      : 'Resultado da Nova Análise'}
                  </h2>
                  <button
                    onClick={handleStartNewAnalysis}
                    className="flex items-center px-4 py-2 bg-white/20 text-white font-semibold rounded-lg shadow-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 ease-in-out"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Fazer Nova Análise
                  </button>
                </div>
                 <AnalysisResultDisplay result={activeResult} />
              </div>
            ) : (
              <>
                <FileUpload 
                    onFileChange={handleFileChange} 
                    onAnalyze={handleAnalyzeClick} 
                    isLoading={isLoading} 
                    loadingMessage={loadingMessage} 
                    customFields={customFields} 
                    setCustomFields={setCustomFields}
                    employeeName={employeeName}
                    setEmployeeName={setEmployeeName}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                />
                {isComparisonLoading && (
                  <LoadingSpinner 
                    message={selectedHistoryIds.length > 0 ? 'Comparando análises...' : loadingMessage} 
                  />
                )}
                {error && <ErrorDisplay message={error} />}
              </>
            )}

            {!comparisonResult && (
              <HistoryDisplay
                history={history}
                onSelectItem={handleSelectHistoryItem}
                onClearHistory={handleClearHistory}
                onExportHistory={handleExportHistory}
                onImportHistory={handleImportHistory}
                selectedIds={selectedHistoryIds}
                onToggleId={handleToggleHistoryId}
                onStartComparison={handleStartComparison}
                isComparisonLoading={isComparisonLoading}
              />
            )}
          </main>
        </div>
      </div>
      <footer className="text-center py-4 border-t border-white/20">
        <p className="text-sm text-blue-200">
          &copy; {new Date().getFullYear()} Direitos Reservados | Desenvolvido por SP Assessoria Contábil
        </p>
      </footer>
    </div>
  );
};

export default App;