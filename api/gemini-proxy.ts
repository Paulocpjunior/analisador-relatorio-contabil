// /api/gemini-proxy.ts

// Este arquivo DEVE estar dentro de uma pasta 'api' na raiz do seu projeto.
// A Vercel irá automaticamente transformar este arquivo em uma função serverless.

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// --- Tipos de Dados (para isolar a função serverless) ---
// Estes tipos são uma cópia de 'types.ts' para garantir que a função
// não dependa de arquivos externos, o que pode causar problemas no deploy.
interface AppSettings {
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
}

type ParseResult = 
  | { type: 'text'; content: string }
  | { type: 'images'; content: { mimeType: string; data: string }[] };

interface AnalysisResult {
  summary: string;
  balanceErrors: any[];
  calculationErrors: any[];
  accountSuggestions: any[];
  spellingCorrections: any[];
  customAnalysisResults?: any[];
}

interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  analysisDate: string;
  result: AnalysisResult;
  employeeName?: string;
  companyName?: string;
}
// --- Fim dos Tipos de Dados ---


// --- Schemas e Prompts ---
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


// Handler da função serverless
export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Apenas requisições POST são permitidas' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await request.json();
        const { type } = body;

        // Acessa a API Key de forma segura através das variáveis de ambiente da Vercel
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("A variável de ambiente API_KEY não está configurada no projeto Vercel.");
        }
        const ai = new GoogleGenAI({ apiKey });

        let result;
        if (type === 'analyze') {
            result = await handleAnalyze(ai, body);
        } else if (type === 'compare') {
            result = await handleCompare(ai, body);
        } else {
            throw new Error("Tipo de requisição inválido.");
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Erro na função proxy da API:", error);
        const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido no servidor.';
        return new Response(JSON.stringify({ message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleCompare(
  ai: GoogleGenAI,
  body: { itemsToCompare: AnalysisHistoryItem[]; settings: AppSettings }
) {
  const { itemsToCompare, settings } = body;

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
    config: {
      responseMimeType: "application/json",
      responseSchema: comparisonSchema, // mantenha ou remova conforme seu código
      temperature: 0.2,
    },
  });

  // ✅ correção simples para o TS18048
  const text = (response as any).text ?? '';
  if (!text.trim()) {
    throw new Error("A resposta da API do Gemini para comparação veio vazia ou foi bloqueada.");
  }

  const cleanedText = text.trim().replace(/^```json\s*|\s*```$/g, '');

  try {
    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch {
    console.error("Comparação retornou não-JSON:", cleanedText);
    throw new Error("Falha ao processar a resposta de comparação (JSON inválido).");
  }
}
