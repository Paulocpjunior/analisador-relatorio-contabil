// /api/gemini-proxy.ts
// Serverless Function (Node) para projetos estáticos na Vercel.

import { GoogleGenAI, Type } from "@google/genai";

// ------------------------ Tipos básicos ------------------------
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
// ---------------------------------------------------------------


// ---------------------- Schemas & Prompts ----------------------
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
    summary: { type: Type.STRING },
    balanceErrors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          accountName: { type: Type.STRING },
          issue: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
        required: ["accountName", "issue", "suggestion"],
      },
    },
    calculationErrors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          groupName: { type: Type.STRING },
          expectedTotal: { type: Type.NUMBER },
          actualTotal: { type: Type.NUMBER },
          suggestion: { type: Type.STRING },
        },
        required: ["groupName", "expectedTotal", "actualTotal", "suggestion"],
      },
    },
    accountSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          suggestion: { type: Type.STRING },
          reasoning: { type: Type.STRING },
        },
        required: ["suggestion", "reasoning"],
      },
    },
    spellingCorrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          correctedText: { type: Type.STRING },
        },
        required: ["originalText", "correctedText"],
      },
    },
    customAnalysisResults: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          request: { type: Type.STRING },
          response: { type: Type.STRING },
        },
        required: ["request", "response"],
      },
    },
  },
  required: ["summary", "balanceErrors", "calculationErrors", "accountSuggestions", "spellingCorrections", "customAnalysisResults"],
};

const comparisonPrompt = `
Você é um auditor contábil sênior. Sua tarefa é comparar os resultados de análises de relatórios contábeis fornecidos abaixo em formato JSON.
**Objetivo**: Realize uma análise comparativa profunda, focando em:
1. **Diferenças Chave (keyDifferences)**: Aponte as divergências mais significativas.
2. **Semelhanças Chave (keySimilarities)**: Identifique problemas recorrentes ou pontos positivos consistentes.
3. **Análise de Tendência (trendAnalysis)**: Se os relatórios parecem ser da mesma empresa em datas diferentes, analise a evolução.
4. **Resumo (summary)**: Forneça um parágrafo conciso resumindo a comparação.
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
    comparedItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { fileName: { type: Type.STRING }, analysisDate: { type: Type.STRING }, employeeName: { type: Type.STRING }, companyName: { type: Type.STRING } } } },
  },
  required: ["summary", "keyDifferences", "keySimilarities", "comparedItems"],
};
// --------------------------------------------------------------


// ---------------------- Utilitários simples -------------------
function getResponseText(resp: any): string {
  const t = (resp as any)?.text;
  if (typeof t === 'string') return t;
  const parts = (resp as any)?.candidates?.flatMap((c: any) => c?.content?.parts ?? []) ?? [];
  const texts = parts.map((p: any) => p?.text).filter((x: any) => typeof x === 'string');
  return texts.join('\n');
}

function stripJsonFences(s: string): string {
  return s.trim().replace(/^```json\s*|\s*```$/g, '');
}
// --------------------------------------------------------------


// ---------------------- Handlers de negócio -------------------
async function handleAnalyze(
  ai: GoogleGenAI,
  body: { reportData: ParseResult; settings: AppSettings; finalPrompt?: string }
) {
  const { reportData, settings, finalPrompt = analysisPrompt } = body;

  let contents: any;
  if (reportData?.type === 'text') {
    contents = `${finalPrompt}\n\n--- INÍCIO DO RELATÓRIO ---\n${reportData.content}\n--- FIM DO RELATÓRIO ---`;
  } else {
    const textPart = { text: `${finalPrompt}\n\n--- RELATÓRIO EM IMAGENS ---` };
    const imageParts = (reportData?.content ?? []).map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    }));
    contents = { parts: [textPart, ...imageParts] };
  }

  const response = await ai.models.generateContent({
    model: settings.model,
    contents,
    config: { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 },
  });

  const text = getResponseText(response);
  const cleaned = stripJsonFences(text);
  if (!cleaned) {
    throw new Error("A resposta da API do Gemini para análise estava vazia ou foi bloqueada por filtros de segurança.");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("A API Gemini retornou uma resposta não-JSON:", cleaned);
    throw new Error("Falha ao processar a resposta da API. O formato JSON retornado era inválido.");
  }
}

async function handleCompare(
  ai: GoogleGenAI,
  body: { itemsToCompare: AnalysisHistoryItem[]; settings: AppSettings }
) {
  const { itemsToCompare = [], settings } = body;

  const reportsJson = itemsToCompare.map((item) => ({
    fileName: item.fileName,
    analysisDate: item.analysisDate,
    employeeName: item.employeeName,
    companyName: item.companyName,
    analysisResult: item.result,
  }));

  const contents = `${comparisonPrompt}\n\n${JSON.stringify(reportsJson, null, 2)}`;

  const response = await ai.models.generateContent({
    model: settings.model,
    contents,
    config: { responseMimeType: "application/json", responseSchema: comparisonSchema, temperature: 0.2 },
  });

  const text = getResponseText(response);
  const cleaned = stripJsonFences(text);
  if (!cleaned) {
    throw new Error("A resposta da API do Gemini para comparação veio vazia ou foi bloqueada.");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Comparação retornou não-JSON:", cleaned);
    throw new Error("Falha ao processar a resposta de comparação (JSON inválido).");
  }
}
// --------------------------------------------------------------


// --------------- Serverless Function (Node runtime) -----------
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Apenas requisições POST são permitidas' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type } = body || {};

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: "A variável de ambiente API_KEY não está configurada no projeto Vercel." });
      return;
    }
    const ai = new GoogleGenAI({ apiKey });

    let result: unknown;
    if (type === 'analyze') {
      result = await handleAnalyze(ai, body);
    } else if (type === 'compare') {
      result = await handleCompare(ai, body);
    } else {
      res.status(400).json({ message: "Tipo de requisição inválido." });
      return;
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro na função proxy da API:", error);
    const message = error?.message ?? 'Ocorreu um erro desconhecido no servidor.';
    res.status(500).json({ message });
  }
}
// --------------------------------------------------------------
