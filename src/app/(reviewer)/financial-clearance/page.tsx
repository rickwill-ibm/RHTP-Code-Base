/**
 * Golden Thread — Financial Clearance (increments GT-3/5/6/7).
 *
 * A server-rendered demonstration that runs the four-stage thread on mock data
 * (real parsed policy library + mock gold-card roster), for two providers of the
 * same lumbar-MRI order: one gold-carded (PA waived) and one not. Shows the
 * stage rail, eligibility, the Medical Necessity panel, patient estimate, and
 * work-queue routing — all from the pure stage services, no backend required.
 */
import { flag } from '@/lib/flags/flags';
import { loadMockLibrary, MOCK_GOLD_CARD_CONTEXT, type MemberContext } from '@/lib/policy';
import {
  runMedicalNecessity,
  runEligibility,
  estimatePatientCost,
  routeToQueue,
  MOCK_ALLOWED_AMOUNTS,
  type StageOrder,
  type FcStage,
} from '@/lib/goldenThread';
import { StageRail } from '@/components/goldenThread/StageRail';
import { MedicalNecessityPanel } from '@/components/goldenThread/MedicalNecessityPanel';

const TS = '2026-07-26T00:00:00.000Z';
const PAYER = 'UnitedHealthcare Community Plan';

interface Scenario {
  heading: string;
  providerNpi: string;
}

const SCENARIOS: Scenario[] = [
  { heading: 'Provider A — gold-carded for this service', providerNpi: '1730154783' },
  { heading: 'Provider B — not gold-carded', providerNpi: '1518998765' },
];

function renderScenario(s: Scenario): React.ReactElement {
  const library = loadMockLibrary();
  const member: MemberContext = { memberId: 'MARIA_SD_001', diagnoses: [] };
  const order: StageOrder = {
    code: '72148',
    codeSystem: 'CPT',
    display: 'MRI lumbar spine w/o contrast',
    providerNpi: s.providerNpi,
    payer: PAYER,
  };

  const mn = runMedicalNecessity(member, order, {
    library,
    goldCard: { ...MOCK_GOLD_CARD_CONTEXT, asOf: TS },
    ids: { determination: 'd', goldCard: 'g', propensity: 'p', evidence: `ev-${s.providerNpi}` },
    ts: TS,
  });

  const eligibility = runEligibility(
    { status: 'active', payer: PAYER, plan: 'Texas STAR', type: 'Medicaid managed care' },
    { requiresPA: mn.determination.requiresPA, goldCardApplied: mn.goldCard.applied }
  );

  const estimate = estimatePatientCost({
    code: order.code,
    display: order.display,
    allowedAmount: MOCK_ALLOWED_AMOUNTS[order.code] ?? 1000,
    benefit: { deductibleRemaining: 300, coinsuranceRate: 0.2, outOfPocketRemaining: 5000 },
  });

  const workItem = routeToQueue({
    netOutcome: mn.netOutcome,
    requiresPA: mn.netRequiresPA,
    propensity: { score: mn.propensity.score, band: mn.propensity.band },
    priority: 'expedited',
    submittedAt: TS,
    evidenceId: mn.evidence.id,
    memberId: member.memberId,
    code: order.code,
  });

  const paSkipped = !mn.netRequiresPA;
  const completed: FcStage[] = ['Eligibility', 'MedicalNecessity'];
  const skipped: FcStage[] = paSkipped ? ['PriorAuth'] : [];
  const current: FcStage = 'PatientEstimation';

  return (
    <section className="space-y-4 rounded-lg border border-slate-300 p-4">
      <h2 className="text-xl font-semibold">{s.heading}</h2>
      <StageRail current={current} completed={completed} skipped={skipped} />

      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <span className="font-medium">Eligibility: </span>
        {eligibility.payer} · {eligibility.plan} — {eligibility.note}
      </div>

      <MedicalNecessityPanel vm={mn.vm} />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-200 p-3 text-sm">
          <p className="font-medium">Patient Estimation (GFE)</p>
          <p className="mt-1">
            Allowed ${estimate.allowedAmount} · member owes{' '}
            <span className="font-semibold">${estimate.memberResponsibility}</span> (deductible $
            {estimate.appliedToDeductible} + coinsurance ${estimate.coinsurance}), plan pays $
            {estimate.planPays}.
          </p>
          <p className="text-xs text-slate-500">
            Propensity-to-pay: {estimate.propensityToPay.band} — {estimate.propensityToPay.note}
          </p>
        </div>
        <div className="rounded border border-slate-200 p-3 text-sm">
          <p className="font-medium">Work queue routing</p>
          <p className="mt-1">
            Queue <span className="font-semibold">{workItem.queue}</span> · {workItem.disposition} ·
            SLA {workItem.slaHours}h (due {workItem.dueBy.slice(0, 10)}).
          </p>
          <p className="text-xs text-slate-500">{workItem.note}</p>
        </div>
      </div>
    </section>
  );
}

export default function FinancialClearancePage(): React.ReactElement {
  if (!flag('goldenThread')) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-slate-600">Financial Clearance is not enabled.</p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Golden Thread — Financial Clearance</h1>
        <p className="mt-1 text-sm text-slate-600">
          SMART-launched: Eligibility → Medical Necessity → Prior Auth → Patient Estimation, unified
          by the Evidence Record. Gold carding, propensity-to-deny, and work-queue routing shown on
          mock data.
        </p>
      </header>
      {SCENARIOS.map((s) => (
        <div key={s.providerNpi}>{renderScenario(s)}</div>
      ))}
      <p className="text-xs italic text-slate-500">
        Demonstration on mock data (real parsed Aetna/UHC policy library + mock gold-card roster).
        Propensity and estimates are decision-support only; the payer ClaimResponse is
        authoritative.
      </p>
    </main>
  );
}
