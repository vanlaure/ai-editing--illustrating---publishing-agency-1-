export type ServiceLine = 'editing' | 'illustration' | 'audiobook' | 'marketing';

export type ServiceLineStatus =
  | 'not_started'
  | 'intake'
  | 'in_progress'
  | 'awaiting_internal_review'
  | 'awaiting_client_review'
  | 'approved'
  | 'on_hold';

export interface AgencyClient {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  code?: string;
  title: string;
  seriesName?: string;
  genre?: string;
  services: ServiceLine[];
  editingStatus: ServiceLineStatus;
  illustrationStatus: ServiceLineStatus;
  audiobookStatus: ServiceLineStatus;
  marketingStatus: ServiceLineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  name: string;
  objective: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface RightsRecord {
  id: string;
  projectId: string;
  assetType: 'manuscript' | 'illustration' | 'audio' | 'marketing' | 'other';
  assetId?: string;
  territory?: string;
  usage?: string;
  expiresAt?: string;
  status: 'pending' | 'approved' | 'restricted' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface AiTaskConfig {
  model: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export type AiTaskId =
  | 'editing.compliance'
  | 'editing.costPlan'
  | 'editing.scenario'
  | 'editing.seriesBible'
  | 'illustration.brief'
  | 'publishing.metadata'
  | 'publishing.exports'
  | 'marketing.campaign'
  | 'marketing.scenario';

export interface AiCallMeta {
  task: AiTaskId | string;
  projectId?: string;
  clientId?: string;
  route: string;
}

export interface VectorChunk {
  id: string;
  heading: string;
  summary: string;
  content: string;
  metadata?: Record<string, any>;
  embedding: number[];
}

export interface VectorDocument {
  documentId: string;
  title: string;
  chunks: VectorChunk[];
}
