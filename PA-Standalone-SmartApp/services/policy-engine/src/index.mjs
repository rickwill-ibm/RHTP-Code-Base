/**
 * Policy Engine HTTP server — Prior Authorization DTR service.
 *
 * Endpoints:
 *   POST /ingest                     — ingest a policy document via LLM extraction
 *   POST /ingest/text                — ingest raw policy text directly
 *   POST /ingest/upload              — ingest an uploaded .pdf or .txt file directly
 *   GET  /ingest/seeds               — list available seed policy files (.txt + .pdf)
 *   GET  /policies                   — list APPROVED policies only (what DTR is allowed to use)
 *   GET  /policies/status            — list ALL policies with review status (for the Ingest screen)
 *   GET  /policies/review-queue      — list policies needing clinical review/re-review
 *   GET  /policies/:policyId         — get a specific policy definition + review status
 *   POST /policies/:policyId/approve — clinical reviewer approves a policy for use in DTR
 *   POST /policies/:policyId/reject  — clinical reviewer sends a policy back for revision
 *   GET  /audit-log                  — flattened history of every review decision, all policies
 *   POST /evaluate                   — evaluate a patient against a policy (DTR match)
 *   GET  /health                     — health check
 *
 * Human-in-the-loop gate: a freshly-extracted policy starts life
 * status:"pending_review" and is invisible to GET /policies (and therefore
 * to DTR) until a clinical reviewer approves it via the Review Policy Logic
 * screen. See policy-review.mjs for the full workflow, the audit log, and
 * the review-cadence/source-file-change staleness mechanism.
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "fs";
import { resolve, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";
import { ingestPolicyText, loadPolicy, resolveProvider } from "./policy-ingestor.mjs";
import { evaluatePolicy } from "./fhir-evaluator.mjs";
import { extractPdfText } from "./pdf-extract.mjs";
import {
  listReviewQueue,
  listAllWithStatus,
  getPolicyWithReviewStatus,
  approvePolicy,
  rejectPolicy,
  getAuditLog,
  DEFAULT_REVIEW_CADENCE_DAYS,
} from "./policy-review.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = resolve(__dir, "../policies");
const SEEDS_DIR = resolve(__dir, "../policies/seeds");
const PORT = parseInt(process.env.PORT ?? "8083", 10);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "4mb" }));
app.use(express.text({ limit: "4mb" }));

/** In-memory cache of extracted PDF text, keyed by "filename:mtimeMs" so an
 * edited/replaced file is re-extracted but repeat directory listings aren't. */
const pdfTextCache = new Map();
async function readSeedText(seedsDir, filename) {
  const filePath = resolve(seedsDir, filename);
  if (filename.toLowerCase().endsWith(".pdf")) {
    const mtime = statSync(filePath).mtimeMs;
    const cacheKey = `${filename}:${mtime}`;
    if (pdfTextCache.has(cacheKey)) return pdfTextCache.get(cacheKey);
    const text = await extractPdfText(readFileSync(filePath));
    pdfTextCache.set(cacheKey, text);
    return text;
  }
  return readFileSync(filePath, "utf-8");
}

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  const active = resolveProvider(); // null if neither OPENAI_API_KEY nor GROQ_API_KEY is set
  res.json({
    status: "ok",
    service: "pa-policy-engine",
    port: PORT,
    // Kept for backward compatibility with anything checking `.openai` directly.
    openai: !!process.env.OPENAI_API_KEY,
    llm: {
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      groqConfigured: !!process.env.GROQ_API_KEY,
      activeProvider: active?.provider ?? null,
      activeModel: active?.model ?? null,
    },
    emrFhir: process.env.EMR_FHIR_BASE ?? "http://localhost:8080/fhir",
    payerFhir: process.env.PAYER_FHIR_BASE ?? "http://localhost:8082/fhir",
  });
});

// ── List policies (APPROVED ONLY — this is the HITL gate) ────────────────────
// This is the endpoint the frontend's policyLookup.findPolicyIdForCpt() calls
// to resolve a CPT code to a governing policy for DTR. A policy that hasn't
// been reviewed and approved yet (status:"pending_review"/"needs_revision")
// simply does not exist as far as DTR is concerned — see policy-review.mjs.
// Policies ingested before this gate existed have no `status` field and
// default to "approved" so they keep working.
app.get("/policies", (_req, res) => {
  if (!existsSync(POLICIES_DIR)) return res.json({ policies: [] });
  const files = readdirSync(POLICIES_DIR).filter((f) => f.endsWith(".json"));
  const policies = files.map((f) => {
    try {
      const p = JSON.parse(readFileSync(resolve(POLICIES_DIR, f), "utf-8"));
      if ((p.status ?? "approved") !== "approved") return null;
      return {
        policyId: p.policyId,
        title: p.policyTitle,
        payer: p.payer,
        cptCodes: p.governedCptCodes ?? [],
        criteriaGroups: p.criteriaGroups?.length ?? 0,
        effectiveDate: p.effectiveDate,
      };
    } catch { return null; }
  }).filter(Boolean);
  res.json({ policies });
});

// ── List ALL policies with review status (Ingest screen badges) ─────────────
app.get("/policies/status", (_req, res) => {
  try {
    res.json({ policies: listAllWithStatus(), defaultReviewCadenceDays: DEFAULT_REVIEW_CADENCE_DAYS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Review queue: everything needing clinical attention ──────────────────────
// New extractions, rejected/needs-revision policies, approved policies that
// are overdue for re-review, and approved policies whose source file changed
// on disk since the last approval (see policy-review.mjs).
app.get("/policies/review-queue", (_req, res) => {
  try {
    res.json({ queue: listReviewQueue(), defaultReviewCadenceDays: DEFAULT_REVIEW_CADENCE_DAYS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Approve / reject a policy (must be declared before the generic
// /policies/:policyId GET route below is irrelevant here since these are
// POST with an extra path segment, but keep near the other /policies/*
// routes for readability) ────────────────────────────────────────────────
app.post("/policies/:policyId/approve", (req, res) => {
  try {
    const { reviewerName, comment, reviewCadenceDays } = req.body ?? {};
    const policy = approvePolicy(req.params.policyId, {
      reviewerName,
      comment,
      reviewCadenceDays: reviewCadenceDays !== undefined ? Number(reviewCadenceDays) : undefined,
    });
    res.json({ success: true, policy });
  } catch (err) {
    res.status(err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
});

app.post("/policies/:policyId/reject", (req, res) => {
  try {
    const { reviewerName, comment } = req.body ?? {};
    const policy = rejectPolicy(req.params.policyId, { reviewerName, comment });
    res.json({ success: true, policy });
  } catch (err) {
    res.status(err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
});

// ── Audit log: flattened review history across every policy ─────────────────
app.get("/audit-log", (req, res) => {
  try {
    const { policyId, reviewerName, action } = req.query;
    res.json({ entries: getAuditLog({ policyId, reviewerName, action }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get single policy (+ computed review status) ─────────────────────────────
// NOTE: must be declared AFTER the static /policies/status and
// /policies/review-queue GET routes above — Express would otherwise match
// "status"/"review-queue" as the :policyId param.
app.get("/policies/:policyId", (req, res) => {
  try {
    const policy = getPolicyWithReviewStatus(req.params.policyId);
    if (!policy) {
      return res.status(404).json({ error: `Policy ${req.params.policyId} not ingested yet. POST /ingest first.` });
    }
    res.json(policy);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/** Derive title/policyId/payer/CPT metadata from raw policy text — works for
 * both .txt seeds (which follow a "Label: value" header convention) and PDF
 * text extraction (which usually won't match that convention cleanly, so
 * these are best-effort and fall back to the filename). */
function deriveSeedMetadata(seedFile, text) {
  const titleMatch = text.match(/^MEDICAL POLICY:\s*(.+)$/m);
  const idMatch = text.match(/^Policy ID:\s*(.+)$/m);
  const payerMatch = text.match(/^Payer:\s*(.+)$/m);
  const cptMatch = text.match(/^Governed CPT Codes:\s*(.+)$/m);
  return {
    suggestedPolicyId: (idMatch?.[1] ?? seedFile).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    title: (titleMatch?.[1] ?? seedFile).trim(),
    payer: payerMatch?.[1]?.trim(),
    cptCodes: cptMatch?.[1]?.trim(),
  };
}

// ── List available seed policy files (for the "pick from directory" UI) ──────
app.get("/ingest/seeds", async (_req, res) => {
  if (!existsSync(SEEDS_DIR)) return res.json({ seeds: [] });

  const alreadyIngested = new Set(
    existsSync(POLICIES_DIR)
      ? readdirSync(POLICIES_DIR)
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(/\.json$/, ""))
      : []
  );

  const files = readdirSync(SEEDS_DIR).filter((f) => f.endsWith(".txt") || f.endsWith(".pdf"));

  const seeds = await Promise.all(
    files.map(async (f) => {
      const seedFile = f.replace(/\.(txt|pdf)$/i, "");
      const isPdf = f.toLowerCase().endsWith(".pdf");
      let text, extractError;
      try {
        text = await readSeedText(SEEDS_DIR, f);
      } catch (err) {
        extractError = err.message;
      }

      if (extractError) {
        return {
          seedFile,
          sourceType: isPdf ? "pdf" : "txt",
          suggestedPolicyId: null,
          title: seedFile,
          payer: undefined,
          cptCodes: undefined,
          sizeBytes: statSync(resolve(SEEDS_DIR, f)).size,
          preview: "",
          alreadyIngested: false,
          extractError,
        };
      }

      const meta = deriveSeedMetadata(seedFile, text);
      return {
        seedFile,
        sourceType: isPdf ? "pdf" : "txt",
        suggestedPolicyId: meta.suggestedPolicyId,
        title: meta.title,
        payer: meta.payer,
        cptCodes: meta.cptCodes,
        sizeBytes: statSync(resolve(SEEDS_DIR, f)).size,
        preview: text.slice(0, 280).trim(),
        alreadyIngested: alreadyIngested.has(meta.suggestedPolicyId),
      };
    })
  );

  res.json({ seeds });
});

// ── Ingest policy text directly ───────────────────────────────────────────────
app.post("/ingest/text", async (req, res) => {
  const { policyId, policyText, force } = req.body;
  if (!policyId || !policyText) {
    return res.status(400).json({ error: "policyId and policyText are required" });
  }
  try {
    const policy = await ingestPolicyText(policyText, policyId, force === true);
    res.json({ success: true, policyId: policy.policyId, criteriaGroups: policy.criteriaGroups?.length });
  } catch (err) {
    console.error("[Ingest]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Ingest from pre-loaded seed file (.txt or .pdf) ──────────────────────────
app.post("/ingest", async (req, res) => {
  const { policyId, seedFile, force } = req.body;
  if (!policyId) return res.status(400).json({ error: "policyId is required" });

  const base = seedFile ?? policyId;
  const txtPath = resolve(SEEDS_DIR, `${base}.txt`);
  const pdfPath = resolve(SEEDS_DIR, `${base}.pdf`);
  const seedPath = existsSync(txtPath) ? txtPath : existsSync(pdfPath) ? pdfPath : null;

  if (!seedPath) {
    return res.status(404).json({ error: `Seed file not found: ${txtPath} (also checked .pdf)` });
  }

  try {
    const seedFilename = basename(seedPath);
    const policyText = await readSeedText(SEEDS_DIR, seedFilename);
    const policy = await ingestPolicyText(policyText, policyId, force === true, { sourceFile: seedFilename });
    res.json({ success: true, policyId: policy.policyId, criteriaGroups: policy.criteriaGroups?.length });
  } catch (err) {
    console.error("[Ingest]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Ingest an uploaded file (.pdf or .txt) directly ──────────────────────────
// Saves the upload into policies/seeds/ so it also shows up in the directory
// listing on future runs, then extracts (PDF) or reads (txt) the real text
// and runs it through the same LLM extraction pipeline as every other path.
app.post("/ingest/upload", upload.single("file"), async (req, res) => {
  const { policyId, force } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded (expected multipart field 'file')" });
  if (!policyId) return res.status(400).json({ error: "policyId is required" });

  const ext = extname(file.originalname).toLowerCase();
  if (ext !== ".pdf" && ext !== ".txt") {
    return res.status(400).json({ error: `Unsupported file type: ${ext || "(none)"} — only .pdf and .txt are supported` });
  }

  try {
    if (!existsSync(SEEDS_DIR)) mkdirSync(SEEDS_DIR, { recursive: true });

    // Save the upload into policies/seeds/ so it appears in the directory
    // listing next time — sanitize the filename, and avoid clobbering an
    // existing, differently-named seed file.
    const safeName = basename(file.originalname).replace(/[^a-zA-Z0-9._-]+/g, "-");
    let destPath = resolve(SEEDS_DIR, safeName);
    if (existsSync(destPath) && statSync(destPath).size !== file.buffer.length) {
      const stem = safeName.replace(ext, "");
      destPath = resolve(SEEDS_DIR, `${stem}-${Date.now()}${ext}`);
    }
    if (!existsSync(destPath)) writeFileSync(destPath, file.buffer);

    const policyText = ext === ".pdf" ? await extractPdfText(file.buffer) : file.buffer.toString("utf-8");
    const policy = await ingestPolicyText(policyText, policyId, force === true || force === "true", { sourceFile: basename(destPath) });
    res.json({ success: true, policyId: policy.policyId, criteriaGroups: policy.criteriaGroups?.length, savedAs: basename(destPath) });
  } catch (err) {
    console.error("[Ingest/Upload]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Evaluate patient against policy ──────────────────────────────────────────
app.post("/evaluate", async (req, res) => {
  const { policyId, patientId, cptCode, emrToken } = req.body;

  if (!policyId || !patientId || !cptCode) {
    return res.status(400).json({ error: "policyId, patientId, and cptCode are required" });
  }

  try {
    const policy = loadPolicy(policyId);
    const result = await evaluatePolicy(policy, patientId, cptCode, emrToken);
    res.json(result);
  } catch (err) {
    console.error("[Evaluate]", err.message);
    res.status(err.message.includes("not ingested") ? 404 : 500).json({ error: err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[PolicyEngine] Running on http://localhost:${PORT}`);
  {
    const active = resolveProvider();
    console.log(`[PolicyEngine] OpenAI: ${process.env.OPENAI_API_KEY ? "✓ configured" : "✗ not set"}`);
    console.log(`[PolicyEngine] Groq:   ${process.env.GROQ_API_KEY ? "✓ configured" : "✗ not set"} (free, no card: https://console.groq.com/keys)`);
    console.log(`[PolicyEngine] Active LLM for extraction: ${active ? `${active.provider} (${active.model})` : "NONE — new policy ingestion will fail until one is set"}`);
  }
  console.log(`[PolicyEngine] EMR FHIR:   ${process.env.EMR_FHIR_BASE ?? "http://localhost:8080/fhir"}`);
  console.log(`[PolicyEngine] Payer FHIR: ${process.env.PAYER_FHIR_BASE ?? "http://localhost:8082/fhir"}`);
  console.log(`[PolicyEngine] Policies dir: ${POLICIES_DIR}`);
  console.log(`[PolicyEngine] Default review cadence: ${DEFAULT_REVIEW_CADENCE_DAYS} days (POLICY_REVIEW_CADENCE_DAYS)`);
  console.log(`[PolicyEngine] Endpoints:`);
  console.log(`  POST /ingest/text                — ingest policy text via LLM`);
  console.log(`  POST /ingest                      — ingest from seed file (.txt or .pdf)`);
  console.log(`  POST /ingest/upload               — ingest an uploaded .pdf or .txt file`);
  console.log(`  GET  /ingest/seeds                — list available seed policy files`);
  console.log(`  GET  /policies                    — list APPROVED policies only (DTR-visible)`);
  console.log(`  GET  /policies/status              — list ALL policies with review status`);
  console.log(`  GET  /policies/review-queue        — list policies needing clinical review`);
  console.log(`  POST /policies/:id/approve         — approve a policy for use in DTR`);
  console.log(`  POST /policies/:id/reject          — send a policy back for revision`);
  console.log(`  GET  /audit-log                    — flattened review history, all policies`);
  console.log(`  POST /evaluate                    — evaluate patient DTR match`);
});
