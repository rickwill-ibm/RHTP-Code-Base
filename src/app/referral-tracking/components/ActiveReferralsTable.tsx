'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReferralFilters, ReferralRecord, ReferralStatus, ReferralUrgency } from '../page';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';

// ─── Mock referral data ───────────────────────────────────────────────────────
export const mockReferrals: ReferralRecord[] = [
  { id: 'ref-001', patientName: 'Maria Redhawk', patientId: 'patient-maria', referralDate: '2026-05-10', specialty: 'Endocrinology', urgency: 'Urgent', status: 'In Progress', assignedProvider: 'Dr. Sofia Reinholt — Avera Endocrinology', providerId: 'prov-002', providerTier: 'Preferred', icdCode: 'R73.09', icdDescription: 'Pre-diabetes (A1C 6.2%)', submissionChannel: 'Epic Direct', submittedDate: '2026-05-11', appointmentDate: '2026-05-28', closedDate: null, outcome: 'Pending', coordinatorName: 'Sarah Johnson', notes: 'A1C 6.2% — pre-diabetic. Postpartum context. 47 miles to Bennett County Health.', daysOpen: 5 },
  { id: 'ref-002', patientName: 'Maria Redhawk', patientId: 'patient-maria', referralDate: '2026-04-18', specialty: 'Behavioral Health', urgency: 'Routine', status: 'Assigned', assignedProvider: 'Dr. Sarah Nakamura — Avera Behavioral Health', providerId: 'prov-012', providerTier: 'Preferred', icdCode: 'F53.0', icdDescription: 'Postpartum depression (Edinburgh PND 427d)', submissionChannel: 'Direct Message', submittedDate: '2026-04-19', appointmentDate: '2026-05-05', closedDate: null, outcome: 'Pending', coordinatorName: 'Sarah Johnson', notes: 'Edinburgh PND screening overdue 427 days. Postpartum support group referral.', daysOpen: 7 },
  { id: 'ref-003', patientName: 'Margaret Okonkwo', patientId: 'patient-001', referralDate: '2026-04-12', specialty: 'Nephrology', urgency: 'STAT', status: 'Awaiting EMR', assignedProvider: 'Dr. Priya Venkataraman — Avera Nephrology', providerId: 'prov-004', providerTier: 'Preferred', icdCode: 'N18.4', icdDescription: 'Chronic kidney disease, stage 4', submissionChannel: null, submittedDate: null, appointmentDate: null, closedDate: null, outcome: 'Pending', coordinatorName: 'Sarah Johnson', notes: 'Urgent — GFR declining rapidly. 89 miles to Avera Sacred Heart.', daysOpen: 3 },
  { id: 'ref-004', patientName: 'Bernard Thibodeau', patientId: 'patient-004', referralDate: '2026-04-05', specialty: 'Cardiology', urgency: 'Routine', status: 'Completed', assignedProvider: 'Dr. Amara Osei — Monument Health Cardiology', providerId: 'prov-001', providerTier: 'Preferred', icdCode: 'I10', icdDescription: 'Essential hypertension', submissionChannel: 'Epic Direct', submittedDate: '2026-04-06', appointmentDate: '2026-04-13', closedDate: '2026-04-13', outcome: 'Seen', coordinatorName: 'Sarah Johnson', notes: 'Follow-up in 3 months. 112 miles to Monument Health Rapid City.', daysOpen: 8 },
  { id: 'ref-005', patientName: 'Constance Abara', patientId: 'patient-005', referralDate: '2026-04-11', specialty: 'Endocrinology', urgency: 'Routine', status: 'Pending', assignedProvider: null, providerId: null, providerTier: null, icdCode: 'E11.9', icdDescription: 'Type 2 diabetes mellitus', submissionChannel: null, submittedDate: null, appointmentDate: null, closedDate: null, outcome: null, coordinatorName: 'Sarah Johnson', notes: 'A1c > 10, needs specialist review. 78 miles to Gregory County.', daysOpen: 4 },
  { id: 'ref-006', patientName: 'Walter Przybylski', patientId: 'patient-006', referralDate: '2026-04-09', specialty: 'Gastroenterology', urgency: 'Routine', status: 'Assigned', assignedProvider: 'Dr. Thomas Kaczmarek — Gregory County Medical Associates', providerId: 'prov-007', providerTier: 'In-Network', icdCode: 'K57.30', icdDescription: 'Diverticulosis of large intestine', submissionChannel: 'Phone', submittedDate: '2026-04-10', appointmentDate: '2026-04-25', closedDate: null, outcome: 'Pending', coordinatorName: 'Sarah Johnson', notes: 'Colonoscopy prep instructions sent.', daysOpen: 6 },
  { id: 'ref-007', patientName: 'Maria Redhawk', patientId: 'patient-maria', referralDate: '2026-04-01', specialty: 'Family Medicine', urgency: 'Routine', status: 'Completed', assignedProvider: 'Dr. Carlos Mendez-Ruiz — Bennett County Health Services', providerId: 'prov-009', providerTier: 'Preferred', icdCode: 'Z39.1', icdDescription: 'Care for lactating mother', submissionChannel: 'Epic Direct', submittedDate: '2026-04-02', appointmentDate: '2026-04-08', closedDate: '2026-04-08', outcome: 'Seen', coordinatorName: 'Sarah Johnson', notes: 'Postpartum follow-up. 12 miles from Martin SD.', daysOpen: 7 },
  { id: 'ref-008', patientName: 'Sylvia Montecinos', patientId: 'patient-011', referralDate: '2026-04-13', specialty: 'Cardiology', urgency: 'STAT', status: 'In Progress', assignedProvider: 'Dr. Amara Osei — Monument Health Cardiology', providerId: 'prov-001', providerTier: 'Preferred', icdCode: 'I48.0', icdDescription: 'Paroxysmal atrial fibrillation', submissionChannel: 'Epic Direct', submittedDate: '2026-04-13', appointmentDate: '2026-04-15', closedDate: null, outcome: 'Pending', coordinatorName: 'Sarah Johnson', notes: 'Holter monitor ordered. 147 miles to Monument Health Rapid City.', daysOpen: 2 },
  { id: 'ref-009', patientName: 'Kwame Asantewaa', patientId: 'patient-012', referralDate: '2026-04-07', specialty: 'Orthopedics', urgency: 'Routine', status: 'Completed', assignedProvider: 'Dr. Jerome Blackwood — Fall River Specialist Network', providerId: 'prov-005', providerTier: 'In-Network', icdCode: 'M17.11', icdDescription: 'Primary osteoarthritis, right knee', submissionChannel: 'Fax', submittedDate: '2026-04-08', appointmentDate: '2026-04-14', closedDate: '2026-04-14', outcome: 'Seen', coordinatorName: 'Sarah Johnson', notes: 'X-ray reviewed, PT referral added. 112 miles to Hot Springs SD.', daysOpen: 7 },
  { id: 'ref-010', patientName: 'Rosa Evangelista', patientId: 'patient-003', referralDate: '2026-04-03', specialty: 'Endocrinology', urgency: 'Urgent', status: 'Completed', assignedProvider: 'Dr. Nkechi Eze-Williams — Oglala Lakota PCP', providerId: 'prov-008', providerTier: 'Preferred', icdCode: 'E10.65', icdDescription: 'Type 1 diabetes with hyperglycemia', submissionChannel: 'Phone', submittedDate: '2026-04-04', appointmentDate: '2026-04-10', closedDate: '2026-04-10', outcome: 'Seen', coordinatorName: 'Sarah Johnson', notes: 'Oglala Sioux Tribe Health Administration. 38 miles from Pine Ridge.', daysOpen: 7 },
  { id: 'ref-011', patientName: 'Bernard Thibodeau', patientId: 'patient-004', referralDate: '2026-04-14', specialty: 'Geriatrics', urgency: 'Routine', status: 'Pending', assignedProvider: null, providerId: null, providerTier: null, icdCode: 'Z87.39', icdDescription: 'Personal history of other musculoskeletal disorders', submissionChannel: null, submittedDate: null, appointmentDate: null, closedDate: null, outcome: null, coordinatorName: 'Sarah Johnson', notes: 'Comprehensive geriatric assessment needed.', daysOpen: 1 },
  { id: 'ref-012', patientName: 'Delroy Hutchinson', patientId: 'patient-002', referralDate: '2026-03-28', specialty: 'Cardiology', urgency: 'Urgent', status: 'Completed', assignedProvider: 'Dr. Amara Osei — Monument Health Cardiology', providerId: 'prov-001', providerTier: 'Preferred', icdCode: 'I25.10', icdDescription: 'Atherosclerotic heart disease', submissionChannel: 'Epic Direct', submittedDate: '2026-03-29', appointmentDate: '2026-04-04', closedDate: '2026-04-04', outcome: 'Seen', coordinatorName: 'Sarah Johnson', notes: 'Stress test ordered. 147 miles to Monument Health Rapid City.', daysOpen: 7 },
];

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReferralStatus }) {
  const map: Record<ReferralStatus, string> = {
    Pending: 'bg-carbon-gray-10 text-carbon-gray-70 border border-carbon-gray-30',
    Assigned: 'bg-[#d0e2ff] text-[#0043ce] border border-[#97c1ff]',
    'In Progress': 'bg-[#fdf6dd] text-[#b45309] border border-[#f1c21b]',
    'Awaiting EMR': 'bg-[#f6f2ff] text-[#6929c4] border border-[#d4bbff]',
    Completed: 'bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]',
    Cancelled: 'bg-[#fff1f1] text-[#da1e28] border border-[#ffb3b8]',
  };
  return <span className={`inline-flex items-center text-2xs font-semibold px-2 py-0.5 ${map[status]}`}>{status}</span>;
}

function UrgencyBadge({ urgency }: { urgency: ReferralUrgency }) {
  const map: Record<ReferralUrgency, string> = {
    Routine: 'text-carbon-gray-50',
    Urgent: 'text-[#b45309] font-semibold',
    STAT: 'text-[#da1e28] font-bold',
  };
  return <span className={`text-xs ${map[urgency]}`}>{urgency}</span>;
}

function TierBadge({ tier }: { tier: ReferralRecord['providerTier'] }) {
  if (!tier) return <span className="text-xs text-carbon-gray-40">—</span>;
  const map = { Preferred: 'text-[#0e6027]', 'In-Network': 'text-[#0043ce]', 'Out-of-Network': 'text-[#da1e28]' };
  return <span className={`text-xs font-medium ${map[tier]}`}>{tier}</span>;
}

// ─── Sort types ───────────────────────────────────────────────────────────────

type SortKey = 'patientName' | 'referralDate' | 'specialty' | 'urgency' | 'status' | 'daysOpen' | 'assignedProvider';

const URGENCY_ORDER: Record<ReferralUrgency, number> = { STAT: 0, Urgent: 1, Routine: 2 };
const STATUS_ORDER: Record<ReferralStatus, number> = { 'Awaiting EMR': 0, 'In Progress': 1, Assigned: 2, Pending: 3, Completed: 4, Cancelled: 5 };

interface ColDef {
  key: string;
  label: string;
  sortable?: boolean;
  sortKey?: SortKey;
}

const COLS: ColDef[] = [
  { key: 'patientName', label: 'Patient', sortable: true, sortKey: 'patientName' },
  { key: 'referralDate', label: 'Date', sortable: true, sortKey: 'referralDate' },
  { key: 'specialty', label: 'Specialty', sortable: true, sortKey: 'specialty' },
  { key: 'urgency', label: 'Urgency', sortable: true, sortKey: 'urgency' },
  { key: 'status', label: 'Status', sortable: true, sortKey: 'status' },
  { key: 'assignedProvider', label: 'Assigned Provider', sortable: true, sortKey: 'assignedProvider' },
  { key: 'providerTier', label: 'Tier' },
  { key: 'icdCode', label: 'ICD' },
  { key: 'submissionChannel', label: 'Channel' },
  { key: 'appointmentDate', label: 'Appt Date' },
  { key: 'daysOpen', label: 'Days Open', sortable: true, sortKey: 'daysOpen' },
  { key: 'coordinatorName', label: 'Coordinator' },
  { key: 'actions', label: '' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  filters: ReferralFilters;
  selectedReferralId: string | null;
  onSelectReferral: (id: string | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActiveReferralsTable({ filters, selectedReferralId, onSelectReferral }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let result = mockReferrals.filter((r) => {
      const q = filters.search.toLowerCase();
      if (q && !r.patientName.toLowerCase().includes(q) && !r.icdCode.toLowerCase().includes(q) && !(r.assignedProvider ?? '').toLowerCase().includes(q)) return false;
      if (filters.status !== 'All' && r.status !== filters.status) return false;
      if (filters.specialty !== 'All' && r.specialty !== filters.specialty) return false;
      if (filters.urgency !== 'All' && r.urgency !== filters.urgency) return false;
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (sortKey) {
        case 'patientName': return dir * a.patientName.localeCompare(b.patientName);
        case 'referralDate': return dir * a.referralDate.localeCompare(b.referralDate);
        case 'specialty': return dir * a.specialty.localeCompare(b.specialty);
        case 'urgency': return dir * (URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
        case 'status': return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
        case 'daysOpen': return dir * (a.daysOpen - b.daysOpen);
        case 'assignedProvider':
          return dir * (a.assignedProvider ?? '').localeCompare(b.assignedProvider ?? '');
        default: return 0;
      }
    });

    return result;
  }, [filters, sortKey, sortDir]);

  const SortIcon = ({ sk }: { sk: SortKey }) => (
    <span className={`ml-1 text-2xs ${sortKey === sk ? 'opacity-100' : 'opacity-30'}`}>
      {sortKey === sk ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="bg-white border border-carbon-gray-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-carbon-gray-20">
        <h2 className="text-sm font-semibold text-carbon-gray-100">Active Referrals</h2>
        <span className="text-xs text-carbon-gray-50">{filtered.length} referral{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-carbon-gray-10 border-b border-carbon-gray-20">
              {COLS.map((col, i) => (
                <th
                  key={`rh-${col.key}-${i}`}
                  className={`px-3 py-2 text-left text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide whitespace-nowrap
                    ${col.sortable ? 'cursor-pointer hover:text-carbon-gray-100 select-none' : ''}
                    ${col.sortKey && sortKey === col.sortKey ? 'text-carbon-blue bg-[#edf5ff]' : ''}`}
                  onClick={() => col.sortable && col.sortKey && handleSort(col.sortKey)}
                >
                  {col.label}
                  {col.sortable && col.sortKey && <SortIcon sk={col.sortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-sm text-carbon-gray-50">No referrals match the current filters.</td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isSelected = selectedReferralId === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectReferral(isSelected ? null : r.id)}
                    className={`group border-b border-carbon-gray-10 cursor-pointer transition-colors ${isSelected ? 'bg-[#edf5ff]' : 'hover:bg-carbon-gray-10'}`}
                  >
                    <td className="px-3 py-2.5 font-medium text-carbon-gray-100 whitespace-nowrap">{r.patientName}</td>
                    <td className="px-3 py-2.5 text-carbon-gray-70 whitespace-nowrap">{r.referralDate}</td>
                    <td className="px-3 py-2.5 text-carbon-gray-70 whitespace-nowrap">{r.specialty}</td>
                    <td className="px-3 py-2.5"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-2.5 text-carbon-gray-70 whitespace-nowrap">
                      {r.assignedProvider ?? <span className="text-carbon-gray-40 italic">Unassigned</span>}
                    </td>
                    <td className="px-3 py-2.5"><TierBadge tier={r.providerTier} /></td>
                    <td className="px-3 py-2.5 font-mono text-xs text-carbon-gray-70 whitespace-nowrap">{r.icdCode}</td>
                    <td className="px-3 py-2.5 text-carbon-gray-70 whitespace-nowrap">{r.submissionChannel ?? <span className="text-carbon-gray-40">—</span>}</td>
                    <td className="px-3 py-2.5 text-carbon-gray-70 whitespace-nowrap">{r.appointmentDate ?? <span className="text-carbon-gray-40">—</span>}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-mono text-xs font-semibold tabular-nums ${r.daysOpen > 14 ? 'text-[#da1e28]' : r.daysOpen > 7 ? 'text-[#b45309]' : 'text-carbon-gray-70'}`}>
                        {r.daysOpen}d
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-carbon-gray-70 whitespace-nowrap">{r.coordinatorName}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Assign task"
                          className="p-1 text-carbon-gray-50 hover:text-carbon-blue hover:bg-[#d0e2ff] transition-colors"
                          onClick={() => toast.success(`Task assigned for ${r.patientName}`)}
                        >
                          <Icon name="ClipboardDocumentListIcon" size={13} />
                        </button>
                        <button
                          title="Flag for outreach"
                          className="p-1 text-carbon-gray-50 hover:text-[#da1e28] hover:bg-[#fff1f1] transition-colors"
                          onClick={() => toast.warning(`${r.patientName} flagged for outreach`)}
                        >
                          <Icon name="FlagIcon" size={13} />
                        </button>
                        {r.status === 'Pending' && (
                          <button
                            title="Assign provider"
                            className="p-1 text-carbon-gray-50 hover:text-[#0e6027] hover:bg-[#defbe6] transition-colors"
                            onClick={() => toast.info(`Opening provider selection for ${r.patientName}`)}
                          >
                            <Icon name="UserPlusIcon" size={13} />
                          </button>
                        )}
                        <button
                          title="View referral journey"
                          className="p-1 text-carbon-gray-50 hover:text-[#6929c4] hover:bg-[#f6f2ff] transition-colors"
                          onClick={() => router.push('/referral-journey-tracker')}
                        >
                          <Icon name="MapIcon" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
