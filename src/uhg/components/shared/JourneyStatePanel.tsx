'use client';

import React, { useState } from 'react';

interface JourneyStatePanelProps {
  collapsed?: boolean;
}

export default function JourneyStatePanel({ collapsed: initialCollapsed = false }: JourneyStatePanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 rounded px-3 py-2 transition-all duration-200"
        style={{ background: 'rgba(38,38,38,0.95)', border: '1px solid rgba(57,57,57,0.8)', cursor: 'pointer' }}
      >
        <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65', animation: 'authPulse 2s ease-in-out infinite' }} />
        <span className="font-mono" style={{ fontSize: '10px', color: '#8d8d8d', letterSpacing: '0.1em' }}>ACTIVE JOURNEYS</span>
        <span style={{ fontSize: '10px', color: '#6f6f6f' }}>▸</span>
      </button>
    );
  }

  return (
    <div
      className="rounded flex flex-col gap-0 overflow-hidden"
      style={{ background: 'rgba(22,22,22,0.97)', border: '1px solid rgba(57,57,57,0.9)', backdropFilter: 'blur(8px)', width: 280 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: 'rgba(38,38,38,0.8)' }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65', animation: 'authPulse 2s ease-in-out infinite' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.12em' }}>ACTIVE JOURNEYS</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Maria Redhawk + Bennett County Health</span>
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6f6f6f', fontSize: '12px', padding: 0 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Consumer Journey */}
      <div className="px-3 py-2.5 flex flex-col gap-1.5" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(250,77,86,0.15)', border: '1px solid rgba(250,77,86,0.35)' }}>
            <span className="font-mono" style={{ fontSize: '8px', color: '#fa4d56', letterSpacing: '0.1em' }}>CONSUMER JOURNEY</span>
          </div>
          <span style={{ fontSize: '10px', color: '#8d8d8d' }}>Maria</span>
        </div>
        <div className="flex flex-col gap-1">
          {[
            { label: 'Stage', value: 'Post-acute cardiac — active monitoring', color: '#c6c6c6' },
            { label: 'Position', value: 'Day 34 of 90-day episode window', color: '#78a9ff' },
            { label: 'Milestone', value: 'Auth renewal window — T-4 days', color: '#f1c21b' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <span style={{ fontSize: '9px', color: '#6f6f6f', minWidth: 52, paddingTop: 1, letterSpacing: '0.04em' }}>{item.label}</span>
              <span style={{ fontSize: '10px', color: item.color, lineHeight: 1.4 }}>{item.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(250,77,86,0.12)', border: '1px solid rgba(250,77,86,0.3)' }}>
              <span className="font-mono" style={{ fontSize: '8px', color: '#fa4d56', letterSpacing: '0.08em' }}>SENSITIVITY: HIGH</span>
            </div>
            <span style={{ fontSize: '9px', color: '#6f6f6f' }}>do not over-communicate</span>
          </div>
        </div>
      </div>

      {/* Provider Journey */}
      <div className="px-3 py-2.5 flex flex-col gap-1.5" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(12,85,184,0.15)', border: '1px solid rgba(12,85,184,0.35)' }}>
            <span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.1em' }}>PROVIDER JOURNEY</span>
          </div>
          <span style={{ fontSize: '10px', color: '#8d8d8d' }}>Bennett County Health</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <span style={{ fontSize: '9px', color: '#6f6f6f', minWidth: 52, paddingTop: 1 }}>Roles</span>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Attending 12', color: '#0C55B8' },
                { label: 'Referring 7', color: '#8b5cf6' },
                { label: 'Network 240', color: '#42be65' },
              ].map((r) => (
                <span key={r.label} className="rounded px-1.5 py-0.5 font-mono" style={{ fontSize: '8px', color: r.color, background: `${r.color}18`, border: `1px solid ${r.color}35` }}>{r.label}</span>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ fontSize: '9px', color: '#6f6f6f', minWidth: 52, paddingTop: 1 }}>Constraint</span>
            <span style={{ fontSize: '10px', color: '#f1c21b', lineHeight: 1.4 }}>Eligibility renewal in progress</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(12,85,184,0.12)', border: '1px solid rgba(12,85,184,0.3)' }}>
              <span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.08em' }}>EHR ONLY</span>
            </div>
            <span style={{ fontSize: '9px', color: '#6f6f6f' }}>phone outreach suppressed</span>
          </div>
        </div>
      </div>

      {/* Operational Journey */}
      <div className="px-3 py-2.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(66,190,101,0.15)', border: '1px solid rgba(66,190,101,0.35)' }}>
            <span className="font-mono" style={{ fontSize: '8px', color: '#42be65', letterSpacing: '0.1em' }}>OPERATIONAL JOURNEY</span>
          </div>
          <span style={{ fontSize: '10px', color: '#8d8d8d' }}>Plan</span>
        </div>
        <div className="flex flex-col gap-1">
          {[
            { label: 'Context', value: 'Q4 SD Medicaid quality window — care gap closure CRITICAL', color: '#f1c21b' },
            { label: 'TCOC', value: 'At ceiling — cost actions need CFO flag', color: '#fa4d56' },
            { label: 'Star Rating', value: '3.7 — readmission reduction is board priority', color: '#78a9ff' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <span style={{ fontSize: '9px', color: '#6f6f6f', minWidth: 52, paddingTop: 1 }}>{item.label}</span>
              <span style={{ fontSize: '10px', color: item.color, lineHeight: 1.4 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
