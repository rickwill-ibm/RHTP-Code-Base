import React from 'react';
import PhaseArc from './PhaseArc';
import MiniProfileBadge from './MiniProfileBadge';

interface ScreenLayoutProps {
  children: React.ReactNode;
  screenId: string;
  showPhaseArc?: boolean;
  phaseArcState?: {
    foundation?: boolean;
    orchestration?: boolean;
    autonomous?: boolean;
  };
  showMiniProfile?: boolean;
  showSignalBg?: boolean;
  className?: string;
}

export default function ScreenLayout({
  children,
  showPhaseArc = true,
  phaseArcState = {},
  showMiniProfile = false,
  className = '',
}: ScreenLayoutProps) {
  return (
    // Carbon g90 #161616 — locked background for ALL screens
    // Using minHeight to ensure content renders properly within AppLayout
    // Subtract AppLayout header height (56px) to prevent overflow
    <div className={`screen-slide flex flex-col ${className}`} style={{ background: '#161616', minHeight: 'calc(100vh - 56px)' }}>
      {/* UHG Header Bar — Navy #002677 demoted to header bar only, never page background */}
      {showPhaseArc && (
        <div
          className="flex items-center justify-between px-6 flex-shrink-0 phase-arc-container"
          style={{ height: 48, background: '#002677', borderBottom: '1px solid rgba(0,0,0,0.4)' }}
        >
          {/* Left: Mini Profile Badge */}
          <div style={{ minWidth: 240 }}>
            <MiniProfileBadge visible={showMiniProfile} />
          </div>

          {/* Center: Phase Arc */}
          <div className="flex-1 flex justify-center">
            <PhaseArc
              foundation={phaseArcState.foundation}
              orchestration={phaseArcState.orchestration}
              autonomous={phaseArcState.autonomous}
            />
          </div>

          {/* Right: RHTP Brand */}
          <div style={{ minWidth: 240 }} className="flex justify-end">
            <div
              className="rounded px-3 py-1.5"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span
                className="font-semibold text-white tracking-wider"
                style={{ fontSize: '11px', letterSpacing: '0.14em' }}
              >
                RHTP ORCHESTRATE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content — always on #161616 */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#161616' }}>{children}</div>
    </div>
  );
}