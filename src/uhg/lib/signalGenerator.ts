export type SignalType =
  | 'AUTH_EXPIRY' |'CARE_GAP' |'AUTH_RENEWAL' |'BEHAVIORAL' |'PROVIDER_CHANGE' |'DISCHARGE' |'CLAIMS_EVENT' |'APPEAL_FILED';

export type SignalComplexity = 'ROUTINE' | 'MEDIUM' | 'HIGH';
export type SignalLayer = 1 | 2 | 3;

export interface Signal {
  id: string;
  type: SignalType;
  complexity: SignalComplexity;
  layer: SignalLayer;
  memberId: string;
  memberName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detail: string;
  timestamp: string;
  isMaria?: boolean;
  autoResolveMs?: number;
  resolved?: boolean;
  highlighted?: boolean;
}

const SIGNAL_TYPE_DISTRIBUTION: { type: SignalType; weight: number }[] = [
  { type: 'AUTH_EXPIRY', weight: 28 },
  { type: 'CARE_GAP', weight: 20 },
  { type: 'AUTH_RENEWAL', weight: 18 },
  { type: 'BEHAVIORAL', weight: 12 },
  { type: 'PROVIDER_CHANGE', weight: 8 },
  { type: 'DISCHARGE', weight: 6 },
  { type: 'CLAIMS_EVENT', weight: 5 },
  { type: 'APPEAL_FILED', weight: 3 },
];

const MEMBER_NAMES = [
  'R. Thompson', 'J. Patel', 'L. Garcia', 'M. Johnson', 'A. Williams',
  'D. Martinez', 'S. Brown', 'K. Davis', 'C. Wilson', 'N. Anderson',
  'T. Taylor', 'B. Thomas', 'H. Jackson', 'F. White', 'G. Harris',
  'P. Martin', 'E. Clark', 'V. Lewis', 'I. Robinson', 'O. Walker',
];

const SIGNAL_DETAILS: Record<SignalType, string[]> = {
  AUTH_EXPIRY: ['Auth expiring T-3', 'Auth expiring T-7', 'Auth expired T+1', 'Auth expiring T-14'],
  CARE_GAP: ['HbA1c gap 30d', 'Annual wellness 60d', 'Mammogram gap 45d', 'Colonoscopy gap 90d'],
  AUTH_RENEWAL: ['Renewal initiated', 'Renewal pending review', 'Renewal approved', 'Renewal docs received'],
  BEHAVIORAL: ['Portal login x3/wk', 'Appointment no-show', 'Medication adherence 78%', 'App engagement high'],
  PROVIDER_CHANGE: ['PCP change request', 'Specialist referral', 'Network change detected', 'Provider term notice'],
  DISCHARGE: ['Hospital discharge today', 'SNF discharge 3d', 'ED discharge x2 30d', 'Discharge summary rcvd'],
  CLAIMS_EVENT: ['Claim submitted $1,240', 'Claim denied appeal', 'Claim adjustment $340', 'Duplicate claim flagged'],
  APPEAL_FILED: ['Appeal filed Day 1', 'Appeal response due 72h', 'Appeal escalated', 'Appeal resolved'],
};

let signalCounter = 1000;

function weightedRandom<T>(items: { type: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.floor(totalWeight * (signalCounter % 100) / 100);
  signalCounter++;
  for (const item of items) {
    rand -= item.weight;
    if (rand < 0) return item.type;
  }
  return items[0].type;
}

function getComplexity(index: number): SignalComplexity {
  const mod = index % 100;
  if (mod < 82) return 'ROUTINE';
  if (mod < 97) return 'MEDIUM';
  return 'HIGH';
}

function getLayer(complexity: SignalComplexity): SignalLayer {
  if (complexity === 'ROUTINE') return 1;
  if (complexity === 'MEDIUM') return 2;
  return 3;
}

function getSeverity(complexity: SignalComplexity, type: SignalType): Signal['severity'] {
  if (complexity === 'HIGH') return 'HIGH';
  if (complexity === 'MEDIUM') return type === 'APPEAL_FILED' ? 'CRITICAL' : 'MEDIUM';
  return 'LOW';
}

function getAutoResolveMs(complexity: SignalComplexity): number | undefined {
  if (complexity === 'ROUTINE') return 800 + (signalCounter % 12) * 100;
  if (complexity === 'MEDIUM') return 5000 + (signalCounter % 10) * 1000;
  return undefined;
}

let _counter = 0;

export function generateSignal(): Signal {
  _counter++;
  const type = weightedRandom(SIGNAL_TYPE_DISTRIBUTION);
  const complexity = getComplexity(_counter);
  const layer = getLayer(complexity);
  const nameIndex = _counter % MEMBER_NAMES.length;
  const detailIndex = _counter % SIGNAL_DETAILS[type].length;
  const memberId = `MBR-${String(10000 + (_counter % 9000)).padStart(5, '0')}`;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String((now.getSeconds() + _counter) % 60).padStart(2, '0');

  return {
    id: `sig-${_counter}`,
    type,
    complexity,
    layer,
    memberId,
    memberName: MEMBER_NAMES[nameIndex],
    severity: getSeverity(complexity, type),
    detail: SIGNAL_DETAILS[type][detailIndex],
    timestamp: `${hours}:${minutes}:${seconds}`,
    autoResolveMs: getAutoResolveMs(complexity),
    resolved: false,
    highlighted: false,
  };
}

export const MARIA_SIGNALS: Signal[] = [
  {
    id: 'maria-sig-001',
    type: 'AUTH_EXPIRY',
    complexity: 'HIGH',
    layer: 3,
    memberId: 'MARIA_SD_001',
    memberName: 'Maria Redhawk',
    severity: 'HIGH',
    detail: 'Auth CAREGAP_HBA1C expiring T-4 — HbA1c lab order contested',
    timestamp: '14:31:18',
    isMaria: true,
    highlighted: true,
  },
  {
    id: 'maria-sig-002',
    type: 'CARE_GAP',
    complexity: 'HIGH',
    layer: 3,
    memberId: 'MARIA_SD_001',
    memberName: 'Maria Redhawk',
    severity: 'HIGH',
    detail: 'HbA1c care gap CAREGAP_001 open 45 days — diabetes episode active',
    timestamp: '14:31:19',
    isMaria: true,
    highlighted: true,
  },
  {
    id: 'maria-sig-003',
    type: 'BEHAVIORAL',
    complexity: 'HIGH',
    layer: 3,
    memberId: 'MARIA_SD_001',
    memberName: 'Maria Redhawk',
    severity: 'MEDIUM',
    detail: 'Portal engagement 2x/week — high receptivity window for outreach',
    timestamp: '14:31:20',
    isMaria: true,
    highlighted: true,
  },
];

export class SignalGeneratorEngine {
  private rate: number;
  private interval: ReturnType<typeof setInterval> | null = null;
  private isPaused = false;
  private onSignal: (signal: Signal) => void;
  private stats = { total: 0, routine: 0, medium: 0, high: 0, mariaInjected: 0 };

  constructor(onSignal: (signal: Signal) => void, rate = 4) {
    this.onSignal = onSignal;
    this.rate = rate;
  }

  start(rate?: number) {
    if (rate) this.rate = rate;
    this.interval = setInterval(() => {
      if (!this.isPaused) {
        const signal = generateSignal();
        this.stats.total++;
        if (signal.complexity === 'ROUTINE') this.stats.routine++;
        else if (signal.complexity === 'MEDIUM') this.stats.medium++;
        else this.stats.high++;
        this.onSignal(signal);
      }
    }, 1000 / this.rate);
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }

  setRate(n: number) {
    this.rate = n;
    if (this.interval) {
      clearInterval(this.interval);
      this.start();
    }
  }

  injectScenario(signals: Signal[]) {
    signals.forEach((s) => this.onSignal(s));
    this.stats.mariaInjected += signals.length;
  }

  injectIntercept() {
    this.onSignal({
      id: 'intercept-001',
      type: 'APPEAL_FILED',
      complexity: 'HIGH',
      layer: 3,
      memberId: 'MARIA_SD_001',
      memberName: 'Maria Redhawk',
      severity: 'CRITICAL',
      detail: 'GOVERNANCE INTERCEPT: SD Medicaid.APPEAL.AUTO.THRESHOLD.001',
      timestamp: '14:31:22',
      isMaria: true,
      highlighted: true,
    });
  }

  reset() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.isPaused = false;
    this.stats = { total: 0, routine: 0, medium: 0, high: 0, mariaInjected: 0 };
    _counter = 0;
  }

  getStats() { return { ...this.stats }; }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}