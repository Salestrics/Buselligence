import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Globe,
  Loader2,
  Mail,
  Play,
  Plus,
  Radar,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import {
  outboundApi,
  type ContactStage,
  type OutboundActivity,
  type OutboundCampaign,
  type OutboundContact,
  type OutboundLead,
  type OutboundStats,
  type SearchProviderId,
} from "../lib/api";
import { cn } from "../lib/utils";

type Tab = "dashboard" | "campaigns" | "leads" | "contacts" | "companies";

const STAGES: ContactStage[] = [
  "new",
  "researching",
  "contacted",
  "replied",
  "qualified",
  "unqualified",
  "customer",
];

export function OutboundPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<OutboundStats | null>(null);
  const [campaigns, setCampaigns] = useState<OutboundCampaign[]>([]);
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [contacts, setContacts] = useState<OutboundContact[]>([]);
  const [companies, setCompanies] = useState<Awaited<ReturnType<typeof outboundApi.listCompanies>>>([]);
  const [searchProviders, setSearchProviders] = useState<Array<{ id: SearchProviderId; name: string }>>([]);
  const [searchProvider, setSearchProvider] = useState<SearchProviderId>("tavily");
  const [searchApiKey, setSearchApiKey] = useState("");
  const [hasSearchKey, setHasSearchKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<OutboundContact | null>(null);
  const [activities, setActivities] = useState<OutboundActivity[]>([]);
  const [activityBody, setActivityBody] = useState("");

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    industry: "",
    geography: "",
    keywords: "",
    targetTitles: "",
    companySize: "",
  });

  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    companyId: "",
  });

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in");
  }, [isPending, session, navigate]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, c, l, ct, co, sp, settings] = await Promise.all([
        outboundApi.getStats(),
        outboundApi.listCampaigns(),
        outboundApi.listLeads(),
        outboundApi.listContacts(),
        outboundApi.listCompanies(),
        outboundApi.getSearchProviders(),
        outboundApi.getSettings(),
      ]);
      setStats(s);
      setCampaigns(c);
      setLeads(l);
      setContacts(ct);
      setCompanies(co);
      setSearchProviders(sp);
      setSearchProvider(settings.searchProvider);
      setHasSearchKey(settings.hasSearchApiKey);
    } catch {
      setError("Failed to load outbound data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user) loadAll();
  }, [session?.user]);

  useEffect(() => {
    if (!selectedContact) return;
    outboundApi.listActivities({ contactId: selectedContact.id }).then(setActivities);
  }, [selectedContact]);

  async function handleSaveSearchSettings(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await outboundApi.saveSettings({
        searchProvider,
        searchApiKey: searchApiKey.trim() || undefined,
      });
      setSearchApiKey("");
      setHasSearchKey(true);
      setSuccess("Search API settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function handleCreateCampaign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const campaign = await outboundApi.createCampaign({
        name: campaignForm.name,
        industry: campaignForm.industry || undefined,
        geography: campaignForm.geography || undefined,
        companySize: campaignForm.companySize || undefined,
        keywords: campaignForm.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        targetTitles: campaignForm.targetTitles.split(",").map((k) => k.trim()).filter(Boolean),
      });
      setCampaigns((prev) => [campaign, ...prev]);
      setCampaignForm({ name: "", industry: "", geography: "", keywords: "", targetTitles: "", companySize: "" });
      setSuccess(`Campaign "${campaign.name}" created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    }
  }

  async function handleRunCampaign(id: string) {
    setRunningId(id);
    setError(null);
    try {
      const result = await outboundApi.runCampaign(id);
      if (result.ok) {
        setSuccess(result.message ?? `Found ${result.leadsFound} leads`);
        await loadAll();
      } else {
        setError(result.message ?? "Campaign run failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunningId(null);
    }
  }

  async function handleConvertLead(id: string) {
    try {
      const contact = await outboundApi.convertLead(id);
      setSuccess(`Converted to contact: ${contact.firstName}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Convert failed");
    }
  }

  async function handleCreateContact(e: FormEvent) {
    e.preventDefault();
    try {
      await outboundApi.createContact({
        firstName: contactForm.firstName,
        lastName: contactForm.lastName || undefined,
        email: contactForm.email || undefined,
        title: contactForm.title || undefined,
        companyId: contactForm.companyId || null,
      });
      setContactForm({ firstName: "", lastName: "", email: "", title: "", companyId: "" });
      setSuccess("Contact created.");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contact");
    }
  }

  async function handleAddActivity(e: FormEvent) {
    e.preventDefault();
    if (!selectedContact || !activityBody.trim()) return;
    try {
      await outboundApi.addActivity({
        contactId: selectedContact.id,
        type: "note",
        subject: "Note",
        body: activityBody,
      });
      setActivityBody("");
      const updated = await outboundApi.listActivities({ contactId: selectedContact.id });
      setActivities(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add activity");
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Radar }[] = [
    { id: "dashboard", label: "Dashboard", icon: Radar },
    { id: "campaigns", label: "Campaigns", icon: Search },
    { id: "leads", label: "Leads", icon: Globe },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
              AI Outbound
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Lead discovery & contact management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Crawl the web for business leads matching your ICP, qualify them with AI,
              and manage contacts through your pipeline.
            </p>
          </div>
          <Link
            to="/chat"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Open BI Chat →
          </Link>
        </div>

        {(error || success) && (
          <div
            className={cn(
              "mb-6 rounded-2xl border px-4 py-3 text-sm",
              error
                ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
            )}
          >
            {error ?? success}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(null); setSuccess(null); }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                tab === id
                  ? "bg-brand-500 text-white"
                  : "border border-white/10 text-slate-400 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-300" />
          </div>
        ) : tab === "dashboard" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white">Pipeline overview</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["Campaigns", stats?.campaigns ?? 0],
                  ["Leads", stats?.leads ?? 0],
                  ["Contacts", stats?.contacts ?? 0],
                  ["Companies", stats?.companies ?? 0],
                  ["Qualified", stats?.qualified ?? 0],
                  ["Follow-ups due", stats?.followUps ?? 0],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-2xl border border-white/8 bg-[#0b1020] p-4">
                    <p className="text-2xl font-semibold text-white">{value as number}</p>
                    <p className="mt-1 text-xs text-slate-500">{label as string}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white">Web search API (BYOK)</h2>
              <p className="mt-2 text-sm text-slate-400">
                Add Tavily, Serper, or Brave API key to power lead discovery.
                {hasSearchKey ? " Key configured." : " Required before running campaigns."}
              </p>
              <form onSubmit={handleSaveSearchSettings} className="mt-4 space-y-3">
                <select
                  value={searchProvider}
                  onChange={(e) => setSearchProvider(e.target.value as SearchProviderId)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white"
                >
                  {searchProviders.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="password"
                  value={searchApiKey}
                  onChange={(e) => setSearchApiKey(e.target.value)}
                  placeholder="Search API key"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white"
                />
                <button type="submit" className="rounded-full bg-brand-500 px-4 py-2 text-sm text-white">
                  Save search settings
                </button>
              </form>
            </section>
          </div>
        ) : tab === "campaigns" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <form onSubmit={handleCreateCampaign} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <h2 className="text-lg font-semibold text-white">New campaign</h2>
              <input required value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="Campaign name" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <input value={campaignForm.industry} onChange={(e) => setCampaignForm({ ...campaignForm, industry: e.target.value })} placeholder="Industry (e.g. B2B SaaS)" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <input value={campaignForm.geography} onChange={(e) => setCampaignForm({ ...campaignForm, geography: e.target.value })} placeholder="Geography (e.g. United States)" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <input value={campaignForm.keywords} onChange={(e) => setCampaignForm({ ...campaignForm, keywords: e.target.value })} placeholder="Keywords (comma-separated)" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <input value={campaignForm.targetTitles} onChange={(e) => setCampaignForm({ ...campaignForm, targetTitles: e.target.value })} placeholder="Target titles (VP Sales, CRO)" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <input value={campaignForm.companySize} onChange={(e) => setCampaignForm({ ...campaignForm, companySize: e.target.value })} placeholder="Company size (e.g. 50-200 employees)" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm text-white">
                <Plus className="h-4 w-4" /> Create campaign
              </button>
            </form>

            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <p className="text-sm text-slate-500">No campaigns yet. Create one to start discovering leads.</p>
              ) : campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{campaign.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {campaign.industry ?? "Any industry"} · {campaign.geography ?? "Global"} · {campaign.leadsCount} leads
                      </p>
                      <p className="mt-2 text-sm text-slate-400">{campaign.description ?? campaign.keywords.join(", ")}</p>
                      <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-xs", campaign.status === "completed" ? "bg-emerald-500/15 text-emerald-300" : campaign.status === "failed" ? "bg-rose-500/15 text-rose-300" : campaign.status === "running" ? "bg-amber-500/15 text-amber-300" : "bg-white/10 text-slate-400")}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRunCampaign(campaign.id)}
                        disabled={runningId === campaign.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                      >
                        {runningId === campaign.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Run
                      </button>
                      <button onClick={() => outboundApi.deleteCampaign(campaign.id).then(loadAll)} className="rounded-lg border border-white/10 p-1.5 text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {campaign.lastRunError && (
                    <p className="mt-2 text-xs text-rose-300">{campaign.lastRunError}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : tab === "leads" ? (
          <div className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-sm text-slate-500">No leads yet. Run a campaign to discover prospects on the web.</p>
            ) : leads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{lead.companyName}</p>
                      <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs text-brand-200">
                        {lead.relevanceScore}% fit
                      </span>
                      <span className="text-xs text-slate-500">{lead.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{lead.aiSummary}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {lead.contactName && <span>{lead.contactName}{lead.title ? ` · ${lead.title}` : ""}</span>}
                      {lead.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                      {lead.website && <span>{lead.website}</span>}
                      {lead.campaignName && <span>Campaign: {lead.campaignName}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lead.status !== "converted" && (
                      <button onClick={() => handleConvertLead(lead.id)} className="inline-flex items-center gap-1 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-200">
                        <UserPlus className="h-3 w-3" /> Convert
                      </button>
                    )}
                    <button onClick={() => outboundApi.updateLead(lead.id, "dismissed").then(loadAll)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab === "contacts" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <form onSubmit={handleCreateContact} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 space-y-3">
                <h2 className="font-medium text-white">Add contact</h2>
                <input required value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} placeholder="First name" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-2 text-sm text-white" />
                <input value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} placeholder="Last name" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-2 text-sm text-white" />
                <input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-2 text-sm text-white" />
                <input value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} placeholder="Title" className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-2 text-sm text-white" />
                <button type="submit" className="rounded-full bg-brand-500 px-4 py-2 text-xs text-white">Add contact</button>
              </form>

              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition",
                      selectedContact?.id === contact.id
                        ? "border-brand-500/40 bg-brand-500/10"
                        : "border-white/8 bg-white/[0.03] hover:border-white/15"
                    )}
                  >
                    <p className="font-medium text-white">
                      {contact.firstName} {contact.lastName ?? ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {contact.companyName ?? "No company"} · {contact.stage}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              {selectedContact ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {selectedContact.firstName} {selectedContact.lastName ?? ""}
                      </h2>
                      <p className="text-sm text-slate-400">{selectedContact.title} at {selectedContact.companyName}</p>
                    </div>
                    <select
                      value={selectedContact.stage}
                      onChange={async (e) => {
                        const updated = await outboundApi.updateContact(selectedContact.id, { stage: e.target.value as ContactStage });
                        setSelectedContact(updated);
                        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                      }}
                      className="rounded-lg border border-white/10 bg-[#0b1020] px-2 py-1 text-xs text-white"
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-slate-400">
                    {selectedContact.email && <p>Email: {selectedContact.email}</p>}
                    {selectedContact.phone && <p>Phone: {selectedContact.phone}</p>}
                    {selectedContact.linkedin && <p>LinkedIn: {selectedContact.linkedin}</p>}
                    {selectedContact.notes && <p className="mt-2 text-slate-300">{selectedContact.notes}</p>}
                  </div>

                  <form onSubmit={handleAddActivity} className="mt-6 space-y-2">
                    <textarea
                      value={activityBody}
                      onChange={(e) => setActivityBody(e.target.value)}
                      placeholder="Add a note, call log, or follow-up..."
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white"
                    />
                    <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-xs text-white">
                      Log activity
                    </button>
                  </form>

                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-medium text-white">Activity timeline</h3>
                    {activities.length === 0 ? (
                      <p className="text-xs text-slate-500">No activity yet.</p>
                    ) : activities.map((activity) => (
                      <div key={activity.id} className="rounded-xl border border-white/8 bg-[#0b1020] p-3">
                        <p className="text-xs text-slate-500">{activity.type} · {new Date(activity.createdAt).toLocaleString()}</p>
                        {activity.subject && <p className="mt-1 text-sm font-medium text-white">{activity.subject}</p>}
                        <p className="mt-1 text-sm text-slate-400">{activity.body}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Select a contact to view details and activity.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.length === 0 ? (
              <p className="text-sm text-slate-500">Companies are created automatically when leads are discovered or contacts are added.</p>
            ) : companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <p className="font-medium text-white">{company.name}</p>
                <p className="mt-1 text-xs text-slate-500">{company.industry ?? "—"} · {company.location ?? "—"}</p>
                {company.website && <p className="mt-2 text-sm text-brand-300">{company.website}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  {company.contactsCount} contacts · {company.leadsCount} leads · {company.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
