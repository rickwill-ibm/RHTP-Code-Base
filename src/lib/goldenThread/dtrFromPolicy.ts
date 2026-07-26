/**
 * DTR questionnaire from policy (increment GT-8, offline path).
 *
 * Deterministically builds a Da Vinci DTR Questionnaire from a parsed medical
 * policy: one yes/no item per medical-necessity indication, plus a
 * documentation-attachment item. This is the offline, reproducible path used in
 * the mock demo; the AI/LLM generation path (reference questionnaire pipeline,
 * Claude generator + reviewer) stays gated behind the `aiDtrGeneration` flag and
 * a human-review gate.
 *
 * Pure — no wall-clock, no external calls.
 */
import type { QuestionnaireItemDef } from '@/lib/dtr/questionnaireResponse';
import type { NormalizedPolicy } from '@/lib/policy';

export interface GeneratedQuestionnaire {
  resourceType: 'Questionnaire';
  url: string;
  status: 'draft'; // human review required before 'active'
  title: string;
  derivedFrom: { source: string; policyId: string; number?: string | null; url?: string | null };
  generatedBy: 'deterministic-offline'; // vs 'ai-pipeline'
  item: QuestionnaireItemDef[];
}

/** Build a draft DTR Questionnaire from a policy's indications. */
export function generateQuestionnaireFromPolicy(policy: NormalizedPolicy): GeneratedQuestionnaire {
  const item: QuestionnaireItemDef[] = [];

  const indications = policy.indications ?? [];
  indications.forEach((ind, i) => {
    item.push({
      linkId: `indication-${ind.label || i + 1}`,
      text: `Does the member meet indication ${ind.label}: ${ind.title}?`,
      type: 'boolean',
      required: false,
    });
  });

  // A criteria-gated policy needs a supporting diagnosis + documentation.
  if (policy.determinationBasis === 'medical-necessity-criteria') {
    item.push({
      linkId: 'supporting-diagnosis',
      text: 'Enter the supporting ICD-10 diagnosis code establishing medical necessity.',
      type: 'string',
      required: true,
    });
  }

  item.push({
    linkId: 'clinical-documentation',
    text: 'Attach or reference clinical documentation supporting medical necessity.',
    type: 'string',
    required: true,
  });

  const number = policy.number ?? undefined;
  return {
    resourceType: 'Questionnaire',
    url: `urn:rhtp:dtr:${policy.policyId}`,
    status: 'draft',
    title: `DTR — ${policy.title}`,
    derivedFrom: {
      source: policy.source,
      policyId: policy.policyId,
      number,
      url: policy.url ?? null,
    },
    generatedBy: 'deterministic-offline',
    item,
  };
}
