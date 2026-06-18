'use client';

import React, { useState, useEffect, useRef } from 'react';
import ScreenLayout from '@/uhg/components/shared/ScreenLayout';
import PresenterControls from '@/uhg/components/shared/PresenterControls';
import MariaStatusStrip from '@/uhg/components/shared/MariaStatusStrip';
import { useDemoStore } from '@/uhg/store/demoStore';

// ─── Medication data ──────────────────────────────────────────────────────────

interface Medication {
  id: string;
  name: string;
  dose: string;
  indication: string;
  risk: 'HIGH' | 'MODERATE' | 'STANDARD';
  riskColor: string;
}

const ELENA_MEDS: Medication[] = [
  { id: 'med-1', name: 'Lisinopril', dose: '10mg', indication: 'Hypertension', risk: 'STANDARD', riskColor: '#42be65' },
  { id: 'med-2', name: 'Metformin', dose: '1000mg', indication: 'Type 2 Diabetes', risk: 'STANDARD', riskColor: '#42be65' },
  { id: 'med-3', name: 'Lisinopril', dose: '10mg', indication: 'Hypertension', risk: 'STANDARD', riskColor: '#42be65' },
  { id: 'med-4', name: 'Atorvastatin', dose: '40mg', indication: 'Cardiovascular', risk: 'STANDARD', riskColor: '#42be65' },
  { id: 'med-5', name: 'Amlodipine', dose: '5mg', indication: 'Hypertension', risk: 'STANDARD', riskColor: '#42be65' },
  { id: 'med-6', name: 'Omeprazole', dose: '20mg', indication: 'GI Protection', risk: 'STANDARD', riskColor: '#42be65' },
];

// Note: Elena (cared-for) is on Metformin 1000mg + Lisinopril 10mg — Maria picks up at Martin Pharmacy
// Refill sync + adherence review coordinated via Bennett County Health + Martin Pharmacy

// ─── Signals ──────────────────────────────────────────────────────────────────

interface MedSignal {
  id: string;
  icon: string;
  label: string;
  detail: string;
  urgency: 'critical' | 'high' | 'opportunity';
  color: string;
}

const ELENA_SIGNALS: MedSignal[] = [
  {
    id: 'sig-inr',
    icon: '⚠',
    label: 'Elena A1C 8.1% — DM Management',
    detail: 'Above target — caregiver-managed; refill sync + follow-up needed at Bennett County Health',
    urgency: 'critical',
    color: '#fa4d56',
  },
  {
    id: 'sig-poly',
    icon: '⚠',
    label: 'Polypharmacy Risk',
    detail: '6 active medications — no medication review in 12 months — interaction risk unassessed',
    urgency: 'high',
    color: '#f59e0b',
  },
  {
    id: 'sig-pcp',
    icon: '●',
    label: 'PCP Appointment in 7 Days',
    detail: 'Opportunity window — bundle medication review + INR order into existing visit',
    urgency: 'opportunity',
    color: '#42be65',
  },
];

// ─── Orchestration actions ────────────────────────────────────────────────────

interface OrchAction {
  id: string;
  label: string;
  detail: string;
  status: 'complete' | 'pending' | 'active';
  color: string;
}

const ORCH_ACTIONS: OrchAction[] = [
  {
    id: 'oa-inr',
    label: 'INR Monitoring Order Initiated',
    detail: 'Urgent clinical signal — order routed to PCP for pre-visit lab draw',
    status: 'complete',
    color: '#fa4d56',
  },
  {
    id: 'oa-review',
    label: 'Medication Review Bundled into PCP Visit',
    detail: 'Polypharmacy risk report generated — pre-visit package sent to Dr. Nguyen',
    status: 'complete',
    color: '#42be65',
  },
  {
    id: 'oa-cm',
    label: 'Care Management Referral',
    detail: 'High medication complexity — no assigned care manager — referral initiated',
    status: 'active',
    color: '#78a9ff',
  },
  {
    id: 'oa-notify',
    label: 'Maria Notified Within Proxy Scope',
    detail: 'Combined outreach: Maria postpartum check-in + Elena medication review — one SMS message',
    status: 'pending',
    color: '#f59e0b',
  },
];

// ─── Consent states ───────────────────────────────────────────────────────────

type ConsentState = 'none' | 'active' | 'intercept';

const CONSENT_SCOPE_ITEMS = [
  'Medication management',
  'Appointment coordination',
  'Care gap notifications',
];

const CONSENT_EXCLUDE_ITEMS = [
  'Financial records',
  'Mental health records',
  'Third-party disclosure',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CaregiverElenaScreen() {
  const setScreen = useDemoStore((s) => s.setScreen);
  const [headerReveal, setHeaderReveal] = useState(false);
  const [signalsReveal, setSignalsReveal] = useState(false);
  const [orchReveal, setOrchReveal] = useState(false);
  const [consentReveal, setConsentReveal] = useState(false);
  const [visibleSignals, setVisibleSignals] = useState(0);
  const [visibleOrch, setVisibleOrch] = useState(0);
  const [consentState, setConsentState] = useState<ConsentState>('none');
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setScreen('caregiver-elena');

    const t1 = setTimeout(() => setHeaderReveal(true), 300);
    const t2 = setTimeout(() => setSignalsReveal(true), 800);

    ELENA_SIGNALS.forEach((_, i) => {
      const t = setTimeout(() => setVisibleSignals(i + 1), 1000 + i * 300);
      timerRefs.current.push(t);
    });

    const t3 = setTimeout(() => setOrchReveal(true), 1000 + ELENA_SIGNALS.length * 300 + 200);

    ORCH_ACTIONS.forEach((_, i) => {
      const t = setTimeout(() => setVisibleOrch(i + 1), 1200 + ELENA_SIGNALS.length * 300 + i * 280);
      timerRefs.current.push(t);
    });

    const t4 = setTimeout(
      () => setConsentReveal(true),
      1200 + ELENA_SIGNALS.length * 300 + ORCH_ACTIONS.length * 280 + 400
    );

    timerRefs.current.push(t1, t2, t3, t4);

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [setScreen]);

  const urgencyConfig = {
    critical: { bg: 'rgba(250,77,86,0.1)', border: 'rgba(250,77,86,0.4)', dot: '#fa4d56' },
    high: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.4)', dot: '#f59e0b' },
    opportunity: { bg: 'rgba(66,190,101,0.08)', border: 'rgba(66,190,101,0.35)', dot: '#42be65' },
  };

  const statusConfig = {
    complete: { color: '#42be65', label: 'COMPLETE', bg: 'rgba(66,190,101,0.12)', border: 'rgba(66,190,101,0.35)' },
    active: { color: '#78a9ff', label: 'ACTIVE', bg: 'rgba(120,169,255,0.12)', border: 'rgba(120,169,255,0.35)' },
    pending: { color: '#f59e0b', label: 'PENDING', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  };

  return (
    <ScreenLayout
      screenId="caregiver-elena"
      showPhaseArc
      phaseArcState={{ foundation: true, orchestration: true, autonomous: true }}
      showMiniProfile
    >
      <PresenterControls currentScreenId="caregiver-elena" />
      <MariaStatusStrip
        state="resolved"
        authStatus="✓ Submitted"
        careGapStatus="✓ In Progress"
        visible
      />

      <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ top: 36, background: '#161616' }}>

        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3 transition-all duration-500"
          style={{
            borderBottom: '1px solid rgba(57,57,57,0.6)',
            background: '#1c1c1c',
            opacity: headerReveal ? 1 : 0,
            transform: headerReveal ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="rounded px-3 py-1.5 flex items-center gap-2" style={{ background: 'rgba(255,126,182,0.12)', border: '1px solid rgba(255,126,182,0.4)' }}>
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#ff7eb6', animation: 'authPulse 1.5s ease-in-out infinite' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#ff7eb6', letterSpacing: '0.1em' }}>
                06e · CAREGIVER THREAD · MEDICATION INTELLIGENCE
              </span>
            </div>
            <span className="text-white font-semibold" style={{ fontSize: '20px' }}>
              Caregiver Intelligence — Elena Redhawk
            </span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: 'Medications', value: '6', color: '#f59e0b' },
              { label: 'INR Overdue', value: '38d', color: '#fa4d56' },
              { label: 'Proxy Consent', value: 'ACTIVE', color: '#42be65' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-end gap-0.5">
                <span className="font-mono font-bold" style={{ fontSize: '18px', color: s.color, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.06em' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Relationship Bar ── */}
        {headerReveal && (
          <div
            className="flex-shrink-0 flex items-center gap-6 px-6 py-3 transition-all duration-500"
            style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#1a1a1a' }}
          >
            {/* Maria node */}
            <div className="flex items-center gap-3 rounded px-4 py-2.5" style={{ background: 'rgba(250,77,86,0.1)', border: '1px solid rgba(250,77,86,0.35)' }}>
              <div className="rounded-full flex-shrink-0" style={{ width: 36, height: 36, background: 'rgba(250,77,86,0.2)', border: '2px solid #fa4d56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px', color: '#fa4d56', fontWeight: 700 }}>M</span>
              </div>
              <div>
                <div className="font-semibold text-white" style={{ fontSize: '14px' }}>Maria Redhawk</div>
                <div className="font-mono" style={{ fontSize: '10px', color: '#fa4d56' }}>MARIA_SD_001 · CAREGIVER</div>
              </div>
            </div>

            {/* Edge */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, #fa4d56, #ff7eb6)', opacity: 0.7 }} />
                <div className="rounded px-2 py-1" style={{ background: 'rgba(255,126,182,0.15)', border: '1px solid rgba(255,126,182,0.4)' }}>
                  <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#ff7eb6', letterSpacing: '0.08em' }}>CAREGIVER_FOR</span>
                </div>
                <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, #ff7eb6, #fa4d56)', opacity: 0.7 }} />
              </div>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.3)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.06em' }}>PROXY CONSENT ✓ SCOPED · ACTIVE</span>
              </div>
            </div>

            {/* Elena node */}
            <div className="flex items-center gap-3 rounded px-4 py-2.5" style={{ background: 'rgba(255,126,182,0.1)', border: '1px solid rgba(255,126,182,0.35)' }}>
              <div className="rounded-full flex-shrink-0" style={{ width: 36, height: 36, background: 'rgba(255,126,182,0.2)', border: '2px solid #ff7eb6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px', color: '#ff7eb6', fontWeight: 700 }}>E</span>
              </div>
              <div>
                <div className="font-semibold text-white" style={{ fontSize: '14px' }}>Elena Redhawk</div>
                <div className="font-mono" style={{ fontSize: '10px', color: '#ff7eb6' }}>ELENA_SD_003 · Age 71 · Dual-eligible (Medicare/SD Medicaid)</div>
              </div>
            </div>

            <div className="ml-auto italic" style={{ fontSize: '13px', color: '#6f6f6f', maxWidth: 340, textAlign: 'right', lineHeight: 1.5 }}>
              The system acts on Elena's behalf only as far as Elena has authorized. Not one step further.
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">

          {/* Left: Signals + Medications */}
          <div className="flex flex-col overflow-hidden" style={{ width: '32%', borderRight: '1px solid rgba(57,57,57,0.5)' }}>

            {/* Signals */}
            <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#1c1c1c' }}>
              <span className="font-mono uppercase tracking-wider" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.12em' }}>
                SIGNALS DETECTED — ELENA REYES
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
              {signalsReveal && ELENA_SIGNALS.slice(0, visibleSignals).map((sig) => {
                const cfg = urgencyConfig[sig.urgency];
                return (
                  <div
                    key={sig.id}
                    className="rounded p-3 transition-all duration-400"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span style={{ fontSize: '14px', color: cfg.dot, flexShrink: 0, marginTop: 1 }}>{sig.icon}</span>
                      <span className="font-semibold text-white" style={{ fontSize: '13px', lineHeight: 1.3 }}>{sig.label}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#8d8d8d', lineHeight: 1.5, paddingLeft: 20 }}>{sig.detail}</p>
                  </div>
                );
              })}
            </div>

            {/* Medications */}
            <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(57,57,57,0.5)' }}>
              <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(57,57,57,0.4)', background: '#1c1c1c' }}>
                <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.12em' }}>
                  ACTIVE MEDICATIONS · 6
                </span>
              </div>
              <div className="px-4 py-2 flex flex-col gap-1.5" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {ELENA_MEDS.map((med) => (
                  <div key={med.id} className="flex items-center justify-between rounded px-3 py-1.5" style={{ background: '#1e1e1e', border: '1px solid rgba(57,57,57,0.5)' }}>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: med.riskColor }} />
                      <span className="font-semibold text-white" style={{ fontSize: '12px' }}>{med.name}</span>
                      <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f' }}>{med.dose}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '10px', color: '#8d8d8d' }}>{med.indication}</span>
                      {med.risk === 'HIGH' && (
                        <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(250,77,86,0.15)', border: '1px solid rgba(250,77,86,0.4)' }}>
                          <span className="font-mono" style={{ fontSize: '8px', color: '#fa4d56', letterSpacing: '0.06em' }}>HIGH RISK</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Orchestration Response */}
          <div className="flex flex-col overflow-hidden" style={{ width: '36%', borderRight: '1px solid rgba(57,57,57,0.5)' }}>
            <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#1c1c1c' }}>
              <span className="font-mono uppercase tracking-wider" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.12em' }}>
                ORCHESTRATION RESPONSE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
              {orchReveal && ORCH_ACTIONS.slice(0, visibleOrch).map((action) => {
                const cfg = statusConfig[action.status];
                return (
                  <div
                    key={action.id}
                    className="rounded p-3 transition-all duration-400"
                    style={{ background: '#1e1e1e', border: `1px solid rgba(57,57,57,0.6)` }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-white" style={{ fontSize: '13px' }}>{action.label}</span>
                      <div className="rounded px-2 py-0.5 flex-shrink-0 ml-2" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <span className="font-mono" style={{ fontSize: '9px', color: cfg.color, letterSpacing: '0.08em' }}>{cfg.label}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: '#8d8d8d', lineHeight: 1.5 }}>{action.detail}</p>
                  </div>
                );
              })}
            </div>

            {/* Closing statement */}
            {orchReveal && visibleOrch >= ORCH_ACTIONS.length && (
              <div
                className="flex-shrink-0 mx-4 mb-2 rounded p-3 transition-all duration-500"
                style={{ background: 'rgba(250,77,86,0.07)', border: '1px solid rgba(250,77,86,0.35)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full" style={{ width: 6, height: 6, background: '#fa4d56', animation: 'authPulse 1s ease-in-out infinite' }} />
                  <span className="font-mono font-semibold" style={{ fontSize: '9px', color: '#fa4d56', letterSpacing: '0.1em' }}>◈ CAREGIVER MED MANAGEMENT — ELENA REGIMEN</span>
                </div>
                <p style={{ fontSize: '11px', color: '#c6c6c6', lineHeight: 1.5, marginBottom: 8 }}>
                  Maria (Elena&apos;s caregiver) manages Elena&apos;s regimen — Metformin 1000mg + Lisinopril 10mg — picked up at Martin Pharmacy. Refill sync and adherence review dispatched to Bennett County Health.
                </p>
                {[
                  { prescriber: 'Bennett County Health', role: 'PCP · CAH · Elena', status: 'REFILL SYNCED', color: '#42be65' },
                  { prescriber: 'Martin Pharmacy', role: 'Family pharmacy · Elena meds', status: 'REFILL SYNCED', color: '#42be65' },
                ].map((item) => (
                  <div key={item.prescriber} className="flex items-center justify-between rounded px-2.5 py-1.5 mb-1" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.2)' }}>
                    <div>
                      <span className="font-semibold" style={{ fontSize: '11px', color: '#f4f4f4' }}>{item.prescriber}</span>
                      <span style={{ fontSize: '10px', color: '#6f6f6f', marginLeft: 6 }}>{item.role}</span>
                    </div>
                    <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.35)' }}>
                      <span className="font-mono" style={{ fontSize: '8px', color: '#42be65', letterSpacing: '0.06em' }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Closing statement */}
            {orchReveal && visibleOrch >= ORCH_ACTIONS.length && (
              <div
                className="flex-shrink-0 mx-4 mb-4 rounded p-4 transition-all duration-500"
                style={{ background: 'rgba(255,126,182,0.08)', border: '1px solid rgba(255,126,182,0.3)' }}
              >
                <p style={{ fontSize: '13px', color: '#c6c6c6', lineHeight: 1.65, fontStyle: 'italic' }}>
                  The system doesn't just understand Maria. It understands{' '}
                  <span style={{ color: '#ff7eb6', fontWeight: 600, fontStyle: 'normal' }}>everyone who depends on her</span>
                  {' '}— and everyone she depends on.
                </p>
              </div>
            )}
          </div>

          {/* Right: Consent Progression */}
          <div className="flex flex-col overflow-hidden" style={{ width: '32%' }}>
            <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#1c1c1c' }}>
              <span className="font-mono uppercase tracking-wider" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.12em' }}>
                CONSENT PROGRESSION
              </span>
            </div>

            {consentReveal && (
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">

                {/* State selector tabs */}
                <div className="flex gap-1 rounded p-1" style={{ background: '#1e1e1e', border: '1px solid rgba(57,57,57,0.5)' }}>
                  {([
                    { key: 'none', label: 'A · No Consent', color: '#6b7280' },
                    { key: 'active', label: 'B · Scoped Active', color: '#42be65' },
                    { key: 'intercept', label: 'C · Boundary Intercept', color: '#fa4d56' },
                  ] as { key: ConsentState; label: string; color: string }[]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setConsentState(tab.key)}
                      className="flex-1 rounded py-1.5 transition-all duration-200"
                      style={{
                        background: consentState === tab.key ? `${tab.color}18` : 'transparent',
                        border: `1px solid ${consentState === tab.key ? tab.color + '55' : 'transparent'}`,
                        color: consentState === tab.key ? tab.color : '#4b5563',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* State A — No Consent */}
                {consentState === 'none' && (
                  <div className="flex flex-col gap-3 transition-all duration-400">
                    <div className="rounded p-4" style={{ background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.4)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded px-2 py-1" style={{ background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.5)' }}>
                          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#9ca3af', letterSpacing: '0.1em' }}>CONSENT GATE — BLOCKED</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: '#c6c6c6', lineHeight: 1.6, marginBottom: 12 }}>
                        Maria Redhawk has requested access to Elena Redhawk (ELENA_SD_003) medication records.
                      </p>
                      <div className="rounded p-3 mb-3" style={{ background: '#1e1e1e', border: '1px solid rgba(57,57,57,0.6)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="rounded-full" style={{ width: 6, height: 6, background: '#6b7280' }} />
                          <span className="font-mono" style={{ fontSize: '11px', color: '#9ca3af' }}>NO PROXY CONSENT ON FILE</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#6f6f6f', lineHeight: 1.5 }}>
                          Elena Redhawk has not granted caregiver access. System cannot act on Elena's behalf.
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {[
                          'Consent request initiated',
                          'Outreach to Elena — preferred channel: phone',
                          'Consent form sent — awaiting signature',
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="rounded-full flex-shrink-0" style={{ width: 4, height: 4, background: '#6b7280' }} />
                            <span style={{ fontSize: '11px', color: '#8d8d8d' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* State B — Consent Active */}
                {consentState === 'active' && (
                  <div className="flex flex-col gap-3 transition-all duration-400">
                    <div className="rounded p-4" style={{ background: 'rgba(66,190,101,0.08)', border: '1px solid rgba(66,190,101,0.4)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded px-2 py-1" style={{ background: 'rgba(66,190,101,0.2)', border: '1px solid rgba(66,190,101,0.5)' }}>
                          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#42be65', letterSpacing: '0.1em' }}>PROXY CONSENT — ACTIVE</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3 rounded p-2.5" style={{ background: '#1e1e1e', border: '1px solid rgba(57,57,57,0.6)' }}>
                        <span style={{ fontSize: '13px', color: '#ff7eb6', fontWeight: 600 }}>Elena Redhawk</span>
                        <span style={{ fontSize: '12px', color: '#6f6f6f' }}>→</span>
                        <span style={{ fontSize: '13px', color: '#fa4d56', fontWeight: 600 }}>Maria Redhawk</span>
                      </div>
                      <div className="mb-3">
                        <div className="font-mono mb-1.5" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>SCOPE INCLUDES:</div>
                        {CONSENT_SCOPE_ITEMS.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: '11px', color: '#42be65' }}>✓</span>
                            <span style={{ fontSize: '11px', color: '#c6c6c6' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mb-3">
                        <div className="font-mono mb-1.5" style={{ fontSize: '10px', color: '#fa4d56', letterSpacing: '0.08em' }}>EXCLUDES:</div>
                        {CONSENT_EXCLUDE_ITEMS.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: '11px', color: '#fa4d56' }}>✕</span>
                            <span style={{ fontSize: '11px', color: '#8d8d8d' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1 rounded p-2.5" style={{ background: '#1a1a1a', border: '1px solid rgba(57,57,57,0.5)' }}>
                        {[
                          { label: 'Granted', value: '2024-11-15' },
                          { label: 'Expires', value: '2025-11-15' },
                          { label: 'HIPAA Basis', value: 'TPO — Treatment, Payment, Operations' },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between">
                            <span style={{ fontSize: '10px', color: '#6f6f6f' }}>{row.label}</span>
                            <span className="font-mono" style={{ fontSize: '10px', color: '#8d8d8d' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3" style={{ fontSize: '11px', color: '#6f6f6f', lineHeight: 1.5 }}>
                        Every access by Maria on Elena's behalf is logged in the audit trail.
                      </p>
                    </div>
                  </div>
                )}

                {/* State C — Consent Boundary Intercept */}
                {consentState === 'intercept' && (
                  <div className="flex flex-col gap-3 transition-all duration-400">
                    <div className="rounded p-4" style={{ background: 'rgba(250,77,86,0.1)', border: '2px solid rgba(250,77,86,0.5)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, background: 'rgba(250,77,86,0.2)', border: '1px solid rgba(250,77,86,0.5)' }}>
                          <span style={{ fontSize: '16px' }}>⚖</span>
                        </div>
                        <div>
                          <div className="font-mono font-semibold" style={{ fontSize: '11px', color: '#fa4d56', letterSpacing: '0.1em' }}>GOVERNANCE INTERCEPT</div>
                          <div className="font-mono" style={{ fontSize: '9px', color: '#8d8d8d', letterSpacing: '0.06em' }}>CONSENT BOUNDARY EXCEEDED</div>
                        </div>
                        <div className="ml-auto rounded px-2 py-0.5" style={{ background: 'rgba(250,77,86,0.2)', border: '1px solid rgba(250,77,86,0.4)' }}>
                          <span className="font-mono" style={{ fontSize: '9px', color: '#fa4d56' }}>BLOCKED</span>
                        </div>
                      </div>

                      <div className="rounded p-3 mb-3" style={{ background: 'rgba(250,77,86,0.08)', border: '1px solid rgba(250,77,86,0.25)' }}>
                        <p style={{ fontSize: '12px', color: '#c6c6c6', lineHeight: 1.6 }}>
                          Care Agent attempted to share Elena's medication list with Maria's care coordinator without Elena's explicit authorization for third-party disclosure.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-start gap-2 rounded p-2.5" style={{ background: '#1e1e1e', border: '1px solid rgba(57,57,57,0.6)' }}>
                          <span style={{ fontSize: '11px', color: '#42be65', flexShrink: 0, marginTop: 1 }}>✓</span>
                          <div>
                            <div style={{ fontSize: '11px', color: '#c6c6c6', fontWeight: 600 }}>Scope of Maria's proxy</div>
                            <div style={{ fontSize: '10px', color: '#8d8d8d' }}>Medication management (personal)</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded p-2.5" style={{ background: '#1e1e1e', border: '1px solid rgba(57,57,57,0.6)' }}>
                          <span style={{ fontSize: '11px', color: '#fa4d56', flexShrink: 0, marginTop: 1 }}>✕</span>
                          <div>
                            <div style={{ fontSize: '11px', color: '#c6c6c6', fontWeight: 600 }}>Scope does NOT cover</div>
                            <div style={{ fontSize: '10px', color: '#8d8d8d' }}>Third-party disclosure to care coordinator</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded p-3" style={{ background: '#1a1a1a', border: '1px solid rgba(57,57,57,0.5)' }}>
                        <div className="font-mono mb-2" style={{ fontSize: '10px', color: '#8d8d8d', letterSpacing: '0.08em' }}>RESOLUTION OPTIONS:</div>
                        {[
                          'Elena must grant expanded scope for third-party disclosure',
                          'OR coordinator contacts Elena directly',
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1">
                            <div className="rounded-full flex-shrink-0 mt-1.5" style={{ width: 4, height: 4, background: '#f59e0b' }} />
                            <span style={{ fontSize: '11px', color: '#c6c6c6', lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Governance distinction callout */}
                    <div className="rounded p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}>
                      <p style={{ fontSize: '11px', color: '#c6c6c6', lineHeight: 1.65, fontStyle: 'italic' }}>
                        The system didn't just verify that Maria has proxy consent. It verified that{' '}
                        <span style={{ color: '#8b5cf6', fontWeight: 600, fontStyle: 'normal' }}>this specific action</span>
                        {' '}falls outside the scope of that consent. That distinction is the difference between compliance theater and compliance architecture.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenLayout>
  );
}
