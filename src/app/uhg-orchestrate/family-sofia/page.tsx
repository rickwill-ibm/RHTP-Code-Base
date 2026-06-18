'use client';

import React, { useState, useEffect, useRef } from 'react';
import ScreenLayout from '@/uhg/components/shared/ScreenLayout';
import PresenterControls from '@/uhg/components/shared/PresenterControls';
import MariaStatusStrip from '@/uhg/components/shared/MariaStatusStrip';
import { useDemoStore } from '@/uhg/store/demoStore';

// ─── Care gaps ────────────────────────────────────────────────────────────────

interface CareGap {
  id: string;
  label: string;
  urgency: 'critical' | 'high' | 'due';
  detail: string;
  source: string;
}

const SOFIA_GAPS: CareGap[] = [
  { id: 'sg-pcp', label: 'No Assigned Pediatrician', urgency: 'critical', detail: 'No PCP on record — immediate gap', source: 'Enrollment data' },
  { id: 'sg-well', label: '24-Month Well Visit Overdue', urgency: 'critical', detail: 'HEDIS W34 — last visit: 12-month', source: 'Claims history' },
  { id: 'sg-dev', label: 'Developmental Screening Due', urgency: 'high', detail: 'M-CHAT-R/F — autism spectrum screen, age 24m', source: 'CDC schedule' },
  { id: 'sg-lead', label: 'Lead Screening Due', urgency: 'high', detail: 'CDC age 24 months — blood lead level', source: 'CDC schedule' },
  { id: 'sg-hgb', label: 'Hemoglobin Screening Due', urgency: 'high', detail: 'AAP recommendation — age 12–24m', source: 'AAP guidelines' },
  { id: 'sg-imm', label: 'Immunizations Due', urgency: 'due', detail: 'DTaP, IPV, MMR, Varicella — 24-month schedule', source: 'CDC immunization schedule' },
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
    id: 'oa-pcp',
    label: 'Pediatrician Recommended',
    detail: 'Bennett County Health · Pediatrics · 0 mi · Accepting',
    status: 'complete',
    color: '#42be65',
  },
  {
    id: 'oa-visit',
    label: 'Well Visit Scheduled',
    detail: 'Pending Maria confirmation — combined with postpartum follow-up window',
    status: 'pending',
    color: '#f59e0b',
  },
  {
    id: 'oa-screen',
    label: 'Screening Bundle Created',
    detail: '4 screenings at single visit — M-CHAT-R/F, lead, hemoglobin, developmental',
    status: 'complete',
    color: '#42be65',
  },
  {
    id: 'oa-imm',
    label: 'Immunization Schedule Generated',
    detail: 'DTaP, IPV, MMR, Varicella — coordinated with well visit appointment',
    status: 'complete',
    color: '#42be65',
  },
  {
    id: 'oa-outreach',
    label: 'Combined Outreach Sent',
    detail: "Maria's postpartum + Sophia's well-child — one SMS, one outreach",
    status: 'active',
    color: '#78a9ff',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FamilySophiaScreen() {
  const setScreen = useDemoStore((s) => s.setScreen);
  const [sofiaReveal, setSophiaReveal] = useState(false);
  const [gapsReveal, setGapsReveal] = useState(false);
  const [orchReveal, setOrchReveal] = useState(false);
  const [closingReveal, setClosingReveal] = useState(false);
  const [visibleGaps, setVisibleGaps] = useState(0);
  const [visibleOrch, setVisibleOrch] = useState(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setScreen('family-sofia');

    const t1 = setTimeout(() => setSophiaReveal(true), 400);
    const t2 = setTimeout(() => setGapsReveal(true), 1000);

    // Reveal gaps one by one
    SOFIA_GAPS.forEach((_, i) => {
      const t = setTimeout(() => setVisibleGaps(i + 1), 1200 + i * 250);
      timerRefs.current.push(t);
    });

    const t3 = setTimeout(() => setOrchReveal(true), 1200 + SOFIA_GAPS.length * 250 + 200);

    // Reveal orch actions one by one
    ORCH_ACTIONS.forEach((_, i) => {
      const t = setTimeout(() => setVisibleOrch(i + 1), 1200 + SOFIA_GAPS.length * 250 + 500 + i * 300);
      timerRefs.current.push(t);
    });

    const t4 = setTimeout(() => setClosingReveal(true), 1200 + SOFIA_GAPS.length * 250 + 500 + ORCH_ACTIONS.length * 300 + 400);

    timerRefs.current.push(t1, t2, t3, t4);
    return () => timerRefs.current.forEach(clearTimeout);
  }, [setScreen]);

  const urgencyColor = (u: CareGap['urgency']) =>
    u === 'critical' ? '#fa4d56' : u === 'high' ? '#f59e0b' : '#78a9ff';

  const urgencyLabel = (u: CareGap['urgency']) =>
    u === 'critical' ? 'CRITICAL' : u === 'high' ? 'HIGH' : 'DUE';

  return (
    <ScreenLayout
      screenId="family-sofia"
      showPhaseArc
      phaseArcState={{ foundation: true, orchestration: true, autonomous: true }}
      showMiniProfile
    >
      <PresenterControls currentScreenId="family-sofia" />

      <MariaStatusStrip
        state="resolved"
        authStatus="✓ Submitted"
        careGapStatus="✓ In Progress"
        episodeStatus="Postpartum · Diabetes"
        visible
      />

      <div
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{ top: 36, background: '#161616' }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid rgba(57,57,57,0.6)', background: '#1c1c1c' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="rounded px-3 py-1.5 flex items-center gap-2"
              style={{ background: 'rgba(250,77,86,0.12)', border: '1px solid rgba(250,77,86,0.4)' }}
            >
              <div
                className="rounded-full"
                style={{ width: 7, height: 7, background: '#fa4d56', animation: 'authPulse 2s ease-in-out infinite' }}
              />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#fa4d56', letterSpacing: '0.1em' }}>
                FAMILY THREAD — DEPENDENT INTELLIGENCE
              </span>
            </div>
            <span className="text-white font-semibold" style={{ fontSize: '20px' }}>
              Maria has a 2-year-old daughter. The system already found her.
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">

          {/* Left: Sophia profile + gaps */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: '45%', borderRight: '1px solid rgba(57,57,57,0.5)' }}
          >
            {/* Sophia identity card */}
            {sofiaReveal && (
              <div
                className="flex-shrink-0 mx-5 mt-4 mb-3 rounded p-4 flex items-start gap-4 fade-in"
                style={{
                  background: 'rgba(250,77,86,0.06)',
                  border: '1px solid rgba(250,77,86,0.35)',
                  borderLeft: '3px solid #fa4d56',
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 48, height: 48, background: 'rgba(250,77,86,0.15)', border: '2px solid #fa4d56' }}
                >
                  <span className="font-bold text-white" style={{ fontSize: '16px' }}>SR</span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white" style={{ fontSize: '18px' }}>Sophia Redhawk</span>
                    <div
                      className="rounded px-2 py-0.5"
                      style={{ background: 'rgba(120,169,255,0.15)', border: '1px solid rgba(120,169,255,0.4)' }}
                    >
                      <span className="font-mono" style={{ fontSize: '10px', color: '#78a9ff' }}>DEPENDENT</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontSize: '12px', color: '#8d8d8d' }}>SD CHIP · Age 2 · DOB June 2024</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: '11px', color: '#fa4d56' }}>Dependent of Maria Redhawk (MARIA_SD_001)</span>
                    <span style={{ fontSize: '11px', color: '#6f6f6f' }}>· Identified via family record</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gap header */}
            {gapsReveal && (
              <div
                className="flex-shrink-0 px-5 py-2 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', borderTop: '1px solid rgba(57,57,57,0.5)' }}
              >
                <span className="font-mono uppercase tracking-wider" style={{ fontSize: '10px', color: '#fa4d56', letterSpacing: '0.12em' }}>
                  CARE GAPS IDENTIFIED — {SOFIA_GAPS.length} OPEN
                </span>
                <div
                  className="rounded px-2 py-0.5"
                  style={{ background: 'rgba(250,77,86,0.12)', border: '1px solid rgba(250,77,86,0.35)' }}
                >
                  <span className="font-mono" style={{ fontSize: '10px', color: '#fa4d56' }}>PROACTIVE DISCOVERY</span>
                </div>
              </div>
            )}

            {/* Gap list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2 min-h-0">
              {SOFIA_GAPS.slice(0, visibleGaps).map((gap, i) => {
                const col = urgencyColor(gap.urgency);
                return (
                  <div
                    key={gap.id}
                    className="rounded p-3 flex flex-col gap-1.5 transition-all duration-400"
                    style={{
                      background: `${col}08`,
                      border: `1px solid ${col}30`,
                      opacity: 1,
                      transform: 'translateX(0)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ fontSize: '13px', color: '#f4f4f4' }}>{gap.label}</span>
                      <div
                        className="rounded px-1.5 py-0.5"
                        style={{ background: `${col}15`, border: `1px solid ${col}40` }}
                      >
                        <span className="font-mono" style={{ fontSize: '9px', color: col, letterSpacing: '0.08em' }}>
                          {urgencyLabel(gap.urgency)}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#8d8d8d', lineHeight: 1.4 }}>{gap.detail}</span>
                    <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563' }}>Source: {gap.source}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Orchestration response */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
            {orchReveal && (
              <div
                className="flex-shrink-0 px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#1c1c1c' }}
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-full" style={{ width: 8, height: 8, background: '#42be65', animation: 'authPulse 2s ease-in-out infinite' }} />
                  <span className="font-mono uppercase tracking-wider" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.12em' }}>
                    ORCHESTRATION RESPONSE
                  </span>
                </div>
                <span className="font-mono" style={{ fontSize: '11px', color: '#8d8d8d' }}>Autonomous · No referral needed</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">
              {ORCH_ACTIONS.slice(0, visibleOrch).map((action) => {
                const statusIcon = action.status === 'complete' ? '✓' : action.status === 'active' ? '◉' : '◌';
                return (
                  <div
                    key={action.id}
                    className="rounded p-3 flex items-start gap-3 fade-in"
                    style={{
                      background: `${action.color}08`,
                      border: `1px solid ${action.color}30`,
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ width: 22, height: 22, background: `${action.color}15`, border: `1px solid ${action.color}` }}
                    >
                      <span style={{ fontSize: '11px', color: action.color }}>{statusIcon}</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" style={{ fontSize: '13px', color: '#f4f4f4' }}>{action.label}</span>
                        <div
                          className="rounded px-1.5 py-0.5"
                          style={{ background: `${action.color}15`, border: `1px solid ${action.color}40` }}
                        >
                          <span className="font-mono" style={{ fontSize: '9px', color: action.color, letterSpacing: '0.08em' }}>
                            {action.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#8d8d8d', lineHeight: 1.4 }}>{action.detail}</span>
                    </div>
                  </div>
                );
              })}

              {/* Recommended provider */}
              {visibleOrch >= 1 && (
                <div
                  className="rounded p-4 flex flex-col gap-2 fade-in"
                  style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}
                >
                  <span className="font-mono uppercase" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.1em' }}>RECOMMENDED PEDIATRICIAN</span>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white" style={{ fontSize: '15px' }}>Dr. Amy Patel</span>
                      <span style={{ fontSize: '12px', color: '#42be65' }}>Bennett County Health</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono" style={{ fontSize: '13px', color: '#f1c21b' }}>★ 4.8</span>
                      <span style={{ fontSize: '11px', color: '#8d8d8d' }}>0.8 mi away</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded px-2 py-0.5"
                      style={{ background: 'rgba(66,190,101,0.15)', border: '1px solid rgba(66,190,101,0.4)' }}
                    >
                      <span className="font-mono" style={{ fontSize: '10px', color: '#42be65' }}>IN-NETWORK</span>
                    </div>
                    <div
                      className="rounded px-2 py-0.5"
                      style={{ background: 'rgba(66,190,101,0.1)', border: '1px solid rgba(66,190,101,0.3)' }}
                    >
                      <span className="font-mono" style={{ fontSize: '10px', color: '#42be65' }}>ACCEPTING NEW PATIENTS</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Closing statement */}
              {closingReveal && (
                <div
                  className="rounded p-4 fade-in"
                  style={{
                    background: 'rgba(38,38,38,0.6)',
                    border: '1px solid rgba(57,57,57,0.6)',
                    borderLeft: '3px solid #fa4d56',
                  }}
                >
                  <p style={{ fontSize: '15px', color: '#c6c6c6', lineHeight: 1.7, fontStyle: 'italic' }}>
                    "The system doesn't just understand Maria. It understands everyone who depends on her."
                  </p>
                  <p className="mt-2" style={{ fontSize: '12px', color: '#6f6f6f', lineHeight: 1.5 }}>
                    Family record traversal · Dependent gap identification · Coordinated outreach — one message for two members.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Screen indicator */}
        <div
          className="absolute bottom-4 right-6 z-10 font-mono"
          style={{ color: '#6f6f6f', fontSize: '12px' }}
        >
          14 / 19
        </div>
      </div>
    </ScreenLayout>
  );
}
