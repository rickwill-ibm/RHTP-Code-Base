import { describe, it, expect } from 'vitest';
import {
  buildQuestionnaireResponse,
  type QuestionnaireItemDef,
} from '@/lib/dtr/questionnaireResponse';

const items: QuestionnaireItemDef[] = [
  { linkId: 'q1', text: 'Conservative therapy?', type: 'boolean', required: true },
  { linkId: 'q2', text: 'Notes', type: 'string' },
  { linkId: 'q3', text: 'Weeks', type: 'integer', required: true },
];

describe('QuestionnaireResponse builder (Slice 4)', () => {
  it('builds a completed QR when required items are answered', () => {
    const { response, missingRequired } = buildQuestionnaireResponse({
      items,
      answers: { q1: true, q2: 'ok', q3: 6 },
      complete: true,
      patientRef: 'Patient/1',
    });
    expect(missingRequired).toEqual([]);
    expect(response.status).toBe('completed');
    expect(response.item.find((i) => i.linkId === 'q1')?.answer?.[0].valueBoolean).toBe(true);
    expect(response.item.find((i) => i.linkId === 'q3')?.answer?.[0].valueInteger).toBe(6);
  });

  it('reports missing required and stays in-progress', () => {
    const { response, missingRequired } = buildQuestionnaireResponse({
      items,
      answers: { q1: true },
      complete: true,
    });
    expect(missingRequired).toEqual(['q3']);
    expect(response.status).toBe('in-progress');
  });
});
