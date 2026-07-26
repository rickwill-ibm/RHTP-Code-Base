/**
 * DTR generator seam (increment GT-8 / #2).
 *
 * Two implementations behind one interface: the deterministic offline generator
 * (ships today) and the AI pipeline (Claude generator + reviewer). The AI path
 * is gated by the `aiDtrGeneration` flag AND a runtime config check (endpoint +
 * key); when it is not configured — as in any offline/mock run — selection
 * falls back to the deterministic generator so the thread never breaks. Both
 * emit a **draft** questionnaire: a human-review gate is mandatory before use.
 */
import { flag } from '@/lib/flags/flags';
import type { NormalizedPolicy } from '@/lib/policy';
import { generateQuestionnaireFromPolicy, type GeneratedQuestionnaire } from '../dtrFromPolicy';

export interface DtrGenerator {
  id: 'deterministic-offline' | 'ai-pipeline';
  generate(policy: NormalizedPolicy): GeneratedQuestionnaire;
}

export const deterministicDtrGenerator: DtrGenerator = {
  id: 'deterministic-offline',
  generate: generateQuestionnaireFromPolicy,
};

export interface AiDtrConfig {
  endpoint?: string;
  hasKey: boolean;
  configured: boolean;
}

/** Read AI pipeline config from env (no secrets logged). */
export function aiDtrConfigFromEnv(): AiDtrConfig {
  const endpoint = process.env.AI_DTR_ENDPOINT || undefined;
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return { endpoint, hasKey, configured: !!endpoint && hasKey };
}

export class DtrNotConfiguredError extends Error {
  constructor() {
    super(
      'AI DTR generation is enabled but not configured (missing AI_DTR_ENDPOINT / ANTHROPIC_API_KEY).'
    );
    this.name = 'DtrNotConfiguredError';
  }
}

/**
 * The AI generator. When configured it would call the reference questionnaire
 * pipeline; that live call needs Docker + a key and cannot run offline, so here
 * it throws {@link DtrNotConfiguredError} unless configured. Selection never
 * routes to it unless configured, so offline runs are unaffected.
 */
export const aiDtrGenerator: DtrGenerator = {
  id: 'ai-pipeline',
  generate(): GeneratedQuestionnaire {
    // Live integration point (GT-8): POST the policy to AI_DTR_ENDPOINT, run the
    // Claude generator + reviewer, return a CQL-prepopulated draft questionnaire.
    throw new DtrNotConfiguredError();
  },
};

export interface GeneratorSelection {
  generator: DtrGenerator;
  reason: string;
}

/** Pick the generator: AI only when the flag is on AND it is configured. */
export function selectDtrGenerator(config: AiDtrConfig = aiDtrConfigFromEnv()): GeneratorSelection {
  if (flag('aiDtrGeneration') && config.configured) {
    return { generator: aiDtrGenerator, reason: 'AI pipeline enabled and configured' };
  }
  if (flag('aiDtrGeneration') && !config.configured) {
    return {
      generator: deterministicDtrGenerator,
      reason:
        'AI enabled but not configured — falling back to deterministic (human review still required)',
    };
  }
  return {
    generator: deterministicDtrGenerator,
    reason: 'deterministic offline generator (AI flag off)',
  };
}
