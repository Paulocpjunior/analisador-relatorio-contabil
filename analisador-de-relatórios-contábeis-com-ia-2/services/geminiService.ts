import { type AnalysisResult, type ParseResult, type AppSettings, type AnalysisHistoryItem, type ComparisonResult } from '../types.ts';

/**
 * Helper function to call the backend proxy.
 * @param body - The request body to send to the serverless function.
 * @returns The JSON response from the API.
 */
async function callApiProxy(body: object) {
  try {
    const response = await fetch(`/api/gemini-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      // Use the error message from the proxy if available, otherwise use a default.
      const errorMessage = result.message || `An error occurred on the server (status: ${response.status}).`;
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error("Error calling API proxy:", error);
    // Re-throw the error to be caught by the calling function's try-catch block
    throw error;
  }
}

export const analyzeReport = async (reportData: ParseResult, customFields: string[], setProgress: (message: string) => void, settings: AppSettings): Promise<AnalysisResult> => {
  setProgress('Enviando para análise no servidor...');
  
  const body = {
    type: 'analyze',
    reportData,
    customFields,
    settings,
  };
  
  const result = await callApiProxy(body);
  setProgress('Análise recebida.');
  return result;
};

export const compareAnalyses = async (itemsToCompare: AnalysisHistoryItem[], settings: AppSettings): Promise<ComparisonResult> => {
  const body = {
    type: 'compare',
    itemsToCompare,
    settings,
  };
  return callApiProxy(body);
};
