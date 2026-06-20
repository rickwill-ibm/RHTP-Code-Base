'use client';
import React from 'react';
import Icon from '@/components/ui/AppIcon';
import type { PanelFilters } from '../page';

const riskFilters = ['All', 'Critical', 'High', 'Moderate', 'Low'];
const gapFilters = ['All Gaps', 'Has Open Gaps', 'No Gaps'];
const hccFilters = ['All HCC', 'Has Suspects', 'No Suspects'];
const alertFilters = ['All Alerts', 'Has Alerts', 'No Alerts'];
const attributionFilters = ['All', 'Confirmed', 'Provisional', 'Disputed', 'Dropped'];

// Map filter bar sort labels to the canonical sort keys used in PatientPanelTable
const SORT_OPTIONS: { label: string; key: string }[] = [
  { label: 'Risk Tier', key: 'riskTier' },
  { label: 'RAF Score', key: 'rafScore' },
  { label: 'PMPM Cost', key: 'pmpmCost' },
  { label: 'ER Risk', key: 'predictedErRisk' },
  { label: 'Last Contact', key: 'lastContactDate' },
  { label: 'Care Gaps', key: 'openCareGaps' },
  { label: 'HCC Suspects', key: 'openHCCSuspects' },
];

interface PanelFilterBarProps {
  filters: PanelFilters;
  onFiltersChange: (f: PanelFilters) => void;
}

export default function PanelFilterBar({ filters, onFiltersChange }: PanelFilterBarProps) {
  const update = (partial: Partial<PanelFilters>) => onFiltersChange({ ...filters, ...partial });

  return (
    <div className="bg-white border border-carbon-gray-20 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Icon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-gray-50" />
          <input
            type="text"
            placeholder="Search patient name or MRN..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-carbon-gray-10 border-0 border-b border-carbon-gray-30 focus:outline-none focus:border-carbon-blue"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-2xs text-carbon-gray-50 mr-1">Risk:</span>
          {riskFilters.map((f) => (
            <button
              key={`risk-${f}`}
              onClick={() => update({ risk: f })}
              className={`px-2.5 py-1 text-2xs font-medium transition-colors ${filters.risk === f
                ? f === 'Critical' ? 'bg-[#da1e28] text-white'
                  : f === 'High' ? 'bg-[#f1c21b] text-[#161616]'
                    : f === 'Moderate' ? 'bg-[#0f62fe] text-white'
                      : f === 'Low' ? 'bg-[#24a148] text-white'
                        : 'bg-carbon-gray-90 text-white' :'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-carbon-gray-50 mr-1">Gaps:</span>
          {gapFilters.map((f) => (
            <button key={`gap-${f}`} onClick={() => update({ gap: f })} className={`px-2.5 py-1 text-2xs font-medium transition-colors ${filters.gap === f ? 'bg-carbon-gray-90 text-white' : 'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-carbon-gray-50 mr-1">HCC:</span>
          {hccFilters.map((f) => (
            <button key={`hcc-${f}`} onClick={() => update({ hcc: f })} className={`px-2.5 py-1 text-2xs font-medium transition-colors ${filters.hcc === f ? 'bg-carbon-gray-90 text-white' : 'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-carbon-gray-50 mr-1">Alerts:</span>
          {alertFilters.map((f) => (
            <button key={`alert-${f}`} onClick={() => update({ alert: f })} className={`px-2.5 py-1 text-2xs font-medium transition-colors ${filters.alert === f ? 'bg-carbon-gray-90 text-white' : 'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'}`}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-carbon-gray-50 mr-1">Attribution:</span>
          {attributionFilters.map((f) => (
            <button
              key={`attr-${f}`}
              onClick={() => update({ attribution: f })}
              className={`px-2.5 py-1 text-2xs font-medium transition-colors ${filters.attribution === f
                ? f === 'Confirmed' ? 'bg-[#24a148] text-white'
                  : f === 'Disputed' ? 'bg-[#da1e28] text-white'
                    : f === 'Provisional' ? 'bg-[#f1c21b] text-[#161616]'
                      : f === 'Dropped'? 'bg-carbon-gray-50 text-white' :'bg-carbon-gray-90 text-white' :'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}