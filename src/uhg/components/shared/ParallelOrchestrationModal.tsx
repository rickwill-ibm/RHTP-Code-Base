'use client';

// ─── ParallelOrchestrationModal.tsx ──────────────────────────────────────────
// Main modal shell. Data → .data.ts · Sub-components → .parts.tsx

import React, { useState, useEffect } from 'react';
import { PARALLEL_MEMBERS } from './ParallelOrchestrationModal.data';
import { MemberMiniCard } from './ParallelOrchestrationModal.parts';

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
