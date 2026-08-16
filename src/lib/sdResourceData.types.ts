// ─── sdResourceData.types.ts ──────────────────────────────────────────────────
// Shared TypeScript interfaces for all SD resource data shapes.

export interface SDCountyOffice {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  county: string;
  phone: string;
  fax?: string;
  hours: string;
  website?: string;
  services: string[];
}

export interface SDCBO {
  id: string;
  number: number;
  name: string;
  org: string;
  domain: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  county: string;
  zip: string;
  capacity: 'Accepting' | 'Waitlist' | 'Full';
  connected: boolean;
  provider: 'findhelp' | 'uniteus';
  lat: number;
  lng: number;
}

export interface SDProgram {
  id: string;
  name: string;
  domain: string;
  fundingSource: string;
  monthlyValue: string;
  office: SDCountyOffice;
  eligibility: string;
  documents: string[];
  onlineUrl?: string;
}

export interface SDCrisisResource {
  id: string;
  name: string;
  type: '988' | 'CSU' | 'Mobile' | 'ED';
  phone: string;
  description: string;
  available: boolean;
  responseTime: string;
  address?: string;
  city?: string;
  zip?: string;
}

export interface SDProvider {
  id: string;
  name: string;
  specialty: string;
  facility: string;
  address: string;
  city: string;
  zip: string;
  county: string;
  phone: string;
  fax?: string;
  tier: 'Preferred' | 'In-Network' | 'Out-of-Network';
  acceptingNew: boolean;
  distanceFromMartin: string;
  lat: number;
  lng: number;
}
