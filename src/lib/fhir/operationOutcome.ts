/**
 * FHIR OperationOutcome helpers (plan F-5). One normalized error shape for the
 * whole BFF so the UI renders errors consistently.
 */

export type IssueSeverity = 'fatal' | 'error' | 'warning' | 'information';

export interface OperationOutcomeIssue {
  severity: IssueSeverity;
  code: string;
  diagnostics?: string;
  expression?: string[];
}

export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: OperationOutcomeIssue[];
}

export function operationOutcome(issues: OperationOutcomeIssue[]): OperationOutcome {
  return { resourceType: 'OperationOutcome', issue: issues };
}

export function ooError(
  diagnostics: string,
  code = 'processing',
  expression?: string[]
): OperationOutcome {
  return operationOutcome([{ severity: 'error', code, diagnostics, expression }]);
}

/** Coerce any thrown error or non-OK FHIR response body into an OperationOutcome. */
export function toOperationOutcome(input: unknown): OperationOutcome {
  if (isOperationOutcome(input)) return input;
  if (input instanceof Error) return ooError(input.message, 'exception');
  if (typeof input === 'string') return ooError(input);
  return ooError('Unknown error', 'unknown');
}

export function isOperationOutcome(x: unknown): x is OperationOutcome {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as { resourceType?: unknown }).resourceType === 'OperationOutcome' &&
    Array.isArray((x as { issue?: unknown }).issue)
  );
}
