'use client';

import React from 'react';
import { useDemoStore, SCREEN_ORDER } from '@/uhg/store/demoStore';

interface PhaseArcProps {
  foundation?: boolean;
  orchestration?: boolean;
  autonomous?: boolean;
}

// Map screen indices to phase labels
const PHASE_SCREEN_RANGES = {
  foundation:    { start: 0, end: 5,  label: 'FOUNDATION',    color: '#0C55B8',  glow: 'rgba(12,85,184,0.6)' },
  orchestration: { start: 6, end: 8,  label: 'ORCHESTRATION', color: '#f59e0b',  glow: 'rgba(245,158,11,0.6)' },
  autonomous:    { start: 9, end: 15, label: 'AUTONOMOUS',     color: '#22c55e',  glow: 'rgba(34,197,94,0.6)' },
};

export default function PhaseArc({ foundation = false, orchestration = false, autonomous = false }: PhaseArcProps) {
  const currentScreen = useDemoStore((s) => s.currentScreen);
  const screenIdx = SCREEN_ORDER.indexOf(currentScreen);
  // Screen number shown to presenter (1-based)
  const screenNum = screenIdx + 1;
  const totalScreens = SCREEN_ORDER.length;

  // Determine which phase is currently active
  const activePhase = autonomous ? 'autonomous' : orchestration ? 'orchestration' : foundation ? 'foundation' : null;

  const phases: Array<{ key: 'foundation' | 'orchestration' | 'autonomous'; active: boolean }> = [
    { key: 'foundation',    active: foundation },
    { key: 'orchestration', active: orchestration },
    { key: 'autonomous',    active: autonomous },
  ];

  return (
    <div className="flex items-center gap-0 phase-arc-container px-4 py-1">
      {/* Screen counter — always visible */}
      <div
        className="flex items-center justify-center rounded mr-4 flex-shrink-0"
        style={{
          width: 52, height: 26,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        <span className="font-mono font-bold" style={{ fontSize: '12px', color: '#f4f4f4', letterSpacing: '0.04em' }}>
          {String(screenNum).padStart(2, '0')}<span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/{String(totalScreens).padStart(2, '0')}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        {phases.map((phase, i) => {
          const cfg = PHASE_SCREEN_RANGES[phase.key];
          const isActive = phase.active;
          // Is this the "most active" phase (the last true one)?
          const isCurrent = phase.key === activePhase;

          return (
            <React.Fragment key={phase.key}>
              {/* Phase node */}
              <div
                className="flex items-center gap-2 rounded px-3 py-1 transition-all duration-500"
                style={{
                  background: isCurrent
                    ? `${cfg.color}22`
                    : isActive
                    ? `${cfg.color}0d`
                    : 'transparent',
                  border: isCurrent
                    ? `1px solid ${cfg.color}70`
                    : isActive
                    ? `1px solid ${cfg.color}30`
                    : '1px solid transparent',
                  boxShadow: isCurrent ? `0 0 14px ${cfg.glow}` : 'none',
                }}
              >
                {/* Indicator dot */}
                <div
                  style={{
                    width: isCurrent ? 12 : 8,
                    height: isCurrent ? 12 : 8,
                    borderRadius: '50%',
                    background: isActive ? cfg.color : 'rgba(100,100,100,0.4)',
                    boxShadow: isCurrent ? `0 0 10px ${cfg.glow}` : 'none',
                    transition: 'all 0.5s ease',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-semibold tracking-wider uppercase transition-all duration-500"
                  style={{
                    fontSize: isCurrent ? '13px' : '11px',
                    letterSpacing: '0.1em',
                    color: isCurrent ? '#ffffff' : isActive ? cfg.color : 'rgba(150,150,150,0.5)',
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {cfg.label}
                </span>
              </div>

              {/* Connector line */}
              {i < phases.length - 1 && (
                <div
                  style={{
                    width: 28,
                    height: 1,
                    background: isActive && phases[i + 1].active
                      ? cfg.color
                      : 'rgba(80,80,80,0.4)',
                    transition: 'background 0.5s ease',
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}