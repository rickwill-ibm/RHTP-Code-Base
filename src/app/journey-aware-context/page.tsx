'use client';
import React, { useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';

// ─── Named Constants — Maria Redhawk · SD RHTP Demo ──────────────────────────
const MEMBER_NAME = 'Maria Redhawk';
const MEMBER_ID = 'MARIA_SD_001';
const MEMBER_LOCATION = 'Martin, SD 57551 · Bennett County';
const MEMBER_PROGRAM = 'SD RHTP Track 3 · Medicaid';

// Active window: post-shift, pre-caregiving
const ACTIVE_WINDOW_START_HOUR = 15; // 3:00 PM
const ACTIVE_WINDOW_END_HOUR = 19;   // 7:00 PM
const ACTIVE_WINDOW_LABEL = '3:00 PM – 7:00 PM';
const ACTIVE_WINDOW_SUBTEXT = 'Post-shift · Weekdays only';

// Suppression band: work hours
const SUPPRESSION_START_HOUR = 6;  // 6:00 AM
const SUPPRESSION_END_HOUR = 14;   // 2:00 PM (14:00)
const SUPPRESSION_LABEL = '6:00 AM – 2:00 PM';
const SUPPRESSION_SUBTEXT = 'Work Hours — Outreach Suppressed';

// Engagement Intelligence stats
const PREFERRED_CHANNEL = 'SMS';
const PREFERRED_CHANNEL_SUBTEXT = 'Only viable channel — no broadband';
const ACTIVE_WINDOW_STAT = '3:00 PM – 7:00 PM';
const ACTIVE_WINDOW_STAT_SUBTEXT = 'Weekdays only · post-shift';
const SESSION_FREQUENCY = '2.1x / week';
const SESSION_FREQUENCY_SUBTEXT = 'SMS initiated — no portal sessions';
const LAST_TOUCHPOINT_DAYS = 2;
const LAST_TOUCHPOINT_CHANNEL = 'SMS';
const LAST_TOUCHPOINT_SUBTEXT = 'WIC eligibility notice · Engaged';

// Suppression rules
const SUPPRESSION_RULES = [
  { id: 'sr-1', icon: '🚫', label: 'No outreach 6:00 AM – 3:00 PM (work hours)', color: '#EF4444', bg: '#EF444422' },
  { id: 'sr-2', icon: '🚫', label: 'No outreach after 7:00 PM (caregiving hours)', color: '#EF4444', bg: '#EF444422' },
  { id: 'sr-3', icon: '🚫', label: 'No portal / email outreach (digital divide)', color: '#F59E0B', bg: '#F59E0B22' },
  { id: 'sr-4', icon: '🚫', label: 'No duplicate SMS within 4 hours', color: '#F59E0B', bg: '#F59E0B22' },
  { id: 'sr-5', icon: '✓',  label: 'Caregiver (Elena): SMS only · clinical summary scope · no BH', color: '#84CC16', bg: '#84CC1622' },
  { id: 'sr-6', icon: '⚠',  label: 'BH outreach: 42 CFR Part 2 consent required before any BH content in SMS', color: '#a78bfa', bg: '#a78bfa22' },
];

// Channel definitions
const CHANNELS = [
  { key: 'sms',       label: 'SMS',         color: '#84CC16', inactive: false, note: null },
  { key: 'phone',     label: 'Phone',       color: '#0EA5E9', inactive: false, note: null },
  { key: 'inperson',  label: 'In-Person',   color: '#8B5CF6', inactive: false, note: null },
  { key: 'portal',    label: 'Portal',      color: '#475569', inactive: true,  note: 'No broadband · portal access blocked' },
  { key: 'mobile',    label: 'Mobile App',  color: '#334155', inactive: true,  note: 'App not installed · basic smartphone' },
  { key: 'email',     label: 'Email',       color: '#374151', inactive: true,  note: 'Email not primary — SMS preferred' },
];

type OutcomeType = 'engaged' | 'ignored' | 'suppressed' | 'converted' | 'no_answer' | 'consent_check';
type InteractionType = 'outreach' | 'response' | 'escalation' | 'session' | 'inbound' | 'outbound' | 'visit';

interface Interaction {
  id: string;
  channel: string;
  dayOffset: number;
  hourOfDay: number;
  type: InteractionType;
  outcome: OutcomeType;
  agent: string;
  note: string;
  timestamp: string;
}

// Timeline: 90 days. dayOffset = days ago (0 = today, 90 = oldest)
const TIMELINE_DAYS = 90;

const INTERACTIONS: Interaction[] = [
  // SMS (primary — 8 interactions)
  { id: 'sms-1',  channel: 'sms', dayOffset: 2,  hourOfDay: 15, type: 'outreach',   outcome: 'engaged',       agent: 'Agent 8',        note: 'WIC eligibility notice',                    timestamp: 'Day 2 · 3:47 PM' },
  { id: 'sms-2',  channel: 'sms', dayOffset: 4,  hourOfDay: 16, type: 'response',   outcome: 'converted',     agent: 'Agent 10',       note: 'Childcare subsidy — replied YES',            timestamp: 'Day 4 · 4:12 PM' },
  { id: 'sms-3',  channel: 'sms', dayOffset: 7,  hourOfDay: 15, type: 'outreach',   outcome: 'engaged',       agent: 'Agent 10',       note: 'SNAP renewal T+47d reminder',               timestamp: 'Day 7 · 3:55 PM' },
  { id: 'sms-4',  channel: 'sms', dayOffset: 14, hourOfDay: 16, type: 'outreach',   outcome: 'ignored',       agent: 'Agent 9',        note: 'Edinburgh PND screening link',              timestamp: 'Day 14 · 4:30 PM' },
  { id: 'sms-5',  channel: 'sms', dayOffset: 21, hourOfDay: 17, type: 'escalation', outcome: 'engaged',       agent: 'Agent 6',        note: 'HbA1c appointment coordination',            timestamp: 'Day 21 · 5:15 PM' },
  { id: 'sms-6',  channel: 'sms', dayOffset: 28, hourOfDay: 8,  type: 'outreach',   outcome: 'suppressed',    agent: 'Consent Agent',  note: 'Sent outside window — blocked (8 AM)',      timestamp: 'Day 28 · 8:00 AM' },
  { id: 'sms-7',  channel: 'sms', dayOffset: 42, hourOfDay: 16, type: 'response',   outcome: 'converted',     agent: 'Agent 10',       note: 'Transportation CBO — confirmed',            timestamp: 'Day 42 · 4:05 PM' },
  { id: 'sms-8',  channel: 'sms', dayOffset: 56, hourOfDay: 15, type: 'outreach',   outcome: 'engaged',       agent: 'Agent 9',        note: 'Sophia well-child reminder',                timestamp: 'Day 56 · 3:30 PM' },
  // Phone (inbound only — 3 interactions)
  { id: 'ph-1',   channel: 'phone', dayOffset: 5,  hourOfDay: 16, type: 'inbound',  outcome: 'engaged',       agent: 'Sarah Johnson',  note: 'Called re: childcare subsidy details',      timestamp: 'Day 5 · 4:45 PM' },
  { id: 'ph-2',   channel: 'phone', dayOffset: 17, hourOfDay: 17, type: 'outbound', outcome: 'no_answer',     agent: 'Sarah Johnson',  note: 'Care manager follow-up attempt',            timestamp: 'Day 17 · 5:10 PM' },
  { id: 'ph-3',   channel: 'phone', dayOffset: 34, hourOfDay: 16, type: 'inbound',  outcome: 'engaged',       agent: 'Bennett DSS',    note: 'Bennett County DSS — benefit question',     timestamp: 'Day 34 · 4:20 PM' },
  // In-Person CHW (2 interactions)
  { id: 'ip-1',   channel: 'inperson', dayOffset: 8,  hourOfDay: 10, type: 'visit', outcome: 'converted',     agent: 'CHW Team',       note: 'CHW home visit · 412 Main St Martin · PRAPARE completed', timestamp: 'Day 8 · 10:00 AM' },
  { id: 'ip-2',   channel: 'inperson', dayOffset: 21, hourOfDay: 14, type: 'visit', outcome: 'engaged',       agent: 'Sarah Johnson',  note: 'Bennett County Health PCP · Sophia in room', timestamp: 'Day 21 · 2:30 PM' },
  // Portal (blocked — 1 interaction 90 days ago)
  { id: 'po-1',   channel: 'portal', dayOffset: 90, hourOfDay: 9,  type: 'outreach', outcome: 'ignored',      agent: 'System',         note: 'Portal registration link sent — not opened', timestamp: 'Day 90 · 9:00 AM' },
  // Email (not used — 1 interaction)
  { id: 'em-1',   channel: 'email', dayOffset: 60, hourOfDay: 9,  type: 'outreach',  outcome: 'ignored',      agent: 'SD DHSS',        note: 'SD DHSS enrollment notice — no email engagement', timestamp: 'Day 60 · 9:00 AM' },
];

const OUTCOME_CONFIG: Record<OutcomeType, { color: string; bg: string; label: string }> = {
  engaged:       { color: '#84CC16', bg: '#84CC1633', label: 'Engaged' },
  converted:     { color: '#a78bfa', bg: '#a78bfa33', label: 'Converted' },
  ignored:       { color: '#94a3b8', bg: '#94a3b833', label: 'Ignored' },
  suppressed:    { color: '#EF4444', bg: '#EF444433', label: 'Suppressed' },
  no_answer:     { color: '#F59E0B', bg: '#F59E0B33', label: 'No Answer' },
  consent_check: { color: '#F59E0B', bg: '#F59E0B33', label: 'Consent Check' },
};

const TYPE_CONFIG: Record<InteractionType, { label: string }> = {
  outreach:   { label: 'Outreach' },
  response:   { label: 'Response' },
  escalation: { label: 'Escalation' },
  session:    { label: 'Session' },
  inbound:    { label: 'Inbound' },
  outbound:   { label: 'Outbound' },
  visit:      { label: 'Visit' },
};

// Conversion intelligence data
const CONVERSION_DATA = [
  { label: 'SMS In-Window',   rate: 78, color: '#84CC16', note: 'suppression working' },
  { label: 'SMS Out-Window',  rate: 8,  color: '#EF4444', note: 'suppression working' },
  { label: 'In-Person CHW',   rate: 100, color: '#8B5CF6', note: 'highest value' },
  { label: 'Phone Inbound',   rate: 67, color: '#0EA5E9', note: '' },
  { label: 'Portal',          rate: 0,  color: '#475569', note: 'access barrier' },
];

// Time axis: 24-hour day (0–23). Active window 15–19, suppression 6–14.
// X-axis represents hour of day (0 = midnight left, 23 = 11pm right)
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p', '11p'];
const HOUR_LABEL_POSITIONS = [0, 3, 6, 9, 12, 15, 18, 21, 23]; // hours

function getXPercent(hour: number): number {
  return (hour / 23) * 100;
}

interface TooltipData {
  interaction: Interaction;
  x: number;
  y: number;
}

export default function JourneyAwareContextPage() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const suppressionLeft = getXPercent(SUPPRESSION_START_HOUR);
  const suppressionRight = 100 - getXPercent(SUPPRESSION_END_HOUR);
  const activeLeft = getXPercent(ACTIVE_WINDOW_START_HOUR);
  const activeRight = 100 - getXPercent(ACTIVE_WINDOW_END_HOUR);

  const handleDotEnter = (e: React.MouseEvent, interaction: Interaction) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const chartRect = chartRef.current?.getBoundingClientRect();
    if (!chartRect) return;
    setTooltip({
      interaction,
      x: rect.left - chartRect.left + rect.width / 2,
      y: rect.top - chartRect.top,
    });
  };

  const handleDotLeave = () => setTooltip(null);

  return (
    <AppLayout
      pageTitle="Journey-Aware Context"
      breadcrumbs={[
        { label: 'CDP & Agentic Automation' },
        { label: 'Journey-Aware Context' },
      ]}
    >
      {/* Member Context Banner */}
      <div
        className="mb-6 px-4 py-3 flex items-center gap-4 border"
        style={{ background: '#0f172a', borderColor: '#1e293b' }}
      >
        <div
          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
          style={{ background: '#F59E0B22' }}
        >
          <Icon name="UserIcon" size={18} className="text-[#F59E0B]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{MEMBER_NAME}</p>
          <p className="text-xs" style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>
            {MEMBER_ID} · {MEMBER_LOCATION} · {MEMBER_PROGRAM}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="px-2 py-1 text-xs font-semibold"
            style={{ background: '#F59E0B22', color: '#F59E0B', border: '1px solid #F59E0B44' }}
          >
            ● ACTIVE WINDOW {ACTIVE_WINDOW_LABEL}
          </span>
          <span
            className="px-2 py-1 text-xs font-semibold"
            style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444444' }}
          >
            ⊘ SUPPRESSED {SUPPRESSION_LABEL}
          </span>
        </div>
      </div>

      {/* ─── SECTION 1: CHANNEL HISTORY ─────────────────────────────────────── */}
      <div
        className="mb-6 border"
        style={{ background: '#0a0f1e', borderColor: '#1e293b' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2"
          style={{ borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-2">
            <Icon name="ChartBarIcon" size={16} className="text-[#F59E0B]" />
            <span className="text-sm font-semibold text-white uppercase tracking-wide">
              Section 1 — Channel History · Longitudinal Communication Context
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: '#94a3b8' }}>
            {Object.entries(OUTCOME_CONFIG).filter(([k]) => ['engaged','converted','ignored','suppressed'].includes(k)).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>

        {/* Band legend */}
        <div
          className="px-5 py-2 flex items-center gap-6 border-b flex-wrap"
          style={{ borderColor: '#1e293b', background: '#0f172a' }}
        >
          <span className="flex items-center gap-2 text-xs" style={{ color: '#F59E0B' }}>
            <span className="w-4 h-3 inline-block rounded-sm" style={{ background: '#F59E0B20', border: '1px solid #F59E0B55' }} />
            Maria&apos;s Active Window · Post-Shift · {ACTIVE_WINDOW_LABEL} Weekdays
          </span>
          <span className="flex items-center gap-2 text-xs" style={{ color: '#EF4444' }}>
            <span className="w-4 h-3 inline-block rounded-sm" style={{ background: '#EF444415', border: '1px solid #EF444440' }} />
            Work Hours — Outreach Suppressed · {SUPPRESSION_LABEL}
          </span>
          <span className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#475569' }} />
            Inactive channel (access barrier)
          </span>
        </div>

        {/* Swimlane Chart */}
        <div className="px-5 py-4" ref={chartRef} style={{ position: 'relative' }}>
          {/* Hour axis header */}
          <div className="flex mb-1 pl-28 pr-2">
            {HOUR_LABEL_POSITIONS.map((h, i) => (
              <div
                key={i}
                className="absolute text-xs"
                style={{
                  color: '#475569',
                  left: `calc(7rem + ${getXPercent(h)}% * (100% - 7rem - 0.5rem) / 100)`,
                  top: '1rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  transform: 'translateX(-50%)',
                }}
              >
                {HOUR_LABELS[i]}
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {CHANNELS.map((ch) => {
              const chInteractions = INTERACTIONS.filter((i) => i.channel === ch.key);
              return (
                <div key={ch.key} className="flex items-center gap-3">
                  {/* Channel label */}
                  <div className="w-24 flex-shrink-0 flex items-center justify-end gap-1.5 pr-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: ch.inactive ? '#475569' : ch.color, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {ch.label}
                    </span>
                    {ch.inactive && (
                      <span className="text-xs px-1" style={{ color: '#475569', background: '#1e293b', fontSize: '9px' }}>
                        OFF
                      </span>
                    )}
                  </div>

                  {/* Lane track */}
                  <div
                    className="flex-1 relative h-9 rounded-sm overflow-hidden"
                    style={{
                      background: ch.inactive ? '#0f172a' : ch.color + '0a',
                      border: `1px solid ${ch.inactive ? '#1e293b' : ch.color + '25'}`,
                      opacity: ch.inactive ? 0.5 : 1,
                    }}
                  >
                    {/* Suppression band (red) */}
                    <div
                      className="absolute inset-y-0 pointer-events-none"
                      style={{
                        left: `${suppressionLeft}%`,
                        right: `${suppressionRight}%`,
                        background: '#EF444410',
                        borderLeft: '1px solid #EF444430',
                        borderRight: '1px solid #EF444430',
                      }}
                    />
                    {/* Active window band (gold) */}
                    <div
                      className="absolute inset-y-0 pointer-events-none"
                      style={{
                        left: `${activeLeft}%`,
                        right: `${activeRight}%`,
                        background: '#F59E0B14',
                        borderLeft: '1px solid #F59E0B50',
                        borderRight: '1px solid #F59E0B50',
                      }}
                    />

                    {/* Interaction dots */}
                    {chInteractions.map((interaction) => {
                      const xPct = getXPercent(interaction.hourOfDay);
                      const outcomeConf = OUTCOME_CONFIG[interaction.outcome];
                      const isInActiveWindow =
                        interaction.hourOfDay >= ACTIVE_WINDOW_START_HOUR &&
                        interaction.hourOfDay < ACTIVE_WINDOW_END_HOUR;
                      const isInSuppression =
                        interaction.hourOfDay >= SUPPRESSION_START_HOUR &&
                        interaction.hourOfDay < SUPPRESSION_END_HOUR;
                      const isHovered = tooltip?.interaction.id === interaction.id;

                      return (
                        <div
                          key={interaction.id}
                          className="absolute top-1/2 cursor-pointer"
                          style={{
                            left: `${xPct}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => handleDotEnter(e, interaction)}
                          onMouseLeave={handleDotLeave}
                        >
                          {/* Pulse ring */}
                          {isHovered && (
                            <div
                              className="absolute rounded-full"
                              style={{
                                width: 22,
                                height: 22,
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: outcomeConf.color + '30',
                                border: `1px solid ${outcomeConf.color}80`,
                                animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                              }}
                            />
                          )}
                          {/* Dot */}
                          <div
                            style={{
                              width: isHovered ? 14 : 10,
                              height: isHovered ? 14 : 10,
                              borderRadius: '50%',
                              background: outcomeConf.color,
                              border: isInActiveWindow
                                ? '2px solid #F59E0B'
                                : isInSuppression
                                ? '2px solid #EF4444'
                                : `1.5px solid ${outcomeConf.color}88`,
                              boxShadow: isHovered ? `0 0 8px ${outcomeConf.color}` : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        </div>
                      );
                    })}

                    {/* Inactive note */}
                    {ch.inactive && ch.note && (
                      <div
                        className="absolute inset-0 flex items-center px-3"
                        style={{ color: '#475569', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {ch.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: Math.min(tooltip.x, 520),
                top: tooltip.y - 10,
                transform: 'translate(-50%, -100%)',
                minWidth: 240,
                maxWidth: 300,
              }}
            >
              <div
                className="p-3 border text-xs"
                style={{ background: '#0f172a', borderColor: '#334155', boxShadow: '0 8px 32px #00000080' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: OUTCOME_CONFIG[tooltip.interaction.outcome].color }}
                  />
                  <span className="font-semibold text-white">
                    {TYPE_CONFIG[tooltip.interaction.type].label}
                  </span>
                  <span
                    className="ml-auto px-1.5 py-0.5 text-xs font-medium"
                    style={{
                      background: OUTCOME_CONFIG[tooltip.interaction.outcome].bg,
                      color: OUTCOME_CONFIG[tooltip.interaction.outcome].color,
                    }}
                  >
                    {OUTCOME_CONFIG[tooltip.interaction.outcome].label}
                  </span>
                </div>
                <div className="space-y-1" style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                  <div><span style={{ color: '#64748b' }}>Time:</span> {tooltip.interaction.timestamp}</div>
                  <div><span style={{ color: '#64748b' }}>Agent:</span> {tooltip.interaction.agent}</div>
                  <div><span style={{ color: '#e2e8f0' }}>{tooltip.interaction.note}</span></div>
                  {tooltip.interaction.hourOfDay >= ACTIVE_WINDOW_START_HOUR && tooltip.interaction.hourOfDay < ACTIVE_WINDOW_END_HOUR && (
                    <div style={{ color: '#F59E0B' }}>● Within active window</div>
                  )}
                  {tooltip.interaction.hourOfDay >= SUPPRESSION_START_HOUR && tooltip.interaction.hourOfDay < SUPPRESSION_END_HOUR && (
                    <div style={{ color: '#EF4444' }}>⊘ Within suppression band</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION 2: ENGAGEMENT INTELLIGENCE PANEL ───────────────────────── */}
      <div
        className="mb-6 border"
        style={{ background: '#0a0f1e', borderColor: '#1e293b' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center gap-2"
          style={{ borderColor: '#1e293b' }}
        >
          <Icon name="LightBulbIcon" size={16} className="text-[#F59E0B]" />
          <span className="text-sm font-semibold text-white uppercase tracking-wide">
            Section 2 — Engagement Intelligence Panel
          </span>
        </div>

        {/* Stat Cards */}
        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4 border-b" style={{ borderColor: '#1e293b' }}>
          {/* Card 1: Preferred Channel */}
          <div className="p-4 border" style={{ background: '#0f172a', borderColor: '#1e293b' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: '#84CC1622' }}>
                <Icon name="ChatBubbleLeftRightIcon" size={14} className="text-[#84CC16]" />
              </div>
              <span className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Preferred Channel</span>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: '#84CC16', fontFamily: 'JetBrains Mono, monospace' }}>
              {PREFERRED_CHANNEL}
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>{PREFERRED_CHANNEL_SUBTEXT}</p>
          </div>

          {/* Card 2: Active Window */}
          <div className="p-4 border" style={{ background: '#0f172a', borderColor: '#1e293b' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: '#F59E0B22' }}>
                <Icon name="ClockIcon" size={14} className="text-[#F59E0B]" />
              </div>
              <span className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Active Window</span>
            </div>
            <p className="text-lg font-bold mb-1" style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
              {ACTIVE_WINDOW_STAT}
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>{ACTIVE_WINDOW_STAT_SUBTEXT}</p>
          </div>

          {/* Card 3: Session Frequency */}
          <div className="p-4 border" style={{ background: '#0f172a', borderColor: '#1e293b' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: '#0EA5E922' }}>
                <Icon name="ArrowPathIcon" size={14} className="text-[#0EA5E9]" />
              </div>
              <span className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Session Frequency</span>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: '#0EA5E9', fontFamily: 'JetBrains Mono, monospace' }}>
              {SESSION_FREQUENCY}
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>{SESSION_FREQUENCY_SUBTEXT}</p>
          </div>

          {/* Card 4: Last Touchpoint */}
          <div className="p-4 border" style={{ background: '#0f172a', borderColor: '#1e293b' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: '#34d39922' }}>
                <Icon name="SignalIcon" size={14} className="text-[#34d399]" />
              </div>
              <span className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>Last Touchpoint</span>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
              {LAST_TOUCHPOINT_DAYS}d ago
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>{LAST_TOUCHPOINT_CHANNEL} · {LAST_TOUCHPOINT_SUBTEXT}</p>
          </div>
        </div>

        {/* Suppression Rules Panel */}
        <div className="px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ShieldExclamationIcon" size={14} className="text-[#EF4444]" />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>
              Active Suppression Rules
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUPPRESSION_RULES.map((rule) => (
              <span
                key={rule.id}
                className="px-3 py-1.5 text-xs font-medium"
                style={{
                  background: rule.bg,
                  color: rule.color,
                  border: `1px solid ${rule.color}44`,
                }}
              >
                {rule.icon} {rule.label}
              </span>
            ))}
          </div>
        </div>

        {/* Conversion Intelligence Strip */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="ChartBarIcon" size={14} className="text-[#F59E0B]" />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>
              Conversion Intelligence — Channel Engagement Rates for Maria
            </span>
          </div>
          <div className="space-y-3">
            {CONVERSION_DATA.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="w-36 flex-shrink-0 text-xs text-right"
                  style={{ color: item.color, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {item.label}
                </div>
                <div className="flex-1 relative h-5 rounded-sm overflow-hidden" style={{ background: '#1e293b' }}>
                  <div
                    className="h-full rounded-sm transition-all duration-700"
                    style={{ width: `${item.rate}%`, background: item.color + 'cc' }}
                  />
                </div>
                <div
                  className="w-12 text-xs text-right flex-shrink-0"
                  style={{ color: item.color, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {item.rate}%
                </div>
                {item.note && (
                  <div className="text-xs flex-shrink-0" style={{ color: '#475569', fontStyle: 'italic' }}>
                    ← {item.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ping {
          75%, 100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
      `}</style>
    </AppLayout>
  );
}
