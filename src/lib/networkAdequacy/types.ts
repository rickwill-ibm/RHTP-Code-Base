/**
 * Network Adequacy — normalized model (increment NA-0).
 *
 * A source-agnostic model for measuring, monitoring, and validating provider
 * network adequacy by **specialty × county × line of business**, against
 * configurable CMS standards (time/distance, in-network %, wait-time, ratio).
 * Mirrors the `providernet_analytics` asset + the pediatric-adequacy storyboard.
 */

export type Lob = 'Medicaid' | 'Medicare' | 'Commercial';

/** CMS county designations drive the applicable standard (large-metro → rural). */
export type CountyType = 'large-metro' | 'metro' | 'micro' | 'rural' | 'ccn';

export interface Provider {
  npi: string;
  name: string;
  specialty: string;
  county: string; // county name (matches GeoUnit.name)
  lat: number;
  lng: number;
  lobs: Lob[];
  acceptingNewPatients: boolean;
  status: 'active' | 'credentialing' | 'pending';
}

export interface GeoUnit {
  fips: string;
  name: string;
  state: string;
  countyType: CountyType;
  lat: number; // centroid
  lng: number;
  population: number;
  members: Partial<Record<Lob, number>>;
}

/** A CMS-style standard for a specialty at a county designation. */
export interface AdequacyStandard {
  specialty: string;
  maxDistanceMiles: number; // time/distance standard
  requiredPer100k: number; // provider-to-member ratio floor
  maxWaitDays: number; // appointment wait-time standard (Medicaid 2024 rule)
  minInNetworkPct: number; // e.g. 90 for MA §422.116
  targetAdequacyPct: number; // program target (e.g. 85)
}

export interface AdequacyInput {
  providers: Provider[];
  geo: GeoUnit[];
  standards: AdequacyStandard[];
  /** Optional measured appointment wait-time (days) by county+specialty+lob. */
  waitTimes?: { county: string; specialty: string; lob: Lob; avgWaitDays: number }[];
}

export interface AdequacyMetric {
  county: string;
  state: string;
  specialty: string;
  lob: Lob;
  adequacyPct: number; // 0..100
  targetPct: number;
  nearestDistanceMiles: number | null;
  providersPer100k: number;
  avgWaitDays: number | null;
  memberProviderRatio: number | null; // members per provider
  providerCount: number;
  memberCount: number;
  gapStatus: boolean; // adequacyPct < targetPct
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Gap {
  county: string;
  state: string;
  specialty: string;
  lob: Lob;
  severity: Severity;
  currentPct: number;
  requiredPct: number;
  affectedPopulation: number;
  shortfallProviders: number; // est. providers needed to reach target
}

/** One standard's pass/fail in a validation. */
export interface ValidationCheck {
  standard: 'time-distance' | 'in-network-90' | 'wait-time' | 'ratio' | 'adequacy-target';
  pass: boolean;
  actual: number | null;
  required: number;
  detail: string;
}

export interface ValidationResult {
  county: string;
  specialty: string;
  lob: Lob;
  compliant: boolean;
  checks: ValidationCheck[];
}

export interface AugmentCandidate {
  specialty: string;
  county: string;
  lob: Lob;
  adequacyLiftPct: number; // est. improvement from adding a provider
  newAdequacyPct: number;
  rationale: string;
}
