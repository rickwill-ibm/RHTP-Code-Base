'use client';
// ─── orchestration/H1abHITLPanel.tsx ─────────────────────────────────────────
// H1ab Human-in-the-Loop panel: care manager acknowledgement simulation.

import React, { useState, useEffect } from 'react';
import type { HITLStep } from './types';

const HITL_STEPS: HITLStep[] = [
  { time: '09:55am', label: 'Sarah opens H1ab', detail: 'Queue notification: Maria Redhawk — enriched brief available', color: '#78a9ff', icon: '📋' },
  { time: '09:56am', label: 'Reviews transport blocker', detail: 'TRANSPORT_BARRIER flagged — home lab kit dispatched as alternative', color: '#ef4444', icon: '⚠️' },
  { time: '09:57am', label: 'Reviews enriched context', detail: 'SDOH barriers, family context, 8 interventions — real-time vs 47-day-old snapshot', color: '#f59e0b', icon: '🔍' },
  { time: '09:58am', label: 'Confirms home kit approach', detail: 'Approach confirmed — barrier-aware outreach script locked for 10am call', color: '#42be65', icon: '✓' },
  { time: '09:58am', label: 'Acknowledgement logged', detail: 'CM_SARAH_JOHNSON acknowledged MARIA_SD_001 context update — no override — approach confirmed', color: '#42be65', icon: '🔒' },
];

const H1AB_MOCK_SECTIONS = [
  {
    label: 'CRITICAL BLOCKERS',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.35)',
    items: [
      { key: 'Type', value: 'TRANSPORT_BARRIER — PROBABLE' },
      { key: 'Impact', value: 'Standard HbA1c clinic appointment will likely fail' },
      { key: 'Evidence', value: '2 missed appointments in 12 months — same zip code' },
      { key: 'System Response', value: 'Home lab kit ordered — eliminates transport barrier' },
      { key: 'Your Action', value: 'Confirm home kit receipt at 10am — do NOT book clinic appt' },
      { key: 'If Kit Declined', value: 'Telehealth + mobile phlebotomy available' },
    ],
  },
  {
    label: 'ENRICHED CONTEXT',
    color: '#78a9ff',
    bg: 'rgba(120,169,255,0.06)',
    border: 'rgba(120,169,255,0.25)',
    items: [
      { key: 'Context Freshness', value: 'REAL-TIME (was: 47-day-old snapshot)' },
      { key: 'SDOH Barriers', value: 'Transport (PROBABLE) · Financial (ELEVATED) · Caregiver Burden (HIGH)' },
      { key: 'Family Context', value: 'Sophia — 6 care gaps · Elena — Lisinopril/A1C elevated' },
      { key: 'Interventions', value: '8 dispatched · HbA1c gap closed · CAREGAP_HBA1C renewal submitted' },
      { key: 'Episode Context', value: 'Postpartum Episode — Day 34 of 90-day window' },
    ],
  },
  {
    label: 'OUTREACH BRIEF',
    color: '#42be65',
    bg: 'rgba(66,190,101,0.06)',
    border: 'rgba(66,190,101,0.25)',
    items: [
      { key: 'Call Time', value: '10:00am — peak engagement window (portal signals)' },
      { key: 'Script', value: 'Barrier-aware — do not mention clinic appointment' },
      { key: 'Opening', value: '"Hi Maria, I\'m calling to confirm your home lab kit arrived"' },
      { key: 'Next Action', value: 'Confirm receipt → schedule follow-up → close HbA1c gap' },
      { key: 'Receptivity Score', value: '87% — ENGAGED state confirmed' },
    ],
  },
];

export function H1abHITLPanel({ onClose }: { onClose: () => void }) {
  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideSelected, setOverrideSelected] = useState<string | null>(null);
  const [showH1abView, setShowH1abView] = useState(false);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [graphPhase, setGraphPhase] = useState(0);

  const triggerH1abGraphOverlay = () => {
    setShowGraphOverlay(true);
    setGraphPhase(1);
    setTimeout(() => setGraphPhase(2), 600);
    setTimeout(() => setGraphPhase(3), 1200);
    setTimeout(() => setGraphPhase(4), 1800);
  };

  const startSimulation = () => {
    setSimulating(true);
    setCurrentStep(0);
    HITL_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        if (i === HITL_STEPS.length - 1) {
          setTimeout(() => {
            setAcknowledged(true);
            setTimeout(() => triggerH1abGraphOverlay(), 800);
          }, 600);
        }
      }, i * 1100);
    });
  };

  useEffect(() => {
    if (!showGraphOverlay) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setShowGraphOverlay(false);
        setGraphPhase(0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGraphOverlay]);

  if (showH1abView) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}>
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#0f1923' }}>
          <div className="flex items-center gap-3">
            <div className="rounded px-2 py-1 flex items-center gap-2" style={{ background: 'rgba(12,85,184,0.2)', border: '1px solid rgba(12,85,184,0.5)' }}>
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>H1ab — CARE MANAGER SYSTEM</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Sarah Johnson · Queue View</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowH1abView(false)} className="rounded px-2 py-1 transition-colors" style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)', color: '#8d8d8d', fontSize: '11px', cursor: 'pointer' }}>← Back</button>
            <button onClick={onClose} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
          </div>
        </div>
        <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between" style={{ background: '#0a1520', borderBottom: '1px solid rgba(57,57,57,0.4)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '10px', color: '#4b5563' }}>Member:</span>
            <span className="font-semibold" style={{ fontSize: '11px', color: '#f4f4f4' }}>Maria Redhawk</span>
            <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: '#ef4444', letterSpacing: '0.06em' }}>HIGH RISK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full" style={{ width: 6, height: 6, background: '#42be65', boxShadow: '0 0 5px #42be65' }} />
            <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>CONTEXT UPDATED — REAL-TIME</span>
          </div>
        </div>
        <div className="flex-shrink-0 mx-4 mt-3 rounded p-3 flex items-start gap-3" style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.35)' }}>
          <div className="rounded-full flex-shrink-0 mt-0.5" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold" style={{ fontSize: '11px', color: '#78a9ff' }}>Orchestration System pushed enriched context — T+47m</span>
            <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Context freshness upgraded from 47-day-old snapshot to real-time. Transport blocker flagged. Home kit dispatched. Review and confirm 10am outreach approach.</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {H1AB_MOCK_SECTIONS.map((section) => (
            <div key={section.label} className="rounded" style={{ background: section.bg, border: `1px solid ${section.border}` }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${section.border}` }}>
                <div className="rounded-full" style={{ width: 6, height: 6, background: section.color }} />
                <span className="font-mono font-semibold" style={{ fontSize: '10px', color: section.color, letterSpacing: '0.1em' }}>{section.label}</span>
              </div>
              <div className="px-3 py-2 flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <div key={item.key} className="flex gap-2">
                    <span className="font-mono flex-shrink-0" style={{ fontSize: '9px', color: '#4b5563', width: 110, letterSpacing: '0.04em' }}>{item.key}</span>
                    <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.4 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {acknowledged && (
            <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '10px', color: '#42be65' }}>✓</span>
                <span className="font-mono" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>ACKNOWLEDGED — T+8h32m</span>
              </div>
              <span style={{ fontSize: '10px', color: '#6f6f6f' }}>CM_SARAH_JOHNSON acknowledged MARIA_SD_001 context update — no override — approach confirmed</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>AUDIT_20241115_183244_HITL_CM_001</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)', background: '#0a1520' }}>
          <button onClick={() => { setAcknowledged(true); setTimeout(() => triggerH1abGraphOverlay(), 400); setShowH1abView(false); }} className="flex-1 rounded py-2 font-semibold transition-all" style={{ background: 'rgba(66,190,101,0.15)', border: '1px solid rgba(66,190,101,0.5)', color: '#42be65', fontSize: '11px', cursor: 'pointer' }}>CONFIRM APPROACH</button>
          <button className="rounded py-2 px-3 transition-all" style={{ background: 'rgba(241,194,27,0.1)', border: '1px solid rgba(241,194,27,0.4)', color: '#f1c21b', fontSize: '11px', cursor: 'pointer' }}>MODIFY</button>
          <button className="rounded py-2 px-3 transition-all" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>ESCALATE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}>
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}>
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>H1ab PUSH — HITL ACKNOWLEDGEMENT</span>
        </div>
        <button onClick={onClose} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65', boxShadow: '0 0 6px #42be65' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#42be65', letterSpacing: '0.1em' }}>H1ab PUSH — COMPLETE</span>
            </div>
            <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563' }}>T+47m</span>
          </div>
          <div className="flex flex-col gap-1 pl-3">
            <div className="flex items-center gap-2"><span style={{ fontSize: '9px', color: '#4b5563' }}>Target:</span><span style={{ fontSize: '10px', color: '#f4f4f4' }}>Sarah Johnson — H1ab queue updated</span></div>
            <div className="flex items-center gap-2"><span style={{ fontSize: '9px', color: '#4b5563' }}>Context:</span><span style={{ fontSize: '10px', color: '#f4f4f4' }}>REAL-TIME</span><span style={{ fontSize: '9px', color: '#6f6f6f' }}>(was: 47-day-old snapshot)</span></div>
            <div className="flex items-center gap-2"><span style={{ fontSize: '9px', color: '#4b5563' }}>Method:</span><span style={{ fontSize: '10px', color: '#78a9ff' }}>Autonomous push — no human assembly required</span></div>
          </div>
        </div>

        <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '11px', color: '#ef4444' }}>⚠</span>
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '0.08em' }}>TRANSPORT BLOCKER FLAGGED IN BRIEF</span>
          </div>
          <span style={{ fontSize: '10px', color: '#d1d5db' }}>Standard HbA1c clinic appointment will likely fail — home lab kit dispatched as alternative</span>
          <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{"Sarah's outreach brief: barrier-aware script loaded · Action: confirm home kit receipt — NOT clinic booking"}</span>
        </div>

        <div className="rounded p-3 flex flex-col gap-3" style={{ background: 'rgba(120,169,255,0.05)', border: '1px solid rgba(120,169,255,0.25)' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#78a9ff', letterSpacing: '0.1em' }}>
              {acknowledged ? 'CARE MANAGER ACKNOWLEDGED' : 'AWAITING CARE MANAGER ACKNOWLEDGEMENT'}
            </span>
            {acknowledged && (
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>T+8h32m</span>
              </div>
            )}
          </div>

          {(simulating || acknowledged) && (
            <div className="flex flex-col gap-2">
              {HITL_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 transition-all duration-500" style={{ opacity: currentStep >= i ? 1 : 0.2 }}>
                  <div className="rounded-full flex-shrink-0 mt-0.5" style={{ width: 7, height: 7, background: currentStep >= i ? step.color : '#393939', boxShadow: currentStep >= i ? `0 0 5px ${step.color}` : 'none', transition: 'all 0.4s' }} />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>{step.time}</span>
                      <span style={{ fontSize: '10px', color: currentStep >= i ? '#f4f4f4' : '#4b5563', fontWeight: 500 }}>{step.label}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#6f6f6f', lineHeight: 1.4 }}>{step.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!simulating && !acknowledged && (
            <button onClick={startSimulation} className="rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2" style={{ background: 'rgba(120,169,255,0.15)', border: '1px solid rgba(120,169,255,0.5)', color: '#78a9ff', fontSize: '12px', cursor: 'pointer' }}>
              <span>▶</span><span>{"SIMULATE SARAH'S RESPONSE"}</span>
            </button>
          )}
          {simulating && !acknowledged && (
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 6, height: 6, background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span className="font-mono" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.08em' }}>{"SIMULATING SARAH'S REVIEW…"}</span>
            </div>
          )}
        </div>

        {acknowledged && !overrideSelected && (
          <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(241,194,27,0.05)', border: '1px solid rgba(241,194,27,0.2)' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: '#f1c21b', letterSpacing: '0.08em' }}>OVERRIDE AUTHORITY</span>
            <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Sarah confirmed the approach. She could have overridden — clinical judgment is always respected.</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowOverride(true)} className="rounded px-3 py-1.5 transition-all" style={{ background: 'rgba(241,194,27,0.08)', border: '1px solid rgba(241,194,27,0.3)', color: '#f1c21b', fontSize: '10px', cursor: 'pointer' }}>View Override Options</button>
              {showOverride && (
                <div className="flex items-center gap-1.5">
                  {['Telehealth', 'Mobile Phlebotomy', 'Defer'].map((opt) => (
                    <button key={opt} onClick={() => { setOverrideSelected(opt); setShowOverride(false); }} className="rounded px-2 py-1 transition-all" style={{ background: 'rgba(57,57,57,0.5)', border: '1px solid rgba(57,57,57,0.7)', color: '#8d8d8d', fontSize: '9px', cursor: 'pointer' }}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {overrideSelected && (
          <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(241,194,27,0.08)', border: '1px solid rgba(241,194,27,0.4)' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '10px', color: '#f1c21b' }}>⚡</span>
              <span className="font-mono" style={{ fontSize: '10px', color: '#f1c21b', letterSpacing: '0.08em' }}>OVERRIDE LOGGED — {overrideSelected.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: '10px', color: '#d1d5db' }}>Care manager clinical judgment: {overrideSelected} selected over home kit</span>
            <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>AUDIT_20241115_183312_OVERRIDE_CM_001 · Governance Agent notified</span>
          </div>
        )}

        {acknowledged && (
          <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(57,57,57,0.5)' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.1em' }}>AUDIT LOG</span>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'AUDIT_20241115_144912_H1AB_001', action: 'CARE_MANAGEMENT → H1ab PUSH COMPLETE', color: '#42be65' },
                { id: 'AUDIT_20241115_183244_HITL_CM_001', action: 'CM_SARAH_JOHNSON acknowledged MARIA_SD_001 — no override — approach confirmed', color: '#78a9ff' },
                { id: 'AUDIT_20241115_183244_SCRIPT_001', action: '10am outreach script locked — barrier-aware — home kit confirmation', color: '#42be65' },
              ].map((entry) => (
                <div key={entry.id} className="flex flex-col gap-0.5">
                  <span className="font-mono" style={{ fontSize: '9px', color: entry.color, letterSpacing: '0.04em' }}>{entry.action}</span>
                  <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>{entry.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)' }}>
        <button onClick={() => setShowH1abView(true)} className="flex-1 rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2" style={{ background: 'rgba(12,85,184,0.15)', border: '1px solid rgba(12,85,184,0.5)', color: '#78a9ff', fontSize: '12px', cursor: 'pointer' }}>
          <span>⊞</span><span>{"VIEW IN H1ab — SARAH'S SYSTEM"}</span>
        </button>
        <button onClick={onClose} className="rounded py-2.5 px-3 transition-all" style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '11px', cursor: 'pointer' }}>Close</button>
      </div>

      {showGraphOverlay && (
        <div className="absolute inset-0 z-60 flex flex-col" style={{ background: 'rgba(5,10,20,0.97)', backdropFilter: 'blur(2px)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(120,169,255,0.35)', background: 'rgba(120,169,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 8px #78a9ff', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.12em' }}>KNOWLEDGE GRAPH — REAL-TIME UPDATE</span>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>H1ab CM WRITE-BACK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.06em' }}>↓ arrow to dismiss</span>
              <button onClick={() => { setShowGraphOverlay(false); setGraphPhase(0); }} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden px-2 py-2">
            <svg width="100%" height="100%" viewBox="0 0 500 420" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <line x1="250" y1="52" x2="120" y2="130" stroke="rgba(120,169,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" /></line>
              <line x1="250" y1="52" x2="370" y2="130" stroke="rgba(241,194,27,0.4)" strokeWidth="1.5" strokeDasharray="4 3"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" /></line>
              {graphPhase >= 2 && <line x1="120" y1="185" x2="120" y2="245" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" strokeDasharray="4 3"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" /></line>}
              {graphPhase >= 3 && <line x1="120" y1="295" x2="120" y2="345" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" /></line>}
              {graphPhase >= 4 && <line x1="370" y1="185" x2="370" y2="280" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3"><animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" /></line>}
              <circle cx="250" cy="28" r="26" fill="rgba(120,169,255,0.12)" stroke="rgba(120,169,255,0.6)" strokeWidth="2" filter="url(#glowBlueH1ab)" />
              <text x="250" y="24" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">MARIA</text>
              <text x="250" y="35" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">REDHAWK</text>
              <rect x="20" y="130" width="200" height="55" rx="4" fill="rgba(120,169,255,0.08)" stroke={graphPhase >= 1 ? '#78a9ff' : 'rgba(120,169,255,0.25)'} strokeWidth={graphPhase >= 1 ? 2 : 1} opacity={graphPhase >= 1 ? 1 : 0.4} />
              <text x="30" y="149" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#78a9ff" letterSpacing="0.06em">SARAH JOHNSON — H1ab</text>
              {graphPhase >= 1 && (<><rect x="148" y="133" width="64" height="16" rx="3" fill="rgba(66,190,101,0.15)" stroke="rgba(66,190,101,0.5)" strokeWidth="1" /><circle cx="156" cy="141" r="3" fill="#10b981" /><text x="180" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ACKNOWLEDGED</text></>)}
              <text x="30" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Care Manager · CM_SARAH_JOHNSON</text>
              {graphPhase >= 1 && (<><text x="30" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">H1ab brief reviewed · approach confirmed ✓</text><text x="30" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">T+8h32m · no override · script locked</text></>)}
              {graphPhase >= 2 && <rect x="20" y="245" width="200" height="50" rx="4" fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.5)" strokeWidth="1" />}
              {graphPhase >= 2 && (<><text x="30" y="263" fontFamily="monospace" fontSize="9" fill="#ef4444" letterSpacing="0.06em">TRANSPORT_BARRIER</text><rect x="148" y="248" width="65" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" /><text x="180" y="260" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">PRE-RESOLVED</text><text x="30" y="277" fontFamily="monospace" fontSize="8" fill="#6f6f6f">2 missed appts · same zip · PROBABLE</text><text x="30" y="289" fontFamily="monospace" fontSize="8" fill="#42be65">← Sarah confirmed barrier-aware script</text></>)}
              {graphPhase >= 3 && <rect x="20" y="345" width="200" height="40" rx="4" fill="rgba(66,190,101,0.06)" stroke="rgba(66,190,101,0.45)" strokeWidth="1" />}
              {graphPhase >= 3 && (<><text x="30" y="363" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">HOME LAB KIT</text><text x="175" y="363" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">DISPATCHED</text><text x="30" y="377" fontFamily="monospace" fontSize="8" fill="#6f6f6f">HbA1c gap · no clinic visit required</text></>)}
              <rect x="280" y="130" width="210" height="55" rx="4" fill="rgba(241,194,27,0.06)" stroke={graphPhase >= 1 ? 'rgba(241,194,27,0.6)' : 'rgba(241,194,27,0.2)'} strokeWidth={graphPhase >= 1 ? 2 : 1} opacity={graphPhase >= 1 ? 1 : 0.4} />
              <text x="290" y="149" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#f1c21b" letterSpacing="0.06em">HbA1c CARE GAP</text>
              {graphPhase >= 1 && (<><rect x="400" y="133" width="82" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" /><text x="441" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ADDRESSED</text></>)}
              <text x="290" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">9.2% · 47d SD Medicaid quality window · Q4 active</text>
              {graphPhase >= 1 && (<><text x="290" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">Home kit dispatched 2024-11-14 ✓</text><text x="290" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">Closure projected 14 days</text></>)}
              {graphPhase >= 4 && <rect x="280" y="280" width="210" height="50" rx="4" fill="rgba(66,190,101,0.06)" stroke="rgba(66,190,101,0.45)" strokeWidth="1" />}
              {graphPhase >= 4 && (<><text x="290" y="298" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">CAREGAP_HBA1C RENEWAL</text><text x="455" y="298" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">SUBMITTED</text><text x="290" y="312" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Procedure HbA1c · cycle time 0.3d</text><text x="290" y="322" fontFamily="monospace" fontSize="8" fill="#42be65">Sarah notified — no action required</text></>)}
              <defs><filter id="glowBlueH1ab" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            </svg>
          </div>
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid rgba(57,57,57,0.4)' }}>
            {[{ color: '#78a9ff', label: 'H1ab_ACKNOWLEDGED' }, { color: '#ef4444', label: 'TRANSPORT_BARRIER' }, { color: '#42be65', label: 'CARE_GAP_ADDRESSED' }, { color: '#f1c21b', label: 'AUTH_SUBMITTED' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5"><div style={{ width: 20, height: 1.5, background: color, opacity: 0.7 }} /><span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.04em' }}>{label}</span></div>
            ))}
            <div className="ml-auto flex items-center gap-1.5"><div className="rounded-full" style={{ width: 5, height: 5, background: '#78a9ff', animation: 'pulse 1.5s infinite' }} /><span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.06em' }}>LIVE — nodes updating</span></div>
          </div>
          <div className="flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.4)', background: 'rgba(0,0,0,0.3)' }}>
            <div className="rounded px-3 py-1 flex items-center gap-2" style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)' }}>
              <span style={{ fontSize: '12px', color: '#6f6f6f' }}>↓</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>PRESS DOWN ARROW TO RETURN TO PANEL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
