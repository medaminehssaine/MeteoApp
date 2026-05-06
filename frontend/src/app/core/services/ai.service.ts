import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NLExtractionResult {
  summary: string;
  indicators: Array<{
    name: string; category: string; currentValue: number;
    targetValue: number; unit: string; trend: string; state: string;
  }>;
  risks: Array<{
    title: string; description: string; category: string;
    probability: number; impact: number; severity: number; status: string;
  }>;
  corrective_actions: Array<{
    title: string; description: string; priority: string; expectedImpact: string;
    assignee?: string; deadline?: string;
  }>;
  overall_health: string;
  confidence: number;
  // Extended fields from file ingestion
  milestones?: Array<{ name: string; date: string; status: string; }>;
  budget?: { planned: number; consumed: number; remaining: number; unit: string; burnRate: string; };
  timeline?: { startDate: string; endDate: string; delayDays: number; criticalPath: string; };
  team_signals?: { workload: string; morale: string; notes: string; };
  raw_observations?: string[];
  _source?: { fileName: string; fileSize: number; fileType: string; extractedChars: number; };
}

export interface FilePreviewResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedChars: number;
  preview: string;
  supported: boolean;
}

export interface MeteoExplanation {
  explanation: string;
}

export interface AIRecommendation {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  expectedImpact: string;
  timeframe?: string;
}

export interface AIRecommendationsResult {
  summary: string;
  urgency: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  recommendations: AIRecommendation[];
  warning_signs: string[];
  positive_points: string[];
}

export interface AIProjectionEnrichment {
  narrative: string;
  key_factors: Array<{ factor: string; direction: string; explanation: string; }>;
  recommendations: AIRecommendation[];
  risk_alert: string | null;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** Feature 1: NL text → structured project data */
  extractFromText(projectName: string, text: string): Observable<NLExtractionResult> {
    return this.http.post<NLExtractionResult>(`${this.base}/ai/extract`, { projectName, text });
  }

  /** Feature 2: Explain a météo score in human language */
  explainMeteo(payload: {
    projectName: string; state: string; score: number;
    indicatorScore: number; riskScore: number; planScore: number; cqdScore: number;
    forced: boolean; forcingRule?: string;
  }): Observable<MeteoExplanation> {
    return this.http.post<MeteoExplanation>(`${this.base}/ai/explain-meteo`, payload);
  }

  /** Feature 3: Enrich a Monte Carlo projection with AI narrative */
  enrichProjection(payload: object): Observable<AIProjectionEnrichment> {
    return this.http.post<AIProjectionEnrichment>(`${this.base}/ai/enrich-projection`, payload);
  }

  /** Feature 4: Generate smart recommendations */
  getRecommendations(payload: {
    projectName: string; meteoState: string; score: number;
    budgetConsumedPct: number; actualProgress: number; plannedProgress: number;
    qualityScore: number; lateActions: number; criticalRisks: number;
    forced: boolean; forcingRule?: string;
  }): Observable<AIRecommendationsResult> {
    return this.http.post<AIRecommendationsResult>(`${this.base}/ai/recommendations`, payload);
  }

  /** Feature 5: File Ingestion — upload any file → AI extraction */
  ingestFile(file: File, projectName?: string): Observable<NLExtractionResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectName) formData.append('projectName', projectName);
    return this.http.post<NLExtractionResult>(`${this.base}/ai/ingest`, formData);
  }

  /** Feature 5b: Preview file content before AI analysis */
  previewFile(file: File): Observable<FilePreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FilePreviewResult>(`${this.base}/ai/ingest/preview`, formData);
  }
}

