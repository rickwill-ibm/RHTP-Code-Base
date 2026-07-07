'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import {
  graphNodes,
  graphEdges,
  lensDefinitions,
  activeSignals,
  type GraphNode,
  type GraphEdge,
  type LensType,
  type ActiveSignal,
} from '@/lib/wholePersonGraphData';
import { useGapClosureStore } from '@/lib/patientContext';

// ── Dark theme ────────────────────────────────────────────────────────────────
const DARK = {
  bg: '#050508',
  surface: '#0d0d18',
  border: '#1a1a2e',
  borderBright: '#252540',
  text: '#e2e8f0',
  textMuted: '#64748b',
  textDim: '#2d3748',
};

// ── Sofia lens — 7 nodes in clean radial ring ─────────────────────────────────
const SOFIA_LENS_NODES = ['n01', 'n15', 'n06', 'n35', 'n13', 'n32', 'n26', 'n52'];

// ── Agent Coalition lens nodes ────────────────────────────────────────────────
const AGENT_LENS_NODES = ['n01', 'a01', 'a02', 'a03', 'n04', 'n07', 'n17', 'n18', 'n41', 'n38', 'n51', 'n25', 'n14'];

// ── Refined lens node sets ────────────────────────────────────────────────────
const LENS_NODE_SETS: Record<LensType, string[]> = {
  all: graphNodes.map((n) => n.id),
  clinical: [
    'n01', 'n04', 'n05', 'n06', 'n07', 'n08', 'n09', 'n10',
    'n14', 'n33', 'n11', 'n12', 'n13', 'n15', 'n16', 'n17', 'n18',
  ],
  behavioral: [
    'n01', 'n05', 'n07', 'n08', 'n19', 'n23', 'n24', 'n25', 'n31', 'n38', 'n44', 'n49', 'n51',
  ],
  social: ['n01', 'n17', 'n18', 'n04', 'n20', 'n21', 'n22', 'n23', 'n47', 'n48', 'n30', 'n36', 'n41'],
  eligibility: [
    'n01', 'n41', 'n42', 'n43', 'n46', 'n45', 'n39', 'n40', 'n18', 'n04', 'n02',
  ],
  agents: AGENT_LENS_NODES,
};

type ExtendedLensType = LensType | 'sofia';

const NODE_TYPE_LABELS: Record<string, string> = {
  Member: 'Member', Insurance: 'Insurance', CareGap: 'Care Gap',
  Episode: 'Episode', Medication: 'Medication', Provider: 'Provider',
  Dependent: 'Dependent', SDOHNode: 'SDOH', BHScreening: 'BH Screening',
  Consent: 'Consent', ChannelHistory: 'Channel', WorkScheduleConstraint: 'Work Constraint',
  HouseholdUnit: 'Household', CaregiverBurden: 'Caregiver Burden',
  PharmacyTouchpoint: 'Pharmacy', CriticalAccessHospital: 'CAH Facility',
  ChildDevelopment: 'Child Development', SeasonalBarrier: 'Seasonal Barrier',
  EligibilityStatus: 'Eligibility', BenefitStatus: 'Benefit Status',
  WICStatus: 'WIC', BHProgramStatus: 'BH Program', HousingStatus: 'Housing',
  LIHEAPStatus: 'LIHEAP', ScreeningResult: 'Screening Result', Agent: 'Agent',
};

// ── Edge Properties Tooltip Panel ─────────────────────────────────────────────
interface EdgeTooltipProps {
  edge: GraphEdge;
  x: number;
  y: number;
  sourceNode: GraphNode | undefined;
  targetNode: GraphNode | undefined;
  onClose: () => void;
}

function EdgeTooltipPanel({ edge, x, y, sourceNode, targetNode, onClose }: EdgeTooltipProps) {
  const ep = edge.edgeProps;
  const confidence = ep?.confidence ?? null;
  const confPct = confidence !== null ? Math.round(confidence * 100) : null;
  const confColor = confPct !== null ? (confPct >= 90 ? '#4ade80' : confPct >= 70 ? '#f59e0b' : '#ef4444') : '#64748b';

  const rows: { key: string; val: string; highlight?: boolean }[] = [];
  if (ep?.since) rows.push({ key: 'since', val: ep.since });
  if (ep?.status) rows.push({ key: 'status', val: String(ep.status), highlight: ep.status === 'OPEN' || ep.status === 'ACTIVE' });
  if (ep?.touchpoints) rows.push({ key: 'touchpoints', val: String(ep.touchpoints) });
  if (ep?.lastContact) rows.push({ key: 'last_contact', val: String(ep.lastContact) });
  if (ep?.lastAction) rows.push({ key: 'last_action', val: String(ep.lastAction) });
  if (ep?.actionType) rows.push({ key: 'action_type', val: String(ep.actionType) });
  if (ep?.dose) rows.push({ key: 'dose', val: String(ep.dose) });
  if (ep?.frequency) rows.push({ key: 'frequency', val: String(ep.frequency) });
  if (ep?.adherence !== undefined) rows.push({ key: 'adherence', val: `${Math.round((ep.adherence as number) * 100)}%`, highlight: (ep.adherence as number) < 0.7 });
  if (ep?.gapDays) rows.push({ key: 'gap_days', val: `${ep.gapDays}d` });

  // Clamp panel to viewport
  const panelW = 240;
  const panelH = 180;
  const clampedX = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - panelW - 16);
  const clampedY = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - panelH - 16);

  return (
    <div
      className="absolute z-30 rounded-xl shadow-2xl pointer-events-auto"
      style={{
        left: clampedX,
        top: clampedY,
        width: panelW,
        background: 'rgba(8,8,20,0.97)',
        border: `1px solid ${edge.color}88`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${edge.color}44` }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: edge.color, boxShadow: `0 0 6px ${edge.color}` }} />
          <span className="text-xs font-mono font-bold truncate" style={{ color: edge.color }}>{edge.label}</span>
        </div>
        <button onClick={onClose} className="text-xs ml-2 flex-shrink-0" style={{ color: DARK.textMuted }}>✕</button>
      </div>

      {/* Source → Target */}
      <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: `1px solid ${DARK.border}` }}>
        <span className="text-xs font-mono truncate" style={{ color: DARK.textMuted, maxWidth: 80 }}>{sourceNode?.label ?? edge.source}</span>
        <span className="text-xs" style={{ color: DARK.textDim }}>→</span>
        <span className="text-xs font-mono truncate" style={{ color: DARK.textMuted, maxWidth: 80 }}>{targetNode?.label ?? edge.target}</span>
      </div>

      {/* Confidence bar */}
      {confPct !== null && (
        <div className="px-3 py-1.5" style={{ borderBottom: `1px solid ${DARK.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono" style={{ color: DARK.textMuted }}>confidence</span>
            <span className="text-xs font-bold font-mono" style={{ color: confColor }}>{confPct}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: DARK.border }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${confPct}%`, background: `linear-gradient(90deg, ${confColor}88, ${confColor})` }} />
          </div>
        </div>
      )}

      {/* Properties */}
      <div className="px-3 py-1.5 space-y-0.5 max-h-28 overflow-y-auto">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono" style={{ color: DARK.textMuted }}>{r.key}</span>
            <span className="text-xs font-mono font-semibold" style={{ color: r.highlight ? '#f59e0b' : DARK.text }}>{r.val}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <span className="text-xs font-mono" style={{ color: DARK.textDim }}>No additional properties</span>
        )}
      </div>

      {/* Cypher snippet */}
      <div className="px-3 py-1.5 rounded-b-xl" style={{ borderTop: `1px solid ${DARK.border}`, background: 'rgba(0,0,0,0.3)' }}>
        <span className="text-xs font-mono" style={{ color: '#42be65', fontSize: '9px' }}>
          [{edge.type} &#123;confidence: {confPct ?? '?'}%&#125;]
        </span>
      </div>
    </div>
  );
}

// ── Cypher Modal ──────────────────────────────────────────────────────────────
function CypherModal({ lens, onClose }: { lens: LensType; onClose: () => void }) {
  const ld = lensDefinitions.find((l) => l.id === lens);
  if (!ld) return null;
  const nodeCount = LENS_NODE_SETS[lens]?.length ?? ld.nodeCount;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl" style={{ background: DARK.surface, border: `1px solid ${DARK.borderBright}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DARK.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: ld.color + '33', color: ld.color, border: `1px solid ${ld.color}66` }}>{ld.label}</span>
            <span className="text-sm font-semibold" style={{ color: DARK.text }}>Cypher Query</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="p-4">
          <p className="text-xs mb-3" style={{ color: DARK.textMuted }}>{ld.description}</p>
          <pre className="text-xs p-4 overflow-x-auto leading-relaxed font-mono rounded" style={{ background: '#0a0f1a', color: '#42be65', border: `1px solid #1a3a1a` }}>{ld.cypher}</pre>
          <div className="flex items-center gap-6 mt-3 pt-3" style={{ borderTop: `1px solid ${DARK.border}` }}>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums" style={{ color: ld.color }}>{nodeCount}</p>
              <p className="text-xs" style={{ color: DARK.textMuted }}>Nodes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums" style={{ color: DARK.text }}>{ld.edgeCount}</p>
              <p className="text-xs" style={{ color: DARK.textMuted }}>Edges</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: ld.color }}>MARIA_SD_001</p>
              <p className="text-xs" style={{ color: DARK.textMuted }}>Anchor Node</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Threaded Right Panel ──────────────────────────────────────────────────────
interface RightPanelProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onClose: () => void;
}

function RightPanel({ node, edges, allNodes, onClose }: RightPanelProps) {
  const [expandedThread, setExpandedThread] = useState<string | null>('clinical');

  const threads = [
    {
      id: 'clinical', label: 'Clinical Thread', color: '#3b82f6',
      items: [
        { label: 'HbA1c Gap', sub: 'Open 38 days · HEDIS window 40d · BLOCKED', color: '#ef4444', urgent: true },
        { label: 'Edinburgh PND Gap', sub: 'Open 427 days · Awaiting BH referral acceptance', color: '#ef4444', urgent: true },
        { label: 'Pre-Diabetic Episode', sub: 'Active · A1C 6.2% ↑ trending', color: '#10b981' },
        { label: 'Postpartum Health', sub: 'UNMANAGED · 427 days post-partum', color: '#f59e0b', urgent: true },
        { label: 'Well-Child 24mo', sub: 'Sophia · 21 days overdue · Bundle with Maria visit', color: '#f97316', urgent: true },
        { label: 'Bennett County Health', sub: 'PCP · CAH · Primary care site', color: '#0ea5e9' },
        { label: 'Postpartum Support Group', sub: 'Referred · Not enrolled · 427d open', color: '#64748b' },
      ],
    },
    {
      id: 'sophia', label: 'Sofia · Dependent', color: '#ec4899',
      items: [
        { label: 'Relationship', sub: 'PARENT_OF · MBR-002 · Age 2', color: '#ec4899' },
        { label: 'PCP', sub: 'Not assigned — referral needed', color: '#ef4444', urgent: true },
        { label: '24-Month Visit', sub: 'Overdue — M-CHAT-R/F pending', color: '#f59e0b', urgent: true },
        { label: 'Immunizations', sub: '3 series incomplete', color: '#f97316' },
        { label: 'Lead / Hemoglobin', sub: 'Screening outstanding', color: '#f59e0b' },
      ],
    },
    {
      id: 'elena', label: 'Elena · Caregiver', color: '#8b5cf6',
      items: [
        { label: 'Consent Pending', sub: 'Elena must authorize independently', color: '#f59e0b', urgent: true },
        { label: 'Cardiac/DM Episode', sub: 'A1C 8.1% · Caregiver managed', color: '#10b981' },
        { label: 'Cardiology Follow-up', sub: 'Winner, SD · 47 miles', color: '#0ea5e9' },
      ],
    },
    {
      id: 'sdoh', label: 'SDOH · Whole Person', color: '#f97316',
      items: [
        { label: 'Transportation HIGH', sub: '47+ miles · No vehicle · No transit', color: '#ef4444', urgent: true },
        { label: 'Childcare Barrier HIGH', sub: 'Blocks HbA1c appointment', color: '#ef4444', urgent: true },
        { label: 'Caregiver Burden', sub: 'Zarit 48 · 18hrs/wk · No respite', color: '#f97316' },
        { label: 'Food Insecurity', sub: 'SNAP active · WIC lapsed', color: '#f59e0b' },
        { label: 'Digital Divide', sub: 'No broadband · SMS only 3pm–7pm', color: '#64748b' },
      ],
    },
    {
      id: 'obligations', label: 'Active Obligations', color: '#84cc16',
      items: [
        { label: 'Childcare Subsidy', sub: '$487/mo eligible · Not enrolled', color: '#f59e0b', urgent: true },
        { label: 'WIC Re-enrollment', sub: '$320/mo · Sophia + Maria eligible', color: '#f59e0b' },
        { label: 'SNAP Renewal', sub: 'T+47 days · Action required', color: '#ef4444' },
        { label: 'LIHEAP Window', sub: 'Oct–Dec · Winter risk HIGH', color: '#f97316' },
      ],
    },
  ];

  const connectedEdges = node ? edges.filter((e) => e.source === node.id || e.target === node.id) : [];
  const connectedNodes = connectedEdges.map((e) => {
    const otherId = e.source === node?.id ? e.target : e.source;
    return { edge: e, node: allNodes.find((n) => n.id === otherId) };
  }).filter((c) => c.node);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: DARK.surface }}>
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${DARK.border}` }}>
        <div>
          <p className="text-sm font-bold" style={{ color: DARK.text }}>Maria Redhawk</p>
          <p className="text-xs" style={{ color: DARK.textMuted }}>Knowledge Graph Context</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: '#14532d', color: '#4ade80', border: '1px solid #166534' }}>KNOWN ●</span>
      </div>

      <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${DARK.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: DARK.textMuted }}>Identity Confidence</span>
          <span className="text-xs font-bold" style={{ color: '#4ade80' }}>97%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: DARK.border }}>
          <div className="h-full rounded-full" style={{ width: '97%', background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: DARK.textDim }}>4 sources reconciled</span>
          <span className="text-xs" style={{ color: '#4ade80' }}>Golden record committed</span>
        </div>
      </div>

      <div className="grid grid-cols-3 px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${DARK.border}` }}>
        {[{ val: '21', label: 'Nodes' }, { val: '26', label: 'Edges' }, { val: '4', label: 'Threads' }].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-bold tabular-nums" style={{ color: DARK.text }}>{s.val}</p>
            <p className="text-xs" style={{ color: DARK.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {node && (
        <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${DARK.border}`, borderLeft: `3px solid ${node.color}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: node.color + '33', color: node.color }}>
              {NODE_TYPE_LABELS[node.type] ?? node.type}
            </span>
            <button onClick={onClose} className="text-xs" style={{ color: DARK.textMuted }}>✕</button>
          </div>
          <p className="text-sm font-bold" style={{ color: DARK.text }}>{node.label}</p>
          {node.sublabel && <p className="text-xs" style={{ color: DARK.textMuted }}>{node.sublabel}</p>}
          {node.locked && <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>🔒 42 CFR Part 2 — BH consent gated</p>}
          {node.consentPending && <p className="text-xs mt-1" style={{ color: '#f97316' }}>⚠ Consent pending</p>}
          {/* Property richness */}
          {node.propertyRichness !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-mono" style={{ color: DARK.textMuted }}>property richness</span>
                <span className="text-xs font-bold font-mono" style={{ color: node.propertyRichness >= 0.8 ? '#4ade80' : node.propertyRichness >= 0.5 ? '#f59e0b' : '#ef4444' }}>
                  {Math.round(node.propertyRichness * 100)}%
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: DARK.border }}>
                <div className="h-full rounded-full" style={{ width: `${node.propertyRichness * 100}%`, background: node.propertyRichness >= 0.8 ? '#4ade80' : node.propertyRichness >= 0.5 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
          )}
          {connectedNodes.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-semibold" style={{ color: DARK.textMuted }}>Connections ({connectedNodes.length})</p>
              {connectedNodes.slice(0, 4).map(({ edge, node: cn }, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cn!.color }} />
                  <span className="text-xs truncate" style={{ color: DARK.text }}>{cn!.label}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: DARK.textDim }}>[{edge.label}]</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {threads.map((thread) => (
          <div key={thread.id} style={{ borderBottom: `1px solid ${DARK.border}` }}>
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:opacity-80 transition-opacity"
              onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: thread.color }} />
                <span className="text-xs font-semibold" style={{ color: thread.color }}>{thread.label}</span>
              </div>
              <span className="text-xs" style={{ color: DARK.textMuted }}>{expandedThread === thread.id ? '▲' : '▼'}</span>
            </button>
            {expandedThread === thread.id && (
              <div className="px-3 pb-2 space-y-1.5">
                {thread.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: item.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium" style={{ color: item.urgent ? item.color : DARK.text }}>{item.label}</p>
                      <p className="text-xs" style={{ color: DARK.textMuted }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-2 flex-shrink-0" style={{ borderTop: `1px solid ${DARK.border}` }}>
        <p className="text-xs font-mono" style={{ color: '#4ade80' }}>● KNOWN · MARIA_SD_001 · 4 THREADS ACTIVE</p>
      </div>
    </div>
  );
}

// ── Canvas + SVG Hybrid Graph ─────────────────────────────────────────────────
interface SimNode extends GraphNode {
  r: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  isCross?: boolean;
}

interface D3GraphProps {
  activeLens: ExtendedLensType;
  highlightNodeIds: string[];
  onNodeClick: (node: GraphNode) => void;
  onNodeHover: (node: GraphNode | null) => void;
  flashNodeIds: string[];
  chainTraversalIds: string[];
  onEdgeClick: (edge: GraphEdge, x: number, y: number) => void;
  overrideNodes?: GraphNode[];
  overrideEdges?: GraphEdge[];
}

// ── Radial position layout for lens views ────────────────────────────────────
function computeRadialPositions(
  nodes: SimNode[],
  cx: number,
  cy: number,
  lens: ExtendedLensType,
  width: number,
  height: number
): void {
  const nonMaria = nodes.filter((n) => n.id !== 'n01');
  const maria = nodes.find((n) => n.id === 'n01');
  if (maria) { maria.x = cx; maria.y = cy; maria.fx = cx; maria.fy = cy; }

  const maxR = Math.min(width, height) * 0.38;
  const innerR = Math.min(maxR * 0.62, 185);
  const outerR = Math.min(maxR, 270);

  if (lens === 'sofia') {
    const R = Math.min(maxR * 0.68, 210);
    nonMaria.forEach((n, i) => {
      const angle = (i / nonMaria.length) * Math.PI * 2 - Math.PI / 2;
      n.x = cx + R * Math.cos(angle);
      n.y = cy + R * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });
    return;
  }

  if (lens === 'agents') {
    // Agent coalition: agents in inner triangle, owned nodes in outer ring
    const agentNodes = nodes.filter((n) => n.type === 'Agent');
    const otherNodes = nodes.filter((n) => n.id !== 'n01' && n.type !== 'Agent');
    const agentR = Math.min(maxR * 0.45, 140);
    const outerAgentR = Math.min(maxR * 0.85, 250);

    agentNodes.forEach((n, i) => {
      const angle = (i / agentNodes.length) * Math.PI * 2 - Math.PI / 2;
      n.x = cx + agentR * Math.cos(angle);
      n.y = cy + agentR * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });
    otherNodes.forEach((n, i) => {
      const angle = (i / otherNodes.length) * Math.PI * 2 - Math.PI / 2;
      n.x = cx + outerAgentR * Math.cos(angle);
      n.y = cy + outerAgentR * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });
    return;
  }

  if (lens === 'social') {
    const scaledInner = Math.min(maxR * 0.62, 200);
    const scaledOuter = Math.min(maxR * 0.88, 250);
    const blockerIds = ['n17', 'n18'];
    const blockedIds = ['n04'];
    const resolverIds = ['n41'];
    const outerIds = nonMaria
      .filter((n) => !blockerIds.includes(n.id) && !blockedIds.includes(n.id) && !resolverIds.includes(n.id))
      .map((n) => n.id);

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const n17 = nodeById.get('n17');
    if (n17) { n17.x = cx - scaledInner * 1.15; n17.y = cy - 25; n17.fx = n17.x; n17.fy = n17.y; }

    const n18 = nodeById.get('n18');
    if (n18) { n18.x = cx - scaledInner * 0.95; n18.y = cy + 75; n18.fx = n18.x; n18.fy = n18.y; }

    const n04 = nodeById.get('n04');
    if (n04) { n04.x = cx + scaledInner; n04.y = cy; n04.fx = n04.x; n04.fy = n04.y; }

    const n41 = nodeById.get('n41');
    if (n41) { n41.x = cx + scaledInner * 0.5; n41.y = cy + scaledInner * 0.65; n41.fx = n41.x; n41.fy = n41.y; }

    const outerNodes = outerIds.map((id) => nodeById.get(id)).filter(Boolean) as SimNode[];
    outerNodes.forEach((n, i) => {
      const startAngle = -Math.PI * 0.85;
      const endAngle = Math.PI * 0.85;
      const angle = startAngle + (i / Math.max(outerNodes.length - 1, 1)) * (endAngle - startAngle);
      n.x = cx + scaledOuter * Math.cos(angle);
      n.y = cy + scaledOuter * Math.sin(angle) - 20;
      n.fx = n.x; n.fy = n.y;
    });
    return;
  }

  const count = nonMaria.length;
  if (count <= 8) {
    const R = Math.min(maxR * 0.72, 220);
    nonMaria.forEach((n, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      n.x = cx + R * Math.cos(angle);
      n.y = cy + R * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });
  } else {
    const innerCount = Math.ceil(count / 2);
    const outerCount = count - innerCount;

    nonMaria.slice(0, innerCount).forEach((n, i) => {
      const angle = (i / innerCount) * Math.PI * 2 - Math.PI / 2;
      n.x = cx + innerR * Math.cos(angle);
      n.y = cy + innerR * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });
    nonMaria.slice(innerCount).forEach((n, i) => {
      const angle = (i / outerCount) * Math.PI * 2 - Math.PI / 2 + (Math.PI / outerCount);
      n.x = cx + outerR * Math.cos(angle);
      n.y = cy + outerR * Math.sin(angle);
      n.fx = n.x; n.fy = n.y;
    });
  }
}

// ── Draw a sphere-quality node on Canvas 2D ───────────────────────────────────
function drawSphereNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  isMaria: boolean,
  isCross: boolean,
  pulse: boolean,
  flashActive: boolean,
  consentPending: boolean,
  opacity: number,
  time: number,
  highlighted: boolean,
  chainActive: boolean,
  chainProgress: number, // 0–1 for the traveling pulse
  validUntilDays: number | undefined,
  propertyRichness: number | undefined,
  isAgent: boolean
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Outer bloom glow
  const glowR = r + (isMaria ? 40 : 22);
  const glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
  glowGrad.addColorStop(0, color + (isMaria ? 'aa' : '66'));
  glowGrad.addColorStop(0.4, color + '33');
  glowGrad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  if (isMaria) {
    const glow2R = r + 65;
    const glow2 = ctx.createRadialGradient(x, y, r, x, y, glow2R);
    glow2.addColorStop(0, color + '44');
    glow2.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(x, y, glow2R, 0, Math.PI * 2);
    ctx.fillStyle = glow2;
    ctx.fill();
  }

  // Pulse ring animation
  if (pulse && !isCross) {
    const pulseScale = 1 + 0.18 * Math.sin(time * 0.003);
    const pulseR = r * pulseScale + 8;
    ctx.beginPath();
    ctx.arc(x, y, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = color + 'aa';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Consent pending dashed ring
  if (consentPending) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Temporal validity arc ─────────────────────────────────────────────────
  // Drawn just outside the node as a depleting arc (full = 90d, empty = 0d)
  if (validUntilDays !== undefined) {
    const maxDays = 90;
    const fraction = Math.min(validUntilDays / maxDays, 1);
    const arcR = r + 9;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + fraction * Math.PI * 2;
    const arcColor = validUntilDays <= 14 ? '#ef4444' : validUntilDays <= 30 ? '#f59e0b' : '#4ade80';

    // Background track
    ctx.beginPath();
    ctx.arc(x, y, arcR, 0, Math.PI * 2);
    ctx.strokeStyle = arcColor + '22';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Filled arc
    ctx.beginPath();
    ctx.arc(x, y, arcR, startAngle, endAngle);
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Pulsing tip dot
    const tipX = x + arcR * Math.cos(endAngle);
    const tipY = y + arcR * Math.sin(endAngle);
    const tipPulse = 0.7 + 0.3 * Math.sin(time * 0.004);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = arcColor;
    ctx.globalAlpha = opacity * tipPulse;
    ctx.fill();
    ctx.globalAlpha = opacity;
  }

  // ── Property richness indicator ───────────────────────────────────────────
  // Small segmented arc on the inner border of the node
  if (propertyRichness !== undefined && !isMaria) {
    const segments = 8;
    const filled = Math.round(propertyRichness * segments);
    const segR = r - 3;
    const richColor = propertyRichness >= 0.8 ? '#4ade80' : propertyRichness >= 0.5 ? '#f59e0b' : '#ef444488';
    const gapAngle = 0.08;
    const segAngle = (Math.PI * 2 - segments * gapAngle) / segments;

    for (let i = 0; i < segments; i++) {
      const startA = -Math.PI / 2 + i * (segAngle + gapAngle);
      const endA = startA + segAngle;
      ctx.beginPath();
      ctx.arc(x, y, segR, startA, endA);
      ctx.strokeStyle = i < filled ? richColor : richColor.replace('80', '20') + '33';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Agent node — hexagonal outer ring
  if (isAgent) {
    const hexR = r + 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = x + hexR * Math.cos(angle);
      const hy = y + hexR * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.strokeStyle = color + 'cc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Main sphere
  const highlightX = x - r * 0.3;
  const highlightY = y - r * 0.3;
  const sphereGrad = ctx.createRadialGradient(highlightX, highlightY, r * 0.05, x, y, r);

  if (flashActive) {
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.3, color);
    sphereGrad.addColorStop(1, '#000000cc');
  } else {
    sphereGrad.addColorStop(0, '#ffffffcc');
    sphereGrad.addColorStop(0.12, color + 'ff');
    sphereGrad.addColorStop(0.55, color + 'dd');
    sphereGrad.addColorStop(1, '#000000ee');
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.globalAlpha = opacity * (isCross ? 0.65 : 1);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = isMaria ? color : color + 'cc';
  ctx.lineWidth = isMaria ? 3 : (isCross ? 1.5 : 2);
  ctx.globalAlpha = opacity * (isCross ? 0.5 : 0.9);
  ctx.stroke();

  // Signal highlight ring
  if (highlighted) {
    ctx.globalAlpha = 1;
    const ringR = r + (validUntilDays !== undefined ? 14 : 7);
    const ringGlow = ctx.createRadialGradient(x, y, ringR - 4, x, y, ringR + 8);
    ringGlow.addColorStop(0, color + 'cc');
    ringGlow.addColorStop(0.5, color + '66');
    ringGlow.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(x, y, ringR + 8, 0, Math.PI * 2);
    ctx.fillStyle = ringGlow;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Chain traversal pulse ring
  if (chainActive && chainProgress > 0) {
    ctx.globalAlpha = chainProgress * opacity;
    const chainR = r + 12 + (1 - chainProgress) * 20;
    ctx.beginPath();
    ctx.arc(x, y, chainR, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, chainR, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = opacity;
  }

  ctx.restore();
}

// ── Standalone render helper ──────────────────────────────────────────────────
function renderFrame(
  canvas: HTMLCanvasElement,
  timestamp: number,
  dimensions: { width: number; height: number },
  dpr: number,
  transform: { k: number; x: number; y: number },
  nodes: SimNode[],
  highlightRef: React.MutableRefObject<string[]>,
  flashRef: React.MutableRefObject<string[]>,
  chainRef: React.MutableRefObject<{ nodeId: string; progress: number }[]>
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = dimensions;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bgGrad.addColorStop(0, '#0c0c1a');
  bgGrad.addColorStop(1, '#030305');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.028)';
  for (let gx = 0; gx < w; gx += 28) {
    for (let gy = 0; gy < h; gy += 28) {
      ctx.beginPath();
      ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const { k, x: tx, y: ty } = transform;
  ctx.translate(tx, ty);
  ctx.scale(k, k);
  const hlSet = new Set(highlightRef.current);
  const flashSet = new Set(flashRef.current);
  const chainMap = new Map(chainRef.current.map((c) => [c.nodeId, c.progress]));

  nodes.forEach((n) => {
    const opacity = 1;
    const highlighted = hlSet.size > 0 && hlSet.has(n.id);
    const chainProgress = chainMap.get(n.id) ?? 0;
    const chainActive = chainMap.has(n.id);
    drawSphereNode(
      ctx, n.x, n.y, n.r, n.color,
      n.id === 'n01', n.isCross ?? false, n.pulse ?? false,
      flashSet.has(n.id), n.consentPending ?? false,
      opacity, timestamp, highlighted,
      chainActive, chainProgress,
      n.validUntilDays,
      n.propertyRichness,
      n.type === 'Agent'
    );
  });
  ctx.restore();
}

function CanvasSVGGraph({ activeLens, highlightNodeIds, onNodeClick, onNodeHover, flashNodeIds, chainTraversalIds, onEdgeClick, overrideNodes, overrideEdges }: D3GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const simulationDoneRef = useRef<boolean>(false);
  const highlightRef = useRef<string[]>(highlightNodeIds);
  const flashRef = useRef<string[]>(flashNodeIds);
  const chainRef = useRef<{ nodeId: string; progress: number }[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [dpr, setDpr] = useState(1);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const transformRef = useRef({ k: 1, x: 0, y: 0 });

  // ── Chain traversal animation ─────────────────────────────────────────────
  useEffect(() => {
    if (chainTraversalIds.length === 0) {
      chainRef.current = [];
      return;
    }

    // Animate each node in the chain sequentially with a traveling pulse
    let cancelled = false;
    const STEP_DURATION = 600; // ms per hop
    const PULSE_DURATION = 400; // ms for the ring to expand and fade

    const animateChain = async () => {
      for (let i = 0; i < chainTraversalIds.length; i++) {
        if (cancelled) break;
        const nodeId = chainTraversalIds[i];
        const startTime = performance.now();

        await new Promise<void>((resolve) => {
          const tick = (now: number) => {
            if (cancelled) { resolve(); return; }
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / PULSE_DURATION, 1);
            // Ease out
            const eased = 1 - Math.pow(1 - progress, 2);
            chainRef.current = [{ nodeId, progress: 1 - eased }]; // fade out as ring expands

            const canvas = canvasRef.current;
            if (canvas && dimensions) {
              cancelAnimationFrame(animFrameRef.current);
              animFrameRef.current = requestAnimationFrame((ts) => {
                renderFrame(canvas, ts, dimensions, dpr, transformRef.current, nodesRef.current, highlightRef, flashRef, chainRef);
              });
            }

            if (elapsed < STEP_DURATION) {
              requestAnimationFrame(tick);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(tick);
        });
      }
      // Final: keep all chain nodes highlighted (handled by highlightRef)
      chainRef.current = [];
    };

    animateChain();
    return () => { cancelled = true; chainRef.current = []; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainTraversalIds]);

  // Keep highlight/flash refs in sync
  useEffect(() => {
    highlightRef.current = highlightNodeIds;
    flashRef.current = flashNodeIds;
    if (simulationDoneRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      const canvas = canvasRef.current;
      if (!canvas || !dimensions) return;
      animFrameRef.current = requestAnimationFrame((ts) => {
        renderFrame(canvas, ts, dimensions, dpr, transformRef.current, nodesRef.current, highlightRef, flashRef, chainRef);
      });
    }
  }, [highlightNodeIds, flashNodeIds, dimensions, dpr, transform]);

  useEffect(() => {
    setDpr(window.devicePixelRatio || 1);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 400), height: Math.max(height, 400) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions || dimensions.width < 100) return;

    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    simulationDoneRef.current = false;

    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    const lensKey: LensType = activeLens === 'sofia' ? 'social' : activeLens as LensType;
    const lensNodeIds = activeLens === 'sofia' ? SOFIA_LENS_NODES : LENS_NODE_SETS[lensKey];
    const lensNodeSet = new Set(lensNodeIds);
    const sourceNodes = overrideNodes ?? graphNodes;
    const visibleNodes = sourceNodes.filter((n) => lensNodeSet.has(n.id));

    const getRadius = (n: GraphNode): number => {
      if (n.id === 'n01') return 75;
      if (n.type === 'Agent') return 28;
      const baseR = n.radius;
      if (baseR >= 20) return 26;
      if (baseR >= 16) return 22;
      return 18;
    };

    const simNodes: SimNode[] = visibleNodes.map((n) => ({
      ...n,
      r: getRadius(n),
      x: n.id === 'n01' ? cx : cx + (Math.random() - 0.5) * 200,
      y: n.id === 'n01' ? cy : cy + (Math.random() - 0.5) * 200,
      fx: n.id === 'n01' ? cx : null,
      fy: n.id === 'n01' ? cy : null,
      isCross: false,
    }));

    nodesRef.current = simNodes;

    const isAllView = activeLens === 'all';

    if (isAllView) {
      const sourceEdges = overrideEdges ?? graphEdges;
      const visibleEdges = sourceEdges.filter(
        (e) => lensNodeSet.has(e.source) && lensNodeSet.has(e.target)
      );
      const nodeById = new Map(simNodes.map((n) => [n.id, n]));
      const simEdges = visibleEdges.map((e) => ({
        ...e,
        source: nodeById.get(e.source) ?? e.source,
        target: nodeById.get(e.target) ?? e.target,
      }));

      const simulation = d3.forceSimulation(simNodes as any)
        .alphaDecay(0.035)
        .velocityDecay(0.55)
        .force('link', d3.forceLink(simEdges).id((d: any) => d.id).distance(90).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-180).distanceMax(300))
        .force('center', d3.forceCenter(cx, cy).strength(0.12))
        .force('collision', d3.forceCollide().radius((d: any) => d.r + 14).strength(0.9))
        .force('x', d3.forceX(cx).strength(0.08))
        .force('y', d3.forceY(cy).strength(0.08));

      simulationRef.current = simulation;

      simulation.on('end', () => {
        simulation.stop();
        simulationDoneRef.current = true;
        cancelAnimationFrame(animFrameRef.current);
        const canvas = canvasRef.current;
        if (!canvas) return;
        animFrameRef.current = requestAnimationFrame((ts) => {
          renderFrame(canvas, ts, dimensions, dpr, transformRef.current, nodesRef.current, highlightRef, flashRef, chainRef);
          simulationDoneRef.current = true;
        });
      });
    } else {
      computeRadialPositions(simNodes, cx, cy, activeLens, width, height);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isAllView) {
      const drawFrame = (timestamp: number) => {
        timeRef.current = timestamp;
        if (simulationDoneRef.current) return;
        renderFrame(canvas, timestamp, dimensions, dpr, transformRef.current, nodesRef.current, highlightRef, flashRef, chainRef);
        animFrameRef.current = requestAnimationFrame(drawFrame);
      };
      animFrameRef.current = requestAnimationFrame(drawFrame);
    } else {
      animFrameRef.current = requestAnimationFrame((ts) => {
        renderFrame(canvas, ts, dimensions, dpr, transformRef.current, nodesRef.current, highlightRef, flashRef, chainRef);
        simulationDoneRef.current = true;
      });
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (simulationRef.current) simulationRef.current.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLens, dimensions]);

  const [edgeTick, setEdgeTick] = useState(0);

  useEffect(() => {
    if (activeLens === 'all' && simulationRef.current) {
      simulationRef.current.on('tick', () => setEdgeTick((t) => t + 1));
    } else {
      const timer = setTimeout(() => setEdgeTick((t) => t + 1), 50);
      return () => clearTimeout(timer);
    }
  }, [activeLens, dimensions]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        const t = { k: event.transform.k, x: event.transform.x, y: event.transform.y };
        transformRef.current = t;
        setTransform(t);
        const canvas = canvasRef.current;
        if (canvas && dimensions) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = requestAnimationFrame((ts) => {
            renderFrame(canvas, ts, dimensions, dpr, t, nodesRef.current, highlightRef, flashRef, chainRef);
          });
        }
      });
    svg.call(zoom);
    return () => { svg.on('.zoom', null); };
  }, [dimensions, dpr]);

  const getNodeAtPoint = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const rawX = (clientX - rect.left);
    const rawY = (clientY - rect.top);
    const { k, x: tx, y: ty } = transform;
    let gx = (rawX - tx) / k;
    let gy = (rawY - ty) / k;

    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = gx - n.x;
      const dy = gy - n.y;
      if (dx * dx + dy * dy <= (n.r + 8) * (n.r + 8)) return n;
    }
    return null;
  }, [transform]);

  // ── Edge hit testing ──────────────────────────────────────────────────────
  const getEdgeAtPoint = useCallback((clientX: number, clientY: number): { edge: GraphEdge; x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    const { k, x: tx, y: ty } = transform;
    let gx = (rawX - tx) / k;
    let gy = (rawY - ty) / k;

    const nodePositions = new Map(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y, r: n.r }]));
    const lensKey: LensType = activeLens === 'sofia' ? 'social' : activeLens as LensType;
    const lensNodeIds = activeLens === 'sofia' ? SOFIA_LENS_NODES : LENS_NODE_SETS[lensKey];
    const lensNodeSet = new Set(lensNodeIds);
    const visibleEdges = graphEdges.filter(
      (e) => lensNodeSet.has(e.source) && lensNodeSet.has(e.target)
    );

    const HIT_DIST = 8 / k; // 8px hit tolerance in graph space

    for (const e of visibleEdges) {
      const src = nodePositions.get(e.source);
      const tgt = nodePositions.get(e.target);
      if (!src || !tgt) continue;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const x1 = src.x + (dx / len) * (src.r + 3);
      const y1 = src.y + (dy / len) * (src.r + 3);
      const x2 = tgt.x - (dx / len) * (tgt.r + 12);
      const y2 = tgt.y - (dy / len) * (tgt.r + 12);

      // Point-to-segment distance
      const ex = x2 - x1, ey = y2 - y1;
      const segLen = Math.sqrt(ex * ex + ey * ey) || 1;
      const t = Math.max(0, Math.min(1, ((gx - x1) * ex + (gy - y1) * ey) / (segLen * segLen)));
      const closestX = x1 + t * ex;
      const closestY = y1 + t * ey;
      const dist = Math.sqrt((gx - closestX) ** 2 + (gy - closestY) ** 2);

      if (dist <= HIT_DIST) {
        return { edge: e, x: clientX - rect.left + 12, y: clientY - rect.top - 20 };
      }
    }
    return null;
  }, [transform, activeLens]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const n = getNodeAtPoint(e.clientX, e.clientY);
    onNodeHover(n);
  }, [getNodeAtPoint, onNodeHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const n = getNodeAtPoint(e.clientX, e.clientY);
    if (n) {
      onNodeClick(n);
      return;
    }
    // Check edge click
    const edgeHit = getEdgeAtPoint(e.clientX, e.clientY);
    if (edgeHit) {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      onEdgeClick(edgeHit.edge, edgeHit.x + (rect?.left ?? 0), edgeHit.y + (rect?.top ?? 0));
    }
  }, [getNodeAtPoint, getEdgeAtPoint, onNodeClick, onEdgeClick]);

  const handleMouseLeave = useCallback(() => { onNodeHover(null); }, [onNodeHover]);

  // ── Render SVG edges ──────────────────────────────────────────────────────
  const lensKey: LensType = activeLens === 'sofia' ? 'social' : activeLens as LensType;
  const lensNodeIds = activeLens === 'sofia' ? SOFIA_LENS_NODES : LENS_NODE_SETS[lensKey];
  const lensNodeSet = new Set(lensNodeIds);
  const sourceEdges = overrideEdges ?? graphEdges;
  const visibleEdges = sourceEdges.filter(
    (e) => lensNodeSet.has(e.source) && lensNodeSet.has(e.target)
  );

  const nodePositions = new Map(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y, r: n.r }]));
  const hlSet = new Set(highlightNodeIds);

  const { k, x: tx, y: ty } = transform;
  const svgTransform = `translate(${tx},${ty}) scale(${k})`;

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#030305' }}
    >
      {dimensions && (
      <>
      <canvas
        ref={canvasRef}
        width={dimensions.width * dpr}
        height={dimensions.height * dpr}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: dimensions.width, height: dimensions.height,
          display: 'block',
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      />

      <svg
        ref={svgRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        width={dimensions.width}
        height={dimensions.height}
      >
        <defs>
          {[...new Set(visibleEdges.map((e) => e.color))].map((color) => {
            const safeId = 'mk-' + color.replace('#', '');
            return (
              <marker key={safeId} id={safeId} viewBox="0 -4 8 8" refX={20} refY={0}
                markerWidth={6} markerHeight={6} orient="auto">
                <path d="M0,-4L8,0L0,4" fill={color} opacity={0.95} />
              </marker>
            );
          })}
          <style>{`
            @keyframes dashFlow { to { stroke-dashoffset: -32; } }
            .anim-edge { animation: dashFlow 1s linear infinite; }
            @keyframes dashFlowGreen { to { stroke-dashoffset: -32; } }
            .anim-edge-green { animation: dashFlowGreen 1.2s linear infinite; }
          `}</style>
        </defs>

        <g transform={svgTransform}>
          {/* Edges — opacity driven by confidence */}
          {visibleEdges.map((e) => {
            const src = nodePositions.get(e.source);
            const tgt = nodePositions.get(e.target);
            if (!src || !tgt) return null;

            // ── Edge opacity by confidence/strength ──────────────────────────
            const confidence = e.edgeProps?.confidence;
            const baseOpacity = e.animated ? 0.95 : 0.65;
            const opacity = confidence !== undefined
              ? Math.max(0.2, confidence * (e.animated ? 1.0 : 0.85))
              : baseOpacity;

            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const x1 = src.x + (dx / dist) * (src.r + 3);
            const y1 = src.y + (dy / dist) * (src.r + 3);
            const x2 = tgt.x - (dx / dist) * (tgt.r + 12);
            const y2 = tgt.y - (dy / dist) * (tgt.r + 12);

            return (
              <line
                key={e.id}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={e.color}
                strokeWidth={e.animated ? Math.max(e.strokeWidth + 1, 3) : Math.max(e.strokeWidth, 1.5)}
                strokeDasharray={e.animated ? '10,6' : (e.dashed ? '6,4' : undefined)}
                strokeOpacity={opacity}
                markerEnd={`url(#mk-${e.color.replace('#', '')})`}
                className={e.animated ? (e.color.includes('198') ? 'anim-edge-green' : 'anim-edge') : undefined}
              />
            );
          })}

          {/* Edge labels for animated/key edges */}
          {visibleEdges.filter((e) => e.animated).map((e) => {
            const src = nodePositions.get(e.source);
            const tgt = nodePositions.get(e.target);
            if (!src || !tgt) return null;
            const mx = (src.x + tgt.x) / 2;
            const my = (src.y + tgt.y) / 2 - 6;
            return (
              <text key={`lbl-${e.id}`} x={mx} y={my}
                textAnchor="middle" fontSize={9} fontFamily="IBM Plex Mono, monospace"
                fill={e.color} opacity={0.9} pointerEvents="none">
                {e.label}
              </text>
            );
          })}

          {/* Node labels + sublabels + badges */}
          {nodesRef.current.map((n) => {
            const opacity = hlSet.size > 0 ? (hlSet.has(n.id) ? 1 : 1) : 1;
            const isMaria = n.id === 'n01';
            const isAgent = n.type === 'Agent';
            const fontSize = isMaria ? 13 : (lensNodeIds.length <= 14 ? 10 : 9);
            const subFontSize = lensNodeIds.length <= 14 ? 8 : 7;
            // Offset label below temporal arc if present
            const arcOffset = n.validUntilDays !== undefined ? 6 : 0;
            const labelY = n.y + n.r + 15 + arcOffset;
            const subY = n.y + n.r + 27 + arcOffset;

            return (
              <g key={`lbl-${n.id}`} opacity={opacity} pointerEvents="none">
                {!isMaria && (
                  <rect
                    x={n.x - (n.label.length > 18 ? 16 : n.label.length * 3.2)}
                    y={labelY - fontSize}
                    width={(n.label.length > 18 ? 32 : n.label.length * 6.4)}
                    height={fontSize + 3}
                    rx={2}
                    fill="rgba(3,3,8,0.72)"
                  />
                )}
                <text x={n.x} y={labelY} textAnchor="middle"
                  fontSize={fontSize} fontFamily="IBM Plex Mono, monospace"
                  fontWeight={isMaria || isAgent ? 'bold' : '600'}
                  fill={isMaria ? '#ffffff' : (isAgent ? '#e2e8f0' : (n.isCross ? '#cbd5e1' : '#f1f5f9'))}
                  stroke="rgba(3,3,8,0.6)" strokeWidth={isMaria ? 0 : 2.5} paintOrder="stroke">
                  {n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label}
                </text>
                {n.sublabel && (
                  <text x={n.x} y={subY} textAnchor="middle"
                    fontSize={subFontSize} fontFamily="IBM Plex Mono, monospace"
                    fill="#94a3b8"
                    stroke="rgba(3,3,8,0.7)" strokeWidth={2} paintOrder="stroke">
                    {n.sublabel.length > 22 ? n.sublabel.slice(0, 20) + '…' : n.sublabel}
                  </text>
                )}
                {/* Temporal validity countdown label */}
                {n.validUntilDays !== undefined && (
                  <text x={n.x} y={n.y - n.r - 14} textAnchor="middle"
                    fontSize={7} fontFamily="IBM Plex Mono, monospace" fontWeight="bold"
                    fill={n.validUntilDays <= 14 ? '#ef4444' : n.validUntilDays <= 30 ? '#f59e0b' : '#4ade80'}
                    stroke="rgba(3,3,8,0.8)" strokeWidth={2} paintOrder="stroke">
                    ⏱ {n.validUntilDays}d
                  </text>
                )}
                {/* Agent role badge */}
                {isAgent && (
                  <>
                    <rect x={n.x - 22} y={n.y - n.r - 17} width={44} height={13} rx={4}
                      fill="#3b0764" stroke="#7c3aed" strokeWidth={1} />
                    <text x={n.x} y={n.y - n.r - 7} textAnchor="middle"
                      fontSize={7} fontWeight="bold" fill="#c4b5fd" fontFamily="IBM Plex Mono, monospace">
                      AGENT
                    </text>
                  </>
                )}
                {/* BLOCKER badge */}
                {['n17', 'n18'].includes(n.id) && (
                  <>
                    <rect x={n.x - 26} y={n.y - n.r - 17} width={52} height={14} rx={4}
                      fill="#7f1d1d" stroke="#ef4444" strokeWidth={1} />
                    <text x={n.x} y={n.y - n.r - 7} textAnchor="middle"
                      fontSize={8} fontWeight="bold" fill="#fca5a5" fontFamily="IBM Plex Mono, monospace">
                      BLOCKER
                    </text>
                  </>
                )}
                {/* BLOCKED badge */}
                {n.id === 'n04' && (
                  <>
                    <rect x={n.x - 26} y={n.y - n.r - 17} width={52} height={14} rx={4}
                      fill="#450a0a" stroke="#b91c1c" strokeWidth={1} />
                    <text x={n.x} y={n.y - n.r - 7} textAnchor="middle"
                      fontSize={8} fontWeight="bold" fill="#fca5a5" fontFamily="IBM Plex Mono, monospace">
                      BLOCKED
                    </text>
                  </>
                )}
                {/* SAFETY ALERT badge */}
                {['n31', 'n51'].includes(n.id) && (
                  <>
                    <rect x={n.x - 38} y={n.y + n.r + 2} width={76} height={13} rx={3}
                      fill="#451a03" stroke="#f59e0b" strokeWidth={0.8} />
                    <text x={n.x} y={n.y + n.r + 11} textAnchor="middle"
                      fontSize={7} fontWeight="bold" fill="#fcd34d" fontFamily="IBM Plex Mono, monospace">
                      △ SAFETY ALERT
                    </text>
                  </>
                )}
                {/* Lock icon for BH gated */}
                {n.locked && (
                  <text x={n.x} y={n.y + 5} textAnchor="middle" dominantBaseline="central"
                    fontSize={Math.max(n.r * 0.4, 9)} fill="#f59e0b">
                    🔒
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      </>
      )}
    </div>
  );
}

// ── Patient Header Strip ──────────────────────────────────────────────────────
function PatientHeaderStrip({ onSignalClick, activeSignalId }: { onSignalClick: (sig: ActiveSignal) => void; activeSignalId: string | null }) {
  const pills = [
    { label: 'RISK MODERATE', color: '#f59e0b', bg: '#451a03' },
    { label: 'AUTH ⚠ T-4 days', color: '#f59e0b', bg: '#451a03' },
    { label: 'CARE GAP △ HbA1c 38d', color: '#f97316', bg: '#431407' },
    { label: 'EPISODE Pre-Diabetic · Postpartum', color: '#10b981', bg: '#022c22' },
    { label: '⚠ Edinburgh PND 427d', color: '#f59e0b', bg: '#451a03' },
    { label: '◆ SDOH · 5 Barriers', color: '#f59e0b', bg: '#451a03' },
    { label: '● RESOLVED', color: '#4ade80', bg: '#022c22' },
  ];

  return (
    <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-2 overflow-x-auto" style={{ background: '#080812', borderBottom: `1px solid ${DARK.border}` }}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb' }}>MR</div>
        <div>
          <p className="text-xs font-bold leading-none" style={{ color: DARK.text }}>Maria Redhawk, 34</p>
          <p className="text-xs leading-none mt-0.5" style={{ color: DARK.textMuted }}>MARIA_SD_001</p>
        </div>
      </div>
      <div className="w-px h-7 flex-shrink-0" style={{ background: DARK.border }} />
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {pills.map((p, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded font-mono whitespace-nowrap flex-shrink-0 font-medium" style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}44` }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Orchestration State Bar ───────────────────────────────────────────────────
function OrchestrationBar() {
  const stages = [
    { label: 'FOUNDATION', active: true },
    { label: 'ORCHESTRATION', active: false },
    { label: 'AUTONOMOUS', active: false },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-1.5 flex-shrink-0" style={{ background: '#06060f', borderBottom: `1px solid ${DARK.border}` }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb' }}>MR</div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: DARK.text }}>Maria Redhawk</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-mono" style={{ color: DARK.textMuted }}>MARIA_SD_001</span>
              <span className="text-xs px-1 rounded font-bold" style={{ background: '#14532d', color: '#4ade80', fontSize: '9px' }}>CONSENT FULL</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#1a1a2e', color: '#ef4444', border: '1px solid #7f1d1d', fontSize: '10px' }}>AUTH T-4</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#1a1a2e', color: '#f59e0b', border: '1px solid #78350f', fontSize: '10px' }}>GAP 38d</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono px-2 py-0.5 rounded font-bold" style={{ background: '#0f1a2e', color: '#93c5fd', border: '1px solid #1d4ed8' }}>04/14</span>
        <div className="flex items-center gap-2">
          {stages.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div className="w-6 h-px" style={{ background: s.active ? '#3b82f6' : DARK.border }} />}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: s.active ? '#3b82f6' : DARK.textDim, boxShadow: s.active ? '0 0 8px #3b82f6' : 'none' }} />
                <span className="text-xs font-mono font-semibold" style={{ color: s.active ? '#60a5fa' : DARK.textDim }}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <button className="text-xs font-bold px-3 py-1 rounded" style={{ background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb' }}>
          UHG ORCHESTRATE
        </button>
      </div>
    </div>
  );
}

// ── Cypher Banner ─────────────────────────────────────────────────────────────
function CypherBanner({ text, activeLens }: { text: string; activeLens: ExtendedLensType }) {
  const lensMessages: Record<ExtendedLensType, string> = {
    all: 'TRANSPORT BARRIER → BLOCKS HbA1c CARE GAP · Click node for Cypher query · Click edge for properties',
    clinical: 'CLINICAL LENS · 17 nodes · BLOCKS chain: Transport/Childcare → HbA1c · Radial layout',
    behavioral: 'BH LENS · 13 nodes · Edinburgh 11 → PostpartumRisk · Zarit 48 → CaregiverBurden · Radial layout',
    social: 'SDOH LENS · 13 nodes · BLOCKS chain dominant axis · Transport/Childcare → HbA1c · Radial layout',
    eligibility: 'ELIGIBILITY LENS · 11 nodes · Amber = ELIGIBLE_NOT_ENROLLED · WOULD_RESOLVE chain · Radial layout',
    sofia: 'SOFIA LENS · 7 nodes · Pediatric thread · Well-Child gap · ENT flag · Proxy consent · Radial ring',
    agents: 'AGENT COALITION · 3 agents · CHW · Care Manager · Zarit Dispatcher · Click edge for last-action properties',
  };

  return (
    <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none">
      <div className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(5,5,15,0.92)', border: '1px solid #166534', backdropFilter: 'blur(4px)' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
        <span className="text-xs font-mono" style={{ color: '#4ade80' }}>IDENTITY RESOLVED · MARIA_SD_001</span>
        <div className="w-px h-4 flex-shrink-0" style={{ background: '#166534' }} />
        <span className="text-xs font-mono" style={{ color: '#ef4444' }}>{activeLens === 'all' ? text : lensMessages[activeLens]}</span>
      </div>
    </div>
  );
}

// ── Bottom Thread Legend ──────────────────────────────────────────────────────
function ThreadLegend({ onLensChange, activeLens }: { onLensChange: (l: ExtendedLensType) => void; activeLens: ExtendedLensType }) {
  const threads = [
    { id: 'clinical' as ExtendedLensType, label: 'Clinical', color: '#3b82f6' },
    { id: 'sofia' as ExtendedLensType, label: 'Sofia · Dependent', color: '#ec4899' },
    { id: 'behavioral' as ExtendedLensType, label: 'Elena · Caregiver', color: '#8b5cf6' },
    { id: 'social' as ExtendedLensType, label: 'SDOH · Whole Person', color: '#f97316' },
    { id: 'eligibility' as ExtendedLensType, label: 'Active Obligations', color: '#84cc16' },
    { id: 'agents' as ExtendedLensType, label: 'Agent Coalition', color: '#7c3aed' },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ background: '#06060f', borderTop: `1px solid ${DARK.border}` }}>
      <div className="flex items-center gap-1 mr-2 flex-shrink-0">
        <span className="text-xs font-mono" style={{ color: DARK.textMuted }}>THREADS:</span>
      </div>
      <div className="flex items-center gap-4 overflow-x-auto flex-1">
        {threads.map((t, i) => (
          <button key={i} onClick={() => onLensChange(t.id)}
            className="flex items-center gap-1.5 whitespace-nowrap hover:opacity-80 transition-opacity">
            <div className="w-2 h-2 rounded-full" style={{ background: t.color, boxShadow: activeLens === t.id ? `0 0 8px ${t.color}` : 'none' }} />
            <span className="text-xs font-mono" style={{ color: activeLens === t.id ? t.color : DARK.textMuted }}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-shrink-0 ml-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded" style={{ background: '#0d0d20', border: `1px solid #1a1a3a` }}>
          <div className="w-2 h-2 rounded flex-shrink-0" style={{ background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
          <span className="text-xs font-mono font-bold" style={{ color: '#60a5fa' }}>PARALLEL ORCHESTRATIONS — 5 COALITIONS ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

// ── Signal Strip ──────────────────────────────────────────────────────────────
function DarkSignalStrip({ signals, activeSignalId, onSignalClick }: { signals: ActiveSignal[]; activeSignalId: string | null; onSignalClick: (sig: ActiveSignal) => void }) {

  const sigConfig: Record<string, {
    icon: string;
    iconColor: string;
    accentColor: string;
    bgIdle: string;
    bgActive: string;
    borderIdle: string;
    borderActive: string;
    textIdle: string;
    textActive: string;
    badgeStyle: 'chain' | 'act' | 'lapsed' | 'confirmed' | 'dual';
    badgeBg: string;
    badgeText: string;
    shape: 'rounded' | 'pill' | 'square';
  }> = {
    'sig-01': {
      icon: '⛓',
      iconColor: '#ef4444',
      accentColor: '#ef4444',
      bgIdle: '#1a0505',
      bgActive: '#ef444422',
      borderIdle: '#7f1d1d',
      borderActive: '#ef4444',
      textIdle: '#fca5a5',
      textActive: '#ff6b6b',
      badgeStyle: 'chain',
      badgeBg: '#7f1d1d',
      badgeText: '#fca5a5',
      shape: 'square',
    },
    'sig-02': {
      icon: '💰',
      iconColor: '#f59e0b',
      accentColor: '#f59e0b',
      bgIdle: '#1a0e00',
      bgActive: '#f59e0b22',
      borderIdle: '#92400e',
      borderActive: '#f59e0b',
      textIdle: '#fcd34d',
      textActive: '#fbbf24',
      badgeStyle: 'act',
      badgeBg: '#92400e',
      badgeText: '#fcd34d',
      shape: 'pill',
    },
    'sig-03': {
      icon: '⚠',
      iconColor: '#fb923c',
      accentColor: '#fb923c',
      bgIdle: '#1a0a00',
      bgActive: '#fb923c22',
      borderIdle: '#7c2d12',
      borderActive: '#fb923c',
      textIdle: '#fdba74',
      textActive: '#fb923c',
      badgeStyle: 'lapsed',
      badgeBg: '#7c2d12',
      badgeText: '#fdba74',
      shape: 'pill',
    },
    'sig-04': {
      icon: '✓',
      iconColor: '#4ade80',
      accentColor: '#4ade80',
      bgIdle: '#001a0a',
      bgActive: '#4ade8022',
      borderIdle: '#166534',
      borderActive: '#4ade80',
      textIdle: '#86efac',
      textActive: '#4ade80',
      badgeStyle: 'confirmed',
      badgeBg: '#166534',
      badgeText: '#86efac',
      shape: 'rounded',
    },
    'sig-05': {
      icon: '🛡',
      iconColor: '#60a5fa',
      accentColor: '#3b82f6',
      bgIdle: '#050e1a',
      bgActive: '#3b82f622',
      borderIdle: '#1e3a5f',
      borderActive: '#3b82f6',
      textIdle: '#93c5fd',
      textActive: '#60a5fa',
      badgeStyle: 'dual',
      badgeBg: '#1e3a5f',
      badgeText: '#93c5fd',
      shape: 'rounded',
    },
  };

  const actionBadge = (sig: ActiveSignal, cfg: typeof sigConfig[string], isActive: boolean) => {
    const base = {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      gap: '2px',
      padding: '1px 5px',
      borderRadius: cfg.shape === 'pill' ? '999px' : '3px',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      background: isActive ? cfg.accentColor + '44' : cfg.badgeBg,
      color: isActive ? cfg.textActive : cfg.badgeText,
      border: `1px solid ${isActive ? cfg.accentColor : cfg.borderIdle}`,
      marginLeft: '2px',
      flexShrink: 0 as const,
    };

    if (cfg.badgeStyle === 'chain') return <span style={base}>⛓ VIEW CHAIN</span>;
    if (cfg.badgeStyle === 'act') return <span style={{ ...base, background: isActive ? '#f59e0b55' : '#92400e', color: '#fcd34d', border: `1px solid ${isActive ? '#f59e0b' : '#b45309'}`, fontWeight: 800 }}>▶ ACT</span>;
    if (cfg.badgeStyle === 'lapsed') return <span style={{ ...base, color: '#fdba74', textDecoration: 'none' }}>↺ RE-ENROLL</span>;
    if (cfg.badgeStyle === 'confirmed') return <span style={{ ...base, color: '#86efac' }}>✓ VIEW</span>;
    if (cfg.badgeStyle === 'dual') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '2px', flexShrink: 0 }}>
        <span style={{ ...base, background: '#1e3a5f', color: '#93c5fd', border: '1px solid #2563eb', fontSize: '9px', padding: '1px 4px' }}>CONSENT ●</span>
        <span style={{ ...base, background: '#0f172a', color: '#7dd3fc', border: '1px solid #1e40af', fontSize: '9px', padding: '1px 4px' }}>ZARIT ↗</span>
      </span>
    );
    return <span style={base}>[{sig.action}]</span>;
  };

  const countdownBadge = (isActive: boolean) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 700,
      background: isActive ? '#ef444433' : '#450a0a',
      color: '#ef4444', border: '1px solid #7f1d1d', marginLeft: '2px', flexShrink: 0,
    }}>⏱ 40d</span>
  );

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto flex-shrink-0" style={{ background: '#050508', borderTop: `1px solid ${DARK.border}` }}>
      <span className="text-xs font-mono font-semibold flex-shrink-0" style={{ color: DARK.textMuted }}>SIGNALS</span>
      {signals.map((sig) => {
        const cfg = sigConfig[sig.id];
        if (!cfg) return null;
        const isActive = activeSignalId === sig.id;
        const borderRadius = cfg.shape === 'pill' ? '999px' : cfg.shape === 'square' ? '4px' : '6px';

        return (
          <button
            key={sig.id}
            onClick={() => onSignalClick(sig)}
            title={sig.detail}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: isActive ? cfg.bgActive : cfg.bgIdle,
              border: `1px solid ${isActive ? cfg.borderActive : cfg.borderIdle}`,
              color: isActive ? cfg.textActive : cfg.textIdle,
              boxShadow: isActive ? `0 0 12px ${cfg.accentColor}55, inset 0 0 8px ${cfg.accentColor}11` : 'none',
              borderRadius,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11px', lineHeight: 1, flexShrink: 0, color: isActive ? cfg.accentColor : cfg.iconColor }}>
              {cfg.icon}
            </span>
            <span style={{ fontWeight: isActive ? 700 : 500 }}>{sig.label}</span>
            {sig.id === 'sig-01' && countdownBadge(isActive)}
            {sig.id !== 'sig-01' && actionBadge(sig, cfg, isActive)}
            {sig.id === 'sig-01' && actionBadge(sig, cfg, isActive)}
          </button>
        );
      })}
    </div>
  );
}

// ── Lens Bar ──────────────────────────────────────────────────────────────────
function DarkLensBar({ activeLens, onLensChange, onShowCypher }: { activeLens: ExtendedLensType; onLensChange: (l: ExtendedLensType) => void; onShowCypher: () => void }) {
  const lensNodeCounts: Record<ExtendedLensType, number> = {
    all: 52,
    clinical: LENS_NODE_SETS.clinical.length,
    behavioral: LENS_NODE_SETS.behavioral.length,
    social: LENS_NODE_SETS.social.length,
    eligibility: LENS_NODE_SETS.eligibility.length,
    sofia: SOFIA_LENS_NODES.length,
    agents: AGENT_LENS_NODES.length,
  };

  const lensItems = [
    ...lensDefinitions.map((ld) => ({ id: ld.id as ExtendedLensType, label: ld.label, color: ld.color })),
    { id: 'sofia' as ExtendedLensType, label: 'Sofia', color: '#ec4899' },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto flex-shrink-0" style={{ background: '#080812', borderBottom: `1px solid ${DARK.border}` }}>
      <span className="text-xs font-mono font-semibold flex-shrink-0" style={{ color: DARK.textMuted }}>LENS</span>
      {lensItems.map((ld) => {
        const isActive = activeLens === ld.id;
        return (
          <button key={ld.id} onClick={() => onLensChange(ld.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{ background: isActive ? ld.color + '25' : 'transparent', border: `1px solid ${isActive ? ld.color : DARK.border}`, color: isActive ? ld.color : DARK.textMuted, boxShadow: isActive ? `0 0 10px ${ld.color}44` : 'none' }}>
            {ld.label}
            <span className="opacity-60 text-xs ml-1">{lensNodeCounts[ld.id]}N</span>
          </button>
        );
      })}
      <div className="flex-1" />
      <button onClick={onShowCypher}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono whitespace-nowrap flex-shrink-0"
        style={{ background: '#0d0d20', border: `1px solid ${DARK.border}`, color: DARK.textMuted }}>
        {'</>'}  VIEW CYPHER
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WholePersonCareSummaryPage() {
  const [activeLens, setActiveLens] = useState<ExtendedLensType>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [highlightNodeIds, setHighlightNodeIds] = useState<string[]>([]);
  const [showCypher, setShowCypher] = useState(false);
  const [flashNodeIds, setFlashNodeIds] = useState<string[]>([]);
  const [chainTraversalIds, setChainTraversalIds] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<{ edge: GraphEdge; x: number; y: number } | null>(null);

  // ── Gap Closure Store integration ─────────────────────────────────────────
  const { getGapClosure, isGapClosed, isGapClosing } = useGapClosureStore();
  const hbA1cClosure = getGapClosure('CG_MARIA_001');
  const gapClosed = isGapClosed('CG_MARIA_001');
  const gapClosing = isGapClosing('CG_MARIA_001');

  // Before/After toggle state
  const [graphView, setGraphView] = useState<'before' | 'after'>('before');

  // Auto-switch to 'after' when gap closes
  useEffect(() => {
    if (gapClosed) {
      setGraphView('after');
    }
  }, [gapClosed]);

  // Compute dynamic node overrides based on closure state
  const getNodeOverrides = useCallback((): Record<string, Partial<GraphNode>> => {
    if (!gapClosed || graphView === 'before') return {};

    return {
      'n04': {
        color: '#84CC16', // lime green
        pulse: false,
        sublabel: 'CLOSED ✓',
        validUntilDays: undefined,
      },
    };
  }, [gapClosed, graphView]);

  // Compute dynamic edge overrides
  const getEdgeOverrides = useCallback((): Record<string, Partial<GraphEdge>> => {
    if (!gapClosed || graphView === 'before') return {};

    return {
      'e19': { color: '#64748b', strokeWidth: 1, animated: false, label: 'WAS_BLOCKING' },
      'e20': { color: '#64748b', strokeWidth: 1, animated: false, label: 'WAS_BLOCKING' },
    };
  }, [gapClosed, graphView]);

  // Periodic flash for benefit gap nodes
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashNodeIds(['n41', 'n43', 'n46']);
      setTimeout(() => setFlashNodeIds([]), 700);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setActiveSignalId(null);
    setHighlightNodeIds([]);
    setSelectedEdge(null);
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  const handleEdgeClick = useCallback((edge: GraphEdge, x: number, y: number) => {
    setSelectedEdge({ edge, x, y });
    setSelectedNode(null);
    setActiveSignalId(null);
    setHighlightNodeIds([]);
  }, []);

  const handleSignalClick = useCallback((sig: ActiveSignal) => {
    if (activeSignalId === sig.id) {
      setActiveSignalId(null);
      setHighlightNodeIds([]);
      setChainTraversalIds([]);
    } else {
      setActiveSignalId(sig.id);
      setHighlightNodeIds(sig.relatedNodeIds);
      setSelectedNode(null);
      setSelectedEdge(null);

      if (sig.chainNodeIds && sig.chainNodeIds.length > 0) {
        setChainTraversalIds(sig.chainNodeIds);
        const totalDuration = sig.chainNodeIds.length * 600 + 200;
        setTimeout(() => setChainTraversalIds([]), totalDuration);
      }

      if (sig.targetLens) {
        setActiveLens(sig.targetLens as ExtendedLensType);
      }
    }
  }, [activeSignalId]);

  const handleLensChange = useCallback((lens: ExtendedLensType) => {
    setActiveLens(lens);
    setSelectedNode(null);
    setHighlightNodeIds([]);
    setActiveSignalId(null);
    setChainTraversalIds([]);
    setSelectedEdge(null);
  }, []);

  const bannerText = hoveredNode
    ? `${hoveredNode.label.toUpperCase()} · Click node for Cypher query`
    : gapClosed
      ? 'HbA1c GAP CLOSED ✓ · HEDIS CDC MET · $8,100 ATTRIBUTED · Toggle Before/After'
      : 'TRANSPORT BARRIER → BLOCKS HbA1c CARE GAP · Click node or edge for properties';

  const cypherLens: LensType = (activeLens === 'sofia' ? 'social' : activeLens) as LensType;

  const edgeSourceNode = selectedEdge ? graphNodes.find((n) => n.id === selectedEdge.edge.source) : undefined;
  const edgeTargetNode = selectedEdge ? graphNodes.find((n) => n.id === selectedEdge.edge.target) : undefined;

  // Build dynamic signals — replace sig-01 if gap is closed
  const dynamicSignals = activeSignals.map((sig) => {
    if (sig.id === 'sig-01' && gapClosed && graphView === 'after') {
      return {
        ...sig,
        type: 'CARE_GAP_CLOSED',
        label: 'HbA1c · CLOSED ✓ · HEDIS MET',
        detail: `HbA1c gap closed · Result: ${hbA1cClosure?.resultValue ?? '—'}% · HEDIS CDC MET · $8,100 attributed`,
        urgency: 'success' as const,
      };
    }
    return sig;
  });

  return (
    <>
    <div
        className="flex flex-col overflow-hidden"
        style={{ background: DARK.bg, height: '100%', maxHeight: '100%' }}
      >
        <OrchestrationBar />
        <PatientHeaderStrip onSignalClick={handleSignalClick} activeSignalId={activeSignalId} />
        <DarkLensBar activeLens={activeLens} onLensChange={handleLensChange} onShowCypher={() => setShowCypher(true)} />

        {/* Before/After toggle — only shown when gap is closed */}
        {gapClosed && (
          <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ background: '#050a05', borderBottom: '1px solid #166534' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span className="text-xs font-mono font-bold" style={{ color: '#4ade80' }}>HbA1c GAP CLOSED ✓ · HEDIS CDC MET · $8,100 ATTRIBUTED</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs font-mono" style={{ color: '#64748b' }}>Graph View:</span>
              <button
                onClick={() => setGraphView('before')}
                className="px-3 py-1 text-xs font-mono font-bold transition-all"
                style={{
                  background: graphView === 'before' ? '#7f1d1d' : '#0d0d20',
                  color: graphView === 'before' ? '#fca5a5' : '#64748b',
                  border: `1px solid ${graphView === 'before' ? '#ef4444' : '#1a1a3a'}`,
                  borderRadius: '4px 0 0 4px',
                }}
              >
                Before
              </button>
              <button
                onClick={() => setGraphView('after')}
                className="px-3 py-1 text-xs font-mono font-bold transition-all"
                style={{
                  background: graphView === 'after' ? '#14532d' : '#0d0d20',
                  color: graphView === 'after' ? '#4ade80' : '#64748b',
                  border: `1px solid ${graphView === 'after' ? '#4ade80' : '#1a1a3a'}`,
                  borderRadius: '0 4px 4px 0',
                }}
              >
                After ✓
              </button>
            </div>
            {hbA1cClosure?.resultValue !== undefined && (
              <div className="flex items-center gap-3 ml-4">
                {[
                  { label: 'A1C', value: `${hbA1cClosure.resultValue}%` },
                  { label: 'HEDIS', value: hbA1cClosure.hedisCompliance === 'MET' ? 'MET ✓' : 'NOT MET' },
                  { label: 'Gainshare', value: '$8,100' },
                  { label: 'Open Gaps', value: graphView === 'after' ? '8' : '9' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-xs font-bold font-mono" style={{ color: '#4ade80' }}>{item.value}</p>
                    <p style={{ fontSize: '9px', color: '#64748b', fontFamily: 'IBM Plex Mono, monospace' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Closing indicator */}
        {gapClosing && !gapClosed && (
          <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ background: '#0a0800', borderBottom: '1px solid #92400e' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#f59e0b' }} />
            <span className="text-xs font-mono font-bold" style={{ color: '#f59e0b' }}>HbA1c gap CLOSING... · Evidence pending</span>
          </div>
        )}

        <div className="flex min-h-0" style={{ flex: '1 1 0%', overflow: 'hidden' }}>
          {/* Graph canvas */}
          <div className="relative min-w-0" style={{ flex: '1 1 0%', overflow: 'hidden' }}>
            <GapAwareCanvasSVGGraph
              activeLens={activeLens}
              highlightNodeIds={highlightNodeIds}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              flashNodeIds={flashNodeIds}
              chainTraversalIds={chainTraversalIds}
              onEdgeClick={handleEdgeClick}
              nodeOverrides={getNodeOverrides()}
              edgeOverrides={getEdgeOverrides()}
              gapClosed={gapClosed}
              graphView={graphView}
              hbA1cClosure={hbA1cClosure}
            />

            <CypherBanner text={bannerText} activeLens={activeLens} />

            {selectedEdge && (
              <EdgeTooltipPanel
                edge={selectedEdge.edge}
                x={selectedEdge.x}
                y={selectedEdge.y}
                sourceNode={edgeSourceNode}
                targetNode={edgeTargetNode}
                onClose={() => setSelectedEdge(null)}
              />
            )}

            {hoveredNode && !selectedNode && (
              <div className="absolute bottom-16 left-4 pointer-events-none z-10 max-w-xs rounded-xl px-3 py-2 shadow-2xl"
                style={{ background: 'rgba(10,10,20,0.95)', border: `1px solid ${hoveredNode.color}88`, backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hoveredNode.color, boxShadow: `0 0 8px ${hoveredNode.color}` }} />
                  <span className="text-xs font-mono font-semibold" style={{ color: hoveredNode.color }}>{NODE_TYPE_LABELS[hoveredNode.type]}</span>
                </div>
                <p className="text-sm font-bold" style={{ color: DARK.text }}>{hoveredNode.label}</p>
                {hoveredNode.sublabel && <p className="text-xs mt-0.5" style={{ color: DARK.textMuted }}>{hoveredNode.sublabel}</p>}
                {hoveredNode.locked && <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>🔒 42 CFR Part 2 gated</p>}
                {hoveredNode.validUntilDays !== undefined && (
                  <p className="text-xs mt-1 font-mono font-bold" style={{ color: hoveredNode.validUntilDays <= 14 ? '#ef4444' : '#f59e0b' }}>
                    ⏱ {hoveredNode.validUntilDays}d until expiry
                  </p>
                )}
                {hoveredNode.propertyRichness !== undefined && (
                  <p className="text-xs mt-0.5 font-mono" style={{ color: DARK.textMuted }}>
                    ◈ {Math.round(hoveredNode.propertyRichness * 100)}% property richness
                  </p>
                )}
                <p className="text-xs mt-1.5 font-mono" style={{ color: DARK.textDim }}>Click to view details · Click edge for properties</p>
              </div>
            )}
          </div>

          {/* Right threaded panel */}
          <div className="flex-shrink-0 flex flex-col overflow-hidden" style={{ width: '256px', borderLeft: `1px solid ${DARK.border}` }}>
            <RightPanel
              node={selectedNode}
              edges={graphEdges}
              allNodes={graphNodes}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>

        <DarkSignalStrip signals={dynamicSignals} activeSignalId={activeSignalId} onSignalClick={handleSignalClick} />
        <ThreadLegend onLensChange={handleLensChange} activeLens={activeLens} />
      </div>

      {showCypher && <CypherModal lens={cypherLens} onClose={() => setShowCypher(false)} />}
    </>
  );
}

// ── Gap-Aware Canvas SVG Graph wrapper ────────────────────────────────────────
interface GapAwareCanvasSVGGraphProps extends D3GraphProps {
  nodeOverrides: Record<string, Partial<GraphNode>>;
  edgeOverrides: Record<string, Partial<GraphEdge>>;
  gapClosed: boolean;
  graphView: 'before' | 'after';
  hbA1cClosure: ReturnType<ReturnType<typeof useGapClosureStore>['getGapClosure']>;
}

function GapAwareCanvasSVGGraph({
  activeLens,
  highlightNodeIds,
  onNodeClick,
  onNodeHover,
  flashNodeIds,
  chainTraversalIds,
  onEdgeClick,
  nodeOverrides,
  edgeOverrides,
  gapClosed,
  graphView,
  hbA1cClosure,
}: GapAwareCanvasSVGGraphProps) {
  // Build modified nodes/edges for the after-closure view
  const effectiveNodes = React.useMemo(() => {
    if (!gapClosed || graphView === 'before') return graphNodes;

    const modified = graphNodes.map((n) => {
      const override = nodeOverrides[n.id];
      if (!override) return n;
      return { ...n, ...override };
    });

    // Add Evidence node
    const evidenceNode: GraphNode = {
      id: 'n_evidence_hba1c',
      nodeNum: 99,
      type: 'ScreeningResult' as any,
      label: 'HbA1c Evidence',
      sublabel: `${hbA1cClosure?.resultValue ?? '—'}% · LOINC 4548-4`,
      properties: {
        type: 'HbA1cObservation',
        resultValue: hbA1cClosure?.resultValue ?? 0,
        procedureCode: '83036',
        status: 'final',
        dateOfService: hbA1cClosure?.dateOfService ?? '',
      },
      lens: ['all', 'clinical'],
      color: '#84CC16',
      radius: 16,
      cluster: 'maria',
      propertyRichness: 0.95,
      totalProperties: 6,
    };

    // Add HEDIS QualityMeasure node
    const hedisNode: GraphNode = {
      id: 'n_hedis_cdc',
      nodeNum: 100,
      type: 'ScreeningResult' as any,
      label: 'HEDIS CDC MET',
      sublabel: `$8,100 · ${hbA1cClosure?.hedisCompliance ?? 'MET'}`,
      properties: {
        measure: 'HbA1c Control (poor)',
        status: hbA1cClosure?.hedisCompliance ?? 'MET',
        gainshare: 8100,
        track: 'Medicaid RHTP Track 3',
      },
      lens: ['all', 'clinical'],
      color: '#84CC16',
      radius: 18,
      cluster: 'maria',
      propertyRichness: 0.9,
      totalProperties: 5,
    };

    return [...modified, evidenceNode, hedisNode];
  }, [gapClosed, graphView, nodeOverrides, hbA1cClosure]);

  const effectiveEdges = React.useMemo(() => {
    if (!gapClosed || graphView === 'before') return graphEdges;

    const modified = graphEdges.map((e) => {
      const override = edgeOverrides[e.id];
      if (!override) return e;
      return { ...e, ...override };
    });

    // Add new closure edges
    const closureEdges: GraphEdge[] = [
      {
        id: 'e_closed_by',
        source: 'n04',
        target: 'n_evidence_hba1c',
        type: 'CLOSED_BY',
        label: 'CLOSED BY',
        color: '#84CC16',
        strokeWidth: 2.5,
        animated: true,
        lens: ['all', 'clinical'],
        edgeProps: { since: hbA1cClosure?.dateOfService ?? '', status: 'CLOSED', confidence: 1.0 },
      },
      {
        id: 'e_evidence_updates',
        source: 'n_evidence_hba1c',
        target: 'n_hedis_cdc',
        type: 'UPDATES',
        label: 'UPDATES',
        color: '#84CC16',
        strokeWidth: 2,
        animated: true,
        lens: ['all', 'clinical'],
        edgeProps: { since: hbA1cClosure?.dateOfService ?? '', status: 'ATTRIBUTED', confidence: 1.0 },
      },
      {
        id: 'e_performed_by',
        source: 'n_evidence_hba1c',
        target: 'n14',
        type: 'PERFORMED_BY',
        label: 'PERFORMED BY',
        color: '#0ea5e9',
        strokeWidth: 1.5,
        lens: ['all', 'clinical'],
        edgeProps: { since: hbA1cClosure?.dateOfService ?? '', confidence: 0.99 },
      },
    ];

    return [...modified, ...closureEdges];
  }, [gapClosed, graphView, edgeOverrides, hbA1cClosure]);

  return (
    <CanvasSVGGraph
      activeLens={activeLens}
      highlightNodeIds={highlightNodeIds}
      onNodeClick={onNodeClick}
      onNodeHover={onNodeHover}
      flashNodeIds={flashNodeIds}
      chainTraversalIds={chainTraversalIds}
      onEdgeClick={onEdgeClick}
      overrideNodes={effectiveNodes}
      overrideEdges={effectiveEdges}
    />
  );
}
