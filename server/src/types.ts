export type VectorDocument = {
  documentId: string;
  title: string;
  chunks: VectorChunk[];
};

export type VectorChunk = {
  id: string;
  heading: string;
  summary: string;
  quote: string;
  content: string;
  embedding: number[];
};

export type CompliancePayload = {
  manuscript: string;
};

export type CostPlanPayload = {
  manuscript: string;
  tier: string;
};

export type ScenarioPayload = {
  manuscript: string;
  priority: 'speed' | 'reach' | 'budget';
};

export type DocumentIngestPayload = {
  documentId: string;
  title?: string;
  text: string;
  chunkSize?: number;
};

export type RagQueryPayload = {
  documentId: string;
  query: string;
  topK?: number;
};
