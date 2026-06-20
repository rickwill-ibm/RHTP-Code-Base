export const maria = {
  id: 'MARIA_SD_001',
  name: 'Maria Redhawk',
  age: 58,
  memberSince: 2019,
  memberId: 'UHG-2019-447821',
  dateOfBirth: '1967-11-14',
  riskScore: 7.8,
  riskTier: 'HIGH' as const,
  episodes: [
    { id: 'EP-CARDIAC-001', type: 'Postpartum', since: '2023-01', status: 'active' },
    { id: 'EP-DIABETES-001', type: 'Diabetes', since: '2021-06', status: 'active' },
  ],
  authorization: {
    id: 'CAREGAP_HBA1C',
    status: 'EXPIRING',
    daysUntilExpiry: -4,
    procedure: 'HbA1c',
    procedureName: 'HbA1c lab',
    contested: true,
    authExpiryCountdown: 'T-4 days',
  },
  careGap: {
    id: 'CAREGAP_001',
    type: 'HbA1c',
    daysOpen: 45,
    status: 'open',
    lastMeasured: '2025-04-19',
    targetDate: '2026-06-03',
  },
  consent: {
    status: 'FULL',
    date: '2024-03-15',
    channels: ['PORTAL', 'EMAIL', 'PHONE'],
  },
  engagementScore: 8.2,
  portalFrequency: '2x/week',
  preferredChannel: 'PORTAL',
  address: {
    claims: '4821 Rural Route Dr, Martin SD 85034',
    careManagement: '4821 Rural Route Dr, Martin, SD 85034',
    crm: '482 Rural Route Drive, Martin SD 85034',
    clinical: '4821 Rural Route Dr, Martin SD 85034',
  },
  riskScoreBySystem: {
    claims: 7.8,
    careManagement: 6.2,
    crm: 7.8,
    clinical: 8.1,
  },
  consentBySystem: {
    claims: 'FULL',
    careManagement: 'PARTIAL',
    crm: 'FULL',
    clinical: 'UNKNOWN',
  },
};

export const drChen = {
  id: 'PROVIDER_001',
  name: 'Bennett County Health',
  specialty: 'Cardiologist',
  npi: '1234567890',
  networkStatus: 'IN_NETWORK' as const,
  eligibilityStatus: 'EXPIRING' as const,
  eligibilityDaysRemaining: 21,
  riskAlignment: 8.1,
  activeEpisodes: 12,
  facility: 'Bennett County Health',
  phone: '(602) 555-0147',
};

export const population = {
  members: 124847,
  providers: 8293,
  activeEpisodes: 47291,
  openAuths: 23104,
  openCareGaps: 18472,
};