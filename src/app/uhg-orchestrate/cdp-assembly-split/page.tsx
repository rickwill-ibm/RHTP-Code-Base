'use client';

import React, { useState, useEffect, useRef } from 'react';
import ScreenLayout from '@/uhg/components/shared/ScreenLayout';
import PresenterControls from '@/uhg/components/shared/PresenterControls';
import MariaStatusStrip from '@/uhg/components/shared/MariaStatusStrip';
import { useDemoStore } from '@/uhg/store/demoStore';

// ─── Source System Records ────────────────────────────────────────────────────

interface SourceRecord {
  id: string;
  system: string;
  systemColor: string;
  systemBg: string;
  memberName: string;
  memberId: string;
  dob: string;
  address: string;
  riskScore: string;
  consentStatus: string;
  authStatus: string;
  conflicts: string[];
}

const SOURCE_RECORDS: SourceRecord[] = [
  {
    id: 'claims',
    system: 'SD Medicaid · Claims Engine',
    systemColor: '#3b82f6',
    systemBg: 'rgba(59,130,246,0.08)',
    memberName: 'Maria Redhawk',
    memberId: 'CLM-8821-A',
    dob: '1992-06-15',
    address: 'Rural Route 1, Martin SD 57551',
    riskScore: 'HIGH — 7.8',
    consentStatus: 'FULL — HIPAA TPO',
    authStatus: 'AUTH-001 ACTIVE',
    conflicts: ['Name mismatch vs EHR', 'Address differs from CRM'],
  },
  {
    id: 'ehr',
    system: 'Bennett County Health · Clinical EHR',
    systemColor: '#22c55e',
    systemBg: 'rgba(34,197,94,0.08)',
    memberName: 'Maria Redhawk',
    memberId: 'EHR-44821',
    dob: '1992-06-15',
    address: 'Rural Route 1, Martin SD 57551',
    riskScore: 'MODERATE — 5.2',
    consentStatus: 'RESEARCH EXCLUDED',
    authStatus: 'AUTH-001 EXPIRING T-4',
    conflicts: ['Name mismatch vs Claims', 'Risk score conflict', 'Consent scope conflict'],
  },
  {
    id: 'auth',
    system: 'SD Medicaid · Auth System',
    systemColor: '#f59e0b',
    systemBg: 'rgba(245,158,11,0.08)',
    memberName: 'M. Redhawk',
    memberId: 'AUTH-MARIA_SD_001',
    dob: '1992-06-15',
    address: 'NOT ON FILE',
    riskScore: 'NOT SCORED',
    consentStatus: 'NOT VERIFIED',
    authStatus: 'AUTH-001 PENDING RENEWAL',
    conflicts: ['Name variant', 'Address missing', 'No risk score', 'No consent record'],
  },
  {
    id: 'care',
    system: 'Bennett County Health · Care Management',
    systemColor: '#a855f7',
    systemBg: 'rgba(168,85,247,0.08)',
    memberName: 'Maria R.',
    memberId: 'CM-2024-8821',
    dob: 'NOT ON FILE',
    address: 'Rural Route 1, Martin SD 57551',
    riskScore: 'HIGH — READMISSION',
    consentStatus: 'UNKNOWN',
    authStatus: 'NO AUTH RECORD',
    conflicts: ['Partial name only', 'DOB missing', 'No auth linkage', 'Consent unknown'],
  },
  {
    id: 'h1ab',
    system: 'RHTP Analytics · H1ab Platform',
    systemColor: '#06b6d4',
    systemBg: 'rgba(6,182,212,0.08)',
    memberName: 'Maria Redhawk',
    memberId: 'H1AB-MBR-8821',
    dob: '1992-06-15',
    address: 'Rural Route 1, Martin SD 57551',
    riskScore: 'HIGH — CARE MGMT',
    consentStatus: 'PARTIAL — TPO ONLY',
    authStatus: 'NOT LINKED',
    conflicts: ['Auth not linked', 'Consent scope partial', 'No risk score sync'],
  },
  {
    id: 'employer',
    system: 'SD Medicaid · SD-MCD',
    systemColor: '#f97316',
    systemBg: 'rgba(249,115,22,0.08)',
    memberName: 'M. Redhawk',
    memberId: 'EMP-SD-MCD',
    dob: 'NOT ON FILE',
    address: 'NOT ON FILE',
    riskScore: 'NOT SCORED',
    consentStatus: 'WELLNESS ONLY',
    authStatus: 'NO AUTH RECORD',
    conflicts: ['Name variant', 'DOB missing', 'Address missing', 'Wellness scope only'],
  },
];

// ─── Resolution Log Entries ───────────────────────────────────────────────────

interface LogEntry {
  id: string;
  text: string;
  color: string;
  delay: number;
  isSuccess?: boolean;
}

const LOG_ENTRIES: LogEntry[] = [
  { id: 'l-anon0', text: 'Incoming: ANONYMOUS SESSION — device fingerprint only',                                          color: '#6f6f6f', delay: 200 },
  { id: 'l-anon1', text: 'RHTP Care Management portal session detected — no authenticated identity',                               color: '#6f6f6f', delay: 400 },
  { id: 'l-anon2', text: 'CDP cross-referencing behavioral pattern against SD Medicaid Claims...',                                 color: '#6f6f6f', delay: 600 },
  { id: 'l-anon3', text: 'Match: MARIA_SD_001 (87% confidence — RHTP + SD Medicaid Claims cross-reference)',                        color: '#f59e0b', delay: 800 },
  { id: 'l-norm0', text: 'Normalizing 6 source schemas → canonical CDP format...',                                        color: '#6f6f6f', delay: 1000 },
  { id: 'l-norm1', text: 'SD Medicaid Claims     X12 837 → FHIR ExplanationOfBenefit ✓',                            color: '#3b82f6', delay: 1100 },
  { id: 'l-norm2', text: 'Bennett County Health EHR            HL7 v2.4 → FHIR Patient + Condition ✓',                            color: '#22c55e', delay: 1200 },
  { id: 'l-norm3', text: 'SD Medicaid Auth       Proprietary → FHIR CoverageEligibility ✓',                         color: '#f59e0b', delay: 1300 },
  { id: 'l-norm4', text: 'Bennett County Health Care Mgmt      CSV export → FHIR CarePlan + Task ✓',                              color: '#a855f7', delay: 1400 },
  { id: 'l-norm5', text: 'RHTP Analytics H1ab           REST → FHIR Task + CareTeam ✓',                                    color: '#06b6d4', delay: 1500 },
  { id: 'l-norm6', text: 'CBO / Social Services           EDI 834 → FHIR Coverage ✓',                                        color: '#f97316', delay: 1600 },
  { id: 'l-norm7', text: '→ Canonical member record ready for identity resolution',                                       color: '#42be65', delay: 1700 },
  { id: 'l0',      text: 'Ingesting 6 source streams...',                                                                 color: '#6f6f6f', delay: 1900 },
  { id: 'l1',      text: 'Authentication confirmed at login — identity promoted to KNOWN',                                color: '#42be65', delay: 2100 },
  { id: 'l-anon4', text: '→ Anonymous-to-known resolution: complete (RHTP Care Management portal signal)',                        color: '#42be65', delay: 2300 },
  { id: 'l2',      text: 'Identity confirmed — MARIA_SD_001 (97% confidence)',                                               color: '#42be65', delay: 2600 },
  { id: 'l3',      text: 'Consent resolved — FULL (Claims authoritative)',                                                color: '#42be65', delay: 3100 },
  { id: 'l4',      text: 'Authorization CAREGAP_HBA1C attached — expiring T-4 days',                                          color: '#f59e0b', delay: 3600 },
  { id: 'l5',      text: 'Care gap CAREGAP_001 linked — HbA1c open 45 days',                                             color: '#fa4d56', delay: 4100 },
  { id: 'l6',      text: 'Episodes assembled — Postpartum, Diabetes active',                                                 color: '#8b5cf6', delay: 4600 },
  { id: 'l7',      text: 'Provider Bennett County Health connected — NPI 1234567890',                                                  color: '#0C55B8', delay: 5100 },
  { id: 'l8',      text: 'Dependent Sophia identified — PARENT_OF linked',                                                 color: '#ff7eb6', delay: 5600 },
  { id: 'l9',      text: 'Caregiver Elena identified — CAREGIVER_FOR linked',                                             color: '#c084fc', delay: 6100 },
  { id: 'l10',     text: 'Proxy consent scope loaded — scoped active',                                                    color: '#c084fc', delay: 6600 },
  { id: 'l11',     text: '✓ Knowledge Graph complete — Maria is now known',                                               color: '#42be65', delay: 7100, isSuccess: true },
];

// ─── Graph Nodes for Assembly Animation ──────────────────────────────────────

interface AssemblyNode {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  color: string;
  delay: number;
  isMaria?: boolean;
}

interface AssemblyEdge {
  id: string;
  from: string;
  to: string;
  color: string;
  label: string;
  delay: number;
}

const ASSEMBLY_NODES: AssemblyNode[] = [
  { id: 'maria',    x: 400, y: 260, r: 52, label: 'Maria Redhawk',        color: '#fa4d56', delay: 800,  isMaria: true },
  { id: 'consent',  x: 400, y: 80,  r: 30, label: 'Consent FULL',       color: '#42be65', delay: 1200 },
  { id: 'auth',     x: 180, y: 160, r: 34, label: 'CAREGAP_HBA1C ⚠ T-4',     color: '#f59e0b', delay: 1700 },
  { id: 'caregap',  x: 180, y: 370, r: 30, label: 'HbA1c Gap 45d',      color: '#fa4d56', delay: 2200 },
  { id: 'cardiac',  x: 600, y: 140, r: 34, label: 'Postpartum Episode',    color: '#8b5cf6', delay: 2700 },
  { id: 'diabetes', x: 620, y: 370, r: 30, label: 'Pre-diabetic',   color: '#8b5cf6', delay: 2900 },
  { id: 'chen',     x: 760, y: 260, r: 36, label: 'Bennett County Health',     color: '#0C55B8', delay: 3300 },
  { id: 'sofia',    x: 280, y: 460, r: 28, label: 'Sophia · Dependent',  color: '#ff7eb6', delay: 3800 },
  { id: 'elena',    x: 520, y: 460, r: 28, label: 'Elena · Caregiver',  color: '#c084fc', delay: 4300 },
];

const ASSEMBLY_EDGES: AssemblyEdge[] = [
  { id: 'e-consent',  from: 'maria',   to: 'consent',  color: '#42be65', label: 'HAS_CONSENT',       delay: 1300 },
  { id: 'e-auth',     from: 'maria',   to: 'auth',     color: '#f59e0b', label: 'HAS_AUTHORIZATION', delay: 1800 },
  { id: 'e-caregap',  from: 'maria',   to: 'caregap',  color: '#fa4d56', label: 'HAS_CARE_GAP',      delay: 2300 },
  { id: 'e-cardiac',  from: 'maria',   to: 'cardiac',  color: '#8b5cf6', label: 'HAS_EPISODE',       delay: 2800 },
  { id: 'e-diabetes', from: 'maria',   to: 'diabetes', color: '#8b5cf6', label: 'HAS_EPISODE',       delay: 3000 },
  { id: 'e-chen',     from: 'cardiac', to: 'chen',     color: '#0C55B8', label: 'ATTENDED_BY',       delay: 3400 },
  { id: 'e-sofia',    from: 'maria',   to: 'sofia',    color: '#ff7eb6', label: 'PARENT_OF',         delay: 3900 },
  { id: 'e-elena',    from: 'maria',   to: 'elena',    color: '#c084fc', label: 'CAREGIVER_FOR',     delay: 4400 },
];

// ─── Assembly Graph SVG ───────────────────────────────────────────────────────

function AssemblyGraph({ visibleNodes, visibleEdges, tick }: {
  visibleNodes: Set<string>;
  visibleEdges: Set<string>;
  tick: number;
}) {
  const nodeMap = Object.fromEntries(ASSEMBLY_NODES.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 900 560"
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <style>{`
          @keyframes dashMove { to { stroke-dashoffset: -20; } }
          .edge-anim { animation: dashMove 1.2s linear infinite; }
          @keyframes nodeIn { from { opacity:0; transform:scale(0.4); } to { opacity:1; transform:scale(1); } }
          .node-in { animation: nodeIn 0.5s ease forwards; }
          @keyframes mariaPulse { 0%,100% { opacity:0.3; } 50% { opacity:0.55; } }
          .maria-pulse { animation: mariaPulse 2.2s ease-in-out infinite; }
        `}</style>
        {ASSEMBLY_NODES.map((n) => (
          <radialGradient key={`g-${n.id}`} id={`g-${n.id}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={n.color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={n.color} stopOpacity="0.1" />
          </radialGradient>
        ))}
      </defs>
      <rect width={900} height={560} fill="#161616" />

      {/* Edges */}
      {ASSEMBLY_EDGES.map((edge) => {
        if (!visibleEdges.has(edge.id)) return null;
        const fn = nodeMap[edge.from];
        const tn = nodeMap[edge.to];
        if (!fn || !tn) return null;
        const dx = tn.x - fn.x;
        const dy = tn.y - fn.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const x1 = fn.x + ux * fn.r;
        const y1 = fn.y + uy * fn.r;
        const x2 = tn.x - ux * tn.r;
        const y2 = tn.y - uy * tn.r;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={edge.id}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={edge.color}
              strokeWidth={2}
              strokeOpacity={0.8}
              strokeDasharray="7 4"
              className="edge-anim"
            />
            <rect x={mx - 52} y={my - 9} width={104} height={14} rx={3} fill="#1a1a1a" fillOpacity={0.9} stroke={edge.color} strokeOpacity={0.3} strokeWidth={0.5} />
            <text x={mx} y={my + 2} textAnchor="middle" fill={edge.color} fontSize={8} fontFamily='"IBM Plex Mono", monospace' fontWeight="600" letterSpacing="0.04em">{edge.label}</text>
          </g>
        );
      })}

      {/* Nodes */}
      {ASSEMBLY_NODES.map((node) => {
        if (!visibleNodes.has(node.id)) return null;
        const pulseFactor = node.isMaria ? 1 + 0.03 * Math.sin(tick * 0.05) : 1;
        const r = node.r * pulseFactor;
        return (
          <g key={node.id} className="node-in">
            {node.isMaria && (
              <circle cx={node.x} cy={node.y} r={r * 2} fill={node.color} fillOpacity={0.07} className="maria-pulse" />
            )}
            <circle cx={node.x} cy={node.y} r={r} fill={`url(#g-${node.id})`} stroke={node.color} strokeWidth={node.isMaria ? 3 : 2} />
            {node.isMaria && (
              <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke={node.color} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 4" />
            )}
            <text
              x={node.x}
              y={node.y + r + (node.isMaria ? 20 : 15)}
              textAnchor="middle"
              fill={node.isMaria ? '#ffffff' : '#f4f4f4'}
              fontSize={node.isMaria ? 15 : 11}
              fontFamily='"IBM Plex Sans", sans-serif'
              fontWeight={node.isMaria ? '700' : '600'}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Instrumentation Tier Data ────────────────────────────────────────────────

const INSTRUMENTATION_TIERS = [
  {
    tier: 'Tier 1',
    label: 'Event-Native',
    pct: '15%',
    color: '#42be65',
    desc: 'Modern APIs · Kafka-ready · low instrumentation cost',
    examples: 'RHTP Care Management portal, Auth API, Martin Pharmacy fill events',
    approach: 'Direct Kafka producer, schema registry enrollment',
    latency: '<5 min',
  },
  {
    tier: 'Tier 2',
    label: 'Batch-Extractable',
    pct: '55%',
    color: '#f59e0b',
    desc: 'Legacy systems · nightly/hourly batch · CDC patterns',
    examples: 'Claims adjudication, H1ab care tasks, eligibility',
    approach: 'Debezium CDC → Kafka → FHIR transformation layer',
    latency: '15 min – 4 hr',
  },
  {
    tier: 'Tier 3',
    label: 'Dark Data',
    pct: '30%',
    color: '#fa4d56',
    desc: 'No API · no event stream · paper/fax/manual entry',
    examples: 'Specialist notes, out-of-network claims, provider attestations',
    approach: 'NLP extraction pipeline → structured event',
    latency: '24 – 48 hr',
  },
];

const LATENCY_REQUIREMENTS = [
  { signal: 'AUTH_EXPIRY',       latency: '<5 min',  reason: 'Operational SLA breach risk',       color: '#fa4d56' },
  { signal: 'DUPLICATE_THERAPY', latency: '<15 min', reason: 'Patient safety threshold',           color: '#fa4d56' },
  { signal: 'CARE_GAP',          latency: '<4 hr',   reason: 'Clinical coordination window',       color: '#f59e0b' },
  { signal: 'SDOH_SIGNAL',       latency: '<24 hr',  reason: 'Intervention planning cycle',        color: '#78a9ff' },
  { signal: 'BEHAVIORAL',        latency: '<1 hr',   reason: 'Engagement window capture',          color: '#42be65' },
];

const DATA_PRODUCTS = [
  { name: 'auth-expiry-events',      owner: 'SD Medicaid Auth Domain',       sla: '<5 min',  consumers: 'Controller · Governance' },
  { name: 'care-gap-signals',        owner: 'Bennett County Health Clinical',  sla: '<4 hr',   consumers: 'Agent Coalition · SD Medicaid quality' },
  { name: 'claims-episode-events',   owner: 'SD Medicaid Claims Domain',      sla: '<15 min', consumers: 'CDP · Risk Engine' },
  { name: 'rx-fill-events',          owner: 'Martin Pharmacy Domain',         sla: '<15 min', consumers: 'Polypharmacy Agent · CDP' },
  { name: 'sdoh-behavioral-signals', owner: 'Bennett County Insight',          sla: '<1 hr',   consumers: 'SDOH Agent · Graph' },
];

// ─── Practitioner Panel ───────────────────────────────────────────────────────

function PractitionerPanel() {
  const [activeTab, setActiveTab] = useState<'tiers' | 'latency' | 'products'>('tiers');

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{ height: 260, borderTop: '1px solid rgba(57,57,57,0.5)', background: '#141414' }}
    >
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-0" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#1a1a1a' }}>
        <div className="flex items-center gap-2 px-4 py-2 border-r" style={{ borderColor: 'rgba(57,57,57,0.5)' }}>
          <div className="rounded-full" style={{ width: 6, height: 6, background: '#f59e0b' }} />
          <span className="font-mono uppercase" style={{ fontSize: '9px', color: '#f59e0b', letterSpacing: '0.14em' }}>PRACTITIONER DEPTH</span>
        </div>
        {[
          { id: 'tiers' as const,    label: 'SOURCE INSTRUMENTATION' },
          { id: 'latency' as const,  label: 'LATENCY REQUIREMENTS' },
          { id: 'products' as const, label: 'DATA PRODUCT PATTERN' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 transition-all duration-200"
            style={{
              background: activeTab === tab.id ? 'rgba(245,158,11,0.12)' : 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
              color: activeTab === tab.id ? '#f59e0b' : '#6f6f6f',
              fontSize: '10px',
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {/* Tier model */}
        {activeTab === 'tiers' && (
          <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.1em' }}>THE INSTRUMENTATION CHALLENGE — 300+ APPLICATIONS</span>
            </div>
            <div className="flex gap-3">
              {INSTRUMENTATION_TIERS.map((tier) => (
                <div
                  key={tier.tier}
                  className="flex-1 rounded p-3 flex flex-col gap-1.5"
                  style={{ background: `${tier.color}0a`, border: `1px solid ${tier.color}30`, borderLeft: `3px solid ${tier.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: tier.color, letterSpacing: '0.08em' }}>{tier.tier} — {tier.label}</span>
                    <span className="font-mono font-bold" style={{ fontSize: '14px', color: tier.color }}>{tier.pct}</span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#8d8d8d', lineHeight: 1.5 }}>{tier.desc}</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex gap-1.5">
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '9px', color: '#6f6f6f', width: 60 }}>EXAMPLES</span>
                      <span style={{ fontSize: '10px', color: '#c6c6c6', lineHeight: 1.4 }}>{tier.examples}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '9px', color: '#6f6f6f', width: 60 }}>APPROACH</span>
                      <span style={{ fontSize: '10px', color: '#c6c6c6', lineHeight: 1.4 }}>{tier.approach}</span>
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '9px', color: '#6f6f6f', width: 60 }}>LATENCY</span>
                      <span className="font-mono font-semibold" style={{ fontSize: '10px', color: tier.color }}>{tier.latency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded px-3 py-2 mt-1" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span style={{ fontSize: '11px', color: '#f59e0b' }}>
                Not 300 applications. <strong>14 data products that matter for Maria.</strong> We are not asking you to rearchitect your estate — we are asking you to identify the products that matter and build from there.
              </span>
            </div>
          </div>
        )}

        {/* Latency requirements */}
        {activeTab === 'latency' && (
          <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-2">
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.1em' }}>EVENT LATENCY REQUIREMENTS BY SIGNAL TYPE</span>
            <div className="flex flex-col gap-1.5">
              {LATENCY_REQUIREMENTS.map((req) => (
                <div key={req.signal} className="flex items-center gap-4 rounded px-3 py-2" style={{ background: `${req.color}08`, border: `1px solid ${req.color}25` }}>
                  <span className="font-mono font-semibold flex-shrink-0" style={{ fontSize: '11px', color: req.color, width: 160, letterSpacing: '0.04em' }}>{req.signal}</span>
                  <span className="font-mono font-bold flex-shrink-0" style={{ fontSize: '13px', color: req.color, width: 80 }}>{req.latency}</span>
                  <span style={{ fontSize: '11px', color: '#8d8d8d' }}>— {req.reason}</span>
                </div>
              ))}
            </div>
            <div className="rounded px-3 py-2 mt-1" style={{ background: 'rgba(66,190,101,0.08)', border: '1px solid rgba(66,190,101,0.25)' }}>
              <span style={{ fontSize: '11px', color: '#42be65' }}>
                Latency SLAs are contractual commitments per data product — not aspirational targets. Each signal type has a named domain owner accountable for SLA adherence.
              </span>
            </div>
          </div>
        )}

        {/* Data product pattern */}
        {activeTab === 'products' && (
          <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.1em' }}>CDP IS NOT A PIPELINE — IT IS A DATA PRODUCT ESTATE</span>
              <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f' }}>14 products in scope · Phase 1</span>
            </div>
            <div className="rounded px-3 py-2 mb-1" style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.25)' }}>
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: 'Owner', desc: 'Named domain team' },
                  { label: 'SLA', desc: 'Latency + freshness + quality' },
                  { label: 'Consumer', desc: 'Agent coalition + governance' },
                  { label: 'Schema', desc: 'Versioned Avro in registry' },
                  { label: 'Lineage', desc: 'Full source-to-graph trace' },
                ].map((attr) => (
                  <div key={attr.label} className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#78a9ff' }}>{attr.label}:</span>
                    <span style={{ fontSize: '10px', color: '#8d8d8d' }}>{attr.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {DATA_PRODUCTS.map((dp) => (
                <div key={dp.name} className="flex items-center gap-3 rounded px-3 py-1.5" style={{ background: 'rgba(38,38,38,0.8)', border: '1px solid rgba(57,57,57,0.6)' }}>
                  <span className="font-mono font-semibold flex-shrink-0" style={{ fontSize: '10px', color: '#42be65', width: 200 }}>{dp.name}</span>
                  <span className="flex-shrink-0" style={{ fontSize: '10px', color: '#8d8d8d', width: 160 }}>{dp.owner}</span>
                  <span className="font-mono font-semibold flex-shrink-0" style={{ fontSize: '10px', color: '#f59e0b', width: 70 }}>{dp.sla}</span>
                  <span style={{ fontSize: '10px', color: '#6f6f6f' }}>{dp.consumers}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CDPAssemblySplit() {
  const setScreen = useDemoStore((s) => s.setScreen);
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [visibleEdges, setVisibleEdges] = useState<Set<string>>(new Set());
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [tick, setTick] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    setScreen('cdp-assembly');

    // Tick for SVG animation
    let t = 0;
    const animate = () => {
      t++;
      setTick(t);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    // Schedule node appearances
    ASSEMBLY_NODES.forEach((node) => {
      const timer = setTimeout(() => {
        setVisibleNodes((prev) => new Set([...prev, node.id]));
      }, node.delay);
      timerRefs.current.push(timer);
    });

    // Schedule edge appearances
    ASSEMBLY_EDGES.forEach((edge) => {
      const timer = setTimeout(() => {
        setVisibleEdges((prev) => new Set([...prev, edge.id]));
      }, edge.delay);
      timerRefs.current.push(timer);
    });

    // Schedule log entries
    LOG_ENTRIES.forEach((entry) => {
      const timer = setTimeout(() => {
        setLogEntries((prev) => (prev.includes(entry.id) ? prev : [...prev, entry.id]));
        if (entry.isSuccess) setComplete(true);
      }, entry.delay);
      timerRefs.current.push(timer);
    });

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
      cancelAnimationFrame(animRef.current);
    };
  }, [setScreen]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  const getLogEntry = (id: string) => LOG_ENTRIES.find((e) => e.id === id);

  return (
    <ScreenLayout
      screenId="cdp-assembly"
      showPhaseArc
      phaseArcState={{ foundation: true, orchestration: false, autonomous: false }}
      showMiniProfile
    >
      <PresenterControls currentScreenId="cdp-assembly" />

      <div
        className="flex flex-col"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#161616', overflow: 'hidden' }}
      >
        {/* Maria Status Strip */}
        <MariaStatusStrip
          state="resolving"
          authStatus="⚠ Expiring T-4"
          careGapStatus="⚠ HbA1c 45d"
          episodeStatus="Postpartum Health"
          visible
        />

        {/* Split header */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ borderBottom: '1px solid rgba(57,57,57,0.6)', background: '#1c1c1c' }}
        >
          {/* Screen title bar */}
          <div
            className="flex items-center px-5"
            style={{ height: 32, borderBottom: '1px solid rgba(57,57,57,0.4)', background: '#141414' }}
          >
            <span className="font-mono font-bold tracking-widest uppercase" style={{ fontSize: '11px', color: '#42be65', letterSpacing: '0.18em' }}>
              CDP Assembly
            </span>
          </div>
          {/* Column headers */}
          <div className="flex" style={{ height: 44 }}>
            <div
              className="flex items-center px-5"
              style={{ width: '45%', borderRight: '1px solid rgba(57,57,57,0.6)' }}
            >
              <span className="font-semibold text-white" style={{ fontSize: '14px' }}>
                One Enterprise.{' '}
                <span style={{ color: '#f59e0b' }}>Six Systems.</span>{' '}
                <span style={{ color: '#fa4d56' }}>Zero Shared Understanding.</span>
              </span>
            </div>
            <div className="flex items-center justify-between px-5 flex-1">
              <span className="font-semibold text-white" style={{ fontSize: '14px' }}>
                Knowledge Graph —{' '}
                <span style={{ color: '#42be65' }}>Assembling</span>
              </span>
              {complete && (
                <div
                  className="rounded px-3 py-1 flex items-center gap-2"
                  style={{ background: 'rgba(66,190,101,0.15)', border: '1px solid rgba(66,190,101,0.4)' }}
                >
                  <div className="rounded-full" style={{ width: 6, height: 6, background: '#42be65' }} />
                  <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.1em' }}>
                    IDENTITY RESOLVED · MARIA_SD_001
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main split */}
        <div className="flex min-h-0" style={{ flex: 1, overflow: 'hidden' }}>
          {/* ── LEFT: Six conflicting system records ── */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: '45%', borderRight: '1px solid rgba(57,57,57,0.5)', background: '#1a1a1a' }}
          >
            {/* Unresolved conflicts banner */}
            <div
              className="flex-shrink-0 px-4 py-2 flex items-center gap-3"
              style={{ borderBottom: '1px solid rgba(250,77,86,0.3)', background: 'rgba(250,77,86,0.06)' }}
            >
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#fa4d56', letterSpacing: '0.1em' }}>
                UNRESOLVED CONFLICTS
              </span>
              <div className="flex items-center gap-3">
                {[
                  { label: 'Risk Score', detail: '4 different values' },
                  { label: 'Consent Status', detail: '3 conflicting scopes' },
                  { label: 'Address', detail: '4 variants' },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <div className="rounded-full" style={{ width: 5, height: 5, background: '#fa4d56' }} />
                    <span style={{ fontSize: '10px', color: '#fa4d56' }}>{c.label}</span>
                    <span style={{ fontSize: '10px', color: '#6f6f6f' }}>({c.detail})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
              <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }`}</style>
              {SOURCE_RECORDS.map((rec, i) => (
                <div
                  key={rec.id}
                  className="rounded overflow-hidden"
                  style={{
                    border: `1px solid ${rec.systemColor}35`,
                    background: rec.systemBg,
                    opacity: 0,
                    animation: `fadeSlideIn 0.4s ease ${i * 120 + 200}ms forwards`,
                  }}
                >
                  {/* System header */}
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: `1px solid ${rec.systemColor}25`, background: `${rec.systemColor}10` }}
                  >
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: rec.systemColor, letterSpacing: '0.1em' }}>
                      {rec.system}
                    </span>
                    <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f' }}>{rec.memberId}</span>
                  </div>
                  {/* Record fields */}
                  <div className="px-3 py-2 flex flex-col gap-1">
                    {[
                      { label: 'NAME', value: rec.memberName },
                      { label: 'DOB', value: rec.dob },
                      { label: 'ADDRESS', value: rec.address },
                      { label: 'RISK', value: rec.riskScore },
                      { label: 'CONSENT', value: rec.consentStatus },
                      { label: 'AUTH', value: rec.authStatus },
                    ].map((field) => (
                      <div key={field.label} className="flex items-start gap-2">
                        <span className="font-mono flex-shrink-0" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em', width: 52, paddingTop: 1 }}>
                          {field.label}
                        </span>
                        <span style={{ fontSize: '11px', color: field.value === 'NOT ON FILE' || field.value === 'NOT SCORED' || field.value === 'NOT VERIFIED' || field.value === 'UNKNOWN' ? '#fa4d56' : '#d4d4d4', lineHeight: 1.3 }}>
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Conflict badges */}
                  {rec.conflicts.length > 0 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1">
                      {rec.conflicts.map((c) => (
                        <div
                          key={c}
                          className="rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(250,77,86,0.12)', border: '1px solid rgba(250,77,86,0.3)' }}
                        >
                          <span style={{ fontSize: '9px', color: '#fa4d56', letterSpacing: '0.04em' }}>⚡ {c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Graph Assembly + Resolution Log ── */}
          <div className="flex flex-col overflow-hidden" style={{ flex: 1, background: '#161616' }}>
            {/* Graph canvas */}
            <div className="relative overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
              <AssemblyGraph visibleNodes={visibleNodes} visibleEdges={visibleEdges} tick={tick} />
              {/* Identity confidence badge */}
              {visibleNodes.has('maria') && (
                <div
                  className="absolute top-3 right-3 rounded px-3 py-1.5 flex flex-col gap-1"
                  style={{ background: 'rgba(22,22,22,0.92)', border: '1px solid rgba(66,190,101,0.4)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>IDENTITY CONFIDENCE</span>
                    <span className="font-mono font-bold" style={{ fontSize: '14px', color: '#42be65' }}>97%</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(57,57,57,0.6)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: complete ? '97%' : '0%', background: '#42be65', transition: 'width 1.5s ease' }}
                    />
                  </div>
                  <span style={{ fontSize: '9px', color: '#6f6f6f' }}>6 sources reconciled · Golden record committed</span>
                </div>
              )}
            </div>

            {/* Resolution log */}
            <div
              className="flex-shrink-0 flex flex-col"
              style={{ height: 180, borderTop: '1px solid rgba(57,57,57,0.5)', background: '#1a1a1a' }}
            >
              <div
                className="flex-shrink-0 px-4 py-2 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(57,57,57,0.5)' }}
              >
                <div
                  className="rounded-full"
                  style={{ width: 6, height: 6, background: complete ? '#42be65' : '#f59e0b', boxShadow: `0 0 6px ${complete ? '#42be65' : '#f59e0b'}` }}
                />
                <span className="font-mono uppercase" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.12em' }}>
                  RESOLUTION LOG
                </span>
              </div>
              <div
                ref={logRef}
                className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 min-h-0"
                style={{ fontFamily: '"IBM Plex Mono", monospace' }}
              >
                <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
                {logEntries.map((id, i) => {
                  const entry = getLogEntry(id);
                  if (!entry) return null;
                  return (
                    <div
                      key={`${id}-${i}`}
                      className="flex items-start gap-2"
                      style={{
                        opacity: 0,
                        animation: 'fadeIn 0.3s ease forwards',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: '#4b5563', flexShrink: 0 }}>›</span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: entry.color,
                          fontWeight: entry.isSuccess ? '700' : '400',
                          letterSpacing: entry.isSuccess ? '0.02em' : '0',
                        }}
                      >
                        {entry.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Practitioner depth panel */}
            <PractitionerPanel />
          </div>
        </div>

        {/* Screen indicator */}
        <div
          className="absolute bottom-4 right-6 z-10 font-mono"
          style={{ color: '#6f6f6f', fontSize: '12px' }}
        >
          04 / 19
        </div>
      </div>
    </ScreenLayout>
  );
}
