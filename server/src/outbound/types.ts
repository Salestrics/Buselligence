export type SearchProviderId = "tavily" | "serper" | "brave";

export type LeadStatus =
  | "new"
  | "qualified"
  | "converted"
  | "contacted"
  | "dismissed";

export type ContactStage =
  | "new"
  | "researching"
  | "contacted"
  | "replied"
  | "qualified"
  | "unqualified"
  | "customer";

export type CompanyStatus = "prospect" | "active" | "customer" | "churned";

export type CampaignStatus = "draft" | "running" | "completed" | "failed";

export type ActivityType =
  | "note"
  | "email"
  | "call"
  | "meeting"
  | "status_change"
  | "discovered"
  | "follow_up";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface ExtractedLead {
  companyName: string;
  website?: string;
  contactName?: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  title?: string;
  industry?: string;
  location?: string;
  relevanceScore: number;
  aiSummary: string;
  qualificationNotes?: string;
  sourceUrl: string;
  snippet: string;
}

export interface OutboundCampaignInput {
  name: string;
  description?: string;
  industry?: string;
  keywords?: string[];
  geography?: string;
  targetTitles?: string[];
  companySize?: string;
  customQueries?: string[];
}

export interface OutboundCampaignPublic {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  keywords: string[];
  geography: string | null;
  targetTitles: string[];
  companySize: string | null;
  customQueries: string[];
  status: CampaignStatus;
  leadsCount: number;
  contactsCount: number;
  lastRunAt: string | null;
  lastRunError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundLeadPublic {
  id: string;
  campaignId: string;
  campaignName: string | null;
  companyId: string | null;
  contactId: string | null;
  companyName: string;
  website: string | null;
  contactName: string | null;
  email: string | null;
  linkedin: string | null;
  phone: string | null;
  title: string | null;
  industry: string | null;
  location: string | null;
  snippet: string | null;
  sourceUrl: string;
  relevanceScore: number;
  aiSummary: string;
  qualificationNotes: string | null;
  status: LeadStatus;
  discoveredAt: string;
}

export interface OutboundCompanyPublic {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  status: CompanyStatus;
  contactsCount: number;
  leadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundContactPublic {
  id: string;
  companyId: string | null;
  companyName: string | null;
  leadId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  title: string | null;
  stage: ContactStage;
  tags: string[];
  notes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundActivityPublic {
  id: string;
  contactId: string | null;
  companyId: string | null;
  leadId: string | null;
  type: ActivityType;
  subject: string | null;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface OutboundContactInput {
  companyId?: string | null;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  title?: string;
  stage?: ContactStage;
  tags?: string[];
  notes?: string;
  nextFollowUpAt?: string | null;
}

export interface OutboundCompanyInput {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  status?: CompanyStatus;
}

export interface OutboundRunResult {
  ok: boolean;
  leadsFound: number;
  searchesRun: number;
  companiesCreated: number;
  message?: string;
}

export interface SearchProviderDefinition {
  id: SearchProviderId;
  name: string;
  description: string;
  docsUrl: string;
}

export const SEARCH_PROVIDER_DEFINITIONS: SearchProviderDefinition[] = [
  {
    id: "tavily",
    name: "Tavily",
    description:
      "AI-native search API optimized for research and lead discovery agents.",
    docsUrl: "https://docs.tavily.com",
  },
  {
    id: "serper",
    name: "Serper",
    description: "Google Search API for high-quality web results.",
    docsUrl: "https://serper.dev",
  },
  {
    id: "brave",
    name: "Brave Search",
    description: "Independent search index with a generous free tier.",
    docsUrl: "https://brave.com/search/api",
  },
];

export const CONTACT_STAGES: ContactStage[] = [
  "new",
  "researching",
  "contacted",
  "replied",
  "qualified",
  "unqualified",
  "customer",
];
