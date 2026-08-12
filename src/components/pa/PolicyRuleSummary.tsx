'use client';
/**
 * PolicyRuleSummary — renders a DTR criteria group's policy requirement:
 * plain-English description, FHIR rule translated to readable text, and
 * verbatim source excerpt from the policy document.
 * Ported from PA-Standalone-SmartApp.
 */

export interface PolicyRuleFhirQuery {
  resourceType?: string;
  searchParam?: string;
  system?: string;
  codes?: string[];
  valueComparison?: string | null;
}

interface Props {
  description?: string;
  fhirQuery?: PolicyRuleFhirQuery;
  sourceExcerpt?: string;
}

export default function PolicyRuleSummary({ description, fhirQuery, sourceExcerpt }: Props) {
  return (
    <div className="space-y-2">
      {description && <p className="text-sm text-gray-700">{description}</p>}
      {fhirQuery && (
        <p className="text-xs font-mono text-gray-500">
          Rule: {fhirQuery.resourceType}.{fhirQuery.searchParam ?? 'code'}
          {fhirQuery.codes?.length ? ` IN {${fhirQuery.codes.join(', ')}}` : ''}
          {fhirQuery.valueComparison ? ` ${fhirQuery.valueComparison}` : ''}
          {fhirQuery.system ? ` (${fhirQuery.system})` : ''}
        </p>
      )}
      {sourceExcerpt ? (
        <div className="rounded-md border border-gray-200 bg-white px-3 py-2 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Source excerpt
          </p>
          <p className="text-xs italic text-gray-600">&ldquo;{sourceExcerpt}&rdquo;</p>
        </div>
      ) : (
        <p className="text-xs italic text-amber-600 mt-2">
          No source excerpt extracted — verify against original document manually.
        </p>
      )}
    </div>
  );
}
