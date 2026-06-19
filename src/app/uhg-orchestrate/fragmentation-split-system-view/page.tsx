'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import ScreenLayout from '@/uhg/components/shared/ScreenLayout';
import PresenterControls from '@/uhg/components/shared/PresenterControls';
import MariaStatusStrip from '@/uhg/components/shared/MariaStatusStrip';
import { useDemoStore } from '@/uhg/store/demoStore';

// ── Data ──────────────────────────────────────────────────────────────────────

const INTERNAL_ENTITIES = [
  {
    id: 'uhc',
    name: 'SD Medicaid',
    abbr: 'SD MEDICAID',
    color: '#3b82f6',
    sees: ['Eligibility & benefits', 'Claims & renewal', 'SNAP/WIC/LIHEAP'],
    blindTo: 'Clinical episodes, SDOH barriers, BH (42 CFR gated)',
  },
  {
    id: 'optumhealth',
    name: 'Bennett County Health',
    abbr: 'BENNETT CAH',
    color: '#22c55e',
    sees: ['Clinical encounters', 'EHR record', 'Care protocols'],
    blindTo: 'Medicaid auth status, pharmacy fills, social services',
  },
  {
    id: 'optumrx',
    name: 'Martin Pharmacy',
    abbr: 'MARTIN RX',
    color: '#a855f7',
    sees: ['Family fills (Elena + Sophia)', 'Adherence', 'Refill timing'],
    blindTo: 'Clinical episodes, diagnoses, claims context',
  },
  {
    id: 'rally',
    name: 'RHTP Care Management',
    abbr: 'RHTP CM',
    color: '#f59e0b',
    sees: ['Care plan & tasks', 'Open care gaps', 'CM: Sarah Johnson'],
    blindTo: 'Benefit enrollment, live pharmacy signals',
  },
  {
    id: 'change',
    name: 'CBO / Social Services',
    abbr: 'CBO/SOCIAL',
    color: '#06b6d4',
    sees: ['SNAP/WIC/LIHEAP', 'Housing waitlist', 'Childcare subsidy'],
    blindTo: 'The whole person — no clinical, eligibility, or BH link',
  },
];

const SYSTEMS = [
  {
    id: 'claims',
    name: 'MMIS / CLAIMS',
    color: '#3b82f6',
    knows: ['Cost trajectory', 'Procedure codes', 'Billing history'],
    blindSpot: 'No clinical context',
  },
  {
    id: 'ehr',
    name: 'CAH EHR',
    color: '#22c55e',
    knows: ['Clinical record', 'Diagnosis history', 'Medication list'],
    blindSpot: 'No Medicaid auth status',
  },
  {
    id: 'auth',
    name: 'ELIGIBILITY',
    color: '#f59e0b',
    knows: ['Medicaid active', 'Renewal T+89d', 'Benefit status'],
    blindSpot: 'No care gap view',
  },
  {
    id: 'care',
    name: 'RHTP CARE MGMT',
    color: '#a855f7',
    knows: ['Care plan active', 'HbA1c gap open', 'PND 427d overdue'],
    blindSpot: 'No benefit-enrollment link',
  },
  {
    id: 'h1ab',
    name: 'PHARMACY',
    color: '#06b6d4',
    knows: ['Martin Pharmacy', 'Family fills (Elena + Sophia)', 'Refill sync'],
    blindSpot: 'No live clinical signals',
    badge: 'FAMILY HUB',
  },
  {
    id: 'employer',
    name: 'BH · 42 CFR',
    color: '#f97316',
    knows: ['Edinburgh PND 11', 'Postpartum Support referral', 'Consent-gated'],
    blindSpot: 'Walled off — no system sees BH data',
    badge: '42 CFR PART 2',
  },
];

const ROLES = [
  {
    id: 'patient',
    label: 'PATIENT',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.30)',
    items: ['Postpartum · Day 427', 'Pre-diabetic A1C 6.2%', 'HbA1c gap open'],
    livesIn: 'CAH EHR + Medicaid claims',
  },
  {
    id: 'caregiver',
    label: 'CAREGIVER',
    subtitle: 'Elena Redhawk, 66',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.30)',
    items: ['Maria is caregiver', 'Medicare beneficiary', 'Lives 15 miles from Maria'],
    livesIn: 'Medicare · Separate residence (15mi from Maria)',
  },
  {
    id: 'parent',
    label: 'PARENT',
    subtitle: 'Sophia, age 2',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.07)',
    border: 'rgba(236,72,153,0.30)',
    items: ['Well-Child 24-mo overdue', 'CHIP active', 'Pediatric care'],
    livesIn: 'CHIP enrollment only',
  },
];

const GAPS = [
  { label: 'IDENTITY', detail: 'Records split across SD Medicaid, CAH, pharmacy, CBO — no single source' },
  { label: 'CONSENT', detail: '42 CFR Part 2 gates BH; Elena proxy consent PENDING' },
  { label: 'RELATIONSHIPS', detail: 'Sophia and Elena invisible — no household graph' },
  { label: 'PREFERENCES', detail: 'SMS-only (3-7pm) known only to outreach log' },
  { label: 'CAREGIVER PROXY', detail: 'No system aware Maria has legal proxy for Elena' },
  { label: 'JOURNEY CONTEXT', detail: 'No system knows she is Day 427 postpartum — unmanaged' },
  { label: 'ROLES', detail: 'Patient + Caregiver + Parent — never held simultaneously' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function FragmentationScreen() {
  const setScreen = useDemoStore((s) => s?.setScreen);
  const navigateNext = useDemoStore((s) => s?.navigateNext);
  const navigatePrev = useDemoStore((s) => s?.navigatePrev);

  const navLock = useRef(false);

  useEffect(() => {
    setScreen?.('fragmentation');
  }, [setScreen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (navLock.current || e.repeat) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navLock.current = true;
        navigateNext?.();
        setTimeout(() => { navLock.current = false; }, 700);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navLock.current = true;
        navigatePrev?.();
        setTimeout(() => { navLock.current = false; }, 700);
      }
    },
    [navigateNext, navigatePrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ScreenLayout
      screenId="fragmentation"
      showPhaseArc
      phaseArcState={{ foundation: true, orchestration: false, autonomous: false }}
      showMiniProfile={false}
    >
      <PresenterControls currentScreenId="fragmentation" />
      <MariaStatusStrip
        state="fragmented"
        visible
      />

      {/* Scrollable content */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#161616',
          overflowY: 'auto',
          padding: '16px 28px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Screen label + headline */}
        <div style={{ marginBottom: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6f6f6f', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            02 &nbsp;&nbsp; THE FRAGMENTED WORLD
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 300, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.01em', margin: '0 0 4px' }}>
            One enterprise. Five entities. Zero coordination.
          </h1>
          <p style={{ fontSize: 12, color: '#8d8d8d', margin: 0, lineHeight: 1.5 }}>
            The enterprise that owns the data cannot connect it — inside its own walls.
          </p>
        </div>

        {/* ── LAYER 1: Fragmented SD systems ── */}
        <div style={{ flexShrink: 0, marginBottom: 10 }}>
          <LayerDivider color="#ef4444" label="LAYER 1 — INTERNAL ENTERPRISE FRAGMENTATION" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {INTERNAL_ENTITIES.map((entity) => (
              <div
                key={entity.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 6,
                  border: `1px solid ${entity.color}33`,
                  borderLeft: `3px solid ${entity.color}`,
                  background: 'rgba(22,22,22,0.95)',
                }}
              >
                <div style={{ padding: '10px 12px 6px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: entity.color, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>
                    {entity.abbr}
                  </div>
                  <div style={{ fontSize: 11, color: '#d4d4d4', fontWeight: 500 }}>{entity.name}</div>
                </div>
                <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#6f6f6f', letterSpacing: '0.06em', marginBottom: 2 }}>SEES:</div>
                  {entity.sees.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ fontSize: 11, color: '#22c55e', marginTop: 1 }}>·</span>
                      <span style={{ fontSize: 10, color: '#c4c4c4', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px 10px' }}>
                  <div style={{ borderRadius: 4, padding: '5px 8px', background: 'rgba(180,30,30,0.18)', border: '1px solid rgba(220,50,50,0.40)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: '#f87171', letterSpacing: '0.05em', marginBottom: 2 }}>BLIND TO:</div>
                    <div style={{ fontSize: 9, color: '#fca5a5', lineHeight: 1.4 }}>{entity.blindTo}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 8,
            borderRadius: 5,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.20)',
            borderLeft: '3px solid rgba(239,68,68,0.60)',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#f87171', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>SAME SD MEDICAID PROGRAM</span>
            <span style={{ fontSize: 11, color: '#8d8d8d', lineHeight: 1.5 }}>
              Five systems. Same SD Medicaid residents, 47 miles apart. No shared identity graph, no consent framework, no coordination layer.
            </span>
          </div>
        </div>

        {/* ── LAYER 2: Six External Systems ── */}
        <div style={{ flexShrink: 0, marginBottom: 10 }}>
          <LayerDivider color="#f59e0b" label="LAYER 2 — SIX MORE SD SYSTEMS — SIX MORE VERSIONS OF MARIA " />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {SYSTEMS.map((sys) => (
              <div
                key={sys.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 6,
                  border: `1px solid ${sys.color}44`,
                  borderTop: `3px solid ${sys.color}`,
                  background: 'rgba(22,22,22,0.95)',
                }}
              >
                <div style={{ padding: '8px 10px 5px', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: sys.color, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {sys.name}
                  </span>
                  {sys.badge && (
                    <span style={{ fontFamily: 'monospace', fontSize: 8, color: sys.color, letterSpacing: '0.06em', background: `${sys.color}1a`, border: `1px solid ${sys.color}4d`, borderRadius: 3, padding: '1px 4px' }}>
                      {sys.badge}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {sys.knows.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ fontSize: 11, color: '#6f6f6f', marginTop: 1 }}>·</span>
                      <span style={{ fontSize: 10, color: '#d4d4d4', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '6px 10px 8px' }}>
                  <div style={{ borderRadius: 4, padding: '5px 7px', background: 'rgba(180,30,30,0.18)', border: '1px solid rgba(220,50,50,0.45)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: '#f87171', letterSpacing: '0.05em' }}>
                      BLIND SPOT: {sys.blindSpot}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LAYER 3: Persona / Roles ── */}
        <div style={{ flexShrink: 0, marginBottom: 10 }}>
          <LayerDivider color="#a855f7" label="LAYER 3 — THE FRAGMENTATION RUNS DEEPER THAN DATA" />
          <div style={{ display: 'flex', gap: 10 }}>
            {ROLES.map((role) => (
              <div
                key={role.id}
                style={{
                  flex: 1,
                  borderRadius: 6,
                  border: `1px solid ${role.border}`,
                  borderTop: `3px solid ${role.color}`,
                  background: role.bg,
                  padding: '10px 12px',
                }}
              >
                <div style={{ marginBottom: 5 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: role.color, letterSpacing: '0.08em' }}>
                    {role.label}
                  </span>
                  {role.subtitle && (
                    <span style={{ fontSize: 10, color: '#8d8d8d', marginLeft: 7 }}>{role.subtitle}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 7 }}>
                  {role.items.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ fontSize: 11, color: '#6f6f6f', marginTop: 1 }}>·</span>
                      <span style={{ fontSize: 11, color: '#c4c4c4', lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderRadius: 4, padding: '4px 7px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 10, color: '#6f6f6f' }}>Lives in: </span>
                  <span style={{ fontSize: 10, color: '#a3a3a3' }}>{role.livesIn}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#a3a3a3', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 0 }}>
            No system understands her roles, her <span style={{ color: '#ffffff', fontStyle: 'normal', fontWeight: 600 }}>Personas</span>, her relationships, or how those roles change across contexts.
            <br />
            There is no whole-person identity graph — across the county or the state.
          </p>
        </div>

        {/* ── LAYER 4: Gap Checklist ── */}
        <div style={{ flexShrink: 0, marginBottom: 10 }}>
          <LayerDivider color="#6f6f6f" label="LAYER 4 — WHAT IS MISSING ACROSS ALL SYSTEMS — ABOUT ONE PERSON" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {GAPS.map((gap) => (
              <div
                key={gap.label}
                style={{
                  borderRadius: 5,
                  background: 'rgba(180,30,30,0.10)',
                  border: '1px solid rgba(220,50,50,0.30)',
                  padding: '8px 9px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#f87171', letterSpacing: '0.07em' }}>
                    {gap.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#ef4444', lineHeight: 1 }}>✗</span>
                </div>
                <p style={{ fontSize: 9, color: '#8d8d8d', lineHeight: 1.4, margin: 0 }}>{gap.detail}</p>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderLeft: '3px solid rgba(255,255,255,0.4)',
            padding: '12px 24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#e5e5e5', fontStyle: 'italic', lineHeight: 1.65, letterSpacing: '-0.01em', margin: 0 }}>
              "Before any agent can act intelligently —
              <br />
              the system must first know who it's acting for."
            </p>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6f6f6f', letterSpacing: '0.10em' }}>↓ ADVANCE TO SEE HOW</span>
            </div>
          </div>
        </div>

        {/* Screen counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 'auto',
            paddingTop: 8,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: 'monospace', color: '#6f6f6f', fontSize: 12 }}>03 / 19</div>
        </div>
      </div>
    </ScreenLayout>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function LayerDivider({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      <span style={{
        fontFamily: 'monospace',
        fontSize: 10,
        color,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: `${color}14`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '3px 10px',
      }}>
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}