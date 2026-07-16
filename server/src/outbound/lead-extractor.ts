import OpenAI from "openai";
import { resolveCredentials } from "../settings.js";
import type { ExtractedLead, OutboundCampaignPublic, SearchResult } from "./types.js";

const EXTRACTION_PROMPT = `You are a B2B lead research analyst. Given web search results and a target campaign profile, extract structured business leads.

Return ONLY valid JSON: { "leads": [ { ... } ] }

Each lead object fields:
- companyName (required string)
- website, contactName, email, linkedin, phone, title, industry, location (string or null)
- relevanceScore (0-100 integer)
- aiSummary (1-2 sentences)
- qualificationNotes (string or null)
- sourceUrl (must match an input result URL)
- snippet (relevant excerpt)

Rules:
- Only extract real businesses, not generic news unless they name specific companies
- relevanceScore 80+ = strong ICP fit, 50-79 = possible fit, below 50 = exclude
- Never invent emails or phone numbers
- Deduplicate by company
- Return at most 8 leads per batch`;

export async function extractLeadsFromResults(
  userId: string,
  campaign: OutboundCampaignPublic,
  results: SearchResult[]
): Promise<ExtractedLead[]> {
  if (results.length === 0) return [];

  const credentials = resolveCredentials(userId);
  if (!credentials) {
    return fallbackExtraction(campaign, results);
  }

  const campaignContext = `
Campaign: ${campaign.name}
Industry: ${campaign.industry ?? "any"}
Keywords: ${campaign.keywords.join(", ") || "none"}
Geography: ${campaign.geography ?? "any"}
Target titles: ${campaign.targetTitles.join(", ") || "any"}
Company size: ${campaign.companySize ?? "any"}
`.trim();

  const resultsContext = results
    .map(
      (result, index) =>
        `[${index + 1}] URL: ${result.url}\nTitle: ${result.title}\nSnippet: ${result.snippet}`
    )
    .join("\n\n");

  try {
    const client = new OpenAI({
      apiKey: credentials.apiKey,
      baseURL: credentials.baseUrl,
    });

    const response = await client.chat.completions.create({
      model: credentials.model,
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: `${campaignContext}\n\nSearch results:\n${resultsContext}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      leads?: ExtractedLead[];
    };

    const leads = parsed.leads ?? (Array.isArray(parsed) ? parsed : []);

    return (leads as ExtractedLead[])
      .filter((lead) => lead.companyName && lead.relevanceScore >= 50)
      .map((lead) => ({
        ...lead,
        sourceUrl: lead.sourceUrl || results[0]?.url || "",
        snippet: lead.snippet || "",
        aiSummary: lead.aiSummary || "Potential lead from web discovery.",
      }));
  } catch (error) {
    console.error("AI lead extraction failed, using fallback:", error);
    return fallbackExtraction(campaign, results);
  }
}

function fallbackExtraction(
  campaign: OutboundCampaignPublic,
  results: SearchResult[]
): ExtractedLead[] {
  return results.slice(0, 5).map((result) => {
    const companyName = extractCompanyFromTitle(result.title);
    const relevance = scoreRelevance(campaign, result);

    return {
      companyName,
      website: extractDomain(result.url) ?? undefined,
      contactName: undefined,
      email: extractEmail(result.snippet) ?? undefined,
      linkedin: result.url.includes("linkedin.com") ? result.url : undefined,
      phone: undefined,
      title: undefined,
      industry: campaign.industry ?? undefined,
      location: campaign.geography ?? undefined,
      relevanceScore: relevance,
      aiSummary: `Discovered via web search: ${result.title}`,
      qualificationNotes: "Extracted without AI — review manually.",
      sourceUrl: result.url,
      snippet: result.snippet,
    };
  }).filter((lead) => lead.relevanceScore >= 40);
}

function extractCompanyFromTitle(title: string): string {
  const cleaned = title
    .replace(/\s*[\|–-]\s*.+$/, "")
    .replace(/\s*:\s*.+$/, "")
    .trim();
  return cleaned.slice(0, 80) || "Unknown Company";
}

function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.includes("linkedin.com") ? null : hostname;
  } catch {
    return null;
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match?.[0] ?? null;
}

function scoreRelevance(
  campaign: OutboundCampaignPublic,
  result: SearchResult
): number {
  let score = 45;
  const haystack = `${result.title} ${result.snippet}`.toLowerCase();

  for (const keyword of campaign.keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 10;
  }
  if (campaign.industry && haystack.includes(campaign.industry.toLowerCase())) {
    score += 10;
  }
  if (campaign.geography && haystack.includes(campaign.geography.toLowerCase())) {
    score += 8;
  }
  for (const title of campaign.targetTitles) {
    if (haystack.includes(title.toLowerCase())) score += 8;
  }
  if (result.url.includes("linkedin.com")) score += 5;

  return Math.min(score, 85);
}
