import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { type AnalysisResult, type ParseResult, type AppSettings, type AnalysisHistoryItem, type ComparisonResult } from '../types.ts';

// --- Schemas and Prompts ---
const analysisPrompt = `
Você é um contador especialista e analista financeiro. Sua tarefa é analisar o seguinte relatório contábil (pode ser um balanço, balancete ou DRE) e fornecer uma análise detalhada. O conteúdo do relatório será fornecido a seguir.

Sua análise deve seguir estritamente o formato JSON de saída especificado.

Aqui estão as tarefas que você deve executar:

1.  **Resumo Geral (summary)**: Forneça um resumo conciso da sua análise, destacando os pontos mais críticos e importantes encontrados no relatório.
2.  **Erros de Saldo (balanceErrors)**: Identifique contas que parecem ter saldos invertidos (ex: uma conta de ativo com saldo credor, ou uma conta de passivo com saldo devedor, a menos que seja uma conta retificadora). Para cada erro, especifique o nome da conta, o problema e uma sugestão de correção.
3.  **Erros de Cálculo (calculationErrors)**: Verifique as somas dos grupos de contas e os totais gerais (Ativo vs. Passivo + PL, por exemplo). Se encontrar discrepâncias, indique o nome do grupo, o total esperado, o total real encontrado e uma sugestão de como investigar/corrigir.
4.  **Sugestões de Contas (accountSuggestions)**: Com base na estrutura do relatório, sugira a criação de novas contas que poderiam melhorar a clareza e o detalhamento, ou a reclassificação de contas existentes. Forneça um raciocínio para cada sugestão.
5.  **Correções Ortográficas (spellingCorrections)**: Revise todo o texto do relatório em busca de erros de digitação ou ortográficos. Para cada erro, forneça o texto original e o texto corrigido.
`;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Resumo geral da análise." },
    balanceErrors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { accountName: { type: Type.STRING }, issue: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["accountName", "issue", "suggestion"] } },
    calculationErrors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { groupName: { type: Type.STRING }, expectedTotal: { type: Type.NUMBER }, actualTotal: { type: Type.NUMBER }, suggestion: { type: Type.STRING } }, required: ["groupName", "expectedTotal", "actualTotal", "suggestion"] } },
    accountSuggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { suggestion: { type: Type.STRING }, reasoning: { type: Type.STRING } }, required: ["suggestion", "reasoning"] } },
    spellingCorrections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { originalText: { type: Type.STRING }, correctedText: { type: Type.STRING } }, required: ["originalText", "correctedText"] } },
    customAnalysisResults: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { request: { type: Type.STRING }, response: { type: Type.STRING } }, required: ["request", "response"] } },
  },
  required: ["summary", "balanceErrors", "calculationErrors", "accountSuggestions", "spellingCorrections", "customAnalysisResults"],
};

const comparisonPrompt = `
    Você é um auditor contábil sênior. Sua tarefa é comparar os resultados de análises de relatórios contábeis fornecidos abaixo em formato JSON.
    **Objetivo**: Realize uma análise comparativa profunda, focando em:
    1.  **Diferenças Chave (keyDifferences)**: Aponte as divergências mais significativas.
    2.  **Semelhanças Chave (keySimilarities)**: Identifique problemas recorrentes ou pontos positivos consistentes.
    3.  **Análise de Tendência (trendAnalysis)**: Se os relatórios parecem ser da mesma empresa em datas diferentes, analise a evolução.
    4.  **Resumo (summary)**: Forneça um parágrafo conciso resumindo a comparação.
    **Importante**: Sua resposta deve ser exclusivamente no formato JSON especificado no schema.
    Abaixo estão os dados para comparação:
    `;

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    keyDifferences: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { aspect: { type: Type.STRING }, details: { type: Type.STRING } } } },
    keySimilarities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { aspect: { type: Type.STRING }, details: { type: Type.STRING } } } },
    trendAnalysis: { type: Type.STRING },
    comparedItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { fileName: { type: Type.STRING }, analysisDate: { type: Type.STRING }, employeeName: { type: Type.STRING }, companyName: { type: Type.STRING } } } }
  },
  required: ["summary", "keyDifferences", "keySimilarities", "comparedItems"],
};
// --- Fim dos Schemas e Prompts ---

const getAiClient = () => {
    // A API Key é injetada pelo ambiente de compilação/execução.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("A variável de ambiente API_KEY não está configurada.");
    }
    return new GoogleGenAI({ apiKey });
}

export const analyzeReport = async (reportData: ParseResult, customFields: string[], setProgress: (message: string) => void, settings: AppSettings): Promise<AnalysisResult> => {
  try {
    setProgress('Preparando para análise...');
    const ai = getAiClient();

    let contents: any;

    let finalPrompt = analysisPrompt;
    if (customFields && customFields.length > 0) {
        const customRequests = customFields.map((field, index) => `  ${index + 1}. ${field}`).join('\n');
        finalPrompt += `
6.  **Análises Customizadas (customAnalysisResults)**: Responda às seguintes solicitações específicas:
${customRequests}`;
    } else {
        finalPrompt += `
6.  **Análises Customizadas (customAnalysisResults)**: O usuário não forneceu nenhuma solicitação customizada. Retorne um array vazio.`;
    }

    if (reportData.type === 'text') {
        contents = `${finalPrompt}\n\n--- INÍCIO DO RELATÓRIO ---\n${reportData.content}\n--- FIM DO RELATÓRIO ---`;
    } else {
        const textPart = { text: `${finalPrompt}\n\n--- RELATÓRIO EM IMAGENS ---` };
        const imageParts = reportData.content.map((img: any) => ({
            inlineData: { mimeType: img.mimeType, data: img.data },
        }));
        contents = { parts: [textPart, ...imageParts] };
    }

    setProgress('Analisando com IA...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: settings.model,
        contents,
        config: { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 },
    });
    
    const resultText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(resultText);

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    const message = error instanceof Error ? error.message : "Não foi possível obter uma análise. Verifique sua chave de API e a conexão com a internet.";
    throw new Error(message);
  }
};


export const compareAnalyses = async (itemsToCompare: AnalysisHistoryItem[], settings: AppSettings): Promise<ComparisonResult> => {
  try {
    const ai = getAiClient();
    
    const reportsJson = itemsToCompare.map(item => ({
        fileName: item.fileName,
        analysisDate: item.analysisDate,
        employeeName: item.employeeName,
        companyName: item.companyName,
        analysisResult: item.result,
    }));
    
    const contents = `${comparisonPrompt}\n\n${JSON.stringify(reportsJson, null, 2)}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: settings.model,
        contents,
        config: { responseMimeType: "application/json", responseSchema: comparisonSchema, temperature: 0.3 },
    });
    
    const resultText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Error calling Gemini API for comparison:", error);
    const message = error instanceof Error ? error.message : "Não foi possível obter uma comparação.";
    throw new Error(message);
  }
};
