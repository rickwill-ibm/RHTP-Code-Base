/**
 * FHIR R4 Resource Mappers
 *
 * Maps FHIR R4 resources returned by HAPI FHIR into the app's RegistryPatient
 * shape.  Used when NEXT_PUBLIC_USE_MOCK_DATA=false.
 *
 * FHIR R4 resource types handled:
 *   Patient        → demographics, identifiers, extensions (RAF, risk tier, …)
 *   Observation    → care gaps (domain / status / daysOpen)
 *   Flag           → CDS alert cards
 *   RiskAssessment → RAF score + ER risk %
 *
 * Extensions written by migrate-patients.mjs are consumed here.
 */

import type {
  RegistryPatient,
  CareGapEntry,
  CdsCardEntry,
  PathwayStepEntry,
} from '../patientRegistry';

// ─── Raw FHIR R4 JSON types (minimal, only fields we use) ────────────────────

interface FhirExtension {
  url: string;
  valueString?: string;
  valueDecimal?: number;
  valueInteger?: number;
  valueBoolean?: boolean;
}

interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier?: { system: string; value: string }[];
  name?: { use?: string; family?: string; given?: string[] }[];
  gender?: string;
  birthDate?: string;
  telecom?: { system?: string; value?: string; use?: string }[];
  address?: { use?: string; text?: string }[];
  communication?: {
    language?: { coding?: { code?: string }[]; text?: string };
    preferred?: boolean;
  }[];
  extension?: FhirExtension[];
  managingOrganization?: { display?: string };
  generalPractitioner?: { display?: string }[];
}

interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: string;
  code?: { text?: string };
  valueInteger?: number;
  extension?: FhirExtension[];
}

interface FhirFlag {
  resourceType: 'Flag';
  id: string;
  status: string;
  code?: { text?: string; coding?: { code?: string; display?: string }[] };
  extension?: FhirExtension[];
}

interface FhirRiskAssessment {
  resourceType: 'RiskAssessment';
  id: string;
  prediction?: { probabilityDecimal?: number }[];
  extension?: FhirExtension[];
}

interface FhirBundle<T> {
  resourceType: 'Bundle';
  entry?: { resource?: T }[];
}

// ─── Extension helpers ────────────────────────────────────────────────────────

function ext(extensions: FhirExtension[] | undefined, url: string): FhirExtension | undefined {
  return extensions?.find((e) => e.url === url);
}

function extStr(extensions: FhirExtension[] | undefined, url: string): string {
  return ext(extensions, url)?.valueString ?? '';
}

function extNum(extensions: FhirExtension[] | undefined, url: string): number {
  const e = ext(extensions, url);
  return e?.valueDecimal ?? e?.valueInteger ?? 0;
}

const BASE = 'http://tcoc.example.org/fhir/StructureDefinition';

// ─── Patient mapper ───────────────────────────────────────────────────────────

export function mapFhirPatientToRegistryPatient(
  patient: FhirPatient,
  observations: FhirObservation[],
  flags: FhirFlag[],
  riskAssessment: FhirRiskAssessment | undefined,
): RegistryPatient {
  // Name
  const officialName = patient.name?.find((n) => n.use === 'official') ?? patient.name?.[0];
  const given = officialName?.given ?? [];
  const family = officialName?.family ?? '';
  const fullName = [...given, family].filter(Boolean).join(' ');

  // Identifiers
  const platformId =
    patient.identifier?.find((i) => i.system === 'urn:tcoc:platform-id')?.value ?? patient.id;
  const ehrMrn =
    patient.identifier?.find((i) => i.system === 'urn:tcoc:ehr-mrn')?.value ?? patient.id;

  // Demographics
  const gender = patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'U';
  const dob = patient.birthDate ?? '';
  const birthYear = dob ? new Date(dob).getFullYear() : new Date().getFullYear();
  const age = new Date().getFullYear() - birthYear;

  // Contact
  const phone =
    patient.telecom?.find((t) => t.system === 'phone')?.value ?? '';
  const location = patient.address?.find((a) => a.use === 'home')?.text ?? '';

  // Language
  const language =
    patient.communication?.[0]?.language?.text ??
    patient.communication?.[0]?.language?.coding?.[0]?.code ??
    'English';

  // Extensions from migration
  const exts = patient.extension;
  const rafScore = extNum(exts, `${BASE}/raf-score`);
  const riskTierRaw = extStr(exts, `${BASE}/risk-tier`);
  const riskTier = (['Critical', 'High', 'Moderate', 'Low'].includes(riskTierRaw)
    ? riskTierRaw
    : 'Moderate') as RegistryPatient['riskTier'];
  const erRiskPct = extNum(exts, `${BASE}/er-risk-pct`);
  const careManager = extStr(exts, `${BASE}/care-manager`);
  const episodeType = extStr(exts, `${BASE}/episode-type`);
  const pmpm = extNum(exts, `${BASE}/pmpm`);
  const pmpmTarget = extNum(exts, `${BASE}/pmpm-target`);
  const contract = extStr(exts, `${BASE}/contract`);

  // Risk assessment overrides
  const riskExts = riskAssessment?.extension;
  const hccSuspects = extNum(riskExts, `${BASE}/hcc-suspects`);
  const hccValue = extNum(riskExts, `${BASE}/hcc-value`);

  // Care gaps from Observations
  const careGaps: CareGapEntry[] = observations.map((obs) => {
    const oExts = obs.extension;
    const statusRaw = extStr(oExts, `${BASE}/care-gap-status`);
    const status = (['Open', 'In Progress', 'Closed', 'Waived'].includes(statusRaw)
      ? statusRaw
      : 'Open') as CareGapEntry['status'];
    const domain = (extStr(oExts, `${BASE}/care-gap-domain`) || 'Clinical') as CareGapEntry['domain'];
    return {
      id: extStr(oExts, `${BASE}/tcoc-gap-id`) || obs.id,
      domain,
      name: obs.code?.text ?? 'Care Gap',
      status,
      daysOpen: extNum(oExts, `${BASE}/care-gap-days-open`) || obs.valueInteger || 0,
      assignedTo: careManager || 'Care Team',
    };
  });

  // CDS cards from Flags
  const cdsCards: CdsCardEntry[] = flags.map((flag) => {
    const fExts = flag.extension;
    const indicatorRaw = flag.code?.coding?.[0]?.code ?? 'info';
    const indicator = (['critical', 'warning', 'info'].includes(indicatorRaw)
      ? indicatorRaw
      : 'info') as CdsCardEntry['indicator'];
    return {
      id: extStr(fExts, `${BASE}/tcoc-cds-id`) || flag.id,
      indicator,
      summary: flag.code?.text ?? '',
      detail: extStr(fExts, `${BASE}/cds-detail`),
    };
  });

  // Pathway steps — not stored in FHIR, return empty array for now
  const pathwaySteps: PathwayStepEntry[] = [];

  return {
    platformId,
    fhirId: `patient/${patient.id}`,
    ehrMrn,
    name: fullName,
    age,
    gender,
    dob,
    location,
    phone,
    pcp: patient.generalPractitioner?.[0]?.display ?? '',
    careManager,
    careManagerInitials: careManager
      .split(' ')
      .map((w) => w[0])
      .join(''),
    organization: patient.managingOrganization?.display ?? '',
    contract,
    attribution: 'Confirmed',
    rafScore,
    riskTier,
    riskLabel: `${riskTier} — ${erRiskPct}% ER risk`,
    erRiskPct,
    hccSuspects,
    hccValue,
    openCareGaps: careGaps.filter((g) => g.status === 'Open' || g.status === 'In Progress').length,
    episodeType,
    episodeStatus: 'Active',
    episodeDaysActive: 0,
    pmpm,
    pmpmTarget,
    lastContact: '',
    // BH — not yet stored in FHIR extensions; defaults shown
    bhScreeningLabel: '',
    bhScore: null,
    bhScoreLabel: '',
    auditC: 0,
    bhRisk: 'Low',
    bhReferralStatus: '',
    bhProvider: '',
    burdenScore: '',
    patientGoal: '',
    // Social — not yet stored in FHIR extensions; defaults shown
    transportStatus: '',
    foodSecurity: '',
    housingStatus: '',
    language,
    ruralDistance: '',
    disparityFlag: '',
    cohortFlag: '',
    snapStatus: '',
    digitalAccess: '',
    careGaps,
    pathwaySteps,
    aiCopilot: '',
    cdsCards,
  };
}

// ─── Bundle helper — extract entries of a given resourceType ─────────────────

export function bundleEntries<T extends { resourceType: string }>(
  bundle: FhirBundle<T>,
  resourceType: string,
): T[] {
  return (bundle.entry ?? [])
    .map((e) => e.resource)
    .filter((r): r is T => r?.resourceType === resourceType);
}
