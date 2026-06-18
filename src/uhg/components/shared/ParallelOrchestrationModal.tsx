'use client';

import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Barrier {
  label: string;
  type: 'BLOCKER' | 'BARRIER' | 'ELEVATED';
  color: string;
}

interface AgentDispatched {
  id: string;
  name: string;
  status: 'COMPLETE' | 'ACTIVE' | 'PENDING';
}

interface ParallelMember {
  id: string;
  name: string;
  riskScore: number;
  memberId: string;
  barriers: Barrier[];
  agents: AgentDispatched[];
  outcomeStage: string;
  outcomeColor: string;
  outcomeIcon: string;
  coalitionSize: number;
  progress: number; // 0–100
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const PARALLEL_MEMBERS: ParallelMember[] = [
  {
    id: 'pm-1',
    name: 'James Okafor',
    riskScore: 8.1,
    memberId: 'MBR-047',
    barriers: [
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
      { label: 'Financial Strain', type: 'ELEVATED', color: '#f97316' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'COMPLETE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'ACTIVE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'ACTIVE' },
      { id: 'a6', name: 'FINANCIAL_AGENT', status: 'ACTIVE' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'PENDING' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'INTERVENTION ACTIVE',
    outcomeColor: '#f59e0b',
    outcomeIcon: '⟳',
    coalitionSize: 8,
    progress: 62,
  },
  {
    id: 'pm-2',
    name: 'Priya Nair',
    riskScore: 7.6,
    memberId: 'MBR-112',
    barriers: [
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
      { label: 'Social Isolation', type: 'BARRIER', color: '#f97316' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'COMPLETE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'COMPLETE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'COMPLETE' },
      { id: 'a6', name: 'OUTREACH_AGENT', status: 'ACTIVE' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'ACTIVE' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'HOME KIT DISPATCHED',
    outcomeColor: '#42be65',
    outcomeIcon: '✓',
    coalitionSize: 8,
    progress: 78,
  },
  {
    id: 'pm-3',
    name: 'DeShawn Williams',
    riskScore: 8.4,
    memberId: 'MBR-203',
    barriers: [
      { label: 'Food Insecurity', type: 'BARRIER', color: '#f97316' },
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'ACTIVE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'ACTIVE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'ACTIVE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'PENDING' },
      { id: 'a6', name: 'NUTRITION_AGENT', status: 'PENDING' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'PENDING' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'COALITION ASSEMBLING',
    outcomeColor: '#78a9ff',
    outcomeIcon: '◎',
    coalitionSize: 8,
    progress: 38,
  },
  {
    id: 'pm-4',
    name: 'Luz Hernandez',
    riskScore: 7.9,
    memberId: 'MBR-318',
    barriers: [
      { label: 'Caregiver Burden', type: 'ELEVATED', color: '#f97316' },
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'COMPLETE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'COMPLETE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'COMPLETE' },
      { id: 'a6', name: 'CAREGIVER_AGENT', status: 'COMPLETE' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'COMPLETE' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'COMPLETE' },
    ],
    outcomeStage: 'RESOLVED · H1ab UPDATED',
    outcomeColor: '#42be65',
    outcomeIcon: '✓✓',
    coalitionSize: 8,
    progress: 100,
  },
  {
    id: 'pm-5',
    name: 'Amir Khalil',
    riskScore: 8.7,
    memberId: 'MBR-441',
    barriers: [
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
      { label: 'Financial Strain', type: 'ELEVATED', color: '#f97316' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'ACTIVE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'ACTIVE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'ACTIVE' },
      { id: 'a6', name: 'FINANCIAL_AGENT', status: 'PENDING' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'PENDING' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'SIGNALS TRIAGED',
    outcomeColor: '#f59e0b',
    outcomeIcon: '⟳',
    coalitionSize: 8,
    progress: 50,
  },
];

// ─── Agent Status Dot ─────────────────────────────────────────────────────────

function AgentDot({ status, name }: { status: AgentDispatched['status']; name: string }) {
  const colorMap = {
    COMPLETE: '#42be65',
    ACTIVE: '#f59e0b',
    PENDING: '#393939',
  };
  const color = colorMap[status];
  return (
    <div
      title={name}
      className="rounded-full flex-shrink-0"
      style={{
        width: 8,
        height: 8,
        background: color,
        boxShadow: status === 'ACTIVE' ? `0 0 6px ${color}` : 'none',
        animation: status === 'ACTIVE' ? 'agentPulse 1.2s ease-in-out infinite' : 'none',
      }}
    />
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ height: 3, background: 'rgba(57,57,57,0.8)', width: '100%' }}
    >
      <div
        className="rounded-full h-full transition-all duration-1000"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

// ─── Member Mini Card ─────────────────────────────────────────────────────────

function MemberMiniCard({ member, index }: { member: ParallelMember; index: number }) {
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimProgress(member.progress), 200 + index * 120);
    return () => clearTimeout(timer);
  }, [member.progress, index]);

  const activeCount = member.agents.filter((a) => a.status === 'ACTIVE').length;
  const completeCount = member.agents.filter((a) => a.status === 'COMPLETE').length;

  return (
    <div
      className="rounded-lg flex flex-col gap-3"
      style={{
        background: 'rgba(22,22,22,0.95)',
        border: '1px solid rgba(57,57,57,0.7)',
        padding: '14px 16px',
        minWidth: 0,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, background: '#fa4d56', boxShadow: '0 0 5px #fa4d56' }}
            />
            <span
              className="font-semibold truncate"
              style={{ fontSize: '13px', color: '#f4f4f4', lineHeight: 1.3 }}
            >
              {member.name}
            </span>
          </div>
          <span
            className="font-mono"
            style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em', paddingLeft: 16 }}
          >
            {member.memberId} · RISK {member.riskScore}
          </span>
        </div>
        {/* Outcome stage pill */}
        <div
          className="rounded flex-shrink-0 flex items-center gap-1 px-2 py-0.5"
          style={{
            background: `${member.outcomeColor}18`,
            border: `1px solid ${member.outcomeColor}40`,
          }}
        >
          <span style={{ fontSize: '9px', color: member.outcomeColor }}>{member.outcomeIcon}</span>
          <span
            className="font-mono"
            style={{ fontSize: '8px', color: member.outcomeColor, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
          >
            {member.outcomeStage}
          </span>
        </div>
      </div>

      {/* Barriers */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>
          TOP BARRIERS
        </span>
        <div className="flex flex-wrap gap-1.5">
          {member.barriers.map((b) => (
            <div
              key={b.label}
              className="rounded flex items-center gap-1 px-2 py-0.5"
              style={{
                background: `${b.color}15`,
                border: `1px solid ${b.color}50`,
              }}
            >
              {b.type === 'BLOCKER' && (
                <span style={{ fontSize: '8px', color: b.color }}>⬛</span>
              )}
              <span
                className="font-mono"
                style={{ fontSize: '9px', color: b.color, letterSpacing: '0.04em' }}
              >
                {b.label}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '8px', color: `${b.color}99`, letterSpacing: '0.04em' }}
              >
                {b.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agents dispatched */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>
            AGENTS DISPATCHED · {member.coalitionSize}-AGENT COALITION
          </span>
          <span className="font-mono" style={{ fontSize: '9px', color: '#8d8d8d' }}>
            <span style={{ color: '#42be65' }}>{completeCount}</span>
            <span style={{ color: '#6f6f6f' }}>/</span>
            <span style={{ color: '#f59e0b' }}>{activeCount} active</span>
            <span style={{ color: '#6f6f6f' }}> / {member.coalitionSize}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {member.agents.map((agent) => (
            <AgentDot key={agent.id} status={agent.status} name={agent.name} />
          ))}
          <span
            className="font-mono ml-1"
            style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.04em' }}
          >
            {member.agents.map((a) => a.name.split('_')[0]).join(' · ')}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>
            ORCHESTRATION PROGRESS
          </span>
          <span className="font-mono" style={{ fontSize: '9px', color: member.outcomeColor }}>
            {animProgress}%
          </span>
        </div>
        <ProgressBar value={animProgress} color={member.outcomeColor} />
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ParallelOrchestrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ParallelOrchestrationModal({ isOpen, onClose }: ParallelOrchestrationModalProps) {
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Live tick for animated stats
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAgents = PARALLEL_MEMBERS.reduce((sum, m) => sum + m.coalitionSize, 0);
  const activeAgents = PARALLEL_MEMBERS.reduce(
    (sum, m) => sum + m.agents.filter((a) => a.status === 'ACTIVE').length,
    0
  );
  const resolvedCount = PARALLEL_MEMBERS.filter((m) => m.progress === 100).length;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes parallelFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{
          width: '92vw',
          maxWidth: 1100,
          maxHeight: '90vh',
          background: '#161616',
          border: '1px solid rgba(57,57,57,0.8)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(57,57,57,0.6)', background: '#1a1a1a' }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div
                className="rounded-full"
                style={{ width: 10, height: 10, background: '#fa4d56', boxShadow: '0 0 8px #fa4d56', animation: 'agentPulse 1.4s ease-in-out infinite' }}
              />
              <span className="font-semibold" style={{ fontSize: '16px', color: '#f4f4f4', letterSpacing: '0.02em' }}>
                Parallel Orchestration — Population View
              </span>
              <div
                className="rounded px-2 py-0.5"
                style={{ background: 'rgba(250,77,86,0.12)', border: '1px solid rgba(250,77,86,0.35)' }}
              >
                <span className="font-mono" style={{ fontSize: '10px', color: '#fa4d56', letterSpacing: '0.08em' }}>
                  LIVE · {PARALLEL_MEMBERS.length} COALITIONS ACTIVE
                </span>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#6f6f6f', paddingLeft: 22 }}>
              High-risk members with transport / SDOH barriers — simultaneous 8-agent orchestrations
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mr-4">
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono font-bold" style={{ fontSize: '20px', color: '#f4f4f4' }}>{totalAgents}</span>
              <span style={{ fontSize: '10px', color: '#6f6f6f' }}>agents deployed</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono font-bold" style={{ fontSize: '20px', color: '#f59e0b' }}>{activeAgents + (tick % 3)}</span>
              <span style={{ fontSize: '10px', color: '#6f6f6f' }}>active now</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono font-bold" style={{ fontSize: '20px', color: '#42be65' }}>{resolvedCount}</span>
              <span style={{ fontSize: '10px', color: '#6f6f6f' }}>resolved</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(57,57,57,0.5)',
              border: '1px solid rgba(57,57,57,0.8)',
              color: '#8d8d8d',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Context banner */}
        <div
          className="flex-shrink-0 px-6 py-3 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}
        >
          <span style={{ fontSize: '13px', color: '#ef4444' }}>⬛</span>
          <span style={{ fontSize: '12px', color: '#c6c6c6', lineHeight: 1.5 }}>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Transport Barrier</span> identified as primary blocker across all 5 members — standard clinic appointments suppressed, alternative interventions dispatched in parallel.
            Each coalition mirrors Maria&apos;s 8-agent structure: Signal → SDOH → Auth → Care Gap → Transport → Domain → Care Mgmt → Governance.
          </span>
        </div>

        {/* Cards grid */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, alignContent: 'start' }}
        >
          {PARALLEL_MEMBERS.map((member, i) => (
            <div
              key={member.id}
              style={{ animation: `parallelFadeIn 0.4s ease both`, animationDelay: `${i * 80}ms` }}
            >
              <MemberMiniCard member={member} index={i} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(57,57,57,0.5)', background: '#1a1a1a' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65' }} />
              <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#f59e0b', boxShadow: '0 0 5px #f59e0b' }} />
              <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#393939' }} />
              <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: '11px', color: '#ef4444' }}>⬛</span>
              <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Transport Blocker</span>
            </div>
          </div>
          <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.06em' }}>
            POPULATION ORCHESTRATION ENGINE · REAL-TIME
          </span>
        </div>
      </div>
    </div>
  );
}
