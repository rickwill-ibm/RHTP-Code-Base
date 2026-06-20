'use client';

import React from 'react';
import { useDemoStore } from '@/uhg/store/demoStore';
import { personaFor } from '@/uhg/data/persona';

interface MiniProfileBadgeProps {
  visible?: boolean;
}

export default function MiniProfileBadge({ visible = true }: MiniProfileBadgeProps) {
  const p = personaFor(useDemoStore((s) => s.activeCitizenId));
  if (!visible) return null;

  const chip = (text: string, color: string, bgA = 0.2) => (
    <span className="font-mono px-1.5 rounded" style={{ background: `${color}${Math.round(bgA * 255).toString(16).padStart(2, '0')}`, color, fontSize: '10px', letterSpacing: '0.04em' }}>{text}</span>
  );

  return (
    <div className="rounded px-3 py-1.5 flex items-center gap-3 fade-in" style={{ background: 'rgba(57,57,57,0.6)', border: '1px solid rgba(57,57,57,0.8)', minWidth: 220 }}>
      <div className="flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-white" style={{ width: 30, height: 30, background: 'rgba(250,77,86,0.2)', border: '2px solid rgba(250,77,86,0.5)', fontSize: '11px' }}>{p.initials}</div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold" style={{ fontSize: '13px' }}>{p.name}</span>
          {chip(p.riskLabel, p.riskColor)}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '11px', color: '#8d8d8d' }}>{p.id}</span>
          {chip('SD MEDICAID', '#42be65')}
        </div>
        <div className="flex items-center gap-2">
          {chip(p.careGap, '#fa4d56', 0.15)}
          {chip(p.sdoh, '#f1c21b')}
        </div>
      </div>
    </div>
  );
}
