/**
 * Lightweight FHIR R4 structural validation (plan F-5).
 *
 * SCOPE: conservative, dependency-free structural checks that catch the most
 * common agent/codegen mistakes (missing resourceType, wrong type, unknown
 * top-level resource) WITHOUT inventing profile rules. Full profile/US-Core
 * conformance is delegated to the standards backbone + external validators
 * (Inferno/Da Vinci) per the blueprint — this is a fast pre-flight only.
 */
import {
  operationOutcome,
  type OperationOutcome,
  type OperationOutcomeIssue,
} from './operationOutcome';

/** R4 resource types this app reads/writes today. Extend as slices land. */
export const KNOWN_RESOURCE_TYPES = new Set<string>([
  'Patient',
  'Coverage',
  'Claim',
  'ClaimResponse',
  'ExplanationOfBenefit',
  'Condition',
  'DiagnosticReport',
  'Observation',
  'ServiceRequest',
  'MedicationRequest',
  'Questionnaire',
  'QuestionnaireResponse',
  'Practitioner',
  'PractitionerRole',
  'Organization',
  'Consent',
  'Provenance',
  'Task',
  'Bundle',
  'OperationOutcome',
  'CarePlan',
  'CareTeam',
]);

export interface FhirResourceLike {
  resourceType?: unknown;
  id?: unknown;
}

/**
 * Validate a resource's structure. Returns an OperationOutcome when problems are
 * found, or `null` when it passes the pre-flight checks.
 */
export function validate(resource: unknown, expectedType?: string): OperationOutcome | null {
  const issues: OperationOutcomeIssue[] = [];

  if (!resource || typeof resource !== 'object') {
    return operationOutcome([
      { severity: 'error', code: 'structure', diagnostics: 'Resource must be a JSON object' },
    ]);
  }
  const r = resource as FhirResourceLike;

  if (typeof r.resourceType !== 'string' || !r.resourceType) {
    issues.push({
      severity: 'error',
      code: 'required',
      diagnostics: 'Missing resourceType',
      expression: ['resourceType'],
    });
  } else {
    if (!KNOWN_RESOURCE_TYPES.has(r.resourceType)) {
      issues.push({
        severity: 'warning',
        code: 'not-supported',
        diagnostics: `Unknown/unsupported resourceType "${r.resourceType}" (possible hallucination — verify against the reference OpenAPI)`,
        expression: ['resourceType'],
      });
    }
    if (expectedType && r.resourceType !== expectedType) {
      issues.push({
        severity: 'error',
        code: 'invariant',
        diagnostics: `Expected ${expectedType} but got ${r.resourceType}`,
        expression: ['resourceType'],
      });
    }
  }

  if (r.id !== undefined && typeof r.id !== 'string') {
    issues.push({
      severity: 'error',
      code: 'value',
      diagnostics: 'id must be a string',
      expression: ['id'],
    });
  }

  return issues.length ? operationOutcome(issues) : null;
}

/** True when the resource passes pre-flight (no error/fatal issues). */
export function isValid(resource: unknown, expectedType?: string): boolean {
  const oo = validate(resource, expectedType);
  if (!oo) return true;
  return !oo.issue.some((i) => i.severity === 'error' || i.severity === 'fatal');
}
