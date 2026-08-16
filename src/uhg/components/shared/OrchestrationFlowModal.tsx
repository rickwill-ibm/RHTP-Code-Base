'use client';
// ─── OrchestrationFlowModal.tsx ───────────────────────────────────────────────
// Main modal canvas: Super Orchestration Controller lane view.
// Sub-panels and data live in ./orchestration/.

import React, { useState, useEffect, useRef } from 'react';
import type { AgentNode, GovernanceAgent } from './orchestration/types';
import { SIGNAL_NODES, FOUNDATION_AGENTS, OPERATIONAL_AGENTS, GOVERNANCE_AGENTS } from './orchestration/agentData';
import { JSON_PAYLOADS } from './orchestration/payloads';
import { H1abHITLPanel } from './orchestration/H1abHITLPanel';
import { DrChenEpicPanel } from './orchestration/DrChenEpicPanel';
import { MarketplacePanel } from './orchestration/MarketplacePanel';
import { MemberMobilePanel } from './orchestration/MemberMobilePanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrchestrationFlowModalProps {
  onClose: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const OrchestrationFlowModal: React.FC<OrchestrationFlowModalProps> = ({ onClose }) => {
  type ActivePanel = 'none' | 'marketplace' | 'h1ab' | 'drchen' | 'mobile' | 'pharmacy' | 'json';
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [jsonPayloadKey, setJsonPayloadKey] = useState<string>('');
  const [popout, setPopout] = useState<{ agent: AgentNode | GovernanceAgent; rect: DOMRect } | null>(null);
  const [laneProgress, setLaneProgress] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [scenarioResolved, setScenarioResolved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setLaneProgress(1), 400);
    const t2 = setTimeout(() => setLaneProgress(2), 1200);
    const t3 = setTimeout(() => setLaneProgress(3), 2000);
    const t4 = setTimeout(() => setTimelineProgress(1), 2400);
    const t5 = setTimeout(() => setTimelineProgress(2), 3200);
    const t6 = setTimeout(() => setScenarioResolved(true), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, []);

  useEffect(() => {
    if (!popout) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popout]')) setPopout(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popout]);

  const openJsonPanel = (key: string) => { setJsonPayloadKey(key); setActivePanel('json'); };
  const openAgentPopout = (agent: AgentNode | GovernanceAgent, el: HTMLElement) => { setPopout({ agent, rect: el.getBoundingClientRect() }); };
  const closePanel = () => setActivePanel('none');

  // ── Right panel renderer ──────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (activePanel === 'h1ab') return <H1abHITLPanel onClose={closePanel} />;
    if (activePanel === 'drchen') return <DrChenEpicPanel onClose={closePanel} />;
    if (activePanel === 'mobile') return <MemberMobilePanel onClose={closePanel} />;
    if (activePanel === 'marketplace') return <MarketplacePanel onClose={closePanel} />;
    if (activePanel === 'pharmacy') {
      const payload = JSON_PAYLOADS['policy_intercept_pharmacy'];
      return (
        <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#ef4444', letterSpacing: '0.1em' }}>MARTIN PHARMACY — CONSENT GATE</span>
            </div>
            <button onClick={closePanel} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <pre className="font-mono text-xs whitespace-pre-wrap" style={{ color: '#d1d5db', lineHeight: 1.6 }}>{JSON.stringify(payload, null, 2)}</pre>
          </div>
        </div>
      );
    }
    if (activePanel === 'json' && jsonPayloadKey) {
      const payload = JSON_PAYLOADS[jsonPayloadKey];
      return (
        <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>JSON PAYLOAD</span>
            </div>
            <button onClick={closePanel} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <pre className="font-mono text-xs whitespace-pre-wrap" style={{ color: '#d1d5db', lineHeight: 1.6 }}>{JSON.stringify(payload, null, 2)}</pre>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-4" style={{ background: '#0d1117', borderLeft: '1px solid rgba(57,57,57,0.4)' }}>
        <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563', letterSpacing: '0.1em' }}>SELECT AN ENDPOINT PILL TO VIEW PAYLOAD</span>
        <div className="flex flex-col gap-2 w-full">
          {[
            { label: 'H1ab HITL Panel', color: '#78a9ff', panel: 'h1ab' as ActivePanel },
            { label: 'Bennett County Health Epic CDS', color: '#8b5cf6', panel: 'drchen' as ActivePanel },
            { label: 'RHTP Mobile Push', color: '#10b981', panel: 'mobile' as ActivePanel },
            { label: 'Agent Marketplace', color: '#f59e0b', panel: 'marketplace' as ActivePanel },
          ].map(({ label, color, panel }) => (
            <button key={panel} onClick={() => setActivePanel(panel)} className="rounded px-3 py-2 text-left transition-all" style={{ background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: '11px', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </div>
    );
  };

  // ── Agent card renderer ───────────────────────────────────────────────────
  const renderAgentCard = (agent: AgentNode, laneVisible: boolean) => {
    const isIntercepted = agent.intercepted;
    const borderColor = isIntercepted ? 'rgba(241,194,27,0.5)' : `${agent.color}40`;
    const bg = isIntercepted ? 'rgba(241,194,27,0.06)' : `${agent.color}10`;
    return (
      <div key={agent.id} className="rounded flex flex-col gap-1.5 transition-all duration-500" style={{ background: bg, border: `1px solid ${borderColor}`, padding: '8px 10px', opacity: laneVisible ? 1 : 0.3, minWidth: 0 }}>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: agent.color, boxShadow: laneVisible ? `0 0 5px ${agent.color}` : 'none' }} />
            <span className="font-mono font-semibold truncate" style={{ fontSize: '9px', color: agent.color, letterSpacing: '0.08em' }}>{agent.label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isIntercepted && (<div className="rounded px-1 py-0.5" style={{ background: 'rgba(241,194,27,0.15)', border: '1px solid rgba(241,194,27,0.4)' }}><span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b', letterSpacing: '0.06em' }}>⚡ INTERCEPT</span></div>)}
            <button onClick={(e) => openAgentPopout(agent, e.currentTarget)} className="rounded flex items-center justify-center" style={{ width: 16, height: 16, background: 'rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '10px', cursor: 'pointer', border: '1px solid rgba(57,57,57,0.6)', flexShrink: 0 }}>ⓘ</button>
          </div>
        </div>
        <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.06em' }}>{agent.completionTime}</span>
        <div className="flex flex-col gap-1">
          {agent.fetchSystems.map((sys) => (
            <button key={sys.id} onClick={() => openJsonPanel(sys.payloadKey)} className="rounded px-2 py-1 flex items-center gap-1.5 transition-all text-left" style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.25)', cursor: 'pointer' }}>
              <span className="font-mono" style={{ fontSize: '7px', color: '#78a9ff', letterSpacing: '0.06em' }}>FETCH</span>
              <span style={{ fontSize: '8px', color: '#c6c6c6' }}>{sys.label}</span>
              <span style={{ fontSize: '7px', color: '#6f6f6f' }}>{sys.sublabel}</span>
              <span className="ml-auto font-mono" style={{ fontSize: '7px', color: '#4b5563' }}>SCOPED</span>
            </button>
          ))}
          {agent.pushSystems.map((sys) => {
            const isH1ab = sys.id === 'h1ab';
            const isDrChen = sys.id === 'dr-chen-ehr';
            const isRHTP = sys.id === 'rally-mobile';
            const isPharmacyGate = sys.id === 'optumrx-gate';
            const pillColor = isPharmacyGate ? '#ef4444' : '#42be65';
            return (
              <button key={sys.id} onClick={() => { if (isH1ab) setActivePanel('h1ab'); else if (isDrChen) setActivePanel('drchen'); else if (isRHTP) setActivePanel('mobile'); else if (isPharmacyGate) setActivePanel('pharmacy'); else openJsonPanel(sys.payloadKey); }} className="rounded px-2 py-1 flex items-center gap-1.5 transition-all text-left" style={{ background: `${pillColor}08`, border: `1px solid ${pillColor}25`, cursor: 'pointer' }}>
                <span className="font-mono" style={{ fontSize: '7px', color: pillColor, letterSpacing: '0.06em' }}>PUSH</span>
                <span style={{ fontSize: '8px', color: '#c6c6c6' }}>{sys.label}</span>
                <span style={{ fontSize: '7px', color: '#6f6f6f' }}>{sys.sublabel}</span>
                <span className="ml-auto font-mono" style={{ fontSize: '7px', color: '#4b5563' }}>SCOPED</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGovernanceCard = (gov: GovernanceAgent, laneVisible: boolean) => {
    const hasIntercept = gov.interceptAt && gov.interceptAt.length > 0;
    return (
      <div key={gov.id} className="rounded flex flex-col gap-1.5 transition-all duration-500" style={{ background: `${gov.color}08`, border: `1px solid ${gov.color}35`, padding: '8px 10px', opacity: laneVisible ? 1 : 0.3 }}>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: gov.color }} />
            <span className="font-mono font-semibold truncate" style={{ fontSize: '9px', color: gov.color, letterSpacing: '0.08em' }}>{gov.label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasIntercept && (<div className="rounded px-1 py-0.5" style={{ background: 'rgba(241,194,27,0.12)', border: '1px solid rgba(241,194,27,0.4)' }}><span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b' }}>CONTAINED</span></div>)}
            <button onClick={(e) => openAgentPopout(gov, e.currentTarget)} className="rounded flex items-center justify-center" style={{ width: 16, height: 16, background: 'rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '10px', cursor: 'pointer', border: '1px solid rgba(57,57,57,0.6)', flexShrink: 0 }}>ⓘ</button>
          </div>
        </div>
        {gov.interceptLabel && (<span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b', letterSpacing: '0.06em' }}>{gov.interceptLabel}</span>)}
        <button onClick={() => openJsonPanel(gov.payloadKey)} className="rounded px-2 py-1 flex items-center gap-1.5 transition-all text-left" style={{ background: 'rgba(57,57,57,0.2)', border: '1px solid rgba(57,57,57,0.4)', cursor: 'pointer' }}>
          <span className="font-mono" style={{ fontSize: '7px', color: '#6f6f6f', letterSpacing: '0.06em' }}>AUDIT LOG</span>
          <span style={{ fontSize: '8px', color: '#c6c6c6' }}>View payload</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3" style={{ background: '#0d1117', borderBottom: '1px solid rgba(57,57,57,0.7)', height: 52 }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 8px #78a9ff', animation: 'pulse 2s infinite' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '13px', color: '#78a9ff', letterSpacing: '0.12em' }}>SUPER ORCHESTRATION CONTROLLER</span>
          <div className="rounded px-2 py-0.5" style={{ background: 'rgba(120,169,255,0.1)', border: '1px solid rgba(120,169,255,0.3)' }}>
            <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.08em' }}>INSTRUCTION_SOURCE: VALIDATED · CONTEXT_INTEGRITY: SHA-256</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActivePanel('marketplace')} className="rounded px-3 py-1.5 font-mono transition-all" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: '10px', cursor: 'pointer', letterSpacing: '0.08em' }}>AGENT MARKETPLACE</button>
          <button onClick={onClose} className="rounded flex items-center justify-center" style={{ width: 28, height: 28, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 16, cursor: 'pointer', border: '1px solid rgba(57,57,57,0.6)' }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left column — coalition flow */}
        <div className="flex flex-col overflow-y-auto" style={{ width: activePanel !== 'none' ? '72%' : '100%', transition: 'width 0.3s ease', borderRight: activePanel !== 'none' ? '1px solid rgba(57,57,57,0.5)' : 'none' }}>
          <div className="flex-1 px-5 py-4 flex flex-col gap-4">

            {/* Lane 0 — Signal Classification */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE 0 — SIGNAL CLASSIFICATION ENGINE</span><div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} /></div>
              <div className="flex items-center gap-2 flex-wrap">
                {SIGNAL_NODES.map((sig) => (
                  <button key={sig.id} onClick={() => openJsonPanel('signal_classification')} className="rounded px-3 py-1.5 flex items-center gap-2 transition-all" style={{ background: `${sig.color}12`, border: `1px solid ${sig.color}40`, cursor: 'pointer' }}>
                    <div className="rounded-full" style={{ width: 6, height: 6, background: sig.color }} />
                    <span className="font-mono font-semibold" style={{ fontSize: '9px', color: sig.color, letterSpacing: '0.08em' }}>{sig.label}</span>
                    <span className="font-mono" style={{ fontSize: '8px', color: '#6f6f6f' }}>{sig.sublabel}</span>
                  </button>
                ))}
                <div className="rounded px-2 py-1" style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.25)' }}>
                  <span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.08em' }}>→ SUPER ORCHESTRATION CONTROLLER</span>
                </div>
              </div>
            </div>

            {/* Lane A — Foundation Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE A — FOUNDATION AGENTS · T+0</span><div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} /></div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {FOUNDATION_AGENTS.map((agent) => renderAgentCard(agent, laneProgress >= 1))}
              </div>
            </div>

            {/* Lane B — Operational Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE B — OPERATIONAL AGENTS · T+3m</span><div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} /></div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {OPERATIONAL_AGENTS.map((agent) => renderAgentCard(agent, laneProgress >= 2))}
              </div>
            </div>

            {/* Parallel Execution Timeline */}
            <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(120,169,255,0.04)', border: '1px solid rgba(120,169,255,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.1em' }}>PARALLEL EXECUTION TIMELINE</span>
                <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>T+0 → T+47m</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {OPERATIONAL_AGENTS.slice(0, 6).map((agent) => {
                  const pct = timelineProgress >= 1 ? Math.min(100, (agent.completionMin / 47) * 100) : 0;
                  return (
                    <div key={agent.id} className="flex items-center gap-2">
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: agent.color, width: 120, letterSpacing: '0.04em' }}>{agent.label}</span>
                      <div className="flex-1 rounded-full" style={{ height: 4, background: 'rgba(57,57,57,0.5)' }}>
                        <div className="rounded-full transition-all duration-1000" style={{ width: `${pct}%`, height: '100%', background: agent.intercepted ? '#f1c21b' : agent.color, opacity: 0.8 }} />
                      </div>
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#4b5563', width: 40 }}>{agent.completionTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lane C — Governance Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE C — GOVERNANCE AGENTS · CONTINUOUS</span><div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} /></div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {GOVERNANCE_AGENTS.map((gov) => renderGovernanceCard(gov, laneProgress >= 3))}
              </div>
            </div>

            {/* Scenario Resolved bar */}
            <div className="rounded p-3 flex items-center gap-3 transition-all duration-700" style={{ background: scenarioResolved ? 'rgba(66,190,101,0.08)' : 'rgba(57,57,57,0.2)', border: `1px solid ${scenarioResolved ? 'rgba(66,190,101,0.4)' : 'rgba(57,57,57,0.4)'}`, opacity: scenarioResolved ? 1 : 0.4 }}>
              <div className="rounded-full" style={{ width: 10, height: 10, background: scenarioResolved ? '#42be65' : '#393939', boxShadow: scenarioResolved ? '0 0 8px #42be65' : 'none', transition: 'all 0.5s' }} />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono font-semibold" style={{ fontSize: '11px', color: scenarioResolved ? '#42be65' : '#6f6f6f', letterSpacing: '0.1em' }}>{scenarioResolved ? 'SCENARIO RESOLVED — T+47m' : 'SCENARIO IN PROGRESS…'}</span>
                {scenarioResolved && (<span style={{ fontSize: '10px', color: '#6f6f6f' }}>8 agents · 71 decisions · 2 intercepts · 100% governance compliance · $18,400 cost avoidance</span>)}
              </div>
              {scenarioResolved && (<div className="ml-auto flex items-center gap-2"><div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}><span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>AUDIT LEDGER COMMITTED</span></div></div>)}
            </div>

          </div>
        </div>

        {/* Right column — active panel */}
        {activePanel !== 'none' && (
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '28%' }}>
            {renderRightPanel()}
          </div>
        )}
      </div>

      {/* Agent popout */}
      {popout && (
        <div data-popout className="fixed z-[60] rounded shadow-2xl flex flex-col gap-2" style={{ top: Math.min(popout.rect.bottom + 8, window.innerHeight - 260), left: Math.min(popout.rect.left, window.innerWidth - 320), width: 300, background: '#161b22', border: '1px solid rgba(57,57,57,0.8)', padding: '12px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: popout.agent.color }} />
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: popout.agent.color, letterSpacing: '0.08em' }}>{popout.agent.label}</span>
            </div>
            <button onClick={() => setPopout(null)} style={{ color: '#6f6f6f', fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>×</button>
          </div>
          {popout.agent.tier && (<span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.06em' }}>{popout.agent.tier}</span>)}
          {popout.agent.rationale && (<p style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.5 }}>{popout.agent.rationale}</p>)}
          {popout.agent.outcome && (<div className="rounded p-2" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.25)' }}><span style={{ fontSize: '9px', color: '#42be65', lineHeight: 1.4 }}>{popout.agent.outcome}</span></div>)}
          {popout.agent.confidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>CONFIDENCE</span>
              <div className="flex-1 rounded-full" style={{ height: 3, background: 'rgba(57,57,57,0.5)' }}>
                <div className="rounded-full" style={{ width: `${(popout.agent.confidence ?? 0) * 100}%`, height: '100%', background: popout.agent.color }} />
              </div>
              <span className="font-mono" style={{ fontSize: '8px', color: popout.agent.color }}>{Math.round((popout.agent.confidence ?? 0) * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrchestrationFlowModal;
