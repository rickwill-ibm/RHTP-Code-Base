/**
 * Da Vinci CDex-conformant DocumentReference construction (Dev Plan Workstream B).
 *
 * Closes the RFI audit gap: DTR gap-evidence uploads previously stored only a
 * plain filename string ("Uploaded: report.pdf — pending clinical confirmation")
 * rather than a real FHIR resource. This module wraps an uploaded file's metadata
 * into a conformant DocumentReference per the Da Vinci CDex Attachment pattern
 * (http://hl7.org/fhir/us/davinci-cdex), so the resource can be attached to a
 * DTR QuestionnaireResponse / PAS Claim submission.
 *
 * docStatus is deliberately "preliminary" until a clinician confirms the upload —
 * this is the FHIR-conformant expression of the same human-gating principle
 * already enforced elsewhere in the platform (PAS submission, policy sign-off).
 */

export interface UploadedFileMeta {
  name: string;
  type: string; // MIME type, e.g. "application/pdf"
  size: number; // bytes
}

export interface CdexDocumentReferenceContext {
  patientId: string;
  /** DTR requirement-group id this evidence is being attached to. */
  groupId: number;
  groupTitle: string;
  /** ISO 8601 timestamp; defaults to now if omitted (kept as a param for deterministic tests). */
  creation?: string;
}

export interface FhirCoding {
  system: string;
  code: string;
  display: string;
}

export interface FhirCodeableConcept {
  coding: FhirCoding[];
  text?: string;
}

export interface DocumentReferenceAttachment {
  contentType: string;
  title: string;
  size: number;
  creation: string;
}

export interface DocumentReferenceContent {
  attachment: DocumentReferenceAttachment;
}

export interface DocumentReference {
  resourceType: 'DocumentReference';
  status: 'current';
  /** preliminary = uploaded but not yet clinically confirmed; final = confirmed and resolves the gap. */
  docStatus: 'preliminary' | 'final';
  type: FhirCodeableConcept;
  category: FhirCodeableConcept[];
  subject: { reference: string };
  date: string;
  content: DocumentReferenceContent[];
  context: {
    related: { display: string }[];
  };
}

/** Generic "clinical document" LOINC type — sufficient for the DTR gap-evidence use case. */
const GENERIC_CLINICAL_DOCUMENT_TYPE: FhirCodeableConcept = {
  coding: [
    {
      system: 'http://loinc.org',
      code: '34133-9',
      display: 'Summary of episode note',
    },
  ],
  text: 'Supporting clinical documentation',
};

const CDEX_ATTACHMENT_CATEGORY: FhirCodeableConcept = {
  coding: [
    {
      system: 'http://hl7.org/fhir/us/davinci-cdex/CodeSystem/cdex-temp-code-system',
      code: 'attachment',
      display: 'CDex Attachment',
    },
  ],
};

/**
 * Build a CDex-conformant DocumentReference for a file uploaded against a DTR
 * requirement-group gap. Pure function — takes file metadata, not a browser File
 * object, so it is directly unit-testable.
 */
export function buildCdexDocumentReference(
  file: UploadedFileMeta,
  ctx: CdexDocumentReferenceContext
): DocumentReference {
  const creation = ctx.creation ?? new Date().toISOString();
  return {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'preliminary',
    type: GENERIC_CLINICAL_DOCUMENT_TYPE,
    category: [CDEX_ATTACHMENT_CATEGORY],
    subject: { reference: `Patient/${ctx.patientId}` },
    date: creation,
    content: [
      {
        attachment: {
          contentType: file.type || 'application/octet-stream',
          title: file.name,
          size: file.size,
          creation,
        },
      },
    ],
    context: {
      related: [{ display: `DTR requirement group ${ctx.groupId}: ${ctx.groupTitle}` }],
    },
  };
}

/** Human-readable summary used in the DTR tree UI, derived from the resource itself. */
export function summarizeDocumentReference(doc: DocumentReference): string {
  const attachment = doc.content[0]?.attachment;
  const status = doc.docStatus === 'preliminary' ? 'pending clinical confirmation' : 'confirmed';
  return `Uploaded: ${attachment?.title ?? 'document'} — ${status}`;
}

/** Marks a previously uploaded DocumentReference as clinically confirmed (docStatus: final). */
export function confirmDocumentReference(doc: DocumentReference): DocumentReference {
  return { ...doc, docStatus: 'final' };
}
