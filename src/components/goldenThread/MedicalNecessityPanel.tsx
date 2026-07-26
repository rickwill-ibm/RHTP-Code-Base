/**
 * Medical Necessity panel (increment GT-3). Presentational; renders the stage
 * view model — net outcome, gold-card status, propensity (with attributable
 * factors), indications, deficiencies, and the remediation loop.
 */
import type { MedicalNecessityVM } from '@/lib/goldenThread';

function bandColor(band: string): string {
  return band === 'high'
    ? 'bg-red-50 text-red-800 border-red-200'
    : band === 'medium'
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : 'bg-green-50 text-green-800 border-green-200';
}

export function MedicalNecessityPanel({ vm }: { vm: MedicalNecessityVM }): React.ReactElement {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Medical Necessity</h3>
          <p className="text-sm text-slate-600">
            {vm.order.display ?? vm.order.code} · {vm.order.code} · member {vm.memberId}
          </p>
        </div>
        <span
          className={`rounded border px-2 py-1 text-xs font-medium ${
            vm.netRequiresPA
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {vm.netRequiresPA ? 'PA required' : 'No PA required'} · {vm.netOutcome}
        </span>
      </header>

      {/* gold card */}
      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <span className="font-medium">Gold card: </span>
        {vm.goldCard.applied ? (
          <span className="text-green-700">
            Applied — PA waived ({vm.goldCard.program}
            {typeof vm.goldCard.approvalRate === 'number'
              ? `, ${Math.round(vm.goldCard.approvalRate * 100)}% approval`
              : ''}
            ). {vm.goldCard.reason}
          </span>
        ) : (
          <span className="text-slate-600">Not applied — {vm.goldCard.reason}</span>
        )}
      </div>

      {/* propensity */}
      <div className={`rounded border p-3 text-sm ${bandColor(vm.propensity.band)}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Propensity-to-deny: {vm.propensity.score}/100 ({vm.propensity.band})
          </span>
        </div>
        <ul className="mt-1 list-inside list-disc text-xs">
          {vm.propensity.factors.map((f, i) => (
            <li key={i}>
              {f.label}: {f.points >= 0 ? '+' : ''}
              {f.points}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs italic opacity-80">
          Decision-support only — not a determination.
        </p>
      </div>

      {/* indications + deficiencies */}
      {vm.indications.length > 0 ? (
        <div className="text-sm">
          <p className="font-medium">Indications considered ({vm.indications.length})</p>
          <ul className="mt-1 list-inside list-disc text-slate-700">
            {vm.indications.slice(0, 6).map((i) => (
              <li key={i.label}>
                {i.label}. {i.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {vm.deficiencies.length > 0 ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm">
          <p className="font-medium text-red-800">Deficiencies</p>
          <ul className="mt-1 list-inside list-disc text-red-800">
            {vm.deficiencies.map((d, i) => (
              <li key={i}>
                <span className="font-medium">{d.kind}:</span> {d.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* remediation loop */}
      <div className="text-sm">
        <p className="font-medium">Next steps</p>
        <ul className="mt-1 space-y-1">
          {vm.remediation.map((r, i) => (
            <li key={i} className="rounded border border-slate-200 p-2">
              <span className="font-medium">{r.label}</span> — {r.detail}
              {r.examples && r.examples.length > 0 ? (
                <span className="block text-xs text-slate-500">e.g. {r.examples.join('; ')}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
