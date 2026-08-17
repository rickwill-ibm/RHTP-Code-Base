'use client';

// ─── ParallelOrchestrationModal.parts.tsx ────────────────────────────────────
// Sub-components: AgentDot, ProgressBar, MemberMiniCard.

import React, { useState, useEffect } from 'react';
import type { AgentDispatched, ParallelMember } from './ParallelOrchestrationModal.data';

// ─── Agent Status Dot ─────────────────────────────────────────────────────────

export function AgentDot({ status, name }: { status: AgentDispatched['status']; name: string }) {
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

export function ProgressBar({ value, color }: { value: number; color: string }) {
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

export function MemberMiniCard({ member, index }: { member: ParallelMember; index: number }) {
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
