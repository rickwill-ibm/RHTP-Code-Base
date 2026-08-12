"use client";

/**
 * "Ingest a new policy" — runs raw payer policy text through the real
 * Intelligent Policy Engine (POST /ingest/text), which parses the rules
 * with an LLM extraction call and caches the resulting PolicyDefinition.
 * Once ingested, the policy is immediately available to DTR for any CPT
 * code it governs — no code change, no hardcoded CPT→policy map (see
 * lib/dtr/policyLookup.ts).
 */

import { useEffect, useRef, useState } from "react";
import {
  ingestPolicyText,
  ingestSeedPolicy,
  uploadPolicyFile,
  fetchPolicyDefinition,
  listSeedPolicies,
  type PolicyDefinition,
  type SeedPolicySummary,
} from "@/lib/dtr/policyIngest";
import { fetchPolicyStatusList, type PolicyQueueEntry } from "@/lib/dtr/policyReview";
import { usePaStore } from "@/lib/pa/usePaStore";
import { toast } from "sonner";

export default function PolicyIngestView() {
  const { goToPolicyReview } = usePaStore();
  const [policyId, setPolicyId] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [force, setForce] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<PolicyDefinition | null>(null);

  // Uses /policies/status (ALL policies, any review status) rather than
  // /policies (approved-only, what DTR reads) — otherwise a just-ingested,
  // still-pending policy would vanish from this list right after ingestion.
  const [policies, setPolicies] = useState<PolicyQueueEntry[] | null>(null);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  const [seeds, setSeeds] = useState<SeedPolicySummary[] | null>(null);
  const [seedsError, setSeedsError] = useState<string | null>(null);
  const [seedsLoading, setSeedsLoading] = useState(true);
  const [ingestingSeed, setIngestingSeed] = useState<string | null>(null);

  useEffect(() => {
    void loadPolicies();
    void loadSeeds();
  }, []);

  async function loadPolicies() {
    setPoliciesLoading(true);
    setPoliciesError(null);
    try {
      setPolicies(await fetchPolicyStatusList());
    } catch (e) {
      setPoliciesError(e instanceof Error ? e.message : "Failed to reach Policy Engine");
    } finally {
      setPoliciesLoading(false);
    }
  }

  async function loadSeeds() {
    setSeedsLoading(true);
    setSeedsError(null);
    try {
      setSeeds(await listSeedPolicies());
    } catch (e) {
      setSeedsError(e instanceof Error ? e.message : "Failed to reach Policy Engine");
    } finally {
      setSeedsLoading(false);
    }
  }

  async function handleIngestSeed(seed: SeedPolicySummary, refresh: boolean) {
    if (!seed.suggestedPolicyId) {
      toast.error("Can't ingest — this file couldn't be read.");
      return;
    }
    setIngestingSeed(seed.seedFile);
    try {
      const result = await ingestSeedPolicy(seed.seedFile, seed.suggestedPolicyId, refresh);
      toast.success(`Parsed ${result.criteriaGroups} criteria group${result.criteriaGroups === 1 ? "" : "s"} for ${result.policyId}`);
      const def = await fetchPolicyDefinition(result.policyId);
      setParsed(def);
      setIngestError(null);
      await Promise.all([loadPolicies(), loadSeeds()]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ingestion failed";
      toast.error(msg);
    } finally {
      setIngestingSeed(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    // Auto-derive a policy id from the filename so the (previously silent)
    // "Policy ID is required" gate doesn't leave the submit button looking
    // permanently disabled after a file is chosen. Only fills it in when
    // empty — never overwrites an id the user already typed.
    if (file && !policyId.trim()) {
      const slug = file.name
        .replace(/\.[^./]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (slug) setPolicyId(slug);
    }
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleIngest() {
    if (!policyId.trim()) {
      toast.error("Policy ID is required.");
      return;
    }
    if (!selectedFile && !policyText.trim()) {
      toast.error("Choose a .pdf/.txt file or paste policy text.");
      return;
    }
    setIngesting(true);
    setIngestError(null);
    setParsed(null);
    try {
      const result = selectedFile
        ? await uploadPolicyFile(selectedFile, policyId.trim(), force)
        : await ingestPolicyText(policyId.trim(), policyText, force);
      toast.success(`Parsed ${result.criteriaGroups} criteria group${result.criteriaGroups === 1 ? "" : "s"} for ${result.policyId}`);
      const def = await fetchPolicyDefinition(result.policyId);
      setParsed(def);
      await Promise.all([loadPolicies(), loadSeeds()]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ingestion failed";
      setIngestError(msg);
      toast.error(msg);
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ingest a New Policy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick a policy document from the Policy Engine&apos;s seeds directory, or paste raw policy text
          below. Either way, the Intelligent Policy Engine runs the real text through a real LLM
          extraction pass to parse governed CPT codes and criteria groups — nothing here is fabricated
          or pre-mapped. Once ingested, the policy is immediately usable by DTR.
        </p>
      </div>

      {/* Policy directory */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Policy Directory</p>
            <p className="text-xs text-gray-400 mt-0.5">services/policy-engine/policies/seeds/</p>
          </div>
          <button onClick={() => void loadSeeds()} className="text-xs font-semibold text-[#1669c1] hover:underline">
            Refresh
          </button>
        </div>
        {seedsLoading ? (
          <div className="px-5 py-6 text-sm text-gray-400">Loading…</div>
        ) : seedsError ? (
          <div className="px-5 py-4 text-sm text-red-600">
            <strong>Couldn&apos;t reach Policy Engine:</strong> {seedsError}
          </div>
        ) : seeds && seeds.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {seeds.map((seed) => (
              <div key={seed.seedFile} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{seed.title}</p>
                    {seed.alreadyIngested && (
                      <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                        Ingested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {seed.seedFile}.{seed.sourceType} · {(seed.sizeBytes / 1024).toFixed(1)} KB
                    {seed.payer ? ` · ${seed.payer}` : ""}
                    {seed.cptCodes ? ` · CPT ${seed.cptCodes}` : ""}
                  </p>
                  {seed.extractError ? (
                    <p className="text-xs text-red-500 mt-1">Couldn&apos;t read this file: {seed.extractError}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{seed.preview}…</p>
                  )}
                </div>
                <button
                  onClick={() => void handleIngestSeed(seed, seed.alreadyIngested)}
                  disabled={ingestingSeed === seed.seedFile || !!seed.extractError}
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-[#1669c1] px-4 py-2 text-xs font-bold text-[#1669c1] hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {ingestingSeed === seed.seedFile ? "Parsing…" : seed.alreadyIngested ? "Re-ingest" : "Ingest"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-sm text-gray-400">
            No policy files found. Drop a .txt policy document into policies/seeds/ on the Policy Engine and hit Refresh.
          </div>
        )}
      </div>

      {/* Ingest form */}
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Or Upload / Paste a Policy Manually</p>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Policy ID</label>
            <input
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              placeholder="e.g. lumbar-mri-72148"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            />
            <label className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[#1669c1]" />
              Re-ingest / overwrite if this Policy ID already exists
            </label>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Upload a file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-gray-700 hover:file:bg-gray-200"
            />
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="truncate">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button onClick={clearSelectedFile} className="flex-shrink-0 font-semibold text-[#1669c1] hover:underline">
                  Clear
                </button>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-400">.pdf or .txt — extracted server-side, no OCR for scanned images.</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Policy text {selectedFile && <span className="normal-case font-normal text-gray-400">(ignored while a file is selected)</span>}
            </label>
            <textarea
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              rows={10}
              disabled={!!selectedFile}
              placeholder="Paste the full coverage policy / medical necessity criteria document text here…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>

        {ingestError && (
          <p className="mb-3 text-sm text-red-600">
            <strong>Ingestion failed:</strong> {ingestError}
            <span className="block text-xs text-gray-400 mt-0.5">
              Confirm the Policy Engine is running and has an LLM key configured — either OPENAI_API_KEY,
              or GROQ_API_KEY (free, no credit card: console.groq.com/keys). Set via start_PA_FHIR.sh.
            </span>
          </p>
        )}

        <button
          onClick={handleIngest}
          disabled={ingesting || !policyId.trim() || (!selectedFile && !policyText.trim())}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1669c1] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0f52a0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ingesting ? "Parsing rules…" : "Run Through Intelligent Policy Engine"}
        </button>
      </div>

      {/* Parsed result */}
      {parsed && (
        <div className="rounded-xl border border-green-200 bg-green-50/40 p-5 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">Parsed Policy Definition</p>
            <button
              onClick={() => goToPolicyReview(parsed.policyId)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1669c1] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0f52a0] transition-colors whitespace-nowrap"
            >
              Review before it goes live →
            </button>
          </div>
          <p className="font-bold text-gray-900">{parsed.policyTitle}</p>
          <p className="text-xs text-gray-500 mb-1">
            {parsed.policyId} · Governs CPT: {parsed.governedCptCodes.join(", ") || "none extracted"}
            {parsed.extractionProvider && (
              <> · Extracted via {parsed.extractionProvider === "openai" ? "OpenAI" : "Groq"} ({parsed.extractionModel})</>
            )}
          </p>
          {parsed.status === "approved" ? (
            <p className="text-xs text-green-700 mb-3">
              Already approved and live for DTR (this was a cached extraction, not a new one — cached
              results don&apos;t reset review status).
            </p>
          ) : (
            <p className="text-xs text-amber-700 mb-3">
              Not yet usable by DTR — this extraction is pending clinical review. Every fresh ingestion
              starts invisible to DTR until a reviewer approves it on the Review Policy Logic screen.
            </p>
          )}
          <div className="space-y-2">
            {parsed.criteriaGroups.map((g) => (
              <div key={g.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm font-bold text-gray-900">Group {g.id}: {g.title}</p>
                {g.candidateCodes && g.candidateCodes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Candidate codes: {g.candidateCodes.map((c) => c.code).join(", ")}
                  </p>
                )}
                {g.fhirQuery && <p className="text-xs text-gray-400 mt-0.5 font-mono">{g.fhirQuery}</p>}
                {g.documentationRequired && (
                  <p className="text-xs text-gray-500 mt-1">Documentation: {g.documentationRequired}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingested policy list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Policies Currently Ingested</p>
          <button onClick={() => void loadPolicies()} className="text-xs font-semibold text-[#1669c1] hover:underline">
            Refresh
          </button>
        </div>
        {policiesLoading ? (
          <div className="px-5 py-6 text-sm text-gray-400">Loading…</div>
        ) : policiesError ? (
          <div className="px-5 py-4 text-sm text-red-600">
            <strong>Couldn&apos;t reach Policy Engine:</strong> {policiesError}
          </div>
        ) : policies && policies.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {policies.map((p) => (
              <button
                key={p.policyId}
                onClick={() => goToPolicyReview(p.policyId)}
                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.policyTitle}</p>
                  <p className="text-xs text-gray-400">{p.policyId}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <PolicyStatusBadge entry={p} />
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-mono text-gray-600 whitespace-nowrap">
                    {p.governedCptCodes.join(", ") || "no CPT codes"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-sm text-gray-400">No policies ingested yet.</div>
        )}
      </div>
    </div>
  );
}

function PolicyStatusBadge({ entry }: { entry: PolicyQueueEntry }) {
  if (entry.status === "pending_review") {
    return (
      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 whitespace-nowrap">
        Pending Review
      </span>
    );
  }
  if (entry.status === "needs_revision") {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 whitespace-nowrap">
        Needs Revision
      </span>
    );
  }
  if (entry.sourceChanged) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 whitespace-nowrap">
        Source Changed
      </span>
    );
  }
  if (entry.isOverdue) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 whitespace-nowrap">
        Overdue
      </span>
    );
  }
  return (
    <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 whitespace-nowrap">
      Approved
    </span>
  );
}
