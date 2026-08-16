'use client';
// ─── orchestration/MarketplacePanel.tsx ──────────────────────────────────────
// Agent Marketplace Library panel: matched/unmatched agent roster display.

import React from 'react';
import { JSON_PAYLOADS } from './payloads';

const TIER_COLORS: Record<string, string> = {
  FOUNDATION: '#78a9ff',
  OPERATIONAL: '#42be65',
  SPECIALTY: '#c084fc',
  QUALITY: '#f59e0b',
  GOVERNANCE: '#ef4444',
};

type MarketplaceData = {
  registryScanned: number;
  matchedAgents: number;
  unmatchedAgents: number;
  matchedAgentRoster: Array<{
    rank: number;
    agentId: string;
    agentName: string;
    tier: string;
    matchScore: number;
    confidenceScore: number;
    matchReasons: string[];
    assignedRole: string;
  }>;
  unmatchedAgentSample: Array<{
    agentId: string;
    agentName: string;
    tier: string;
    matchScore: number;
    exclusionReason: string;
  }>;
  unmatchedSampleNote: string;
};

export function MarketplacePanel({ onClose }: { onClose: () => void }) {
  const data = JSON_PAYLOADS['marketplace_query'] as MarketplaceData;

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}>
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#0f1923' }}>
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>AGENT MARKETPLACE LIBRARY</span>
        </div>
        <button onClick={onClose} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
      </div>

      <div className="flex-shrink-0 px-4 py-2 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#0a1520' }}>
        <div className="flex items-center gap-1.5"><span style={{ fontSize: '9px', color: '#4b5563' }}>SCANNED</span><span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#f4f4f4' }}>{data.registryScanned}</span></div>
        <div style={{ width: 1, height: 16, background: 'rgba(57,57,57,0.6)' }} />
        <div className="flex items-center gap-1.5"><div className="rounded-full" style={{ width: 5, height: 5, background: '#42be65' }} /><span style={{ fontSize: '9px', color: '#4b5563' }}>MATCHED</span><span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#42be65' }}>{data.matchedAgents}</span></div>
        <div style={{ width: 1, height: 16, background: 'rgba(57,57,57,0.6)' }} />
        <div className="flex items-center gap-1.5"><div className="rounded-full" style={{ width: 5, height: 5, background: '#4b5563' }} /><span style={{ fontSize: '9px', color: '#4b5563' }}>EXCLUDED</span><span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#6f6f6f' }}>{data.unmatchedAgents}</span></div>
        <div className="ml-auto"><div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.1)', border: '1px solid rgba(66,190,101,0.4)' }}><span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>COALITION ASSEMBLED</span></div></div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.1em' }}>MATCHED AGENTS — {data.matchedAgents} SELECTED</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(66,190,101,0.2)' }} />
          </div>
          {data.matchedAgentRoster.map((agent) => {
            const tierColor = TIER_COLORS[agent.tier] || '#78a9ff';
            const matchPct = Math.round(agent.matchScore * 100);
            const confPct = Math.round(agent.confidenceScore * 100);
            return (
              <div key={agent.agentId} className="rounded p-2.5 flex flex-col gap-1.5" style={{ background: 'rgba(15,25,35,0.8)', border: '1px solid rgba(57,57,57,0.6)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#4b5563' }}>#{agent.rank}</span>
                    <span className="font-semibold truncate" style={{ fontSize: '10px', color: '#f4f4f4' }}>{agent.agentName}</span>
                  </div>
                  <div className="rounded px-1.5 py-0.5 flex-shrink-0" style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}40` }}>
                    <span className="font-mono" style={{ fontSize: '7px', color: tierColor, letterSpacing: '0.06em' }}>{agent.tier}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '8px', color: '#4b5563', width: 60, flexShrink: 0 }}>Match</span>
                  <div className="flex-1 rounded-full" style={{ height: 4, background: 'rgba(57,57,57,0.5)' }}>
                    <div className="rounded-full" style={{ width: `${matchPct}%`, height: 4, background: '#42be65', transition: 'width 0.5s ease' }} />
                  </div>
                  <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#42be65', width: 28, textAlign: 'right' }}>{matchPct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '8px', color: '#4b5563', width: 60, flexShrink: 0 }}>Confidence</span>
                  <div className="flex-1 rounded-full" style={{ height: 4, background: 'rgba(57,57,57,0.5)' }}>
                    <div className="rounded-full" style={{ width: `${confPct}%`, height: 4, background: '#78a9ff', transition: 'width 0.5s ease' }} />
                  </div>
                  <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#78a9ff', width: 28, textAlign: 'right' }}>{confPct}%</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {agent.matchReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span style={{ fontSize: '8px', color: '#42be65', flexShrink: 0, marginTop: 1 }}>›</span>
                      <span style={{ fontSize: '8px', color: '#6f6f6f', lineHeight: 1.4 }}>{reason}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: '7px', color: '#4b5563' }}>ROLE:</span>
                  <span className="font-mono" style={{ fontSize: '8px', color: tierColor, letterSpacing: '0.04em' }}>{agent.assignedRole}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.1em' }}>EXCLUDED AGENTS — SAMPLE</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(57,57,57,0.4)' }} />
          </div>
          {data.unmatchedAgentSample.slice(0, 5).map((agent) => {
            const tierColor = TIER_COLORS[agent.tier] || '#6f6f6f';
            return (
              <div key={agent.agentId} className="rounded p-2 flex flex-col gap-1" style={{ background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(57,57,57,0.4)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{agent.agentName}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>{Math.round(agent.matchScore * 100)}%</span>
                    <div className="rounded px-1 py-0.5" style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)' }}>
                      <span className="font-mono" style={{ fontSize: '7px', color: tierColor, letterSpacing: '0.04em' }}>{agent.tier}</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '8px', color: '#4b5563', lineHeight: 1.4 }}>{agent.exclusionReason}</span>
              </div>
            );
          })}
          <div className="rounded px-2 py-1.5" style={{ background: 'rgba(57,57,57,0.15)', border: '1px solid rgba(57,57,57,0.3)' }}>
            <span style={{ fontSize: '8px', color: '#4b5563', lineHeight: 1.4 }}>{data.unmatchedSampleNote}</span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)', background: '#0a1520' }}>
        <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.06em' }}>QUERY_ID: REGISTRY_QUERY_MARIA_SD_001_001</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="rounded-full" style={{ width: 5, height: 5, background: '#42be65', boxShadow: '0 0 4px #42be65' }} />
          <span className="font-mono" style={{ fontSize: '8px', color: '#42be65', letterSpacing: '0.06em' }}>GOVERNANCE OVERLAY: MANDATORY</span>
        </div>
      </div>
    </div>
  );
}
