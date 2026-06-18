/**
 * FHIR Client Stub for Standalone Demo
 * 
 * This is a simplified stub for the standalone demo.
 * The full implementation exists in the main TCoC project.
 */

export class FhirClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_FHIR_BASE_URL || 'http://localhost:8080/fhir';
  }

  async read(resourceType: string, id: string): Promise<any> {
    console.log(`Mock FHIR read: ${resourceType}/${id}`);
    return { resourceType, id };
  }

  async create(resource: any): Promise<any> {
    console.log(`Mock FHIR create: ${resource.resourceType}`);
    return { ...resource, id: `mock-${Date.now()}` };
  }

  async update(resource: any): Promise<any> {
    console.log(`Mock FHIR update: ${resource.resourceType}/${resource.id}`);
    return resource;
  }

  async search(resourceType: string, params: any): Promise<any> {
    console.log(`Mock FHIR search: ${resourceType}`, params);
    return { resourceType: 'Bundle', entry: [] };
  }

  async delete(resourceType: string, id: string): Promise<void> {
    console.log(`Mock FHIR delete: ${resourceType}/${id}`);
  }
}

let fhirClientInstance: FhirClient | null = null;

export function getFhirClient(): FhirClient {
  if (!fhirClientInstance) {
    fhirClientInstance = new FhirClient();
  }
  return fhirClientInstance;
}

export const fhirClient = {
  getFhirClient,
};

// Made with Bob
