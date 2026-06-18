// uhg/data/persona.ts — display persona for UHG-Orchestrate screens, sourced from the
// RHTP patient registry. Works for ANY citizen; default = Maria Redhawk (MARIA_SD_001).
import { getPatientById, getAllPatients, type RegistryPatient } from '@/lib/patientRegistry';

export const DEFAULT_CITIZEN = 'MARIA_SD_001';

export interface UhgPersona {
  id: string; name: string; age: number; gender: string; initials: string;
  riskLabel: string; riskColor: string;
  bhStatus: string; careGap: string; episode: string;
  clinicalAlert: string | null; sdoh: string; population: string;
  careManager: string; organization: string; location: string;
}

function toInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}
function riskColor(tier: string) {
  return /crit|high/i.test(tier) ? '#fa4d56' : /mod/i.test(tier) ? '#f1c21b' : '#42be65';
}
function topClinicalGap(p: RegistryPatient) {
  const g = p.careGaps?.find((c) => c.domain === 'Clinical' && c.status !== 'Closed') || p.careGaps?.[0];
  return g ? `${g.name.replace(/ \(.*\)/, '')} ${g.daysOpen}d` : 'No open gap';
}

export function personaFor(citizenId?: string): UhgPersona {
  const p = getPatientById(citizenId || DEFAULT_CITIZEN) || getPatientById(DEFAULT_CITIZEN)!;
  const tier = p.riskTier || 'Moderate';
  const social = p.careGaps?.filter((c) => c.domain === 'Social').length || 0;
  return {
    id: p.platformId, name: p.name, age: p.age, gender: p.gender, initials: toInitials(p.name),
    riskLabel: `${tier.toUpperCase()} · RAF ${p.rafScore}`, riskColor: riskColor(tier),
    bhStatus: p.bhScoreLabel || p.bhScreeningLabel || 'No BH screen',
    careGap: topClinicalGap(p),
    episode: `${p.episodeType} · ${p.episodeStatus}`,
    clinicalAlert: /pre-?diab/i.test(p.riskLabel || '') ? 'Pre-diabetic · A1C' : null,
    sdoh: social > 0 ? `SDOH · ${social} barriers` : 'SDOH · screening',
    population: `${p.contract} · ${p.organization}`,
    careManager: p.careManager, organization: p.organization, location: p.location,
  };
}

export function citizenRoster(): { id: string; name: string }[] {
  return getAllPatients().map((p) => ({ id: p.platformId, name: p.name }));
}
