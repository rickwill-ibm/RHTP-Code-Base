import { describe, it, expect } from 'vitest';
import { loadMockNetwork, parseIntent, runAssistant } from '@/lib/networkAdequacy';

/** NA-2 ΓÇö interactive assistant (deterministic intent engine). */
const net = loadMockNetwork();

describe('Intent parsing', () => {
  it('maps "MariaΓÇÖs state" to SD and detects specialty/LOB', () => {
    const i = parseIntent('show the Medicaid pediatric baseline for MariaΓÇÖs state', net);
    expect(i.scope.state).toBe('SD');
    expect(i.scope.specialty).toBe('Pediatrics');
    expect(i.scope.lob).toBe('Medicaid');
    expect(i.kind).toBe('baseline');
  });

  it('detects validate / prioritize / augment intents', () => {
    expect(parseIntent('validate Todd primary care Medicaid', net).kind).toBe('validate');
    expect(parseIntent('prioritize the worst gaps in South Dakota', net).kind).toBe('prioritize');
    expect(parseIntent('recommend augmentation for Fulton mental health Medicaid', net).kind).toBe(
      'augment'
    );
  });

  it('maps behavioral ΓåÆ Mental Health and peds ΓåÆ Pediatrics', () => {
    expect(parseIntent('behavioral gaps', net).scope.specialty).toBe('Mental Health');
    expect(parseIntent('peds in GA', net).scope.specialty).toBe('Pediatrics');
    expect(parseIntent('peds in GA', net).scope.state).toBe('GA');
  });
});

describe('Assistant responses (grounded in the engine)', () => {
  it('baseline summarizes cells + gaps for a state', () => {
    const r = runAssistant('show the SD Medicaid baseline', net);
    expect(r.intent).toBe('baseline');
    expect(r.metrics && r.metrics.length).toBeGreaterThan(0);
    expect(r.text).toMatch(/average adequacy/i);
  });

  it('prioritize returns worst-first gaps with a viz focus', () => {
    const r = runAssistant('prioritize the worst gaps in South Dakota', net);
    expect(r.gaps && r.gaps.length).toBeGreaterThan(0);
    expect(r.visualizationUpdates?.focusState).toBe('SD');
    expect(r.visualizationUpdates?.focusCounties?.length).toBeGreaterThan(0);
  });

  it('validate returns a compliance verdict with per-standard checks', () => {
    const r = runAssistant('validate Oglala Lakota pediatrics Medicaid', net);
    expect(r.validation).toBeTruthy();
    expect(r.validation!.compliant).toBe(false);
    expect(r.text).toMatch(/NON-COMPLIANT/);
  });

  it('augment returns a human-gated recommendation with a lift', () => {
    const r = runAssistant('recommend augmentation for Fulton mental health Medicaid', net);
    expect(r.augmentation).toBeTruthy();
    expect(r.text).toMatch(/human review required/i);
  });

  it('deep-dive on a county lists its cells', () => {
    const r = runAssistant('explore Oglala Lakota county', net);
    expect(r.intent).toBe('deep-dive');
    expect(r.metrics && r.metrics.length).toBeGreaterThan(0);
  });
});
