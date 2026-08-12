import { describe, expect, it } from "vitest";
import {
  buildCdexDocumentReference,
  summarizeDocumentReference,
  confirmDocumentReference,
} from "@/lib/dtr/cdexDocumentReference";

const FILE = { name: "op-note.pdf", type: "application/pdf", size: 20480 };
const CTX = {
  patientId: "MEMBER_123",
  groupId: 2,
  groupTitle: "Diagnosis supports medical necessity",
  creation: "2026-08-07T00:00:00.000Z",
};

describe("CDex DocumentReference construction (Dev Plan Workstream B)", () => {
  it("builds a conformant DocumentReference resource from file metadata", () => {
    const doc = buildCdexDocumentReference(FILE, CTX);
    expect(doc.resourceType).toBe("DocumentReference");
    expect(doc.status).toBe("current");
    expect(doc.subject.reference).toBe("Patient/MEMBER_123");
    expect(doc.content[0].attachment.title).toBe("op-note.pdf");
    expect(doc.content[0].attachment.contentType).toBe("application/pdf");
    expect(doc.content[0].attachment.size).toBe(20480);
    expect(doc.context.related[0].display).toContain("Diagnosis supports medical necessity");
  });

  it("defaults docStatus to preliminary — not resolved until clinically confirmed", () => {
    const doc = buildCdexDocumentReference(FILE, CTX);
    expect(doc.docStatus).toBe("preliminary");
  });

  it("falls back to a safe content type when the browser reports none", () => {
    const doc = buildCdexDocumentReference({ ...FILE, type: "" }, CTX);
    expect(doc.content[0].attachment.contentType).toBe("application/octet-stream");
  });

  it("summarizes a preliminary upload as pending clinical confirmation", () => {
    const doc = buildCdexDocumentReference(FILE, CTX);
    expect(summarizeDocumentReference(doc)).toBe(
      "Uploaded: op-note.pdf — pending clinical confirmation"
    );
  });

  it("confirmDocumentReference flips docStatus to final and updates the summary", () => {
    const doc = buildCdexDocumentReference(FILE, CTX);
    const confirmed = confirmDocumentReference(doc);
    expect(confirmed.docStatus).toBe("final");
    expect(summarizeDocumentReference(confirmed)).toBe("Uploaded: op-note.pdf — confirmed");
    // original is untouched (pure function)
    expect(doc.docStatus).toBe("preliminary");
  });

  it("is deterministic given an explicit creation timestamp (testability)", () => {
    const a = buildCdexDocumentReference(FILE, CTX);
    const b = buildCdexDocumentReference(FILE, CTX);
    expect(a).toEqual(b);
  });
});
