/**
 * TypeScript shapes mirroring the C# DTOs returned by the Netlify Dashboard backoffice API.
 * Kept in sync by hand; see Models/NetlifyModels.cs.
 */

/** Mirror of the C# DeployStatus enum (System.Text.Json serialises enums as numbers). */
export enum DeployStatus {
  Other = 0,
  Building = 1,
  Deployed = 2,
  Failed = 3,
}

export interface ConnectionStatusModel {
  isConnected: boolean;
  accountName?: string | null;
  selectedSiteId?: string | null;
}

export interface NetlifySiteModel {
  id: string;
  name: string;
  url?: string | null;
  customDomain?: string | null;
}

export interface NetlifyDeployModel {
  id: string;
  state: string;
  status: DeployStatus;
  branch?: string | null;
  commitRef?: string | null;
  commitUrl?: string | null;
  context?: string | null;
  deployUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
}
