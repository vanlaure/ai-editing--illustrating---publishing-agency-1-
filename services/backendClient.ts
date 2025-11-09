import type { LaunchScenario, ManuscriptSegment, ManuscriptSearchResult, ComplianceIssue, CostPlan } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const post = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request to ${path} failed`);
  }
  return response.json() as Promise<T>;
};

export const backendClient = {
  async extractWorldBible(context: string) {
    const response = await fetch('/api/world/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || 'Failed to extract series bible from context.');
    }

    const data = await response.json();
    if (!data.success || !data.seriesBible) {
      throw new Error(data.message || 'Invalid series bible response from server.');
    }

    return data.seriesBible as {
      characters?: any[];
      settings?: any[];
      factions?: any[];
      items?: any[];
      timeline?: any[];
      styleGuidelines?: any;
    };
  },
  async syncIndex(documentId: string, text: string) {
    return post<{ documentId: string; segments: ManuscriptSegment[] }>('/documents', {
      documentId,
      text,
    });
  },
  async searchIndex(documentId: string, query: string) {
    return post<{ results: ManuscriptSearchResult[] }>('/rag/query', {
      documentId,
      query,
    });
  },
  async runComplianceScan(manuscript: string) {
    return post<{ issues: ComplianceIssue[] }>('/ai/compliance', { manuscript });
  },
  async generateCostPlan(tier: 'starter' | 'professional' | 'cinematic', manuscript: string) {
    return post<{ plan: CostPlan }>('/ai/cost-plan', { tier, manuscript });
  },
  async simulateLaunch(priority: 'speed' | 'reach' | 'budget', manuscript: string) {
    return post<{ scenarios: LaunchScenario[] }>('/ai/scenario', { priority, manuscript });
  },
};
