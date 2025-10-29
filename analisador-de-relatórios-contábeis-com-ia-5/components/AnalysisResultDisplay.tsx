import React from 'react';
import { type AnalysisResult } from '../types.ts';
import { CheckCircle, AlertTriangle, FileWarning, Lightbulb, Pilcrow, Calculator, Download, ClipboardCheck, Printer, FileText } from 'lucide-react';
import AnimateIn from './AnimateIn.tsx';

declare const jspdf: any;
declare const html2canvas: any;

const ResultCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string; onDownload?: () => void; }> = ({ title, icon: Icon, children, className = '', onDownload }) => (
  <div className={`bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20 mb-6 transition-colors duration-300 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-3 text-cyan-400" />
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
       {onDownload && (
        <button
          onClick={onDownload}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={`Baixar seção ${title}`}
          title={`Baixar seção ${title}`}
        >
          <Download className="w-5 h-5 text-blue-200" />
        </button>
      )}
    </div>
    <div className="prose prose-invert max-w-none text-blue-200 prose-strong:text-white prose-p:text-blue-200 prose-headings:text-white prose-code:text-cyan-300 prose-a:text-cyan-400 prose-table:text-blue-200 prose-thead:text-blue-100 prose-tr:border-white/20 prose-li:text-blue-200">
      {children}
    </div>
  </div>
);

const NoData: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center gap-3 text-blue-200">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <p>{message}</p>
    </div>
);


const generateReportText = (result: AnalysisResult): string => {
    const sections: string[] = [];
    const separator = '\n' + '-'.repeat(80) + '\n';

    sections.push('RELATÓRIO DE ANÁLISE CONTÁBIL');
    sections.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    sections.push(separator);

    sections.push('1. RESUMO DA ANÁLISE');
    sections.push(result.summary || 'Nenhum resumo fornecido.');
    sections.push(separator);

    sections.push('2. ERROS DE SALDO (CONTAS INVERTIDAS)');
    if (result.balanceErrors && result.balanceErrors.length > 0) {
        result.balanceErrors.forEach((error, i) => {
            sections.push(`  ${i + 1}. Conta: ${error.accountName}`);
            sections.push(`     Problema: ${error.issue}`);
            sections.push(`     Sugestão: ${error.suggestion}\n`);
        });
    } else {
        sections.push('  Nenhum erro de saldo encontrado.');
    }
    sections.push(separator);

    sections.push('3. ERROS DE CÁLCULO');
    if (result.calculationErrors && result.calculationErrors.length > 0) {
        result.calculationErrors.forEach((error, i) => {
            sections.push(`  ${i + 1}. Grupo: ${error.groupName}`);
            sections.push(`     Total Esperado: ${error.expectedTotal.toLocaleString('pt-BR')}`);
            sections.push(`     Total Encontrado: ${error.actualTotal.toLocaleString('pt-BR')}`);
            sections.push(`     Sugestão: ${error.suggestion}\n`);
        });
    } else {
        sections.push('  Nenhum erro de cálculo encontrado.');
    }
    sections.push(separator);

    sections.push('4. SUGESTÕES PARA O PLANO DE CONTAS');
    if (result.accountSuggestions && result.accountSuggestions.length > 0) {
        result.accountSuggestions.forEach((sug, i) => {
            sections.push(`  ${i + 1}. Sugestão: ${sug.suggestion}`);
            sections.push(`     Justificativa: ${sug.reasoning}\n`);
        });
    } else {
        sections.push('  Nenhuma sugestão para o plano de contas.');
    }
    sections.push(separator);

    sections.push('5. CORREÇÕES ORTOGRÁFICAS');
    if (result.spellingCorrections && result.spellingCorrections.length > 0) {
        result.spellingCorrections.forEach((corr, i) => {
            sections.push(`  ${i + 1}. Original: "${corr.originalText}" -> Correção: "${corr.correctedText}"\n`);
        });
    } else {
        sections.push('  Nenhum erro ortográfico encontrado.');
    }
    sections.push(separator);

    sections.push('6. ANÁLISES CUSTOMIZADAS');
    if (result.customAnalysisResults && result.customAnalysisResults.length > 0) {
        result.customAnalysisResults.forEach((res, i) => {
            sections.push(`  ${i + 1}. Solicitação: ${res.request}`);
            sections.push(`     Resposta: ${res.response}\n`);
        });
    } else {
        sections.push('  Nenhuma análise customizada foi solicitada.');
    }
    sections.push(separator);


    return sections.join('\n');
};

const generatePrintableHtml = (result: AnalysisResult): string => {
  let html = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px;}
      h1, h2, h3 { color: #000; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      h1 { font-size: 24px; text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; }
      h2 { font-size: 20px; margin-top: 25px; }
      h3 { font-size: 16px; margin-top: 15px; }
      ul { list-style-type: disc; padding-left: 20px; }
      li { margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      code { font-family: monospace; background-color: #eee; padding: 2px 4px; border-radius: 4px; }
      .section { margin-bottom: 25px; page-break-inside: avoid; }
      .error { border-left: 4px solid #d9534f; padding: 10px 15px; background: #f9f2f4; }
      .calculation-error { border-left: 4px solid #f0ad4e; padding: 10px 15px; background: #fcf8e3; }
      .suggestion { border-left: 4px solid #5bc0de; padding: 10px 15px; background: #f4f8fa; }
      .custom { border-left: 4px solid #777; padding: 10px 15px; background: #f5f5f5; }
    </style>
    <h1>Relatório de Análise Contábil</h1>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
  `;

  const sanitize = (text: string) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  html += `<div class="section"><h2>Resumo da Análise</h2><p>${sanitize(result.summary)}</p></div>`;

  html += `<div class="section"><h2>Erros de Saldo (Contas Invertidas)</h2>`;
  if (result.balanceErrors && result.balanceErrors.length > 0) {
    html += `<ul>${result.balanceErrors.map(e => `<li class="error"><strong>${sanitize(e.accountName)}</strong>: ${sanitize(e.issue)}<br/><em>Sugestão: ${sanitize(e.suggestion)}</em></li>`).join('')}</ul>`;
  } else { html += `<p>Nenhum erro de saldo encontrado.</p>`; }
  html += `</div>`;

  html += `<div class="section"><h2>Erros de Cálculo</h2>`;
  if (result.calculationErrors && result.calculationErrors.length > 0) {
    html += `<ul>${result.calculationErrors.map(e => `<li class="calculation-error"><strong>${sanitize(e.groupName)}</strong><br/>Total esperado: <code>${e.expectedTotal.toLocaleString('pt-BR')}</code><br/>Total encontrado: <code>${e.actualTotal.toLocaleString('pt-BR')}</code><br/><em>Sugestão: ${sanitize(e.suggestion)}</em></li>`).join('')}</ul>`;
  } else { html += `<p>Nenhum erro de cálculo encontrado.</p>`; }
  html += `</div>`;

  html += `<div class="section"><h2>Sugestões para o Plano de Contas</h2>`;
  if (result.accountSuggestions && result.accountSuggestions.length > 0) {
    html += `<ul>${result.accountSuggestions.map(s => `<li class="suggestion"><strong>${sanitize(s.suggestion)}</strong><br/>${sanitize(s.reasoning)}</li>`).join('')}</ul>`;
  } else { html += `<p>Nenhuma sugestão para o plano de contas.</p>`; }
  html += `</div>`;

  html += `<div class="section"><h2>Correções Ortográficas</h2>`;
  if (result.spellingCorrections && result.spellingCorrections.length > 0) {
    html += `<table><thead><tr><th>Original</th><th>Correção</th></tr></thead><tbody>`;
    html += result.spellingCorrections.map(c => `<tr><td><s>${sanitize(c.originalText)}</s></td><td>${sanitize(c.correctedText)}</td></tr>`).join('');
    html += `</tbody></table>`;
  } else { html += `<p>Nenhum erro ortográfico encontrado.</p>`; }
  html += `</div>`;

  if (result.customAnalysisResults && result.customAnalysisResults.length > 0) {
    html += `<div class="section"><h2>Análises Customizadas</h2>`;
    html += `<ul>${result.customAnalysisResults.map(r => `<li class="custom"><strong>Solicitação: "${sanitize(r.request)}"</strong><br/><p>${sanitize(r.response).replace(/\n/g, '<br/>')}</p></li>`).join('')}</ul>`;
    html += `</div>`;
  }

  return html;
};

export const AnalysisResultDisplay: React.FC<{ result: AnalysisResult }> = ({ result }) => {
  const handleDownloadReport = () => {
    const reportText = generateReportText(result);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `relatorio-analise-contabil-completo-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const reportHtml = generatePrintableHtml(result);
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
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // with margin
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = pdfHeight;
      let position = 10;
      const pageHeight = pdf.internal.pageSize.getHeight() - 20;

      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -heightLeft + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      pdf.save(`relatorio-analise-contabil-${timestamp}.pdf`);
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      alert("Ocorreu um erro ao exportar para PDF. Por favor, tente novamente.");
    } finally {
      document.body.removeChild(container);
    }
  };

  const handlePrint = () => {
    const reportHtml = generatePrintableHtml(result);
    const printContainer = document.getElementById('print-content');
    if (printContainer) {
      printContainer.innerHTML = reportHtml;
      
      const afterPrint = () => {
        printContainer.innerHTML = '';
        window.removeEventListener('afterprint', afterPrint);
      };
      window.addEventListener('afterprint', afterPrint, { once: true });

      window.print();
    } else {
      console.error("Print container #print-content not found.");
      alert("Não foi possível iniciar a impressão.");
    }
  };

  const handleDownloadSection = (content: string, sectionName: string) => {
    if (!content.trim() || content.includes('Nenhum dado encontrado para esta seção.')) {
        alert('Não há conteúdo para baixar nesta seção.');
        return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `relatorio-${sectionName}-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSectionText = (title: string, content: string): string => {
    return `${title}\n${'-'.repeat(title.length)}\n\n${content}`;
  };

  const getSummaryText = () => generateSectionText('RESUMO DA ANÁLISE', result.summary || 'Nenhum resumo fornecido.');

  const getBalanceErrorsText = () => {
    if (!result.balanceErrors || result.balanceErrors.length === 0) return 'Nenhum dado encontrado para esta seção.';
    const content = result.balanceErrors.map((error, i) => 
        `  ${i + 1}. Conta: ${error.accountName}\n     Problema: ${error.issue}\n     Sugestão: ${error.suggestion}`
    ).join('\n\n');
    return generateSectionText('ERROS DE SALDO (CONTAS INVERTIDAS)', content);
  };

  const getCalcErrorsText = () => {
    if (!result.calculationErrors || result.calculationErrors.length === 0) return 'Nenhum dado encontrado para esta seção.';
    const content = result.calculationErrors.map((error, i) =>
        `  ${i + 1}. Grupo: ${error.groupName}\n     Total Esperado: ${error.expectedTotal.toLocaleString('pt-BR')}\n     Total Encontrado: ${error.actualTotal.toLocaleString('pt-BR')}\n     Sugestão: ${error.suggestion}`
    ).join('\n\n');
    return generateSectionText('ERROS DE CÁLCULO', content);
  };

  const getAccountSuggestionsText = () => {
      if (!result.accountSuggestions || result.accountSuggestions.length === 0) return 'Nenhum dado encontrado para esta seção.';
      const content = result.accountSuggestions.map((sug, i) =>
          `  ${i + 1}. Sugestão: ${sug.suggestion}\n     Justificativa: ${sug.reasoning}`
      ).join('\n\n');
      return generateSectionText('SUGESTÕES PARA O PLANO DE CONTAS', content);
  };

  const getSpellingCorrectionsText = () => {
      if (!result.spellingCorrections || result.spellingCorrections.length === 0) return 'Nenhum dado encontrado para esta seção.';
      const content = result.spellingCorrections.map((corr, i) =>
          `  ${i + 1}. Original: "${corr.originalText}" -> Correção: "${corr.correctedText}"`
      ).join('\n');
      return generateSectionText('CORREÇÕES ORTOGRÁFICAS', content);
  };

  const getCustomAnalysisText = () => {
    if (!result.customAnalysisResults || result.customAnalysisResults.length === 0) return 'Nenhum dado encontrado para esta seção.';
    const content = result.customAnalysisResults.map((res, i) =>
        `  ${i + 1}. Solicitação: ${res.request}\n     Resposta: ${res.response}`
    ).join('\n\n');
    return generateSectionText('ANÁLISES CUSTOMIZADAS', content);
  };

  const hasBalanceErrors = result.balanceErrors && result.balanceErrors.length > 0;
  const hasCalcErrors = result.calculationErrors && result.calculationErrors.length > 0;
  const hasCustomResults = result.customAnalysisResults && result.customAnalysisResults.length > 0;


  return (
    <div className="mt-8 space-y-6">
        <div className="flex justify-end items-center flex-wrap gap-2 mb-2">
            <button
                onClick={handleDownloadReport}
                className="flex items-center px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                <Download className="w-4 h-4 mr-2" />
                Baixar .txt
            </button>
             <button
                onClick={handleExportPdf}
                className="flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
            </button>
             <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
            </button>
        </div>

       <AnimateIn>
          <ResultCard 
            title="Resumo da Análise" 
            icon={FileWarning}
            onDownload={() => handleDownloadSection(getSummaryText(), 'resumo-analise')}
          >
            <p>{result.summary}</p>
          </ResultCard>
        </AnimateIn>

       <AnimateIn delay={0.1}>
        <ResultCard 
            title="Erros de Saldo (Contas Invertidas)" 
            icon={AlertTriangle}
            className={
                hasBalanceErrors
                ? '!border-red-500 bg-red-900/20'
                : '!border-green-500'
            }
            onDownload={() => handleDownloadSection(getBalanceErrorsText(), 'erros-saldo')}
        >
          {hasBalanceErrors ? (
            <ul className="space-y-4">
              {result.balanceErrors.map((error, index) => (
                <li key={index} className="p-3 bg-red-500/10 rounded-md border-l-4 border-red-500">
                  <strong className="text-red-300">{error.accountName}</strong>: {error.issue}
                  <p className="text-sm mt-1"><em>Sugestão: {error.suggestion}</em></p>
                </li>
              ))}
            </ul>
          ) : <NoData message="Nenhum erro de saldo encontrado." />}
        </ResultCard>
        </AnimateIn>

        <AnimateIn delay={0.2}>
            <ResultCard 
                title="Erros de Cálculo" 
                icon={Calculator}
                className={
                    hasCalcErrors
                    ? '!border-orange-500 bg-orange-900/20'
                    : '!border-green-500'
                }
                onDownload={() => handleDownloadSection(getCalcErrorsText(), 'erros-calculo')}
            >
                {hasCalcErrors ? (
                    <ul className="space-y-4">
                    {result.calculationErrors.map((error, index) => (
                        <li key={index} className="p-3 bg-orange-500/10 rounded-md border-l-4 border-orange-500">
                        <strong className="text-orange-300">{error.groupName}</strong>
                        <p>Total esperado: <code className="font-mono">{error.expectedTotal.toLocaleString('pt-BR')}</code></p>
                        <p>Total encontrado: <code className="font-mono">{error.actualTotal.toLocaleString('pt-BR')}</code></p>
                        <p className="text-sm mt-1"><em>Sugestão: {error.suggestion}</em></p>
                        </li>
                    ))}
                    </ul>
                ) : <NoData message="Nenhum erro de cálculo encontrado nos totais." />}
            </ResultCard>
        </AnimateIn>

        <AnimateIn delay={0.3}>
            <ResultCard 
              title="Sugestões para o Plano de Contas" 
              icon={Lightbulb}
              onDownload={() => handleDownloadSection(getAccountSuggestionsText(), 'sugestoes-contas')}
            >
                 {result.accountSuggestions && result.accountSuggestions.length > 0 ? (
                    <ul className="space-y-4">
                    {result.accountSuggestions.map((sug, index) => (
                        <li key={index} className="p-3 bg-sky-500/10 rounded-md border-l-4 border-sky-500">
                        <strong className="text-sky-300">{sug.suggestion}</strong>
                        <p className="text-sm mt-1">{sug.reasoning}</p>
                        </li>
                    ))}
                    </ul>
                ) : <NoData message="Nenhuma sugestão de novas contas." />}
            </ResultCard>
        </AnimateIn>

        <AnimateIn delay={0.4}>
            <ResultCard 
              title="Correções Ortográficas" 
              icon={Pilcrow}
              onDownload={() => handleDownloadSection(getSpellingCorrectionsText(), 'correcoes-ortograficas')}
            >
                {result.spellingCorrections && result.spellingCorrections.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left font-semibold p-2">Original</th>
                                <th className="text-left font-semibold p-2">Correção</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.spellingCorrections.map((corr, index) => (
                                <tr key={index} className="border-t border-white/20">
                                    <td className="p-2 text-red-400"><s>{corr.originalText}</s></td>
                                    <td className="p-2 text-green-400">{corr.correctedText}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <NoData message="Nenhum erro ortográfico encontrado." />}
            </ResultCard>
        </AnimateIn>

        {hasCustomResults && (
            <AnimateIn delay={0.5}>
                <ResultCard 
                  title="Análises Customizadas" 
                  icon={ClipboardCheck}
                  onDownload={() => handleDownloadSection(getCustomAnalysisText(), 'analises-customizadas')}
                >
                    <ul className="space-y-6">
                    {result.customAnalysisResults!.map((res, index) => (
                        <li key={index} className="p-4 bg-slate-500/10 rounded-lg border-l-4 border-slate-500">
                        <strong className="block text-white mb-2">Solicitação: "{res.request}"</strong>
                        <p className="whitespace-pre-wrap">{res.response}</p>
                        </li>
                    ))}
                    </ul>
                </ResultCard>
            </AnimateIn>
        )}
    </div>
  );
};