/**
 * CDS Hooks 2.0 server — Prior Authorization CRD service.
 *
 * Endpoints:
 *   GET  /cds-services                      — hook discovery
 *   POST /cds-services/prior-auth-crd        — order-sign hook
 *   GET  /health                             — health check
 */

import express from "express";
import cors from "cors";
import { handleOrderSign } from "./order-sign-handler.mjs";

const PORT = parseInt(process.env.PORT ?? "8081", 10);
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

// ── Discovery ──────────────────────────────────────────────────────────────────
app.get("/cds-services", (_req, res) => {
  res.json({
    services: [
      {
        hook: "order-sign",
        id: "prior-auth-crd",
        title: "Prior Authorization Coverage Requirements Discovery",
        description: "Da Vinci CRD — checks enrollment, eligibility, network status, and PA requirements at order-sign.",
        prefetch: {
          patient:        "Patient/{{context.patientId}}",
          coverage:       "Coverage?patient={{context.patientId}}&status=active",
          serviceRequest: "ServiceRequest/{{context.draftOrders.entry[0].resource.id}}",
        },
      },
    ],
  });
});

// ── order-sign hook ────────────────────────────────────────────────────────────
app.post("/cds-services/prior-auth-crd", async (req, res) => {
  const hookRequest = req.body;
  console.log(`[CRD] order-sign hook — patient: ${hookRequest?.context?.patientId} — instance: ${hookRequest?.hookInstance}`);

  try {
    const response = await handleOrderSign(hookRequest);
    res.json(response);
  } catch (err) {
    console.error("[CRD] Error:", err.message);
    res.status(500).json({
      cards: [{
        summary: "CRD service error",
        detail: err.message,
        indicator: "warning",
        source: { label: "CRD Server" },
      }],
    });
  }
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", service: "pa-cds-hooks", port: PORT }));

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[CDS Hooks] Prior Auth CRD service running on http://localhost:${PORT}`);
  console.log(`[CDS Hooks] Discovery: http://localhost:${PORT}/cds-services`);
  console.log(`[CDS Hooks] EMR FHIR:  ${process.env.EMR_FHIR_BASE ?? "http://localhost:8080/fhir"}`);
});
