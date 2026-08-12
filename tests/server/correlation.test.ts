import { describe, it, expect } from 'vitest';
import { newCorrelationId, correlationFrom, CORRELATION_HEADER } from '@/lib/server/correlation';

describe('Correlation IDs (F-6)', () => {
  it('mints unique ids', () => {
    expect(newCorrelationId()).not.toEqual(newCorrelationId());
  });

  it('propagates an inbound id from Headers', () => {
    const h = new Headers({ [CORRELATION_HEADER]: 'cid-inbound' });
    expect(correlationFrom(h)).toBe('cid-inbound');
  });

  it('mints a fresh id when none present', () => {
    expect(correlationFrom(new Headers())).toMatch(/.+/);
  });

  it('reads from a plain record too', () => {
    expect(correlationFrom({ [CORRELATION_HEADER]: 'cid-rec' })).toBe('cid-rec');
  });
});
