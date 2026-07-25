'use client';

import { useState } from 'react';
import {
  buildQuestionnaireResponse,
  type QuestionnaireItemDef,
  type AnswerValue,
  type QuestionnaireResponse,
} from '@/lib/dtr/questionnaireResponse';

/**
 * Native DTR questionnaire renderer (plan Slice 4 / blueprint §6.4).
 * Renders a questionnaire, accepts prepopulated answers, emits a
 * QuestionnaireResponse. Accessible labels; validates required items.
 */
export function QuestionnaireRenderer({
  items,
  prepopulated,
  questionnaireCanonical,
  patientRef,
  onComplete,
}: {
  items: QuestionnaireItemDef[];
  prepopulated?: Record<string, AnswerValue>;
  questionnaireCanonical?: string;
  patientRef?: string;
  onComplete?: (qr: QuestionnaireResponse) => void;
}): React.ReactElement {
  const [answers, setAnswers] = useState<Record<string, AnswerValue | undefined>>(
    prepopulated ?? {}
  );
  const [missing, setMissing] = useState<string[]>([]);

  function set(linkId: string, value: AnswerValue): void {
    setAnswers((a) => ({ ...a, [linkId]: value }));
  }

  function submit(): void {
    const { response, missingRequired } = buildQuestionnaireResponse({
      questionnaireCanonical,
      patientRef,
      items,
      answers,
      complete: true,
    });
    setMissing(missingRequired);
    if (missingRequired.length === 0) onComplete?.(response);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {items.map((item) => {
        const val = answers[item.linkId];
        const isMissing = missing.includes(item.linkId);
        const id = `q-${item.linkId}`;
        return (
          <div key={item.linkId} className="space-y-1">
            <label htmlFor={id} className="block text-sm font-medium">
              {item.text}
              {item.required ? <span className="text-red-600"> *</span> : null}
            </label>
            {item.type === 'boolean' ? (
              <input
                id={id}
                type="checkbox"
                checked={Boolean(val)}
                onChange={(e) => set(item.linkId, e.target.checked)}
              />
            ) : (
              <input
                id={id}
                type={item.type === 'integer' ? 'number' : item.type === 'date' ? 'date' : 'text'}
                value={val === undefined ? '' : String(val)}
                onChange={(e) =>
                  set(
                    item.linkId,
                    item.type === 'integer' ? Number(e.target.value) : e.target.value
                  )
                }
                className={`w-full rounded border px-2 py-1 text-sm ${isMissing ? 'border-red-400' : 'border-slate-300'}`}
                aria-invalid={isMissing}
              />
            )}
            {isMissing ? <p className="text-xs text-red-600">Required</p> : null}
          </div>
        );
      })}
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
      >
        Complete documentation
      </button>
    </form>
  );
}

export default QuestionnaireRenderer;
