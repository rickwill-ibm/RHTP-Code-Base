/**
 * Closed-Loop Referral Service with Complete FHIR Integration
 * 
 * This service implements the full closed-loop referral workflow including:
 * - ServiceRequest creation for referrals
 * - Task tracking for referral completion
 * - Procedure documentation for service completion
 * - Observation creation for clinical evidence
 * - MeasureReport updates for gap closure
 * - Provenance records for audit trail
 * 
 * Author: Richard Hennessy — TCOC Total Cost of Care Clinical Platform
 */

import { FhirClient } from './fhirClient';

// Initialize FHIR client
const fhirClient = new FhirClient();

// ─── Type Definitions ──────────────────────────────────────────────────────────

export interface ReferralRequest {
  patientId: string;
  requesterId: string;
  performerId: string;
  serviceCode: string;
  serviceDisplay: string;
  reasonCode?: string;
  reasonDisplay?: string;
  conditionId?: string;
  careGapId?: string;
  gainshareEligible?: boolean;
  gainshareAmount?: number;
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  notes?: string;
}

export interface ServiceCompletionRequest {
  taskId: string;
  serviceRequestId: string;
  patientId: string;
  performerId: string;
  procedureCode: string;
  procedureDisplay: string;
  performedDate: string;
  observations?: ObservationData[];
  notes?: string;
}

export interface ObservationData {
  code: string;
  codeSystem: string;
  display: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  interpretation?: string;
}

export interface MeasureReportUpdate {
  measureReportId: string;
  patientId: string;
  measureCode: string;
  gapClosed: boolean;
  evidenceReferences: string[];
  closureDate: string;
}

// ─── Retry Configuration ───────────────────────────────────────────────────────

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  let delay = RETRY_CONFIG.initialDelay;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        console.warn(`${context} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}):`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
      }
    }
  }

  throw new Error(`${context} failed after ${RETRY_CONFIG.maxRetries + 1} attempts: ${lastError?.message}`);
}

// ─── FHIR Resource Creation Functions ─────────────────────────────────────────

/**
 * Create a ServiceRequest for a referral
 */
export async function createReferralServiceRequest(
  request: ReferralRequest
): Promise<any> {
  return retryWithBackoff(async () => {
    const serviceRequest = {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      priority: request.priority || 'routine',
      category: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '3457005',
          display: 'Patient referral'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: request.serviceCode,
          display: request.serviceDisplay
        }],
        text: request.serviceDisplay
      },
      subject: {
        reference: `Patient/${request.patientId}`
      },
      authoredOn: new Date().toISOString(),
      requester: {
        reference: `Practitioner/${request.requesterId}`
      },
      performer: [{
        reference: `Practitioner/${request.performerId}`
      }],
      ...(request.reasonCode && {
        reasonCode: [{
          coding: [{
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: request.reasonCode,
            display: request.reasonDisplay
          }]
        }]
      }),
      ...(request.conditionId && {
        reasonReference: [{
          reference: `Condition/${request.conditionId}`
        }]
      }),
      ...(request.notes && {
        note: [{
          text: request.notes
        }]
      }),
      extension: [
        ...(request.careGapId ? [{
          url: 'http://tcoc.org/fhir/StructureDefinition/care-gap-reference',
          valueReference: {
            reference: `MeasureReport/${request.careGapId}`
          }
        }] : []),
        ...(request.gainshareEligible ? [{
          url: 'http://tcoc.org/fhir/StructureDefinition/gainshare-eligible',
          valueBoolean: true
        }] : []),
        ...(request.gainshareAmount ? [{
          url: 'http://tcoc.org/fhir/StructureDefinition/gainshare-amount',
          valueMoney: {
            value: request.gainshareAmount,
            currency: 'USD'
          }
        }] : [])
      ]
    };

    const response = await fhirClient.create(serviceRequest as any);
    console.log('ServiceRequest created:', response.id);
    return response;
  }, 'Create ServiceRequest');
}

/**
 * Create a Task to track referral completion
 */
export async function createReferralTask(
  serviceRequestId: string,
  patientId: string,
  performerId: string,
  requesterId: string
): Promise<any> {
  return retryWithBackoff(async () => {
    const task = {
      resourceType: 'Task',
      status: 'requested',
      intent: 'order',
      priority: 'routine',
      code: {
        coding: [{
          system: 'http://hl7.org/fhir/CodeSystem/task-code',
          code: 'fulfill',
          display: 'Fulfill the focal request'
        }]
      },
      focus: {
        reference: `ServiceRequest/${serviceRequestId}`
      },
      for: {
        reference: `Patient/${patientId}`
      },
      authoredOn: new Date().toISOString(),
      requester: {
        reference: `Practitioner/${requesterId}`
      },
      owner: {
        reference: `Practitioner/${performerId}`
      },
      businessStatus: {
        text: 'Referral sent, awaiting appointment'
      }
    };

    const response = await fhirClient.create(task as any);
    console.log('Task created:', response.id);
    return response;
  }, 'Create Task');
}

/**
 * Update Task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'requested' | 'accepted' | 'in-progress' | 'completed' | 'cancelled',
  businessStatus?: string,
  output?: any[]
): Promise<any> {
  return retryWithBackoff(async () => {
    const task: any = await fhirClient.read('Task', taskId);
    
    task.status = status;
    if (businessStatus) {
      task.businessStatus = { text: businessStatus };
    }
    if (status === 'completed') {
      task.executionPeriod = {
        start: task.authoredOn,
        end: new Date().toISOString()
      };
    }
    if (output) {
      task.output = output;
    }

    const response = await fhirClient.update(task);
    console.log('Task updated:', taskId);
    return response;
  }, 'Update Task');
}

/**
 * Create a Procedure for service completion
 */
export async function createProcedure(
  request: ServiceCompletionRequest
): Promise<any> {
  return retryWithBackoff(async () => {
    const procedure: any = {
      resourceType: 'Procedure',
      status: 'completed',
      code: {
        coding: [{
          system: 'http://www.ama-assn.org/go/cpt',
          code: request.procedureCode,
          display: request.procedureDisplay
        }]
      },
      subject: {
        reference: `Patient/${request.patientId}`
      },
      performedDateTime: request.performedDate,
      performer: [{
        actor: {
          reference: `Practitioner/${request.performerId}`
        }
      }],
      reasonReference: [{
        reference: `ServiceRequest/${request.serviceRequestId}`
      }],
      basedOn: [{
        reference: `ServiceRequest/${request.serviceRequestId}`
      }],
      ...(request.notes && {
        note: [{
          text: request.notes
        }]
      })
    };

    const response = await fhirClient.create(procedure);
    console.log('Procedure created:', response.id);
    return response;
  }, 'Create Procedure');
}

/**
 * Create Observations for clinical evidence
 */
export async function createObservations(
  patientId: string,
  performerId: string,
  serviceRequestId: string,
  observations: ObservationData[]
): Promise<any[]> {
  const results = [];
  
  for (const obs of observations) {
    const observation = await retryWithBackoff(async () => {
      const resource: any = {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory'
          }]
        }],
        code: {
          coding: [{
            system: obs.codeSystem,
            code: obs.code,
            display: obs.display
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: new Date().toISOString(),
        issued: new Date().toISOString(),
        performer: [{
          reference: `Practitioner/${performerId}`
        }],
        ...(obs.valueQuantity && {
          valueQuantity: {
            value: obs.valueQuantity.value,
            unit: obs.valueQuantity.unit,
            system: obs.valueQuantity.system || 'http://unitsofmeasure.org',
            code: obs.valueQuantity.code || obs.valueQuantity.unit
          }
        }),
        ...(obs.valueString && {
          valueString: obs.valueString
        }),
        ...(obs.interpretation && {
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: obs.interpretation
            }]
          }]
        }),
        basedOn: [{
          reference: `ServiceRequest/${serviceRequestId}`
        }]
      };

      const response = await fhirClient.create(resource);
      console.log('Observation created:', response.id);
      return response;
    }, `Create Observation ${obs.code}`);
    
    results.push(observation);
  }
  
  return results;
}

/**
 * Update MeasureReport for gap closure
 */
export async function updateMeasureReportForGapClosure(
  update: MeasureReportUpdate
): Promise<any> {
  return retryWithBackoff(async () => {
    const measureReport: any = await fhirClient.read('MeasureReport', update.measureReportId);
    
    // Update the measure report to reflect gap closure
    if (!measureReport.extension) {
      measureReport.extension = [];
    }
    
    measureReport.extension.push({
      url: 'http://tcoc.org/fhir/StructureDefinition/gap-closure',
      extension: [
        {
          url: 'closed',
          valueBoolean: update.gapClosed
        },
        {
          url: 'closureDate',
          valueDateTime: update.closureDate
        },
        {
          url: 'evidence',
          valueReference: update.evidenceReferences.map(ref => ({ reference: ref }))
        }
      ]
    });

    const response = await fhirClient.update(measureReport);
    console.log('MeasureReport updated for gap closure:', update.measureReportId);
    return response;
  }, 'Update MeasureReport');
}

/**
 * Create Provenance record for audit trail
 */
export async function createProvenanceRecord(
  targetResourceType: string,
  targetResourceId: string,
  actorId: string,
  activity: string,
  reason?: string
): Promise<any> {
  return retryWithBackoff(async () => {
    const provenance: any = {
      resourceType: 'Provenance',
      target: [{
        reference: `${targetResourceType}/${targetResourceId}`
      }],
      recorded: new Date().toISOString(),
      agent: [{
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
            code: 'author'
          }]
        },
        who: {
          reference: `Practitioner/${actorId}`
        }
      }],
      activity: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
          code: activity
        }]
      },
      ...(reason && {
        reason: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
            code: 'TREAT',
            display: reason
          }]
        }]
      })
    };

    const response = await fhirClient.create(provenance);
    console.log('Provenance record created:', response.id);
    return response;
  }, 'Create Provenance');
}

// ─── Complete Workflow Functions ──────────────────────────────────────────────

/**
 * Complete referral workflow: Create ServiceRequest + Task + Provenance
 */
export async function initiateReferral(request: ReferralRequest): Promise<{
  serviceRequest: any;
  task: any;
  provenance: any;
}> {
  try {
    // Create ServiceRequest
    const serviceRequest = await createReferralServiceRequest(request);
    
    // Create Task
    const task = await createReferralTask(
      serviceRequest.id,
      request.patientId,
      request.performerId,
      request.requesterId
    );
    
    // Create Provenance
    const provenance = await createProvenanceRecord(
      'ServiceRequest',
      serviceRequest.id,
      request.requesterId,
      'CREATE',
      'Referral initiated for care gap closure'
    );
    
    return { serviceRequest, task, provenance };
  } catch (error) {
    console.error('Failed to initiate referral:', error);
    throw error;
  }
}

/**
 * Complete service and close gap: Update Task + Create Procedure + Create Observations + Update MeasureReport + Create Provenance
 */
export async function completeServiceAndCloseGap(
  request: ServiceCompletionRequest,
  measureReportId?: string
): Promise<{
  task: any;
  procedure: any;
  observations: any[];
  measureReport?: any;
  provenance: any;
}> {
  try {
    // Create Procedure
    const procedure = await createProcedure(request);
    
    // Create Observations
    const observations = request.observations 
      ? await createObservations(
          request.patientId,
          request.performerId,
          request.serviceRequestId,
          request.observations
        )
      : [];
    
    // Update Task with output
    const taskOutput = [
      {
        type: { text: 'Procedure performed' },
        valueReference: { reference: `Procedure/${procedure.id}` }
      },
      ...observations.map(obs => ({
        type: { text: 'Lab result' },
        valueReference: { reference: `Observation/${obs.id}` }
      }))
    ];
    
    const task = await updateTaskStatus(
      request.taskId,
      'completed',
      'Service completed, results available',
      taskOutput
    );
    
    // Update MeasureReport if gap closure
    let measureReport;
    if (measureReportId) {
      measureReport = await updateMeasureReportForGapClosure({
        measureReportId,
        patientId: request.patientId,
        measureCode: request.procedureCode,
        gapClosed: true,
        evidenceReferences: [
          `Procedure/${procedure.id}`,
          ...observations.map(obs => `Observation/${obs.id}`)
        ],
        closureDate: request.performedDate
      });
    }
    
    // Create Provenance
    const provenance = await createProvenanceRecord(
      'Task',
      request.taskId,
      request.performerId,
      'UPDATE',
      'Service completed and documented'
    );
    
    return { task, procedure, observations, measureReport, provenance };
  } catch (error) {
    console.error('Failed to complete service:', error);
    throw error;
  }
}

/**
 * Validation helper
 */
export function validateReferralRequest(request: ReferralRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!request.patientId) errors.push('Patient ID is required');
  if (!request.requesterId) errors.push('Requester ID is required');
  if (!request.performerId) errors.push('Performer ID is required');
  if (!request.serviceCode) errors.push('Service code is required');
  if (!request.serviceDisplay) errors.push('Service display is required');
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export const referralService = {
  createReferralServiceRequest,
  createReferralTask,
  updateTaskStatus,
  createProcedure,
  createObservations,
  updateMeasureReportForGapClosure,
  createProvenanceRecord,
  initiateReferral,
  completeServiceAndCloseGap,
  validateReferralRequest,
};

// Made with Bob
