import {
  generateSearchQueries,
  getCampaign,
  refreshCampaignLeadCount,
  setCampaignStatus,
} from "./campaigns.js";
import { findOrCreateCompany, listCompanies } from "./companies.js";
import { saveDiscoveredLead } from "./contacts.js";
import { extractLeadsFromResults } from "./lead-extractor.js";
import { runWebSearch } from "./search.js";
import { resolveSearchCredentials } from "./settings.js";
import type { OutboundRunResult, SearchResult } from "./types.js";

import "./schema.js";

function dbCompanyCount(userId: string): number {
  return listCompanies(userId).length;
}

function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    let key = result.url;
    try {
      key = new URL(result.url).hostname.replace(/^www\./, "");
    } catch {
      // keep url as key
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function runOutboundCampaign(
  campaignId: string,
  userId: string
): Promise<OutboundRunResult> {
  const campaign = getCampaign(campaignId, userId);
  if (!campaign) {
    return { ok: false, leadsFound: 0, searchesRun: 0, companiesCreated: 0, message: "Campaign not found" };
  }

  const searchCreds = resolveSearchCredentials(userId);
  if (!searchCreds) {
    return {
      ok: false,
      leadsFound: 0,
      searchesRun: 0,
      companiesCreated: 0,
      message: "Add a search API key in Outbound settings (Tavily, Serper, or Brave).",
    };
  }

  setCampaignStatus(campaignId, userId, "running");

  try {
    const queries = generateSearchQueries(campaign);
    const allResults: SearchResult[] = [];

    for (const query of queries) {
      const results = await runWebSearch(
        searchCreds.provider,
        searchCreds.apiKey,
        query,
        8
      );
      allResults.push(...results);
    }

    const uniqueResults = dedupeResults(allResults);
    const batches = chunk(uniqueResults, 6);
    let leadsFound = 0;
    let companiesCreated = 0;

    for (const batch of batches) {
      const extracted = await extractLeadsFromResults(userId, campaign, batch);

      for (const lead of extracted) {
        const beforeCount = dbCompanyCount(userId);
        const company = findOrCreateCompany(userId, {
          name: lead.companyName,
          website: lead.website,
          industry: lead.industry ?? campaign.industry ?? undefined,
          location: lead.location ?? campaign.geography ?? undefined,
        });
        const afterCount = dbCompanyCount(userId);
        if (afterCount > beforeCount) companiesCreated++;

        saveDiscoveredLead(userId, campaignId, lead, company.id);
        leadsFound++;
      }
    }

    refreshCampaignLeadCount(campaignId, userId);
    setCampaignStatus(campaignId, userId, "completed");

    return {
      ok: true,
      leadsFound,
      searchesRun: queries.length,
      companiesCreated,
      message: `Discovery complete. Found ${leadsFound} lead(s) across ${queries.length} searches.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign run failed";
    setCampaignStatus(campaignId, userId, "failed", message);
    return {
      ok: false,
      leadsFound: 0,
      searchesRun: 0,
      companiesCreated: 0,
      message,
    };
  }
}
