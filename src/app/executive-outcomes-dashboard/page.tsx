'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const POPULATION_METRICS = [
  { label: 'Care Gaps Closed', value: '6,842', sub: 'YTD 2026', color: 'text-[#24a148]', icon: 'CheckCircleIcon', trend: '+1,240 vs Q1', up: true },
  { label: 'Open Care Gaps', value: '8,241', sub: 'Remaining', color: 'text-[#da1e28]', icon: 'ExclamationTriangleIcon', trend: '-612 this quarter', up: false },
  { label: 'Closure Rate', value: '68.4%', sub: 'Target: 75%', color: 'text-[#b45309]', icon: 'ChartBarIcon', trend: '+4.2% vs Q1', up: true },
  { label: 'Quality Score', value: '3.8★', sub: 'STARS Rating', color: 'text-[#f1c21b]', icon: 'StarIcon', trend: '+0.3 vs prior year', up: true },
];

const FINANCIAL_METRICS = [
  { label: 'Gain Share Earned', value: '$1.1M', sub: 'YTD 2026', color: 'text-[#24a148]', icon: 'CurrencyDollarIcon', trend: 'On track for $1.84M', up: true },
  { label: 'Shared Savings', value: '$847K', sub: 'Realized', color: 'text-[#24a148]', icon: 'BanknotesIcon', trend: '+$124K vs Q1', up: true },
  { label: 'Incentive Payments', value: '$253K', sub: 'Quality bonuses', color: 'text-[#0043ce]', icon: 'TrophyIcon', trend: 'Q2 payment pending', up: true },
  { label: 'Avoided Leakage', value: '$412K', sub: 'Out-of-network', color: 'text-[#6929c4]', icon: 'ShieldCheckIcon', trend: '-18% leakage rate', up: false },
];

const OPERATIONAL_METRICS = [
  { label: 'Referral Completion Rate', value: '84%', sub: 'Specialist tasks', color: 'text-[#0043ce]', icon: 'ArrowsRightLeftIcon', trend: '+6% vs Q1', up: true },
  { label: 'Specialist Response Time', value: '3.2d', sub: 'Avg days to accept', color: 'text-[#24a148]', icon: 'ClockIcon', trend: '-0.8d vs Q1', up: false },
  { label: 'Provider Participation', value: '94%', sub: 'Active in network', color: 'text-[#24a148]', icon: 'UserGroupIcon', trend: '+2 orgs joined', up: true },
  { label: 'Patient Engagement', value: '71%', sub: 'Outreach response', color: 'text-[#b45309]', icon: 'PhoneIcon', trend: '+3% vs Q1', up: true },
];

const CLOSURE_TREND = [
  { month: 'Jan', closed: 820, open: 9200, rate: 58 },
  { month: 'Feb', closed: 940, open: 9100, rate: 61 },
  { month: 'Mar', closed: 1100, open: 8900, rate: 63 },
  { month: 'Apr', closed: 1280, open: 8600, rate: 65 },
  { month: 'May', closed: 1420, open: 8241, rate: 68 },
  { month: 'Jun (proj)', closed: 1580, open: 7900, rate: 71 },
];

const GAIN_SHARE_TREND = [
  { month: 'Jan', earned: 180, projected: 200 },
  { month: 'Feb', earned: 210, projected: 230 },
  { month: 'Mar', earned: 240, projected: 260 },
  { month: 'Apr', earned: 230, projected: 280 },
  { month: 'May', earned: 240, projected: 300 },
  { month: 'Jun (proj)', earned: 0, projected: 320 },
];

const MEASURE_PERFORMANCE = [
  { measure: 'CBP-236', name: 'Hypertension', current: 71, target: 72, program: 'HEDIS' },
  { measure: 'CDC-001', name: 'A1C Control', current: 68, target: 75, program: 'HEDIS' },
  { measure: 'COL-113', name: 'Colorectal Screen', current: 58, target: 65, program: 'HEDIS' },
  { measure: 'SPC-438', name: 'Statin Therapy', current: 77, target: 80, program: 'STARS' },
  { measure: 'EED', name: 'Diabetic Eye Exam', current: 54, target: 60, program: 'HEDIS' },
  { measure: 'MIPS-487', name: 'SDoH Screening', current: 62, target: 70, program: 'MIPS' },
];

const NETWORK_PERFORMANCE = [
  { org: 'Oglala Lakota PCP', type: 'PCP', closure: 78, gainShare: 88, patients: 3100 },
  { org: 'Monument Cardio', type: 'Specialist', closure: 82, gainShare: 74, patients: 1820 },
  { org: 'Bennett Co. Health', type: 'FQHC', closure: 71, gainShare: 142, patients: 8420 },
  { org: 'Gregory Co. Medical', type: 'PCP', closure: 73, gainShare: 97, patients: 4200 },
  { org: 'Winner Regional', type: 'Hospital', closure: 64, gainShare: 218, patients: 11200 },
  { org: 'Fall River Specialists', type: 'Specialist', closure: 55, gainShare: 61, patients: 2890 },
];

type DashSection = 'population' | 'financial' | 'operational';

export default function ExecutiveOutcomesDashboardPage() {
  const [activeSection, setActiveSection] = useState<DashSection>('population');

  return (
    <AppLayout
      pageTitle="Executive Rural Health Outcomes Dashboard"
      breadcrumbs={[
        { label: 'RHTP Platform', href: '/contract-program-selection' },
        { label: 'Executive Dashboard' },
      ]}
      contextBanner={
        <div className="bg-[#161616] border-b border-carbon-gray-80 px-6 py-2 flex items-center gap-6 flex-wrap">
          <span className="text-xs font-semibold text-white">South Dakota Rural Health Transformation Program</span>
          <span className="text-xs text-carbon-gray-30">Performance Period: Jan–Dec 2026</span>
          <span className="text-xs text-carbon-gray-30">14 Counties · 47,832 Lives · 18 Organizations</span>
          <span className="ml-auto text-xs text-carbon-gray-50">As of May 29, 2026</span>
        </div>
      }
    >
      {/* Section tabs */}
      <div className="flex gap-0 border-b border-carbon-gray-20 bg-white px-6">
        {[
          { key: 'population' as DashSection, label: 'Population Health', icon: 'UserGroupIcon' },
          { key: 'financial' as DashSection, label: 'Financial Performance', icon: 'CurrencyDollarIcon' },
          { key: 'operational' as DashSection, label: 'Operational Metrics', icon: 'ChartBarIcon' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === tab.key
                ? 'border-[#0f62fe] text-[#0f62fe]'
                : 'border-transparent text-carbon-gray-50 hover:text-carbon-gray-100'
            }`}
          >
            <Icon name={tab.icon as any} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Population Health */}
        {activeSection === 'population' && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {POPULATION_METRICS.map((m) => (
                <div key={m.label} className="bg-white border border-carbon-gray-20 px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={m.icon as any} size={13} className="text-carbon-gray-50" />
                    <p className="carbon-label">{m.label}</p>
                  </div>
                  <p className={`text-2xl font-bold font-mono mt-1 ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-carbon-gray-50 mt-0.5">{m.sub}</p>
                  <p className={`text-2xs mt-1 font-medium ${m.up ? 'text-[#24a148]' : 'text-[#da1e28]'}`}>
                    {m.up ? '↑' : '↓'} {m.trend}
                  </p>
                </div>
              ))}
            </div>

            {/* Closure trend chart */}
            <div className="bg-white border border-carbon-gray-20 px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-carbon-gray-100">Care Gap Closure Rate Trend</h3>
                  <p className="text-xs text-carbon-gray-50">Monthly closure rate vs open gap count</p>
                </div>
                <span className="text-2xs font-semibold px-2 py-1 bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]">
                  Target: 75% by Q4
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={CLOSURE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="rate" stroke="#24a148" fill="#defbe6" name="Closure Rate %" />
                  <Area yAxisId="right" type="monotone" dataKey="closed" stroke="#0043ce" fill="#d0e2ff" name="Gaps Closed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Measure performance */}
            <div className="bg-white border border-carbon-gray-20">
              <div className="px-5 py-3 border-b border-carbon-gray-20 flex items-center gap-2">
                <Icon name="ChartBarIcon" size={15} className="text-[#6929c4]" />
                <h3 className="text-sm font-semibold text-carbon-gray-100">Quality Measure Performance</h3>
              </div>
              <div className="divide-y divide-carbon-gray-20">
                {MEASURE_PERFORMANCE.map((m) => {
                  const pct = Math.min((m.current / m.target) * 100, 100);
                  const onTrack = m.current >= m.target * 0.95;
                  return (
                    <div key={m.measure} className="px-5 py-3 flex items-center gap-4">
                      <div className="w-24 flex-shrink-0">
                        <p className="text-xs font-semibold text-carbon-gray-100">{m.name}</p>
                        <p className="text-2xs font-mono text-carbon-gray-50">{m.measure}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-2 bg-carbon-gray-20 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${onTrack ? 'bg-[#24a148]' : 'bg-[#b45309]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-carbon-gray-70 flex-shrink-0 w-20 text-right">
                            {m.current}% / {m.target}%
                          </span>
                        </div>
                      </div>
                      <span className={`text-2xs font-semibold px-2 py-0.5 flex-shrink-0 ${
                        m.program === 'HEDIS' ? 'bg-[#d0e2ff] text-[#0043ce]' :
                        m.program === 'STARS' ? 'bg-[#f6f2ff] text-[#6929c4]' :
                        'bg-[#fdf6dd] text-[#b45309]'
                      }`}>{m.program}</span>
                      <span className={`text-2xs font-semibold px-2 py-0.5 flex-shrink-0 ${
                        onTrack ? 'bg-[#defbe6] text-[#0e6027]' : 'bg-[#fdf6dd] text-[#b45309]'
                      }`}>{onTrack ? 'On Track' : 'At Risk'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Financial Performance */}
        {activeSection === 'financial' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FINANCIAL_METRICS.map((m) => (
                <div key={m.label} className="bg-white border border-carbon-gray-20 px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={m.icon as any} size={13} className="text-carbon-gray-50" />
                    <p className="carbon-label">{m.label}</p>
                  </div>
                  <p className={`text-2xl font-bold font-mono mt-1 ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-carbon-gray-50 mt-0.5">{m.sub}</p>
                  <p className={`text-2xs mt-1 font-medium ${m.up ? 'text-[#24a148]' : 'text-[#da1e28]'}`}>
                    {m.up ? '↑' : '↓'} {m.trend}
                  </p>
                </div>
              ))}
            </div>

            {/* Gain share trend */}
            <div className="bg-white border border-carbon-gray-20 px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-carbon-gray-100">Gain Share Earned vs Projected ($K)</h3>
                  <p className="text-xs text-carbon-gray-50">Monthly gain share accumulation</p>
                </div>
                <div className="flex items-center gap-3 text-2xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#24a148] inline-block" /> Earned</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#d0e2ff] inline-block" /> Projected</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={GAIN_SHARE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `$${v}K`} />
                  <Bar dataKey="projected" fill="#d0e2ff" name="Projected" />
                  <Bar dataKey="earned" fill="#24a148" name="Earned" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Shared savings model */}
            <div className="bg-white border border-carbon-gray-20 px-5 py-4">
              <h3 className="text-sm font-semibold text-carbon-gray-100 mb-4">Shared Savings Model — Performance vs Benchmark</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Benchmark PMPM', value: '$892', sub: 'State-set target', color: 'bg-carbon-gray-10 border-carbon-gray-20' },
                  { label: 'Actual PMPM', value: '$847', sub: '$45 below benchmark', color: 'bg-[#defbe6] border-[#a7f0ba]' },
                  { label: 'Savings Generated', value: '$2.15M', sub: 'Annualized projection', color: 'bg-[#defbe6] border-[#a7f0ba]' },
                ].map((item) => (
                  <div key={item.label} className={`border px-4 py-4 ${item.color}`}>
                    <p className="text-2xs text-carbon-gray-50 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-2xl font-bold font-mono text-carbon-gray-100">{item.value}</p>
                    <p className="text-xs text-carbon-gray-50 mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Operational Metrics */}
        {activeSection === 'operational' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OPERATIONAL_METRICS.map((m) => (
                <div key={m.label} className="bg-white border border-carbon-gray-20 px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={m.icon as any} size={13} className="text-carbon-gray-50" />
                    <p className="carbon-label">{m.label}</p>
                  </div>
                  <p className={`text-2xl font-bold font-mono mt-1 ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-carbon-gray-50 mt-0.5">{m.sub}</p>
                  <p className={`text-2xs mt-1 font-medium ${m.up ? 'text-[#24a148]' : 'text-[#da1e28]'}`}>
                    {m.up ? '↑' : '↓'} {m.trend}
                  </p>
                </div>
              ))}
            </div>

            {/* Network performance table */}
            <div className="bg-white border border-carbon-gray-20">
              <div className="px-5 py-3 border-b border-carbon-gray-20 flex items-center gap-2">
                <Icon name="BuildingOffice2Icon" size={15} className="text-[#0043ce]" />
                <h3 className="text-sm font-semibold text-carbon-gray-100">Network Organization Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-carbon-gray-10 border-b border-carbon-gray-20">
                      <th className="px-4 py-2.5 text-left text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Organization</th>
                      <th className="px-4 py-2.5 text-left text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-2.5 text-right text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Patients</th>
                      <th className="px-4 py-2.5 text-right text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Gap Closure</th>
                      <th className="px-4 py-2.5 text-right text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Gain Share YTD</th>
                      <th className="px-4 py-2.5 text-center text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-gray-20">
                    {NETWORK_PERFORMANCE.map((org) => (
                      <tr key={org.org} className="hover:bg-carbon-gray-10 transition-colors">
                        <td className="px-4 py-3 font-medium text-carbon-gray-100">{org.org}</td>
                        <td className="px-4 py-3 text-carbon-gray-50">{org.type}</td>
                        <td className="px-4 py-3 text-right font-mono text-carbon-gray-100">{org.patients.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold font-mono ${org.closure >= 70 ? 'text-[#24a148]' : org.closure >= 60 ? 'text-[#b45309]' : 'text-[#da1e28]'}`}>
                            {org.closure}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-[#24a148]">${org.gainShare}K</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-2xs font-semibold px-2 py-0.5 ${
                            org.closure >= 70 ? 'bg-[#defbe6] text-[#0e6027]' : 'bg-[#fdf6dd] text-[#b45309]'
                          }`}>
                            {org.closure >= 70 ? 'On Track' : 'At Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rollup narrative */}
            <div className="bg-[#f0f4ff] border border-[#97c1ff] px-5 py-4">
              <div className="flex items-start gap-3">
                <Icon name="InformationCircleIcon" size={18} className="text-[#0043ce] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#0043ce] mb-1">How Individual Interventions Roll Up to Network Outcomes</p>
                  <p className="text-xs text-carbon-gray-70 leading-relaxed">
                    Each patient intervention — a cardiology referral, an A1C lab order, a specialist consultation — closes a care gap that
                    contributes to the network's HEDIS/STARS quality score. Higher quality scores unlock the gain-share pool.
                    The RHTP platform tracks every intervention from referral creation through evidence submission to EDW reporting,
                    creating a closed-loop quality improvement cycle that directly drives state Medicaid incentive payments.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
