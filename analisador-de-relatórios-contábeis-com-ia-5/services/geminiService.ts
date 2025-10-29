import { type AnalysisResult, type ParseResult, type AppSettings, type AnalysisHistoryItem, type ComparisonResult } from '../types.ts';

const analyzeWithTimeout = async <T>(promise: Promise<T>, timeoutSeconds: number): Promise<T> => {
  let timeoutHandle: number;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => {
      reject(new Error(`A análise demorou mais de ${timeoutSeconds} segundos e foi interrompida.`));
    }, timeoutSeconds * 1000);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const callApiProxy = async (endpoint: string, body: any, timeout: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Ocorreu um erro no servidor (código: ${response.status}).`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
       throw new Error(`A análise demorou mais de ${timeout} segundos e foi interrompida.`);
    }
    throw error;
  }
};


export const analyzeReport = async (reportData: ParseResult, customFields: string[], setProgress: (message: string) => void, settings: AppSettings): Promise<AnalysisResult> => {
  try {
    setProgress('Enviando para análise segura...');
    const body = {
      type: 'analyze',
      reportData,
      customFields,
      settings,
    };
    const result: AnalysisResult = await callApiProxy('/api/gemini-proxy', body, settings.timeout);
    return result;
  } catch (error) {
    console.error("Error calling API proxy for analysis:", error);
    const message = error instanceof Error ? error.message : "Não foi possível obter uma análise. Verifique a conexão e as configurações do projeto na Vercel.";
    throw new Error(message);
  }
};


export const compareAnalyses = async (itemsToCompare: AnalysisHistoryItem[], settings: AppSettings): Promise<ComparisonResult> => {
  try {
    const body = {
      type: 'compare',
      itemsToCompare,
      settings,
    };
    const result: ComparisonResult = await callApiProxy('/api/gemini-proxy', body, settings.timeout);
    return result;
  } catch (error) {
    console.error("Error calling API proxy for comparison:", error);
    const message = error instanceof Error ? error.message : "Não foi possível obter uma comparação.";
    throw new Error(message);
  }
};
