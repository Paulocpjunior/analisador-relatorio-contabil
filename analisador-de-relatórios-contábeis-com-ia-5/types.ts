export interface BalanceError {
  accountName: string;
  issue: string;
  suggestion: string;
}

export interface CalculationError {
  groupName: string;
  expectedTotal: number;
  actualTotal: number;
  suggestion: string;
}

export interface AccountSuggestion {
  suggestion: string;
  reasoning: string;
}

export interface SpellingCorrection {
  originalText: string;
  correctedText: string;
}

export interface CustomAnalysisResultItem {
  request: string;
  response: string;
}

export interface AnalysisResult {
  summary: string;
  balanceErrors: BalanceError[];
  calculationErrors: CalculationError[];
  accountSuggestions: AccountSuggestion[];
  spellingCorrections: SpellingCorrection[];
  customAnalysisResults?: CustomAnalysisResultItem[];
}

export type ParseResult = 
  | { type: 'text'; content: string }
  | { type: 'images'; content: { mimeType: string; data: string }[] };

export interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  analysisDate: string;
  result: AnalysisResult;
  employeeName?: string;
  companyName?: string;
}

export interface AppSettings {
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  timeout: number; // in seconds
}

// Types for Comparison Feature
export interface ComparisonKeyPoint {
  aspect: string;
  details: string;
}

export interface ComparedItemInfo {
  fileName: string;
  analysisDate: string;
  employeeName?: string;
  companyName?: string;
}

export interface ComparisonResult {
  summary: string;
  keyDifferences: ComparisonKeyPoint[];
  keySimilarities: ComparisonKeyPoint[];
  trendAnalysis?: string;
  comparedItems: ComparedItemInfo[];
}