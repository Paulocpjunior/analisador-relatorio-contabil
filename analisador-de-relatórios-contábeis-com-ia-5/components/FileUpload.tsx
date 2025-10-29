import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Plus, Trash2, User, Building } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  loadingMessage: string;
  customFields: string[];
  setCustomFields: React.Dispatch<React.SetStateAction<string[]>>;
  employeeName: string;
  setEmployeeName: React.Dispatch<React.SetStateAction<string>>;
  companyName: string;
  setCompanyName: React.Dispatch<React.SetStateAction<string>>;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFileChange, 
    onAnalyze, 
    isLoading, 
    loadingMessage, 
    customFields, 
    setCustomFields,
    employeeName,
    setEmployeeName,
    companyName,
    setCompanyName
 }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentCustomField, setCurrentCustomField] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if(file && (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
       setSelectedFile(file);
       onFileChange(file);
    }
  };

  const handleAddCustomField = () => {
    if (currentCustomField.trim()) {
      setCustomFields([...customFields, currentCustomField.trim()]);
      setCurrentCustomField('');
    }
  };

  const handleRemoveCustomField = (indexToRemove: number) => {
    setCustomFields(customFields.filter((_, index) => index !== indexToRemove));
  };


  return (
    <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20 w-full mb-8">
      <div className="flex flex-col items-center justify-center w-full">
        {!selectedFile ? (
          <label 
            htmlFor="dropzone-file" 
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/30 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-10 h-10 mb-3 text-blue-200" />
              <p className="mb-2 text-sm text-blue-100"><span className="font-semibold text-white">Clique para enviar</span> ou arraste e solte</p>
              <p className="text-xs text-blue-200">PDF ou XLSX</p>
              <p className="text-xs text-blue-300 mt-2">(Nota: PDFs digitalizados/imagem são suportados)</p>
            </div>
            <input id="dropzone-file" ref={fileInputRef} type="file" className="hidden" accept=".pdf,.xlsx" onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="w-full p-4 border-2 border-white/30 rounded-lg flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-cyan-400" />
              <span className="font-medium text-white">{selectedFile.name}</span>
            </div>
            <button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-blue-200" />
            </button>
          </div>
        )}

        <div className="w-full mt-6 pt-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="employee-name" className="block text-sm font-medium text-blue-100 mb-2">
                    Nome do Colaborador (Opcional)
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                    <input
                        id="employee-name"
                        type="text"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full bg-transparent border border-white/30 rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
                    />
                </div>
            </div>
             <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-blue-100 mb-2">
                    Nome da Empresa (Opcional)
                </label>
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
                    <input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Acme Corp"
                        className="w-full bg-transparent border border-white/30 rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
                    />
                </div>
            </div>
        </div>


        <div className="w-full mt-6 pt-6 border-t border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3">Análises Customizadas (Opcional)</h3>
            <p className="text-sm text-blue-200 mb-4">Adicione solicitações específicas para a IA. Ex: "Calcule o EBITDA" ou "Verifique a evolução do endividamento".</p>
            
            {customFields.length > 0 && (
            <ul className="space-y-2 mb-4">
                {customFields.map((field, index) => (
                <li key={index} className="flex items-center justify-between bg-white/10 p-2 rounded-md">
                    <span className="text-sm text-white">{field}</span>
                    <button onClick={() => handleRemoveCustomField(index)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                </li>
                ))}
            </ul>
            )}
            
            <div className="flex gap-2">
            <input
                type="text"
                value={currentCustomField}
                onChange={(e) => setCurrentCustomField(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomField(); } }}
                placeholder="Digite sua solicitação de análise"
                className="flex-grow bg-transparent border border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/80"
            />
            <button
                onClick={handleAddCustomField}
                className="flex items-center px-4 py-2 bg-white/20 text-white font-semibold rounded-lg shadow-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
            </button>
            </div>
        </div>


        <button
          onClick={onAnalyze}
          disabled={!selectedFile || isLoading}
          className="mt-8 w-full px-6 py-3 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {isLoading ? loadingMessage : 'Analisar Relatório'}
        </button>
      </div>
    </div>
  );
};