'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { useAppContext } from '@/lib/appContext';
import { buildCohort, type MeasureDescriptor } from '@/lib/careTeam/cohorts';
import { getMember } from '@/lib/careTeam/members';

const BAR_COLORS = ['#0043ce', '#6929c4', '#198038', '#b45309', '#9f1853', '#007d79'];

export default function CohortAttributionModal({
  measure,
  onClose,
}: {
  measure: MeasureDescriptor;
  onClose: () => void;
}) {
  const router = useRouter();
  const { addCohort } = useAppContext();
  const cohort = useMemo(() => buildCohort(measure), [measure]);

  const distEntries = Object.entries(cohort.distribution).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...distEntries.map(([, n]) => n), 1);
  const confidence = Object.values(cohort.assignments).reduce(
    (acc, a) => { acc[a.confidence]++; return acc; },
    { High: 0, Medium: 0, Low: 0 } as Record<string, number>
  );
  const sampleRationales = Object.values(cohort.assignments).slice(0, 3);
  const isSocial = cohort.program === 'Social';

  const handleConfirm = () => {
    addCohort(cohort);
    toast.success('Cohort created & auto-assigned', {
      description: `${cohort.patientIds.length} patients across ${distEntries.length} case managers`,
    });
    router.push(`/care-manager?tab=dashboard&cohortId=${encodeURIComponent(cohort.id)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-auto border border-carbon-gray-20 shadow-xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-carbon-gray-20 bg-[#edf5ff]">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="SparklesIcon" size={16} className="text-[#0043ce]" />
              <p className="text-sm font-semibold text-[#0043ce]">Auto-Attribution Preview</p>
            </div>
            <p className="text-xs text-carbon-gray-70 mt-1">
              {cohort.measureName} · <span className="font-mono">{cohort.measureKey}</span> · {cohort.contractName}
            </p>
          </div>
          <button onClick={onClose} className="text-carbon-gray-50 hover:text-carbon-gray-100">
            <Icon name="XMarkIcon" size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-carbon-gray-20 p-3">
              <p className="font-mono text-xl font-bold text-carbon-gray-100">{cohort.patientIds.length}</p>
              <p className="text-2xs text-carbon-gray-50">{isSocial ? 'Citizens (capped subset)' : 'Citizens in cohort'}</p>
            </div>
            <div className="border border-carbon-gray-20 p-3">
              <p className="font-mono text-xl font-bold text-carbon-gray-100">{distEntries.length}</p>
              <p className="text-2xs text-carbon-gray-50">Case managers assigned</p>
            </div>
            <div className="border border-carbon-gray-20 p-3">
              <p className="font-mono text-xl font-bold text-carbon-gray-100">{cohort.denominator.toLocaleString()}</p>
              <p className="text-2xs text-carbon-gray-50">Measure open-gap denominator</p>
            </div>
          </div>

          {isSocial && cohort.denominator > cohort.patientIds.length && (
            <p className="text-2xs text-[#b45309] bg-[#fdf6dd] px-3 py-2 border border-[#f1c21b]">
              Population-scale measure — working a prioritized high-risk subset of {cohort.patientIds.length}. Full population of {cohort.denominator.toLocaleString()} is tracked as the denominator.
            </p>
          )}

          <div>
            <p className="text-xs font-semibold text-carbon-gray-70 uppercase tracking-wide mb-2">Caseload distribution</p>
            <div className="space-y-2">
              {distEntries.map(([memberId, count], i) => {
                const m = getMember(memberId);
                return (
                  <div key={memberId} className="flex items-center gap-2">
                    <div className="w-40 flex-shrink-0">
                      <p className="text-xs font-medium text-carbon-gray-100 truncate">{m?.name ?? memberId}</p>
                      <p className="text-2xs text-carbon-gray-50">{m?.credential} · {m?.specialties[0]}</p>
                    </div>
                    <div className="flex-1 h-5 bg-carbon-gray-10">
                      <div className="h-full flex items-center justify-end pr-2" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                        <span className="text-2xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-carbon-gray-70">Confidence:</p>
            <span className="text-2xs font-semibold px-2 py-0.5 bg-[#defbe6] text-[#0e6027]">{confidence.High} High</span>
            <span className="text-2xs font-semibold px-2 py-0.5 bg-[#d0e2ff] text-[#0043ce]">{confidence.Medium} Medium</span>
            <span className="text-2xs font-semibold px-2 py-0.5 bg-carbon-gray-10 text-carbon-gray-70">{confidence.Low} Low</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-carbon-gray-70 uppercase tracking-wide mb-2">Sample rationales</p>
            <div className="space-y-1.5">
              {sampleRationales.map((a) => (
                <div key={a.patientId} className="text-2xs text-carbon-gray-70 border-l-2 border-[#0043ce] pl-2 py-0.5">
                  {a.rationale}
                  {a.overCapacityException && <span className="ml-1 text-[#da1e28] font-semibold">[over-capacity exception]</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-carbon-gray-20 bg-carbon-gray-10">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-carbon-gray-70 border border-carbon-gray-20 bg-white hover:bg-carbon-gray-10">Cancel</button>
          <button onClick={handleConfirm} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0043ce] hover:bg-[#002d9c]">
            <Icon name="CheckIcon" size={12} />
            Confirm & Open Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
