import { describe, it, expect, afterEach } from 'vitest';
import {
  selectDtrGenerator,
  aiDtrGenerator,
  deterministicDtrGenerator,
  DtrNotConfiguredError,
  aiDtrConfigFromEnv,
} from '@/lib/goldenThread/dtr/generator';
import { loadMockLibrary } from '@/lib/policy';

/** #2 / GT-8 — DTR generator selection + fallback. */
const lib = loadMockLibrary();
const policy = lib.findByNumber('0520')!;

const savedFlag = process.env.NEXT_PUBLIC_FLAG_AI_DTR;
afterEach(() => {
  if (savedFlag === undefined) delete process.env.NEXT_PUBLIC_FLAG_AI_DTR;
  else process.env.NEXT_PUBLIC_FLAG_AI_DTR = savedFlag;
});

describe('DTR generator selection', () => {
  it('uses the deterministic generator when the AI flag is off', () => {
    delete process.env.NEXT_PUBLIC_FLAG_AI_DTR;
    const sel = selectDtrGenerator({ configured: false, hasKey: false });
    expect(sel.generator.id).toBe('deterministic-offline');
  });

  it('falls back to deterministic when AI is enabled but NOT configured', () => {
    process.env.NEXT_PUBLIC_FLAG_AI_DTR = 'true';
    const sel = selectDtrGenerator({ configured: false, hasKey: false });
    expect(sel.generator.id).toBe('deterministic-offline');
    expect(sel.reason).toMatch(/not configured/i);
  });

  it('routes to the AI generator when enabled AND configured', () => {
    process.env.NEXT_PUBLIC_FLAG_AI_DTR = 'true';
    const sel = selectDtrGenerator({
      configured: true,
      hasKey: true,
      endpoint: 'https://ai.local',
    });
    expect(sel.generator.id).toBe('ai-pipeline');
  });

  it('the deterministic generator produces a draft questionnaire', () => {
    const q = deterministicDtrGenerator.generate(policy);
    expect(q.status).toBe('draft');
    expect(q.item.length).toBeGreaterThan(0);
  });

  it('the AI generator throws NotConfigured when invoked offline', () => {
    expect(() => aiDtrGenerator.generate(policy)).toThrow(DtrNotConfiguredError);
  });

  it('config detection reads env without exposing secrets', () => {
    const cfg = aiDtrConfigFromEnv();
    expect(typeof cfg.configured).toBe('boolean');
    expect(typeof cfg.hasKey).toBe('boolean');
  });
});
