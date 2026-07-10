/**
 * CDS Hooks Discovery endpoint
 * GET /api/cds-hooks
 * Returns the list of registered hooks per the CDS Hooks specification.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    services: [
      {
        hook: 'patient-view',
        title: 'TCOC Patient View',
        description: 'Surfaces care gaps, BH risk, and social needs when a patient record is opened.',
        id: 'tcoc-patient-view',
        prefetch: {
          patient: 'Patient/{{context.patientId}}',
        },
      },
      {
        hook: 'encounter-start',
        title: 'TCOC Encounter Start',
        description: 'Surfaces priority CDS alerts at the start of an encounter.',
        id: 'tcoc-encounter-start',
        prefetch: {
          patient: 'Patient/{{context.patientId}}',
          encounter: 'Encounter/{{context.encounterId}}',
        },
      },
      {
        hook: 'order-sign',
        title: 'TCOC Order Sign',
        description: 'Validates orders against the patient care plan and flags DDI risks.',
        id: 'tcoc-order-sign',
        prefetch: {
          patient: 'Patient/{{context.patientId}}',
        },
      },
    ],
  });
}
