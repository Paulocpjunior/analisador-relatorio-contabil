

import React from 'react';
import { type ComparisonResult, type AnalysisHistoryItem } from '../types.ts';
import { FileDiff, CheckCheck, Scale, TrendingUp, ArrowLeft, Building, User, Calendar, BarChart2, FileText, AlertCircle, CheckCircle as CheckCircleIcon } from 'lucide-react';
import AnimateIn from './AnimateIn.tsx';

declare const jspdf: any;
declare const html2canvas: any;


const ResultCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; }> = ({ title, icon: Icon, children }) => (
  <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 mb-6">
    <div className="flex items-center mb-4">
      <Icon className="w-6 h-6 mr-3 text-cyan-400" />
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <div className="prose prose-invert max-w-none text-blue-200 prose-strong:text-white prose-p:text-blue-200 prose-headings:text-white prose-code:text-cyan-300 prose-a:text-cyan-400 prose-table:text-blue-200 prose-thead:text-blue-100 prose-tr:border-white/20 prose-li:text-blue-200">
      {children}
    </div>
  </div>
);

const generateComparisonPrintableHtml = (result: ComparisonResult): string => {
  const sanitize = (text: string | undefined | null) => (text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let html = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px;}
      h1, h2 { color: #000; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      h1 { font-size: 24px; text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; }
      h2 { font-size: 20px; margin-top: 25px; }
      .section { margin-bottom: 25px; page-break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
      th { background-color: #f2f2f2; }
      .difference { border-left: 4px solid #d9534f; padding: 10px 15px; background: #f9f2f4; margin-bottom: 10px; }
      .similarity { border-left: 4px solid #5cb85c; padding: 10px 15px; background: #f4f8f4; margin-bottom: 10px; }
      .trend { border-left: 4px solid #5bc0de; padding: 10px 15px; background: #f4f8fa; }
    </style>
    <h1>Relatório Comparativo de Análises</h1>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  `;

  html += `<div class="section"><h2>Relatórios Comparados</h2><table><thead><tr><th>Arquivo</th><th>Data</th><th>Empresa</th><th>Colaborador</th></tr></thead><tbody>`;
  result.comparedItems.forEach(item => {
    html += `
      <tr>
        <td>${sanitize(item.fileName)}</td>
        <td>${sanitize(new Date(item.analysisDate).toLocaleString('pt-BR'))}</td>
        <td>${sanitize(item.companyName) || 'N/A'}</td>
        <td>${sanitize(item.employeeName) || 'N/A'}</td>
      </tr>
    `;
  });
  html += `</tbody></table></div>`;

  html += `<div class="section"><h2>Resumo Comparativo</h2><p>${sanitize(result.summary)}</p></div>`;

  html += `<div class="section"><h2>Principais Diferenças</h2>`;
  if (result.keyDifferences.length > 0) {
    result.keyDifferences.forEach(diff => {
      html += `<div class="difference"><strong>${sanitize(diff.aspect)}</strong><p>${sanitize(diff.details)}</p></div>`;
    });
  } else {
    html += `<p>Nenhuma diferença significativa encontrada.</p>`;
  }
  html += `</div>`;

  html += `<div class="section"><h2>Principais Semelhanças</h2>`;
  if (result.keySimilarities.length > 0) {
    result.keySimilarities.forEach(sim => {
      html += `<div class="similarity"><strong>${sanitize(sim.aspect)}</strong><p>${sanitize(sim.details)}</p></div>`;
    });
  } else {
    html += `<p>Nenhuma semelhança significativa encontrada.</p>`;
  }
  html += `</div>`;

  if (result.trendAnalysis) {
    html += `<div class="section"><h2>Análise de Tendência</h2><div class="trend"><p>${sanitize(result.trendAnalysis)}</p></div></div>`;
  }

  return html;
};


export const ComparisonDisplay: React.FC<{ result: ComparisonResult; comparedItemsFull: AnalysisHistoryItem[]; onClose: () => void; }> = ({ result, comparedItemsFull, onClose }) => {
    
    const maxBalanceErrors = Math.max(...comparedItemsFull.map(item => item.result.balanceErrors.length), 1);
    const maxCalcErrors = Math.max(...comparedItemsFull.map(item => item.result.calculationErrors.length), 1);

     const handleExportPdf = async () => {
        const reportHtml = generateComparisonPrintableHtml(result);
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '210mm';
        container.style.backgroundColor = 'white';
        container.innerHTML = reportHtml;
        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container.firstElementChild || container, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const imgProps = pdf.getImageProperties(imgData);
            const margin = 10;
            const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            let heightLeft = pdfHeight;
            let position = margin;
            const pageHeight = pdf.internal.pageSize.getHeight() - (margin * 2);

            pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = -heightLeft + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            pdf.save(`comparativo-analise-contabil-${timestamp}.pdf`);
        } catch (err) {
            console.error("Error exporting comparison to PDF:", err);
            alert("Ocorreu um erro ao exportar o comparativo para PDF. Por favor, tente novamente.");
        } finally {
            document.body.removeChild(container);
        }
    };


    return (
        <div className="mt-2 space-y-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-white">
                    Comparativo de Análises
                  </h2>
                 <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPdf}
                        className="flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center px-4 py-2 bg-white/20 text-white font-semibold rounded-lg shadow-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 ease-in-out"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </button>
                  </div>
            </div>
            
            <AnimateIn>
                <div className="bg-white/5 p-4 rounded-lg border border-white/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left p-2 font-semibold text-white">Arquivo</th>
                        <th className="text-left p-2 font-semibold text-white"><Calendar className="w-4 h-4 inline mr-1" /> Data</th>
                        <th className="text-left p-2 font-semibold text-white"><Building className="w-4 h-4 inline mr-1" /> Empresa</th>
                        <th className="text-left p-2 font-semibold text-white"><User className="w-4 h-4 inline mr-1" /> Colaborador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparedItems.map((item, index) => (
                        <tr key={index} className="border-b border-white/10 last:border-b-0">
                          <td className="p-2 text-blue-100 truncate" title={item.fileName}>{item.fileName}</td>
                          <td className="p-2 text-blue-200">{new Date(item.analysisDate).toLocaleString('pt-BR')}</td>
                          <td className="p-2 text-blue-200">{item.companyName || 'N/A'}</td>
                          <td className="p-2 text-blue-200">{item.employeeName || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </AnimateIn>

            <AnimateIn delay={0.1}>
                <ResultCard title="Resumo Comparativo" icon={FileDiff}>
                    <p>{result.summary}</p>
                </ResultCard>
            </AnimateIn>
            
            <AnimateIn delay={0.15}>
                <ResultCard title="Comparação Visual de Erros" icon={BarChart2}>
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div><span>Erros de Saldo</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-500"></div><span>Erros de Cálculo</span></div>
                        </div>
                        {comparedItemsFull.map(item => (
                            <div key={item.id}>
                                <p className="font-semibold text-white mb-2 truncate" title={item.fileName}>{item.fileName}</p>
                                <div className="space-y-2">
                                    <div className="w-full bg-white/5 rounded-full" title={`Erros de Saldo: ${item.result.balanceErrors.length}`}>
                                        <div 
                                            style={{ width: item.result.balanceErrors.length > 0 ? `${(item.result.balanceErrors.length / maxBalanceErrors) * 100}%` : '0%'}}
                                            className="bg-red-500 text-xs font-medium text-red-100 text-center p-1 leading-none rounded-full min-w-[2rem] transition-all duration-500 ease-out"
                                        >
                                            {item.result.balanceErrors.length}
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full" title={`Erros de Cálculo: ${item.result.calculationErrors.length}`}>
                                        <div 
                                            style={{ width: item.result.calculationErrors.length > 0 ? `${(item.result.calculationErrors.length / maxCalcErrors) * 100}%` : '0%' }}
                                            className="bg-orange-500 text-xs font-medium text-orange-100 text-center p-1 leading-none rounded-full min-w-[2rem] transition-all duration-500 ease-out"
                                        >
                                            {item.result.calculationErrors.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ResultCard>
            </AnimateIn>

            <AnimateIn delay={0.2}>
                <ResultCard title="Principais Diferenças" icon={Scale}>
                    {result.keyDifferences.length > 0 ? (
                        <ul className="space-y-4">
                        {result.keyDifferences.map((diff, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-red-500/10 rounded-md">
                              <AlertCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                              <div>
                                <strong className="text-red-300">{diff.aspect}</strong>
                                <p className="text-sm mt-1">{diff.details}</p>
                              </div>
                            </li>
                        ))}
                        </ul>
                    ) : <p>Nenhuma diferença significativa encontrada.</p>}
                </ResultCard>
            </AnimateIn>

             <AnimateIn delay={0.3}>
                <ResultCard title="Principais Semelhanças" icon={CheckCheck}>
                    {result.keySimilarities.length > 0 ? (
                        <ul className="space-y-4">
                        {result.keySimilarities.map((sim, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-md">
                              <CheckCircleIcon className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                              <div>
                                <strong className="text-green-300">{sim.aspect}</strong>
                                <p className="text-sm mt-1">{sim.details}</p>
                              </div>
                            </li>
                        ))}
                        </ul>
                    ) : <p>Nenhuma semelhança significativa encontrada.</p>}
                </ResultCard>
            </AnimateIn>

            {result.trendAnalysis && (
                <AnimateIn delay={0.4}>
                    <ResultCard title="Análise de Tendência" icon={TrendingUp}>
                        <p>{result.trendAnalysis}</p>
                    </ResultCard>
                </AnimateIn>
            )}
        </div>
    );
};