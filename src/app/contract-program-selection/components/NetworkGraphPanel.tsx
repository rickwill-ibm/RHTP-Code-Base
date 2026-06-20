'use client';
import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';

const NODES = [
  { id: 'state', label: 'SD DHSS', sub: 'State Medicaid Agency', x: 50, y: 10, color: '#0043ce', icon: '🏛️', size: 'lg', clickable: false },
  { id: 'rhtp', label: 'RHTP Platform', sub: 'Regional Tech Center', x: 50, y: 38, color: '#6929c4', icon: '⚡', size: 'lg', clickable: false },
  { id: 'fqhc1', label: 'Bennett Co. HC', sub: 'CAH · 8,420 pts', x: 10, y: 68, color: '#0043ce', icon: '🏥', size: 'sm', clickable: true, region: 'region-west-river', regionName: 'West River Region' },
  { id: 'fqhc2', label: 'Winner FQHC', sub: 'FQHC · 5,640 pts', x: 30, y: 72, color: '#0043ce', icon: '🏥', size: 'sm', clickable: true, region: 'region-central', regionName: 'Missouri River Corridor' },
  { id: 'hosp1', label: 'Winner Regional', sub: 'Rural Hospital', x: 50, y: 75, color: '#6929c4', icon: '🏨', size: 'sm', clickable: true, region: 'region-southeast', regionName: 'Southeast SD Region' },
  { id: 'hosp2', label: 'Avera Sacred Hrt', sub: 'Critical Access', x: 68, y: 72, color: '#6929c4', icon: '🏨', size: 'sm', clickable: true, region: 'region-northeast', regionName: 'Northeast SD Region' },
  { id: 'pcp1', label: 'Oglala Lakota PCP', sub: 'PCP · 3,100 pts', x: 85, y: 65, color: '#24a148', icon: '👨‍⚕️', size: 'sm', clickable: true, region: 'region-west-river', regionName: 'West River Region' },
  { id: 'spec1', label: 'Monument Cardio', sub: 'Specialist', x: 20, y: 90, color: '#b45309', icon: '❤️', size: 'sm', clickable: true, region: 'region-southeast', regionName: 'Southeast SD Region' },
  { id: 'spec2', label: 'Avera Specialists', sub: 'Specialist', x: 78, y: 88, color: '#b45309', icon: '🔬', size: 'sm', clickable: true, region: 'region-southeast', regionName: 'Southeast SD Region' },
];

const CONNECTIONS = [
  { from: 'state', to: 'rhtp', label: 'Funds & Governs' },
  { from: 'rhtp', to: 'fqhc1' },
  { from: 'rhtp', to: 'fqhc2' },
  { from: 'rhtp', to: 'hosp1' },
  { from: 'rhtp', to: 'hosp2' },
  { from: 'rhtp', to: 'pcp1' },
  { from: 'rhtp', to: 'spec1' },
  { from: 'rhtp', to: 'spec2' },
];

const LEGEND = [
  { color: '#0043ce', label: 'FQHCs' },
  { color: '#6929c4', label: 'Rural Hospitals' },
  { color: '#24a148', label: 'PCP Practices' },
  { color: '#b45309', label: 'Specialist Groups' },
];

export default function NetworkGraphPanel() {
  const router = useRouter();

  const getNode = (id: string) => NODES.find((n) => n.id === id)!;

  const handleNodeClick = (node: typeof NODES[0]) => {
    if (!node.clickable) return;
    if (node.region && node.regionName) {
      router.push(`/provider-level?region=${node.region}&regionName=${encodeURIComponent(node.regionName)}`);
    }
  };

  return (
    <div className="bg-white border border-carbon-gray-20">
      <div className="px-5 py-3 border-b border-carbon-gray-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="ShareIcon" size={15} className="text-[#6929c4]" />
          <h3 className="text-sm font-semibold text-carbon-gray-100">Integrated Rural Care Delivery Network</h3>
        </div>
        <div className="flex items-center gap-3">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-2xs text-carbon-gray-50">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* Click hint */}
        <div className="mb-3 flex items-center gap-2 text-2xs text-carbon-gray-50">
          <Icon name="CursorArrowRaysIcon" size={13} className="text-[#0043ce]" />
          <span>Click any provider node to drill into that region&apos;s providers</span>
        </div>

        {/* SVG Network Graph */}
        <div className="relative bg-[#f8f9ff] border border-carbon-gray-20 overflow-hidden" style={{ height: '320px' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Connection lines */}
            {CONNECTIONS.map((conn, i) => {
              const from = getNode(conn.from);
              const to = getNode(conn.to);
              return (
                <g key={`conn-${i}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={conn.label ? '#0043ce' : '#c6c6c6'}
                    strokeWidth={conn.label ? '0.5' : '0.3'}
                    strokeDasharray={conn.label ? '0' : '1,0.5'}
                    opacity={0.7}
                  />
                  {conn.label && (
                    <text
                      x={(from.x + to.x) / 2 + 2}
                      y={(from.y + to.y) / 2}
                      fontSize="2"
                      fill="#0043ce"
                      textAnchor="middle"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const r = node.size === 'lg' ? 5 : 3.5;
              return (
                <g
                  key={node.id}
                  style={{ cursor: node.clickable ? 'pointer' : 'default' }}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Hover ring for clickable nodes */}
                  {node.clickable && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 2}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="0.4"
                      opacity={0.4}
                      strokeDasharray="1,0.5"
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 1}
                    fill={node.color}
                    opacity={0.15}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={node.color}
                    opacity={0.9}
                  />
                  <text
                    x={node.x}
                    y={node.y + 0.5}
                    fontSize={node.size === 'lg' ? '3.5' : '2.5'}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {node.icon}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + r + 2.5}
                    fontSize="2"
                    fill="#161616"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + r + 4.5}
                    fontSize="1.6"
                    fill={node.clickable ? '#0043ce' : '#6f6f6f'}
                    textAnchor="middle"
                  >
                    {node.clickable ? '→ drill in' : node.sub}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Overlay label */}
          <div className="absolute top-3 left-3 bg-white/90 border border-carbon-gray-20 px-3 py-2">
            <p className="text-2xs font-semibold text-carbon-gray-100">14 SD Rural Counties</p>
            <p className="text-2xs text-carbon-gray-50">18 Participating Organizations</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: 'FQHCs / CAHs', value: '4', color: '#0043ce' },
            { label: 'Rural Hospitals', value: '3', color: '#6929c4' },
            { label: 'PCP Practices', value: '6', color: '#24a148' },
            { label: 'Specialist Groups', value: '5', color: '#b45309' },
          ].map((s) => (
            <div key={s.label} className="bg-carbon-gray-10 border border-carbon-gray-20 px-3 py-2.5 text-center">
              <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-carbon-gray-70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
