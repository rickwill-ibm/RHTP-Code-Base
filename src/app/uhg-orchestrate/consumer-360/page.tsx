'use client';

import React, { useState, useEffect, useRef } from 'react';
import ScreenLayout from '@/uhg/components/shared/ScreenLayout';
import PresenterControls from '@/uhg/components/shared/PresenterControls';
import MariaStatusStrip from '@/uhg/components/shared/MariaStatusStrip';
import { useDemoStore } from '@/uhg/store/demoStore';

// ─── Journey milestone data ───────────────────────────────────────────────────

interface JourneyMilestone {
  id: string;
  day: number;
  label: string;
  sublabel: string;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  color: string;
}

const JOURNEY_MILESTONES: JourneyMilestone[] = [
  { id: 'jm-0',  day: 0,  label: 'Admission',     sublabel: 'Postpartum event',          color: '#fa4d56' },
  { id: 'jm-14', day: 14, label: 'Discharge',      sublabel: 'Post-acute transition',  color: '#f1c21b' },
  { id: 'jm-34', day: 34, label: 'HERE',            sublabel: 'Active monitoring',      isCurrent: true, color: '#42be65' },
  { id: 'jm-60', day: 60, label: 'Follow-up Appt', sublabel: 'Cardiology review',      isUpcoming: true, color: '#78a9ff' },
  { id: 'jm-90', day: 90, label: 'Episode Close',  sublabel: '90-day window end',      isUpcoming: true, color: '#8b5cf6' },
];

interface ExpectedSignal {
  id: string;
  type: 'expected' | 'unexpected' | 'positive';
  label: string;
  detail: string;
  icon: string;
  color: string;
}

const EXPECTED_SIGNALS: ExpectedSignal[] = [
  {
    id: 'es-auth',
    type: 'expected',
    label: 'Auth renewal',
    detail: 'Expected at Day 34 — standard post-discharge authorization cycle',
    icon: '✓',
    color: '#42be65',
  },
  {
    id: 'es-hba1c',
    type: 'unexpected',
    label: 'HbA1c care gap',
    detail: 'Unexpected — should have closed by Day 21. Now 13 days overdue.',
    icon: '⚠',
    color: '#f1c21b',
  },
  {
    id: 'es-portal',
    type: 'positive',
    label: 'Portal engagement',
    detail: 'Positive — expected post-discharge. 2x/week login indicates receptivity.',
    icon: '✓',
    color: '#42be65',
  },
];

interface ProfileAttribute {
  id: string;
  label: string;
  value: string;
  color: string;
}

const PROFILE_ATTRIBUTES: ProfileAttribute[] = [
  { id: 'pa-age',    label: 'Age',           value: '58',                    color: '#c6c6c6' },
  { id: 'pa-risk',   label: 'Risk Score',    value: '7.8 / 10',              color: '#fa4d56' },
  { id: 'pa-member', label: 'Member Since',  value: '2019',                  color: '#8d8d8d' },
  { id: 'pa-plan',   label: 'Plan',          value: 'SD Medicaid',          color: '#8d8d8d' },
  { id: 'pa-pcp',    label: 'PCP',           value: 'Bennett County Health',        color: '#78a9ff' },
  { id: 'pa-cond',   label: 'Conditions',    value: 'Postpartum Health',    color: '#8b5cf6' },
  { id: 'pa-auth',   label: 'Open Auth',     value: 'CAREGAP_HBA1C — T-4 days',   color: '#f1c21b' },
  { id: 'pa-consent',label: 'Consent',       value: 'FULL — all channels',   color: '#42be65' },
  { id: 'pa-cm',     label: 'Care Manager',  value: 'Sarah Johnson (H1ab)',     color: '#06b6d4' },
  { id: 'pa-dup',    label: '⚠ Dup Therapy', value: 'Lisinopril + Metformin',   color: '#fa4d56' },
];

// ─── Journey Timeline Component ───────────────────────────────────────────────

function JourneyTimeline({ visible }: { visible: boolean }) {
  const totalDays = 90;
  const currentDay = 34;
  const progressPct = (currentDay / totalDays) * 100;

  return (
    <div
      className="rounded flex flex-col gap-4 p-5 transition-all duration-500"
      style={{
        background: 'rgba(22,22,22,0.95)',
        border: '1px solid rgba(66,190,101,0.3)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#42be65', animation: 'authPulse 2s ease-in-out infinite' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#42be65', letterSpacing: '0.1em' }}>
            MARIA&apos;S CARE JOURNEY — Postpartum Episode
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.3)' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: '#42be65' }}>Day {currentDay} of {totalDays}</span>
          </div>
          <div className="rounded px-2 py-0.5" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: '#f59e0b' }}>{Math.round(progressPct)}% complete</span>
          </div>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative" style={{ paddingTop: 40, paddingBottom: 48 }}>
        {/* Track line */}
        <div
          className="absolute rounded-full"
          style={{ left: '5%', right: '5%', top: 56, height: 4, background: 'rgba(57,57,57,0.8)' }}
        />
        {/* Progress fill */}
        <div
          className="absolute rounded-full transition-all duration-1000"
          style={{ left: '5%', top: 56, height: 4, width: `${progressPct * 0.9}%`, background: 'linear-gradient(90deg, #fa4d56, #f1c21b, #42be65)' }}
        />

        {/* Milestones */}
        {JOURNEY_MILESTONES.map((milestone) => {
          const leftPct = 5 + (milestone.day / totalDays) * 90;
          return (
            <div
              key={milestone.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${leftPct}%`, transform: 'translateX(-50%)', top: 0 }}
            >
              {/* Day label above */}
              <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f', marginBottom: 4 }}>
                Day {milestone.day}
              </span>

              {/* Node */}
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  width: milestone.isCurrent ? 20 : 14,
                  height: milestone.isCurrent ? 20 : 14,
                  background: milestone.isCurrent ? milestone.color : milestone.isUpcoming ? 'rgba(57,57,57,0.8)' : milestone.color,
                  border: `2px solid ${milestone.color}`,
                  boxShadow: milestone.isCurrent ? `0 0 16px ${milestone.color}60` : 'none',
                  marginTop: milestone.isCurrent ? -3 : 0,
                  zIndex: milestone.isCurrent ? 10 : 1,
                  position: 'relative',
                }}
              >
                {milestone.isCurrent && (
                  <div className="rounded-full" style={{ width: 8, height: 8, background: '#161616' }} />
                )}
              </div>

              {/* Labels below */}
              <div className="flex flex-col items-center gap-0.5 mt-3">
                <span
                  className="font-semibold"
                  style={{
                    fontSize: milestone.isCurrent ? '13px' : '11px',
                    color: milestone.isCurrent ? milestone.color : milestone.isUpcoming ? '#6f6f6f' : '#c6c6c6',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {milestone.label}
                </span>
                <span style={{ fontSize: '10px', color: '#6f6f6f', whiteSpace: 'nowrap' }}>
                  {milestone.sublabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expected signals at Day 34 */}
      <div className="flex flex-col gap-2">
        <span style={{ fontSize: '11px', color: '#6f6f6f', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Expected signals at Day 34:
        </span>
        <div className="flex flex-col gap-1.5">
          {EXPECTED_SIGNALS.map((sig) => (
            <div key={sig.id} className="flex items-start gap-3">
              <span
                className="font-mono font-semibold flex-shrink-0"
                style={{ fontSize: '13px', color: sig.color, width: 16, textAlign: 'center' }}
              >
                {sig.icon}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold" style={{ fontSize: '12px', color: sig.type === 'unexpected' ? '#f1c21b' : '#c6c6c6' }}>
                  {sig.label}
                  {sig.type === 'unexpected' && (
                    <span className="font-mono ml-2" style={{ fontSize: '9px', color: '#f1c21b', background: 'rgba(241,194,27,0.12)', border: '1px solid rgba(241,194,27,0.3)', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.06em' }}>
                      UNEXPECTED
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '11px', color: '#6f6f6f', lineHeight: 1.4 }}>{sig.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity guidance */}
      <div
        className="rounded px-4 py-3 flex items-start gap-3"
        style={{ background: 'rgba(250,77,86,0.08)', border: '1px solid rgba(250,77,86,0.25)' }}
      >
        <div className="rounded px-2 py-0.5 flex-shrink-0" style={{ background: 'rgba(250,77,86,0.15)', border: '1px solid rgba(250,77,86,0.35)' }}>
          <span className="font-mono" style={{ fontSize: '9px', color: '#fa4d56', letterSpacing: '0.08em' }}>SENSITIVITY: HIGH</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: '12px', color: '#c6c6c6' }}>Communication guidance at this stage:</span>
          <span style={{ fontSize: '12px', color: '#f4f4f4' }}>Combine touchpoints — member fatigue risk. Single outreach preferred.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Channel History Timeline ─────────────────────────────────────────────────

interface ChannelEvent {
  id: string;
  day: number;
  channel: string;
  channelIcon: string;
  channelColor: string;
  type: string;
  outcome: string;
  annotation?: string;
}

const CHANNEL_HISTORY: ChannelEvent[] = [
  {
    id: 'ch-1',
    day: 1,
    channel: 'IVR',
    channelIcon: '☎',
    channelColor: '#8d8d8d',
    type: 'Self-service inquiry',
    outcome: 'Benefits menu navigated — no agent transfer',
    annotation: 'First contact post-discharge',
  },
  {
    id: 'ch-2',
    day: 8,
    channel: 'PHONE',
    channelIcon: '📞',
    channelColor: '#f59e0b',
    type: 'Outbound call attempt',
    outcome: 'No answer — voicemail left',
  },
  {
    id: 'ch-3',
    day: 11,
    channel: 'PHONE',
    channelIcon: '📞',
    channelColor: '#f59e0b',
    type: 'Outbound call attempt',
    outcome: 'No answer — 2nd unanswered attempt',
    annotation: '2 phone attempts unanswered → preference updated',
  },
  {
    id: 'ch-4',
    day: 14,
    channel: 'PORTAL',
    channelIcon: '⬡',
    channelColor: '#42be65',
    type: 'Portal login — self-initiated',
    outcome: 'Auth status viewed · Care plan accessed',
    annotation: 'Portal became primary — system learned',
  },
  {
    id: 'ch-5',
    day: 21,
    channel: 'PORTAL',
    channelIcon: '⬡',
    channelColor: '#42be65',
    type: 'Portal session — 18 min',
    outcome: 'HbA1c reminder acknowledged · Rx refill initiated',
  },
  {
    id: 'ch-6',
    day: 28,
    channel: 'PORTAL',
    channelIcon: '⬡',
    channelColor: '#42be65',
    type: 'Portal session — 12 min',
    outcome: 'Financial summary reviewed · Sophia care gap viewed',
  },
  {
    id: 'ch-7',
    day: 34,
    channel: 'PORTAL',
    channelIcon: '⬡',
    channelColor: '#42be65',
    type: 'Portal active — 2×/week pattern',
    outcome: 'Engagement window open — outreach scheduled 10am',
    annotation: 'Current — receptivity HIGH',
  },
];

function ChannelHistoryTimeline({ visible }: { visible: boolean }) {
  return (
    <div
      className="rounded flex flex-col gap-3 p-5 transition-all duration-500"
      style={{
        background: 'rgba(22,22,22,0.95)',
        border: '1px solid rgba(120,169,255,0.3)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 8px rgba(120,169,255,0.5)' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#78a9ff', letterSpacing: '0.1em' }}>
            CHANNEL HISTORY — Longitudinal Communication Context
          </span>
        </div>
        <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.3)' }}>
          <span className="font-mono" style={{ fontSize: '10px', color: '#42be65' }}>Day 1 → Day 34</span>
        </div>
      </div>

      {/* Channel progression summary */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'IVR', color: '#8d8d8d', day: 'Day 1' },
          { label: 'PHONE ×2', color: '#f59e0b', day: 'Day 8–11' },
          { label: 'PORTAL', color: '#42be65', day: 'Day 14+' },
        ].map((ch, i) => (
          <React.Fragment key={ch.label}>
            <div className="rounded px-2.5 py-1 flex items-center gap-1.5" style={{ background: `${ch.color}12`, border: `1px solid ${ch.color}40` }}>
              <div className="rounded-full" style={{ width: 6, height: 6, background: ch.color }} />
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: ch.color }}>{ch.label}</span>
              <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{ch.day}</span>
            </div>
            {i < 2 && <span style={{ fontSize: '14px', color: '#393939' }}>→</span>}
          </React.Fragment>
        ))}
        <div className="ml-auto rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.1)', border: '1px solid rgba(66,190,101,0.3)' }}>
          <span style={{ fontSize: '10px', color: '#42be65' }}>Portal preferred — learned, not configured</span>
        </div>
      </div>

      {/* Timeline events */}
      <div className="flex flex-col gap-0 relative" style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
        {/* Vertical connector line */}
        <div
          className="absolute"
          style={{ left: 28, top: 12, bottom: 12, width: 1, background: 'rgba(57,57,57,0.8)' }}
        />
        {CHANNEL_HISTORY.map((event, i) => (
          <div key={event.id} className="flex items-start gap-3 relative" style={{ paddingBottom: i < CHANNEL_HISTORY.length - 1 ? 10 : 0 }}>
            {/* Channel icon node */}
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
              style={{
                width: 28,
                height: 28,
                background: event.day === 34 ? event.channelColor : `${event.channelColor}18`,
                border: `1.5px solid ${event.channelColor}${event.day === 34 ? '' : '60'}`,
                boxShadow: event.day === 34 ? `0 0 10px ${event.channelColor}50` : 'none',
              }}
            >
              <span style={{ fontSize: '11px', color: event.day === 34 ? '#161616' : event.channelColor }}>{event.channelIcon}</span>
            </div>

            {/* Event content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="rounded px-1.5 py-0.5" style={{ background: `${event.channelColor}15`, border: `1px solid ${event.channelColor}40` }}>
                  <span className="font-mono font-bold" style={{ fontSize: '9px', color: event.channelColor, letterSpacing: '0.08em' }}>{event.channel}</span>
                </div>
                <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f' }}>Day {event.day}</span>
                <span style={{ fontSize: '11px', color: '#c6c6c6' }}>{event.type}</span>
              </div>
              <span style={{ fontSize: '10px', color: '#8d8d8d', lineHeight: 1.4, display: 'block', marginTop: 2 }}>{event.outcome}</span>
              {event.annotation && (
                <div className="rounded px-2 py-0.5 mt-1.5 inline-flex items-center gap-1.5" style={{ background: `${event.channelColor}10`, border: `1px solid ${event.channelColor}30` }}>
                  <span style={{ fontSize: '9px', color: '#6f6f6f' }}>↳</span>
                  <span style={{ fontSize: '10px', color: event.channelColor, fontStyle: 'italic' }}>{event.annotation}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Insight footer */}
      <div
        className="rounded px-4 py-2.5 flex items-start gap-3"
        style={{ background: 'rgba(120,169,255,0.06)', border: '1px solid rgba(120,169,255,0.25)' }}
      >
        <div className="rounded px-2 py-0.5 flex-shrink-0" style={{ background: 'rgba(120,169,255,0.15)', border: '1px solid rgba(120,169,255,0.35)' }}>
          <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.08em' }}>CHANNEL LEARNING</span>
        </div>
        <span style={{ fontSize: '11px', color: '#8d8d8d', lineHeight: 1.5 }}>
          Portal became primary after 2 failed phone attempts — system updated preference automatically on Day 14. Outreach today scheduled via portal at 10am based on 20 days of behavioral data.
        </span>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Consumer360Screen() {
  const setScreen = useDemoStore((s) => s.setScreen);
  const [profileVisible, setProfileVisible] = useState(false);
  const [journeyVisible, setJourneyVisible] = useState(false);
  const [signalsVisible, setSignalsVisible] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [consentDomainsOpen, setConsentDomainsOpen] = useState(false);
  const [householdOpen, setHouseholdOpen] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setScreen('consumer-360');
    const t1 = setTimeout(() => setProfileVisible(true), 300);
    const t2 = setTimeout(() => setJourneyVisible(true), 700);
    const t3 = setTimeout(() => setSignalsVisible(true), 1200);
    timerRefs.current.push(t1, t2, t3);
    return () => { timerRefs.current.forEach(clearTimeout); timerRefs.current = []; };
  }, [setScreen]);

  return (
    <ScreenLayout
      screenId="consumer-360"
      showPhaseArc
      phaseArcState={{ foundation: true, orchestration: false, autonomous: false }}
      showMiniProfile
    >
      <PresenterControls currentScreenId="consumer-360" />

      <MariaStatusStrip
        state="known"
        authStatus="AUTH T-4 days"
        careGapStatus="HbA1c Gap 45d"
        episodeStatus="Postpartum Health"
        visible
      />

      {/* Main content */}
      <div
        className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0"
        style={{ background: '#161616' }}
      >
        {/* Left: Profile card */}
        <div
          className="flex-shrink-0 flex flex-col gap-4 overflow-y-auto"
          style={{ width: 280 }}
        >
          {/* Identity card */}
          <div
            className="rounded p-5 flex flex-col gap-4 transition-all duration-500"
            style={{
              background: 'rgba(38,38,38,0.9)',
              border: '1px solid rgba(250,77,86,0.4)',
              opacity: profileVisible ? 1 : 0,
              transform: profileVisible ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{ width: 56, height: 56, background: 'rgba(250,77,86,0.15)', border: '2px solid rgba(250,77,86,0.5)' }}
              >
                <span className="font-semibold text-white" style={{ fontSize: '20px' }}>MR</span>
              </div>
              <div>
                <div className="font-semibold text-white" style={{ fontSize: '18px' }}>Maria Redhawk</div>
                <div className="font-mono" style={{ fontSize: '11px', color: '#fa4d56', letterSpacing: '0.06em' }}>MARIA_SD_001 · HIGH RISK</div>
              </div>
            </div>

            {/* Attributes */}
            <div className="flex flex-col gap-2">
              {PROFILE_ATTRIBUTES.map((attr) => (
                <div key={attr.id} className="flex items-center justify-between">
                  <span style={{ fontSize: '11px', color: '#6f6f6f' }}>{attr.label}</span>
                  <span style={{ fontSize: '12px', color: attr.color, fontWeight: attr.label === 'Risk Score' ? 600 : 400 }}>{attr.value}</span>
                </div>
              ))}
            </div>

            {/* Identity confidence */}
            <div className="rounded px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(66,190,101,0.1)', border: '1px solid rgba(66,190,101,0.3)' }}>
              <span style={{ fontSize: '11px', color: '#8d8d8d' }}>Identity confidence</span>
              <span className="font-mono font-semibold" style={{ fontSize: '14px', color: '#42be65' }}>97%</span>
            </div>
          </div>

          {/* Active signals summary */}
          {signalsVisible && (
            <div
              className="rounded p-4 flex flex-col gap-3 fade-in"
              style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(57,57,57,0.8)', opacity: 0 }}
            >
              <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.1em' }}>ACTIVE SIGNALS</span>
              {/* Duplicate Therapy Critical Alert */}
              <div
                className="rounded px-3 py-2 flex items-start gap-2"
                style={{ background: 'rgba(250,77,86,0.12)', border: '1.5px solid rgba(250,77,86,0.6)', boxShadow: '0 0 10px rgba(250,77,86,0.15)' }}
              >
                <div className="rounded-full flex-shrink-0 mt-0.5" style={{ width: 7, height: 7, background: '#fa4d56', animation: 'authPulse 1s ease-in-out infinite', boxShadow: '0 0 6px #fa4d56' }} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono font-bold" style={{ fontSize: '10px', color: '#fa4d56', letterSpacing: '0.06em' }}>⚠ Med review_ALERT — DUPLICATE_THERAPY</span>
                  <span style={{ fontSize: '10px', color: '#f4f4f4', lineHeight: 1.4 }}>Lisinopril (CVS) + Metformin (Walgreens) — same molecule — two prescribers</span>
                  <span style={{ fontSize: '9px', color: '#f87171' }}>A1C monitoring: 22d ago · Bleeding risk: ELEVATED</span>
                </div>
              </div>
              {/* Medication History — Duplicate Therapy */}
              <div className="rounded px-3 py-2 flex flex-col gap-1.5" style={{ background: 'rgba(250,77,86,0.06)', border: '1px solid rgba(250,77,86,0.3)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#fa4d56', letterSpacing: '0.08em' }}>ACTIVE MEDICATIONS — ANTICOAGULANTS</span>
                {[
                  { name: 'Lisinopril 5mg', type: 'Generic', prescriber: 'Bennett County Health', pharmacy: 'CVS #4821', fill: '2024-11-01', color: '#f1c21b' },
                  { name: 'Metformin 5mg', type: 'Brand', prescriber: 'Bennett County Health', pharmacy: 'Walgreens #7734', fill: '2024-10-28', color: '#fa4d56' },
                ].map((med) => (
                  <div key={med.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="rounded-full" style={{ width: 5, height: 5, background: med.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '10px', color: '#f4f4f4', fontWeight: 600 }}>{med.name}</span>
                      <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{med.type}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span style={{ fontSize: '9px', color: '#8d8d8d' }}>{med.prescriber} · {med.pharmacy}</span>
                    </div>
                  </div>
                ))}
                <div className="rounded px-2 py-1 mt-0.5" style={{ background: 'rgba(250,77,86,0.1)', border: '1px solid rgba(250,77,86,0.3)' }}>
                  <span style={{ fontSize: '9px', color: '#fa4d56' }}>⚠ DUPLICATE — Lisinopril Sodium · Same mechanism · Two prescribers unaware of each other</span>
                </div>
              </div>
              {[
                { id: 'as-auth',     label: 'AUTH_EXPIRY',    detail: 'T-4 days',       color: '#f1c21b', severity: 'HIGH' },
                { id: 'as-gap',      label: 'CARE_GAP',       detail: 'HbA1c 45d',      color: '#fa4d56', severity: 'HIGH' },
                { id: 'as-behavior', label: 'BEHAVIORAL',     detail: 'Portal 2x/wk',   color: '#42be65', severity: 'MEDIUM' },
                { id: 'as-mtm',      label: 'Med review_ALERT',      detail: 'Dup therapy',    color: '#fa4d56', severity: 'CRITICAL' },
              ].map((sig) => (
                <div key={sig.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full" style={{ width: 6, height: 6, background: sig.color, flexShrink: 0 }} />
                    <span className="font-mono" style={{ fontSize: '10px', color: sig.color, letterSpacing: '0.04em' }}>{sig.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '10px', color: '#8d8d8d' }}>{sig.detail}</span>
                    <div className="rounded px-1.5 py-0.5" style={{ background: `${sig.color}15` }}>
                      <span className="font-mono" style={{ fontSize: '8px', color: sig.color }}>{sig.severity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Care Manager context — H1ab */}
          {signalsVisible && (
            <div
              className="rounded p-4 flex flex-col gap-3 fade-in"
              style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.3)', opacity: 0, animationDelay: '0.3s' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#06b6d4', letterSpacing: '0.1em' }}>CARE MANAGER</span>
                <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }}>
                  <span className="font-mono" style={{ fontSize: '8px', color: '#06b6d4' }}>H1ab</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 32, height: 32, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)' }}
                >
                  <span className="font-semibold" style={{ fontSize: '12px', color: '#06b6d4' }}>SC</span>
                </div>
                <div>
                  <div className="font-semibold" style={{ fontSize: '13px', color: '#f4f4f4' }}>Sarah Johnson</div>
                  <div style={{ fontSize: '10px', color: '#8d8d8d' }}>Assigned care manager</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Care plan age</span>
                  <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#f87171' }}>47 days old</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Open tasks</span>
                  <span className="font-mono" style={{ fontSize: '11px', color: '#f1c21b' }}>3 pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Context freshness</span>
                  <span className="font-mono" style={{ fontSize: '11px', color: '#f87171' }}>STALE</span>
                </div>
              </div>
              <div className="rounded px-2.5 py-2" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
                <span style={{ fontSize: '10px', color: '#f87171', lineHeight: 1.4 }}>
                  Sarah is working from a 47-day-old snapshot — unaware of AUTH_EXPIRY, SDOH barriers, or family context.
                </span>
              </div>
            </div>
          )}

          {/* Provider Context — Bennett County Health */}
          {signalsVisible && (
            <div
              className="rounded p-4 flex flex-col gap-3 fade-in"
              style={{ background: 'rgba(12,85,184,0.05)', border: '1px solid rgba(12,85,184,0.35)', opacity: 0, animationDelay: '0.4s' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#78a9ff', letterSpacing: '0.1em' }}>PROVIDER CONTEXT</span>
                <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.35)' }}>
                  <span className="font-mono" style={{ fontSize: '8px', color: '#42be65' }}>CDS HOOK ACTIVE</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 32, height: 32, background: 'rgba(12,85,184,0.15)', border: '1px solid rgba(12,85,184,0.4)' }}
                >
                  <span className="font-semibold" style={{ fontSize: '11px', color: '#78a9ff' }}>DC</span>
                </div>
                <div>
                  <div className="font-semibold" style={{ fontSize: '13px', color: '#f4f4f4' }}>Bennett County Health</div>
                  <div style={{ fontSize: '10px', color: '#8d8d8d' }}>Cardiology · NPI: 1234567890</div>
                </div>
              </div>
              {/* Without integration */}
              <div className="rounded px-3 py-2.5 flex flex-col gap-1.5" style={{ background: 'rgba(250,77,86,0.06)', border: '1px solid rgba(250,77,86,0.25)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="rounded-full" style={{ width: 5, height: 5, background: '#fa4d56', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: '9px', color: '#fa4d56', letterSpacing: '0.08em' }}>WITHOUT INTEGRATION</span>
                </div>
                <span style={{ fontSize: '10px', color: '#8d8d8d', lineHeight: 1.4 }}>Claims history only — 14-day lag</span>
                <span style={{ fontSize: '10px', color: '#6f6f6f', lineHeight: 1.4 }}>Opens Maria&apos;s chart blind — no duplicate therapy alert, no SDOH context, no pre-approved auth visible</span>
              </div>
              {/* With integration */}
              <div className="rounded px-3 py-2.5 flex flex-col gap-1.5" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="rounded-full" style={{ width: 5, height: 5, background: '#42be65', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>WITH INTEGRATION</span>
                </div>
                <span style={{ fontSize: '10px', color: '#42be65', lineHeight: 1.4 }}>Real-time context · CDS Hook active</span>
                <div className="flex flex-col gap-1 mt-0.5">
                  {[
                    { label: 'Next appointment', value: '2024-11-15 10:00am', color: '#78a9ff' },
                    { label: 'Pre-visit brief', value: 'DELIVERED ✓', color: '#42be65' },
                    { label: 'Duplicate therapy', value: 'Flagged in EHR before visit', color: '#fa4d56' },
                    { label: 'Auth pre-approval', value: 'Visible — ready to order', color: '#42be65' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{row.label}</span>
                      <span style={{ fontSize: '10px', color: row.color, fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lifecycle Context — collapsible accordion */}
          {signalsVisible && (
            <div
              className="rounded flex flex-col fade-in"
              style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(57,57,57,0.8)', opacity: 0, animationDelay: '0.5s' }}
            >
              <button
                onClick={() => setLifecycleOpen((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
                }}
              >
                <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#78a9ff', letterSpacing: '0.1em' }}>LIFECYCLE CONTEXT</span>
                <span style={{ fontSize: '14px', color: '#6f6f6f', transform: lifecycleOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </button>
              {lifecycleOpen && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Enrolled', value: '3 years (SD Medicaid SD Medicaid)', color: '#c6c6c6' },
                    { label: 'Prior hospitalizations', value: '1 (cardiac, 2022)', color: '#f87171' },
                    { label: 'Plan transitions', value: '0', color: '#8d8d8d' },
                    { label: 'Life events', value: 'New dependent registered June 2024 (Sophia)', color: '#ff7eb6' },
                    { label: 'Caregiver status', value: 'Registered Nov 2024 (Elena)', color: '#c084fc' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-2">
                      <span style={{ fontSize: '10px', color: '#6f6f6f', flexShrink: 0 }}>{item.label}</span>
                      <span style={{ fontSize: '11px', color: item.color, textAlign: 'right', lineHeight: 1.4 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Consent Domains — collapsible accordion */}
          {signalsVisible && (
            <div
              className="rounded flex flex-col fade-in"
              style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(66,190,101,0.35)', opacity: 0, animationDelay: '0.6s' }}
            >
              <button
                onClick={() => setConsentDomainsOpen((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.1em' }}>CONSENT DOMAINS</span>
                  <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(241,194,27,0.12)', border: '1px solid rgba(241,194,27,0.35)' }}>
                    <span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b' }}>2 LIMITED</span>
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: '#6f6f6f', transform: consentDomainsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </button>
              {consentDomainsOpen && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { domain: 'SD Medicaid Commercial', scope: 'FULL — TPO', status: 'Active', statusColor: '#42be65', icon: '✓' },
                    { domain: 'Martin Pharmacy', scope: 'LIMITED', status: 'Fill history only', statusColor: '#f1c21b', icon: '⚠', note: 'Diagnosis excluded' },
                    { domain: 'Bennett County Health', scope: 'PENDING', status: 'Not granted', statusColor: '#9ca3af', icon: '✗' },
                    { domain: 'RHTP Care Management', scope: 'FULL', status: 'Active', statusColor: '#42be65', icon: '✓' },
                    { domain: 'Employer SD-MCD', scope: 'LIMITED', status: 'Wellness only', statusColor: '#f1c21b', icon: '⚠', note: 'Clinical excluded' },
                    { domain: 'Elena Proxy', scope: 'SCOPED', status: 'Meds + Appts', statusColor: '#c084fc', icon: '⊙' },
                  ].map((item) => (
                    <div
                      key={item.domain}
                      className="rounded px-2.5 py-2 flex flex-col gap-0.5"
                      style={{
                        background: item.statusColor === '#42be65' ? 'rgba(66,190,101,0.06)' : item.statusColor === '#f1c21b' ? 'rgba(241,194,27,0.06)' : item.statusColor === '#c084fc' ? 'rgba(192,132,252,0.06)' : 'rgba(28,28,28,0.6)',
                        border: `1px solid ${item.statusColor}25`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '11px', color: '#c6c6c6', fontWeight: 500 }}>{item.domain}</span>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '10px', color: '#6f6f6f' }}>{item.scope}</span>
                          <div className="rounded px-1.5 py-0.5" style={{ background: `${item.statusColor}15`, border: `1px solid ${item.statusColor}40` }}>
                            <span className="font-mono" style={{ fontSize: '8px', color: item.statusColor, letterSpacing: '0.06em' }}>{item.icon} {item.status}</span>
                          </div>
                        </div>
                      </div>
                      {'note' in item && item.note && (
                        <span style={{ fontSize: '9px', color: '#6f6f6f', fontStyle: 'italic' }}>{item.note}</span>
                      )}
                    </div>
                  ))}
                  <div className="rounded px-2.5 py-2 mt-1" style={{ background: 'rgba(241,194,27,0.06)', border: '1px solid rgba(241,194,27,0.25)' }}>
                    <span style={{ fontSize: '10px', color: '#f1c21b', lineHeight: 1.4 }}>
                      Consent verified at domain level before every cross-org agent action. Martin Pharmacy Med review blocked — diagnosis scope insufficient.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Communication Permissions — collapsible */}
          {signalsVisible && (
            <div
              className="rounded flex flex-col fade-in"
              style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(57,57,57,0.8)', opacity: 0, animationDelay: '0.7s' }}
            >
              <button
                onClick={() => setPermissionsOpen((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
                }}
              >
                <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.1em' }}>COMMUNICATION PERMISSIONS</span>
                <span style={{ fontSize: '14px', color: '#6f6f6f', transform: permissionsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </button>
              {permissionsOpen && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    {[
                      { channel: 'Portal', status: 'OPT-IN', ok: true },
                      { channel: 'SMS', status: 'OPT-IN', ok: true },
                      { channel: 'Phone', status: 'OPT-IN', ok: true },
                      { channel: 'Email', status: 'OPT-OUT', ok: false },
                      { channel: 'Marketing', status: 'OPT-OUT', ok: false },
                    ].map((p) => (
                      <div
                        key={p.channel}
                        style={{
                          borderRadius: 4, padding: '3px 8px',
                          background: p.ok ? 'rgba(66,190,101,0.1)' : 'rgba(156,163,175,0.1)',
                          border: `1px solid ${p.ok ? 'rgba(66,190,101,0.3)' : 'rgba(156,163,175,0.3)'}`,
                        }}
                      >
                        <span style={{ fontSize: '10px', color: p.ok ? '#42be65' : '#9ca3af' }}>{p.channel}: {p.status} {p.ok ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderRadius: 4, padding: '5px 8px', background: 'rgba(241,194,27,0.08)', border: '1px solid rgba(241,194,27,0.25)' }}>
                    <span style={{ fontSize: '10px', color: '#f1c21b' }}>Frequency cap: 3 per 7 days — </span>
                    <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>2 used this week</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Journey map + context */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
          <div className="flex-shrink-0">
            <h2 className="font-semibold text-white" style={{ fontSize: '22px', letterSpacing: '-0.01em', marginBottom: 4 }}>
              Journey-Aware Context
            </h2>
            <p style={{ fontSize: '14px', color: '#8d8d8d' }}>
              The system knows where Maria is in her care journey — and what signals are expected vs unexpected at this stage.
            </p>
          </div>

          {/* Journey timeline */}
          <JourneyTimeline visible={journeyVisible} />

          {/* Channel History Timeline */}
          <ChannelHistoryTimeline visible={journeyVisible} />

          {/* Journey context for orchestration */}
          {journeyVisible && (
            <div
              className="rounded p-4 flex flex-col gap-3 fade-in"
              style={{ background: 'rgba(12,85,184,0.06)', border: '1px solid rgba(12,85,184,0.3)', opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-full" style={{ width: 7, height: 7, background: '#78a9ff' }} />
                <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>
                  ORCHESTRATION CONTEXT — WHY THIS MATTERS
                </span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {[
                  {
                    id: 'oc-1',
                    title: 'Auth signal is expected',
                    detail: 'Day 34 is the standard auth renewal window for post-acute cardiac. System knows this — no escalation needed.',
                    color: '#42be65',
                  },
                  {
                    id: 'oc-2',
                    title: 'HbA1c gap is off-track',
                    detail: 'Should have closed by Day 21. The system flags this as unexpected — not just a gap, but a deviation from expected trajectory.',
                    color: '#f1c21b',
                  },
                  {
                    id: 'oc-3',
                    title: 'Portal engagement = window',
                    detail: 'Elevated engagement at Day 34 is a positive signal. System treats it as a receptivity window — act now, not later.',
                    color: '#78a9ff',
                  },
                ].map((item) => (
                  <div key={item.id} className="rounded p-3 flex flex-col gap-1.5" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                    <span className="font-semibold" style={{ fontSize: '12px', color: item.color }}>{item.title}</span>
                    <span style={{ fontSize: '11px', color: '#8d8d8d', lineHeight: 1.45 }}>{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Household Panel — collapsible */}
          {signalsVisible && (
            <div
              className="rounded flex flex-col fade-in"
              style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(255,126,182,0.35)', opacity: 0, animationDelay: '0.9s' }}
            >
              <button
                onClick={() => setHouseholdOpen((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#ff7eb6', letterSpacing: '0.1em' }}>HOUSEHOLD</span>
                  <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(255,126,182,0.12)', border: '1px solid rgba(255,126,182,0.35)' }}>
                    <span className="font-mono" style={{ fontSize: '8px', color: '#ff7eb6' }}>3 MEMBERS</span>
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: '#6f6f6f', transform: householdOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </button>
              {householdOpen && (
                <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Household members */}
                  {[
                    { id: 'MARIA_SD_001', name: 'Maria Redhawk', role: 'Primary member', risk: 'HIGH 7.8', riskColor: '#fa4d56', initials: 'MR' },
                    { id: 'SD CHIP', name: 'Sophia Reyes', role: 'Dependent, age 2', risk: 'MODERATE', riskColor: '#f1c21b', initials: 'SR', note: 'No PCP · 6 gaps' },
                    { id: 'ELENA_SD_003', name: 'Elena Redhawk', role: 'Caregiver context', risk: 'HIGH (meds)', riskColor: '#fa4d56', initials: 'ER', note: 'Proxy consent: SCOPED' },
                  ].map((member) => (
                    <div key={member.id} className="flex items-center gap-2.5 rounded px-2.5 py-2" style={{ background: 'rgba(38,38,38,0.6)', border: '1px solid rgba(57,57,57,0.5)' }}>
                      <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, background: 'rgba(255,126,182,0.12)', border: '1px solid rgba(255,126,182,0.35)' }}>
                        <span className="font-semibold" style={{ fontSize: '9px', color: '#ff7eb6' }}>{member.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span style={{ fontSize: '11px', color: '#f4f4f4', fontWeight: 500 }}>{member.name}</span>
                          <span className="font-mono" style={{ fontSize: '9px', color: member.riskColor }}>{member.risk}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#6f6f6f' }}>{member.role}</span>
                        {'note' in member && member.note && (
                          <span style={{ fontSize: '9px', color: '#f1c21b', display: 'block' }}>{member.note}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Outreach load */}
                  <div className="rounded px-2.5 py-2 flex flex-col gap-2" style={{ background: 'rgba(241,194,27,0.06)', border: '1px solid rgba(241,194,27,0.25)' }}>
                    <span className="font-mono" style={{ fontSize: '9px', color: '#f1c21b', letterSpacing: '0.08em' }}>HOUSEHOLD OUTREACH LOAD — THIS WEEK</span>
                    {[
                      { name: 'Maria', used: 2, cap: 3, color: '#f1c21b' },
                      { name: 'Sophia', used: 0, cap: 3, color: '#42be65' },
                      { name: 'Elena', used: 1, cap: 3, color: '#c084fc', note: 'A1C reminder pending' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span style={{ fontSize: '10px', color: '#8d8d8d', width: 36 }}>{item.name}</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((dot) => (
                            <div key={dot} className="rounded-full" style={{ width: 8, height: 8, background: dot < item.used ? item.color : 'rgba(57,57,57,0.6)', border: `1px solid ${dot < item.used ? item.color + '80' : 'rgba(57,57,57,0.4)'}` }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{item.used}/{item.cap} cap</span>
                        {'note' in item && item.note && (
                          <span style={{ fontSize: '9px', color: item.color, fontStyle: 'italic' }}>{item.note}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Combined outreach opportunity */}
                  <div className="rounded px-2.5 py-2 flex flex-col gap-1" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.25)' }}>
                    <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>COMBINED OUTREACH OPPORTUNITY</span>
                    <span style={{ fontSize: '10px', color: '#c6c6c6', lineHeight: 1.4 }}>Maria + Sophia: single message — cardiac + pediatric update</span>
                    <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Reduces household outreach load · Improves engagement likelihood</span>
                  </div>

                  {/* Shared preferences */}
                  <div className="rounded px-2.5 py-2 flex flex-col gap-1.5" style={{ background: 'rgba(120,169,255,0.06)', border: '1px solid rgba(120,169,255,0.25)' }}>
                    <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.08em' }}>HOUSEHOLD PREFERENCES</span>
                    {[
                      { label: 'Combined outreach', value: 'PREFERRED — Maria confirmed' },
                      { label: 'Timing', value: 'Weekdays 9–11am (Maria + Sophia)' },
                      { label: 'Language', value: 'English (all household members)' },
                      { label: 'Channel', value: 'Portal primary — Maria' },
                      { label: 'Care manager', value: 'Sarah Johnson — covers Maria + Sophia' },
                    ].map((pref) => (
                      <div key={pref.label} className="flex items-start justify-between gap-2">
                        <span style={{ fontSize: '9px', color: '#6f6f6f', flexShrink: 0 }}>{pref.label}</span>
                        <span style={{ fontSize: '10px', color: '#c6c6c6', textAlign: 'right', lineHeight: 1.3 }}>{pref.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ScreenLayout>
  );
}
