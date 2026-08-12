"use client";

/**
 * PolicyRuleSummary — renders one criteria group's requirement in plain
 * terms: the description, the FHIR rule translated to readable text, and
 * the verbatim source excerpt from the policy document (or an explicit
 * warning when no excerpt was extracted, e.g. for policies ingested before
 * that field existed).
 *
 * Shared between two screens that both need to show "what does the policy
 * actually require" identically:
 *   - PolicyReviewView.tsx — the clinical reviewer's Review Policy Logic
 *     screen, where this is what's being verified against the source doc
 *   - DtrTreeView.tsx — the DTR match screen's "Policy Requirement" column,
 *     so the ordering provider sees the exact same rule text a reviewer
 *     already approved, not a re-derived or re-worded version of it
 */

export interface PolicyRuleFhirQuery {
  resourceType?: string;
  searchParam?: string;
  system?: string;
  codes?: string[];
  valueComparison?: string | null;
}

export interface PolicyRuleSummaryProps {
  description?: string;
  fhirQuery?: PolicyRuleFhirQuery;
  sourceExcerpt?: string;
}

export default function PolicyRuleSummary({ description, fhirQuery, sourceExcerpt }: PolicyRuleSummaryProps) {
  return (
    <div className="space-y-2">
      {description && <p className="text-sm text-gray-700">{description}</p>}
      {fhirQuery && (
        <p className="text-xs font-mono text-gray-500">
          Rule: {fhirQuery.resourceType}.{fhirQuery.searchParam ?? "code"}
          {fhirQuery.codes?.length ? ` IN {${fhirQuery.codes.join(", ")}}` : ""}
          {fhirQuery.valueComparison ? ` ${fhirQuery.valueComparison}` : ""}
          {fhirQuery.system ? ` (${fhirQuery.system})` : ""}
        </p>
      )}
      {sourceExcerpt ? (
        <div className="rounded-md border border-gray-200 bg-white px-3 py-2 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Source excerpt</p>
          <p className="text-xs italic text-gray-600">&ldquo;{sourceExcerpt}&rdquo;</p>
        </div>
      ) : (
        <p className="text-xs italic text-amber-600 mt-2">
          No source excerpt extracted for this group — verify against the original document manually.
        </p>
      )}
    </div>
  );
}
