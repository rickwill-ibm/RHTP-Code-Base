/**
 * DTR QuestionnaireResponse builder (plan Slice 4 / blueprint §6.4).
 * Turns user/prepopulated answers into a FHIR R4 QuestionnaireResponse. Pure.
 */

export interface QuestionnaireItemDef {
  linkId: string;
  text: string;
  type: 'string' | 'boolean' | 'integer' | 'choice' | 'date';
  required?: boolean;
}

export type AnswerValue = string | boolean | number;

export interface QuestionnaireResponseItem {
  linkId: string;
  text: string;
  answer?: {
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDate?: string;
  }[];
}

export interface QuestionnaireResponse {
  resourceType: 'QuestionnaireResponse';
  status: 'in-progress' | 'completed';
  questionnaire?: string;
  subject?: { reference: string };
  item: QuestionnaireResponseItem[];
}

function toAnswer(
  type: QuestionnaireItemDef['type'],
  value: AnswerValue
): QuestionnaireResponseItem['answer'] {
  switch (type) {
    case 'boolean':
      return [{ valueBoolean: Boolean(value) }];
    case 'integer':
      return [{ valueInteger: Number(value) }];
    case 'date':
      return [{ valueDate: String(value) }];
    default:
      return [{ valueString: String(value) }];
  }
}

export function buildQuestionnaireResponse(params: {
  questionnaireCanonical?: string;
  patientRef?: string;
  items: QuestionnaireItemDef[];
  answers: Record<string, AnswerValue | undefined>;
  complete: boolean;
}): { response: QuestionnaireResponse; missingRequired: string[] } {
  const missingRequired: string[] = [];
  const item: QuestionnaireResponseItem[] = params.items.map((def) => {
    const val = params.answers[def.linkId];
    if (def.required && (val === undefined || val === '')) missingRequired.push(def.linkId);
    return {
      linkId: def.linkId,
      text: def.text,
      answer: val === undefined || val === '' ? undefined : toAnswer(def.type, val),
    };
  });

  return {
    response: {
      resourceType: 'QuestionnaireResponse',
      status: params.complete && missingRequired.length === 0 ? 'completed' : 'in-progress',
      questionnaire: params.questionnaireCanonical,
      subject: params.patientRef ? { reference: params.patientRef } : undefined,
      item,
    },
    missingRequired,
  };
}
