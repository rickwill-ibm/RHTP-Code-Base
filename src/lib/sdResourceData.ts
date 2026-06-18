// ─── South Dakota Resource Library ───────────────────────────────────────────
// Single source of truth for all SD-specific addresses, contacts, resources,
// map coordinates, and Maria Redhawk's confirmed PRAPARE domains.
// All screens import from here to ensure SD consistency.

// ─── SD Map Center (Bennett County, Martin SD) ────────────────────────────────
export const SD_MAP_CENTER = { lat: 43.18, lng: -101.73, label: 'Martin, SD 57551 — Bennett County' };

// ─── SD Zip Codes ─────────────────────────────────────────────────────────────
export const SD_ZIP_CODES = {
  MARTIN: '57551',
  WINNER: '57580',
  RAPID_CITY: '57701',
  PIERRE: '57501',
  PINE_RIDGE: '57770',
  HOT_SPRINGS: '57747',
  BURKE: '57523',
  GREGORY: '57533',
  SIOUX_FALLS: '57110',
  OGLALA: '57764',
  MOBRIDGE: '57601',
};

// ─── SD Counties ──────────────────────────────────────────────────────────────
export const SD_COUNTIES = [
  'Bennett', 'Oglala Lakota', 'Tripp', 'Fall River', 'Gregory',
  'Hughes', 'Pennington', 'Minnehaha', 'Shannon', 'Todd',
];

// ─── SD County Offices ────────────────────────────────────────────────────────
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

export const SD_COUNTY_OFFICES: SDCountyOffice[] = [
  {
    id: 'co-001',
    name: 'SD DSS Bennett County Office',
    address: '102 N. Van Buren St',
    city: 'Martin',
    zip: '57551',
    county: 'Bennett',
    phone: '(605) 685-6622',
    fax: '(605) 685-6623',
    hours: 'Mon–Fri 8am–5pm',
    website: 'dss.sd.gov',
    services: ['SNAP', 'TANF', 'Medicaid', 'CCAP', 'Child Support'],
  },
  {
    id: 'co-002',
    name: 'Bennett County WIC Office',
    address: '102 N. Van Buren St',
    city: 'Martin',
    zip: '57551',
    county: 'Bennett',
    phone: '(605) 685-6622',
    hours: 'Mon–Fri 8am–5pm',
    website: 'doh.sd.gov/wic',
    services: ['WIC — Women, Infants & Children', 'Nutrition counseling', 'Breastfeeding support'],
  },
  {
    id: 'co-003',
    name: 'Community Action Partnership of the Black Hills',
    address: '601 E. St. Joseph St',
    city: 'Rapid City',
    zip: '57701',
    county: 'Pennington',
    phone: '(605) 348-0820',
    hours: 'Mon–Fri 8am–4:30pm',
    website: 'capbh.org',
    services: ['LIHEAP', 'Emergency assistance', 'Weatherization', 'Head Start'],
  },
  {
    id: 'co-004',
    name: 'SD Housing Development Authority',
    address: '3060 E. Elizabeth St',
    city: 'Pierre',
    zip: '57501',
    county: 'Hughes',
    phone: '(605) 773-3181',
    hours: 'Mon–Fri 8am–5pm',
    website: 'sdhda.org',
    services: ['Rental assistance', 'Section 8 vouchers', 'Homeownership programs'],
  },
  {
    id: 'co-005',
    name: 'SD Department of Labor — Bennett County',
    address: '102 N. Van Buren St',
    city: 'Martin',
    zip: '57551',
    county: 'Bennett',
    phone: '(605) 685-6622',
    hours: 'Mon–Fri 8am–5pm',
    website: 'dlr.sd.gov',
    services: ['Job placement', 'WIOA training', 'Unemployment insurance'],
  },
  {
    id: 'co-006',
    name: 'SD DSS Statewide Benefits Line',
    address: '700 Governors Dr',
    city: 'Pierre',
    zip: '57501',
    county: 'Hughes',
    phone: '(605) 773-3165',
    hours: 'Mon–Fri 7am–6pm',
    website: 'dss.sd.gov',
    services: ['SNAP', 'Medicaid', 'TANF', 'CCAP', 'Online applications'],
  },
];

// ─── SD CBOs ──────────────────────────────────────────────────────────────────
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

export const SD_CBOS: SDCBO[] = [
  { id: 'sd-001', number: 1, name: 'Benefit Enrollment Assistance', org: 'Bennett County Action CBO', domain: 'Financial', email: 'enroll@bennettcountyaction.org', phone: '(605) 685-6100', address: '204 W 3rd St', city: 'Martin', county: 'Bennett', zip: '57551', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 43.18, lng: -101.73 },
  { id: 'sd-002', number: 2, name: 'Medical Transportation (NEMT)', org: 'Medicaid NEMT — Bennett County', domain: 'Transportation', email: 'nemt@sd.gov', phone: '(800) 843-8394', address: '102 N Van Buren St', city: 'Martin', county: 'Bennett', zip: '57551', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 43.18, lng: -101.74 },
  { id: 'sd-003', number: 3, name: 'Food Pantry & SNAP Assistance', org: 'Oglala Sioux Tribe Community Services', domain: 'Food', email: 'food@ostcs.org', phone: '(605) 867-5821', address: '1 Crazy Horse Dr', city: 'Pine Ridge', county: 'Oglala Lakota', zip: '57770', capacity: 'Accepting', connected: true, provider: 'findhelp', lat: 43.02, lng: -102.55 },
  { id: 'sd-004', number: 4, name: 'Emergency Housing & Shelter', org: 'SD Housing Development Authority', domain: 'Housing', email: 'housing@sdhda.org', phone: '(605) 773-3181', address: '3060 E Elizabeth St', city: 'Pierre', county: 'Hughes', zip: '57501', capacity: 'Waitlist', connected: true, provider: 'uniteus', lat: 44.37, lng: -100.34 },
  { id: 'sd-005', number: 5, name: 'Postpartum Support Group', org: 'Bennett County Health Services', domain: 'Mental Health', email: 'bh@bennettcountyhealth.org', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin', county: 'Bennett', zip: '57551', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 43.18, lng: -101.73 },
  { id: 'sd-006', number: 6, name: 'WIC — Women, Infants & Children', org: 'Bennett County WIC Office', domain: 'Nutrition', email: 'wic@bennett.sd.gov', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin', county: 'Bennett', zip: '57551', capacity: 'Accepting', connected: true, provider: 'findhelp', lat: 43.18, lng: -101.73 },
  { id: 'sd-007', number: 7, name: 'Childcare Assistance (CCAP)', org: 'SD DSS Bennett County Office', domain: 'Childcare', email: 'dss@bennett.sd.gov', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin', county: 'Bennett', zip: '57551', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 43.18, lng: -101.73 },
  { id: 'sd-008', number: 8, name: 'Behavioral Health Services', org: 'Avera Sacred Heart CAH — BH', domain: 'Mental Health', email: 'bh@averasacredheart.org', phone: '(605) 842-7100', address: '501 Summit St', city: 'Winner', county: 'Tripp', zip: '57580', capacity: 'Accepting', connected: false, provider: 'findhelp', lat: 43.37, lng: -99.86 },
  { id: 'sd-009', number: 9, name: 'Employment & Job Training', org: 'SD Department of Labor — Bennett County', domain: 'Employment', email: 'jobs@sd.gov', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin', county: 'Bennett', zip: '57551', capacity: 'Accepting', connected: false, provider: 'findhelp', lat: 43.18, lng: -101.73 },
  { id: 'sd-010', number: 10, name: 'Utility Assistance (LIHEAP)', org: 'Community Action Partnership of the Black Hills', domain: 'Utility', email: 'liheap@capbh.org', phone: '(605) 348-0820', address: '601 E St Joseph St', city: 'Rapid City', county: 'Pennington', zip: '57701', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 44.08, lng: -103.23 },
  { id: 'sd-011', number: 11, name: 'Tribal Health Services', org: 'Oglala Sioux Tribe Health Administration', domain: 'Health', email: 'health@ostadmin.org', phone: '(605) 867-5131', address: '1 Crazy Horse Dr', city: 'Pine Ridge', county: 'Oglala Lakota', zip: '57770', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 43.02, lng: -102.55 },
  { id: 'sd-012', number: 12, name: 'Crisis & Safety Services', org: 'Monument Health Crisis Line', domain: 'Safety', email: 'crisis@monument.health', phone: '(605) 755-1000', address: '677 Cathedral Dr', city: 'Rapid City', county: 'Pennington', zip: '57701', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 44.08, lng: -103.23 },
  { id: 'sd-013', number: 13, name: 'Substance Use Treatment', org: 'Fall River Health Services', domain: 'Substance Use', email: 'su@fallriverhealth.org', phone: '(605) 745-3159', address: '1201 Highway 71', city: 'Hot Springs', county: 'Fall River', zip: '57747', capacity: 'Accepting', connected: false, provider: 'findhelp', lat: 43.43, lng: -103.47 },
  { id: 'sd-014', number: 14, name: 'Disability & Independent Living', org: 'SD Advocacy Services', domain: 'Disabilities', email: 'advocacy@sdadvocacy.org', phone: '(605) 224-8294', address: '221 S Central Ave', city: 'Pierre', county: 'Hughes', zip: '57501', capacity: 'Accepting', connected: false, provider: 'findhelp', lat: 44.37, lng: -100.34 },
  { id: 'sd-015', number: 15, name: 'Domestic Violence Services', org: 'Sacred Heart Center — DV', domain: 'Safety', email: 'dv@sacredheartcenter.org', phone: '(605) 842-1234', address: '501 Summit St', city: 'Winner', county: 'Tripp', zip: '57580', capacity: 'Accepting', connected: true, provider: 'findhelp', lat: 43.37, lng: -99.86 },
  { id: 'sd-016', number: 16, name: 'Education & Literacy', org: 'SD Literacy Council', domain: 'Education', email: 'learn@sdliteracy.org', phone: '(605) 224-9738', address: '104 N Euclid Ave', city: 'Pierre', county: 'Hughes', zip: '57501', capacity: 'Accepting', connected: false, provider: 'findhelp', lat: 44.37, lng: -100.34 },
  { id: 'sd-017', number: 17, name: 'Physical Activity & Wellness', org: 'Gregory County Medical Associates', domain: 'Physical Activity', email: 'wellness@gregorycountymed.org', phone: '(605) 835-8394', address: '400 Park St', city: 'Burke', county: 'Gregory', zip: '57523', capacity: 'Accepting', connected: false, provider: 'findhelp', lat: 43.18, lng: -99.29 },
  { id: 'sd-018', number: 18, name: 'Financial Counseling', org: 'SD Consumer Credit Counseling', domain: 'Financial', email: 'counsel@sdccc.org', phone: '(605) 334-6004', address: '4901 E 26th St', city: 'Sioux Falls', county: 'Minnehaha', zip: '57110', capacity: 'Accepting', connected: true, provider: 'uniteus', lat: 43.54, lng: -96.73 },
];

// ─── SD Programs ──────────────────────────────────────────────────────────────
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

export const SD_PROGRAMS: SDProgram[] = [
  {
    id: 'prog-wic',
    name: 'WIC — Women, Infants & Children',
    domain: 'Nutrition',
    fundingSource: 'USDA',
    monthlyValue: '$320/mo',
    office: SD_COUNTY_OFFICES[1], // Bennett County WIC
    eligibility: 'Income ≤ 185% FPL · Pregnant, postpartum, or infant/child under 5',
    documents: ['Proof of identity (SD ID or tribal ID)', 'Proof of residency (utility bill or lease)', 'Proof of income (pay stubs or benefit letter)', 'Infant/child birth certificate or pregnancy documentation'],
    onlineUrl: 'doh.sd.gov/wic',
  },
  {
    id: 'prog-ccap',
    name: 'SD Childcare Assistance Program (CCAP)',
    domain: 'Childcare',
    fundingSource: 'SD DSS',
    monthlyValue: '$487/mo',
    office: SD_COUNTY_OFFICES[0], // SD DSS Bennett County
    eligibility: 'Income ≤ 85% SMI · Working or in school · Child under 13',
    documents: ['Proof of identity (SD ID or tribal ID)', 'Proof of residency in Bennett County', 'Proof of income (last 30 days)', "Child's birth certificate", 'Childcare provider information'],
    onlineUrl: 'dss.sd.gov/childcare',
  },
  {
    id: 'prog-snap',
    name: 'SNAP Food Assistance',
    domain: 'Food Security',
    fundingSource: 'USDA',
    monthlyValue: '$281/mo',
    office: SD_COUNTY_OFFICES[0], // SD DSS Bennett County
    eligibility: 'Income ≤ 130% FPL · SD resident · Household size verified',
    documents: ['Proof of identity', 'Proof of SD residency', 'Proof of income or zero-income statement', 'Social Security numbers for all household members'],
    onlineUrl: 'dss.sd.gov/snap',
  },
  {
    id: 'prog-tanf',
    name: 'TANF — Temporary Assistance for Needy Families',
    domain: 'Financial',
    fundingSource: 'SD DSS',
    monthlyValue: '$463/mo',
    office: SD_COUNTY_OFFICES[0], // SD DSS Bennett County
    eligibility: 'Income ≤ 185% FPL · Dependent children · SD resident',
    documents: ['Proof of identity', 'Proof of SD residency', 'Birth certificates for all children', 'Proof of income', 'Social Security cards'],
    onlineUrl: 'dss.sd.gov/tanf',
  },
  {
    id: 'prog-liheap',
    name: 'LIHEAP — Low Income Home Energy Assistance',
    domain: 'Utilities',
    fundingSource: 'Federal LIHEAP',
    monthlyValue: '$180/season',
    office: SD_COUNTY_OFFICES[2], // Community Action Partnership
    eligibility: 'Income ≤ 150% FPL · SD resident · Primary heating source',
    documents: ['Proof of identity', 'Proof of residency', 'Most recent utility bill', 'Proof of income'],
    onlineUrl: 'capbh.org/liheap',
  },
  {
    id: 'prog-sdhda',
    name: 'SD Housing Development Authority — Rental Assistance',
    domain: 'Housing',
    fundingSource: 'SDHDA',
    monthlyValue: 'Est. $850/mo',
    office: SD_COUNTY_OFFICES[3], // SDHDA Pierre
    eligibility: 'Income ≤ 50% AMI · SD resident · Waitlist position',
    documents: ['Proof of identity', 'Proof of SD residency', 'Proof of income', 'Rental history'],
    onlineUrl: 'sdhda.org',
  },
  {
    id: 'prog-nemt',
    name: 'Medicaid Non-Emergency Transportation',
    domain: 'Transportation',
    fundingSource: 'SD Medicaid',
    monthlyValue: 'Covered',
    office: SD_COUNTY_OFFICES[0], // SD DSS Bennett County
    eligibility: 'Active SD Medicaid enrollment · Medical appointment required',
    documents: ['Medicaid ID card', 'Appointment confirmation'],
    onlineUrl: 'dss.sd.gov/medicaid/transport',
  },
];

// ─── SD Crisis Resources ──────────────────────────────────────────────────────
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

export const SD_CRISIS_RESOURCES: SDCrisisResource[] = [
  {
    id: 'cr-001',
    name: '988 Suicide & Crisis Lifeline — SD',
    type: '988',
    phone: '988',
    description: 'Call or text 988 — 24/7 mental health crisis support. SD-specific counselors available.',
    available: true,
    responseTime: 'Immediate',
  },
  {
    id: 'cr-002',
    name: 'Monument Health Crisis Stabilization Unit',
    type: 'CSU',
    phone: '(605) 755-1000',
    description: 'Walk-in crisis stabilization — 23-hour observation, no ED required. Rapid City.',
    available: true,
    responseTime: '< 30 min',
    address: '677 Cathedral Dr',
    city: 'Rapid City',
    zip: '57701',
  },
  {
    id: 'cr-003',
    name: 'Avera Behavioral Health Mobile Crisis',
    type: 'Mobile',
    phone: '(605) 322-4065',
    description: 'Mobile crisis team dispatch — community-based de-escalation across western SD',
    available: true,
    responseTime: '30–60 min',
    address: '3900 S Kiwanis Ave',
    city: 'Sioux Falls',
    zip: '57105',
  },
  {
    id: 'cr-004',
    name: 'Avera Sacred Heart Hospital ED',
    type: 'ED',
    phone: '(605) 842-7100',
    description: 'Emergency Department — psychiatric evaluation and stabilization. Winner, SD.',
    available: true,
    responseTime: 'Varies',
    address: '501 Summit St',
    city: 'Winner',
    zip: '57580',
  },
];

// ─── SD Providers ─────────────────────────────────────────────────────────────
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

export const SD_PROVIDERS: SDProvider[] = [
  {
    id: 'prov-001',
    name: 'Dr. Carlos Mendez-Ruiz',
    specialty: 'Family Medicine',
    facility: 'Bennett County Health Services',
    address: '102 N Van Buren St',
    city: 'Martin',
    zip: '57551',
    county: 'Bennett',
    phone: '(605) 685-6622',
    tier: 'Preferred',
    acceptingNew: true,
    distanceFromMartin: '0 miles',
    lat: 43.18,
    lng: -101.73,
  },
  {
    id: 'prov-002',
    name: 'Dr. Sofia Reinholt',
    specialty: 'Endocrinology',
    facility: 'Avera Endocrinology — Winner',
    address: '501 Summit St',
    city: 'Winner',
    zip: '57580',
    county: 'Tripp',
    phone: '(605) 842-7100',
    tier: 'Preferred',
    acceptingNew: true,
    distanceFromMartin: '47 miles',
    lat: 43.37,
    lng: -99.86,
  },
  {
    id: 'prov-003',
    name: 'Dr. Sarah Nakamura',
    specialty: 'Behavioral Health',
    facility: 'Avera Behavioral Health — Winner',
    address: '501 Summit St',
    city: 'Winner',
    zip: '57580',
    county: 'Tripp',
    phone: '(605) 842-7100',
    tier: 'Preferred',
    acceptingNew: true,
    distanceFromMartin: '47 miles',
    lat: 43.37,
    lng: -99.86,
  },
  {
    id: 'prov-004',
    name: 'Dr. Priya Venkataraman',
    specialty: 'Nephrology',
    facility: 'Avera Sacred Heart — Nephrology',
    address: '501 Summit St',
    city: 'Winner',
    zip: '57580',
    county: 'Tripp',
    phone: '(605) 842-7100',
    tier: 'Preferred',
    acceptingNew: true,
    distanceFromMartin: '47 miles',
    lat: 43.37,
    lng: -99.86,
  },
  {
    id: 'prov-005',
    name: 'Dr. Jerome Blackwood',
    specialty: 'Orthopedics',
    facility: 'Fall River Health Services',
    address: '1201 Highway 71',
    city: 'Hot Springs',
    zip: '57747',
    county: 'Fall River',
    phone: '(605) 745-3159',
    tier: 'In-Network',
    acceptingNew: true,
    distanceFromMartin: '112 miles',
    lat: 43.43,
    lng: -103.47,
  },
  {
    id: 'prov-006',
    name: 'Dr. Amara Osei',
    specialty: 'Cardiology',
    facility: 'Monument Health Cardiology',
    address: '677 Cathedral Dr',
    city: 'Rapid City',
    zip: '57701',
    county: 'Pennington',
    phone: '(605) 755-1000',
    tier: 'Preferred',
    acceptingNew: true,
    distanceFromMartin: '147 miles',
    lat: 44.08,
    lng: -103.23,
  },
  {
    id: 'prov-007',
    name: 'Dr. Thomas Kaczmarek',
    specialty: 'Gastroenterology',
    facility: 'Gregory County Medical Associates',
    address: '400 Park St',
    city: 'Burke',
    zip: '57523',
    county: 'Gregory',
    phone: '(605) 835-8394',
    tier: 'In-Network',
    acceptingNew: true,
    distanceFromMartin: '78 miles',
    lat: 43.18,
    lng: -99.29,
  },
  {
    id: 'prov-008',
    name: 'Dr. Nkechi Eze-Williams',
    specialty: 'Family Medicine',
    facility: 'Oglala Lakota PCP — Pine Ridge',
    address: '1 Crazy Horse Dr',
    city: 'Pine Ridge',
    zip: '57770',
    county: 'Oglala Lakota',
    phone: '(605) 867-5131',
    tier: 'Preferred',
    acceptingNew: true,
    distanceFromMartin: '38 miles',
    lat: 43.02,
    lng: -102.55,
  },
];

// ─── SD Transport Resources ───────────────────────────────────────────────────
export const SD_TRANSPORT = {
  NEMT: {
    name: 'SD Medicaid Non-Emergency Medical Transport (NEMT)',
    phone: '(800) 843-8394',
    address: '102 N Van Buren St, Martin, SD 57551',
    description: 'Free medical transport for Medicaid members to covered appointments',
    eligibility: 'Active SD Medicaid enrollment required',
    bookingLead: '3 business days advance notice',
  },
  BENNETT_ACTION: {
    name: 'Bennett County Action CBO — Transport Coordination',
    phone: '(605) 685-6100',
    address: '204 W 3rd St, Martin, SD 57551',
    description: 'Volunteer driver coordination for Bennett County residents',
    eligibility: 'Bennett County residents',
    bookingLead: '48 hours advance notice',
  },
  SD_MEDICAID_TRANSPORT: {
    name: 'SD Medicaid Transport Benefit',
    phone: '(605) 773-3165',
    address: '700 Governors Dr, Pierre, SD 57501',
    description: 'Statewide Medicaid transport coordination',
    eligibility: 'Active SD Medicaid enrollment',
    bookingLead: '5 business days advance notice',
  },
};

// ─── Maria Redhawk Confirmed PRAPARE Domains ──────────────────────────────────
// Pre-populated from confirmed PRAPARE screening results per PDF
// Used by Social Needs Screening and other screens when Maria is active patient

export const MARIA_CONFIRMED_PRAPARE = {
  patientId: 'MARIA_SD_001',
  screeningDate: '2026-04-15',
  screener: 'Sarah Johnson (Care Manager)',
  instrument: 'PRAPARE / findhelp 13-Domain',

  // Confirmed HIGH risk domains
  transportation: {
    status: 'HIGH' as const,
    confirmed: true,
    detail: '47 miles to nearest specialist, no vehicle — BLOCKER for HbA1c, Well-Child, Edinburgh',
    questionResponses: { t1: 2 }, // Yes, most of the time
    recommendedCBO: 'Medicaid NEMT — Bennett County',
    cboPhone: '(800) 843-8394',
    uniteUsTask: true,
  },
  childcare: {
    status: 'HIGH' as const,
    confirmed: true,
    detail: 'No childcare coverage — blocks all daytime appointments. Sophia (24mo) has no provider.',
    questionResponses: { su1: 2 },
    recommendedCBO: 'SD DSS Bennett County Office (CCAP)',
    cboPhone: '(605) 685-6622',
    monthlyValue: '$487/mo',
    uniteUsTask: true,
  },
  food: {
    status: 'MODERATE' as const,
    confirmed: true,
    detail: 'SNAP active (current), WIC lapsed — household food security at risk',
    questionResponses: { f1: 2, f2: 2 }, // Often true
    recommendedCBO: 'Bennett County WIC Office',
    cboPhone: '(605) 685-6622',
    uniteUsTask: true,
  },
  financial: {
    status: 'HIGH' as const,
    confirmed: true,
    detail: 'Very hard to pay for basics — single parent, early shift employment',
    questionResponses: { fi1: 3, fi2: 1 }, // Very hard
    recommendedCBO: 'Bennett County Action CBO',
    cboPhone: '(605) 685-6100',
    uniteUsTask: true,
  },
  housing: {
    status: 'MODERATE' as const,
    confirmed: true,
    detail: 'Worried about losing housing — rental assistance waitlist #47, est. 18 months',
    questionResponses: { h1: 2, h2: 0 }, // Worried about losing housing
    recommendedCBO: 'SD Housing Development Authority',
    cboPhone: '(605) 773-3181',
    uniteUsTask: false,
  },
  utilities: {
    status: 'MODERATE' as const,
    confirmed: true,
    detail: 'LIHEAP eligible but not yet applied — West Central Electric Cooperative service area',
    questionResponses: { u1: 1 }, // Yes, some of the time
    recommendedCBO: 'Community Action Partnership of the Black Hills',
    cboPhone: '(605) 348-0820',
    uniteUsTask: false,
  },
  mentalHealth: {
    status: 'MODERATE' as const,
    confirmed: true,
    detail: 'Edinburgh PND 11 — Moderate risk. BH referral open, not yet accepted. Postpartum unmanaged.',
    questionResponses: { mh1: 2, mh2: 2, mh3: 3 }, // More than half the days / fairly often
    recommendedCBO: 'Bennett County Health Services — Postpartum Support Group',
    cboPhone: '(605) 685-6622',
    bhGated: true, // Requires BH consent
    uniteUsTask: true,
  },
  employment: {
    status: 'STABLE' as const,
    confirmed: true,
    detail: 'Part-time employment — Bennett County School District, early shift',
    questionResponses: { e1: 1 }, // Part-time
    recommendedCBO: null,
    uniteUsTask: false,
  },

  // Unconfirmed domains (need current screening)
  unconfirmedDomains: ['physical_activity', 'substance_use', 'education', 'safety', 'disabilities'],

  // Summary
  totalConfirmedUnmet: 5,
  totalConfirmedModerate: 3,
  totalConfirmedHigh: 3,
  primaryBlocker: 'Transportation — 47 miles, no vehicle. Blocks HbA1c, Well-Child, Edinburgh screening.',
  secondaryBlocker: 'Childcare — no coverage. Blocks all daytime appointments.',
  aiCopilotNote: 'Transport barrier is the primary blocker — affects HbA1c, Well-Child, and Edinburgh. Childcare subsidy ($487/mo) resolves appointment barrier. Bundle Sophia\'s well-child + Maria\'s HbA1c — one trip to Winner. Edinburgh 427 days — BH referral sent, not yet accepted. SMS 3pm–7pm only.',
};

// ─── SD Recommendations by Domain ────────────────────────────────────────────
// Used by Social Needs Screening recommendations panel
export const SD_RECOMMENDATIONS: Record<string, { name: string; org: string; phone: string; address: string; city: string; connected: boolean }[]> = {
  housing: [
    { name: 'Rental Assistance Waitlist', org: 'SD Housing Development Authority', phone: '(605) 773-3181', address: '3060 E Elizabeth St', city: 'Pierre, SD 57501', connected: true },
    { name: 'Emergency Housing', org: 'Bennett County Action CBO', phone: '(605) 685-6100', address: '204 W 3rd St', city: 'Martin, SD 57551', connected: true },
    { name: 'Section 8 Voucher Program', org: 'SD Housing Development Authority', phone: '(605) 773-3181', address: '3060 E Elizabeth St', city: 'Pierre, SD 57501', connected: false },
    { name: 'Transitional Housing', org: 'Oglala Sioux Tribe Community Services', phone: '(605) 867-5821', address: '1 Crazy Horse Dr', city: 'Pine Ridge, SD 57770', connected: false },
    { name: 'Rapid Rehousing', org: 'SD Community Action Partnership', phone: '(605) 348-0820', address: '601 E St Joseph St', city: 'Rapid City, SD 57701', connected: true },
  ],
  food: [
    { name: 'Food Pantry & SNAP Assistance', org: 'Oglala Sioux Tribe Community Services', phone: '(605) 867-5821', address: '1 Crazy Horse Dr', city: 'Pine Ridge, SD 57770', connected: true },
    { name: 'WIC — Women, Infants & Children', org: 'Bennett County WIC Office', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: true },
    { name: 'SNAP Enrollment', org: 'SD DSS Bennett County Office', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: true },
    { name: 'SD Food Bank', org: 'South Dakota Food Bank', phone: '(605) 335-0364', address: '4701 N Westport Ave', city: 'Sioux Falls, SD 57107', connected: false },
    { name: 'Meals on Wheels', org: 'SD Area Agency on Aging', phone: '(605) 773-3656', address: '700 Governors Dr', city: 'Pierre, SD 57501', connected: true },
  ],
  transportation: [
    { name: 'Medical Transportation (NEMT)', org: 'Medicaid NEMT — Bennett County', phone: '(800) 843-8394', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: true },
    { name: 'Volunteer Driver Program', org: 'Bennett County Action CBO', phone: '(605) 685-6100', address: '204 W 3rd St', city: 'Martin, SD 57551', connected: true },
    { name: 'SD Medicaid Transport Benefit', org: 'SD Medicaid', phone: '(605) 773-3165', address: '700 Governors Dr', city: 'Pierre, SD 57501', connected: true },
    { name: 'Senior Ride Program', org: 'SD Area Agency on Aging', phone: '(605) 773-3656', address: '700 Governors Dr', city: 'Pierre, SD 57501', connected: false },
  ],
  utility: [
    { name: 'LIHEAP Energy Assistance', org: 'Community Action Partnership of the Black Hills', phone: '(605) 348-0820', address: '601 E St Joseph St', city: 'Rapid City, SD 57701', connected: true },
    { name: 'Utility Assistance', org: 'Bennett County Action CBO', phone: '(605) 685-6100', address: '204 W 3rd St', city: 'Martin, SD 57551', connected: true },
    { name: 'West Central Electric Cooperative', org: 'West Central Electric Cooperative', phone: '(605) 685-6581', address: 'PO Box 37', city: 'Murdo, SD 57559', connected: false },
  ],
  safety: [
    { name: 'Crisis & Safety Services', org: 'Monument Health Crisis Line', phone: '(605) 755-1000', address: '677 Cathedral Dr', city: 'Rapid City, SD 57701', connected: true },
    { name: 'Domestic Violence Services', org: 'Sacred Heart Center — DV', phone: '(605) 842-1234', address: '501 Summit St', city: 'Winner, SD 57580', connected: true },
    { name: 'SD DV Hotline', org: 'SD Coalition Against Domestic Violence', phone: '(800) 430-7233', address: 'Statewide', city: 'South Dakota', connected: false },
  ],
  financial: [
    { name: 'Benefit Enrollment Assistance', org: 'Bennett County Action CBO', phone: '(605) 685-6100', address: '204 W 3rd St', city: 'Martin, SD 57551', connected: true },
    { name: 'TANF — Cash Assistance', org: 'SD DSS Bennett County Office', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: true },
    { name: 'Financial Counseling', org: 'SD Consumer Credit Counseling', phone: '(605) 334-6004', address: '4901 E 26th St', city: 'Sioux Falls, SD 57110', connected: false },
  ],
  employment: [
    { name: 'Employment & Job Training', org: 'SD Department of Labor — Bennett County', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: false },
    { name: 'WIOA Job Services', org: 'SD Workforce Development', phone: '(605) 773-5017', address: '700 Governors Dr', city: 'Pierre, SD 57501', connected: true },
    { name: 'Tribal Employment Rights', org: 'Oglala Sioux Tribe Employment', phone: '(605) 867-5821', address: '1 Crazy Horse Dr', city: 'Pine Ridge, SD 57770', connected: false },
  ],
  support: [
    { name: 'Postpartum Support Group', org: 'Bennett County Health Services', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: true },
    { name: 'Caregiver Support', org: 'SD Area Agency on Aging', phone: '(605) 773-3656', address: '700 Governors Dr', city: 'Pierre, SD 57501', connected: false },
    { name: 'Adult Day Services', org: 'Avera Sacred Heart CAH', phone: '(605) 842-7100', address: '501 Summit St', city: 'Winner, SD 57580', connected: false },
  ],
  education: [
    { name: 'Education & Literacy', org: 'SD Literacy Council', phone: '(605) 224-9738', address: '104 N Euclid Ave', city: 'Pierre, SD 57501', connected: false },
    { name: 'GED Programs', org: 'Bennett County School District', phone: '(605) 685-6996', address: '101 W 1st St', city: 'Martin, SD 57551', connected: false },
    { name: 'Adult Education', org: 'SD Board of Regents', phone: '(605) 773-3455', address: '306 E Capitol Ave', city: 'Pierre, SD 57501', connected: true },
  ],
  physical_activity: [
    { name: 'Physical Activity & Wellness', org: 'Gregory County Medical Associates', phone: '(605) 835-8394', address: '400 Park St', city: 'Burke, SD 57523', connected: false },
    { name: 'Tribal Wellness Programs', org: 'Oglala Sioux Tribe Health Administration', phone: '(605) 867-5131', address: '1 Crazy Horse Dr', city: 'Pine Ridge, SD 57770', connected: false },
  ],
  substance_use: [
    { name: 'Substance Use Treatment', org: 'Fall River Health Services', phone: '(605) 745-3159', address: '1201 Highway 71', city: 'Hot Springs, SD 57747', connected: true },
    { name: 'SD Substance Use Counseling', org: 'Avera Behavioral Health', phone: '(605) 322-4065', address: '3900 S Kiwanis Ave', city: 'Sioux Falls, SD 57105', connected: false },
    { name: 'AA / NA Meetings', org: 'SD AA Intergroup', phone: '(605) 336-0624', address: 'Multiple Locations', city: 'South Dakota', connected: false },
  ],
  mental_health: [
    { name: 'Postpartum Support Group', org: 'Bennett County Health Services', phone: '(605) 685-6622', address: '102 N Van Buren St', city: 'Martin, SD 57551', connected: true },
    { name: 'Behavioral Health Services', org: 'Avera Sacred Heart CAH — BH', phone: '(605) 842-7100', address: '501 Summit St', city: 'Winner, SD 57580', connected: false },
    { name: 'SD 988 Crisis Line', org: 'SD 988 Network', phone: '988', address: 'Statewide', city: 'South Dakota', connected: false },
  ],
  disabilities: [
    { name: 'Disability & Independent Living', org: 'SD Advocacy Services', phone: '(605) 224-8294', address: '221 S Central Ave', city: 'Pierre, SD 57501', connected: true },
    { name: 'Disability Benefits', org: 'SSA — SD Field Office', phone: '(800) 772-1213', address: '2525 W Main St', city: 'Rapid City, SD 57702', connected: false },
    { name: 'ADA Services', org: 'SD Disability Rights', phone: '(605) 224-8294', address: '221 S Central Ave', city: 'Pierre, SD 57501', connected: true },
  ],
};

// ─── SD Care Team Contacts ────────────────────────────────────────────────────
export const SD_CARE_TEAM = {
  SARAH_JOHNSON: {
    name: 'Sarah Johnson',
    role: 'Care Manager',
    org: 'Bennett County Health RHTP',
    phone: '(605) 685-6622',
    email: 'sjohnson@bennettcountyhealth.org',
  },
  ANGELA_TORRES: {
    name: 'Angela Torres',
    role: 'CHW Supervisor',
    org: 'Bennett County Action CBO',
    phone: '(605) 685-6100',
    email: 'atorres@bennettcountyaction.org',
  },
  DR_MENDEZ: {
    name: 'Dr. Carlos Mendez-Ruiz',
    role: 'PCP',
    org: 'Bennett County Health Services',
    phone: '(605) 685-6622',
    email: 'cmendez@bennettcountyhealth.org',
  },
  DR_NAKAMURA: {
    name: 'Dr. Sarah Nakamura',
    role: 'Behavioral Health',
    org: 'Avera Behavioral Health — Winner',
    phone: '(605) 842-7100',
    email: 'snakamura@avera.org',
  },
};
