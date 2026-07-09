'use client';
/**
 * PatientSwitcherDropdown — topbar patient picker.
 *
 * Reads all 5 patients from the registry, shows name + risk tier badge.
 * On select → calls setActivePatientId() from AppContext so all patient-facing
 * screens update without any page-level changes.
 *
 * Author: Richard Hennessy — TCOC Total Cost of Care Clinical Platform
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/lib/appContext';
import { getAllRegistryPatients } from '@/lib/services/patientService';

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  Critical: { bg: '#fff1f1', text: '#da1e28' },
  High:     { bg: '#fff8e1', text: '#b45309' },
  Moderate: { bg: '#d0e2ff', text: '#0043ce' },
  Low:      { bg: '#defbe6', text: '#0e6027' },
};

export default function PatientSwitcherDropdown() {
  const { activePatientId, setActivePatientId } = useAppContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const patients = getAllRegistryPatients();
  const active = patients.find((p) => p.platformId === activePatientId) ?? patients[0];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const riskStyle = RISK_STYLES[active?.riskTier ?? 'Moderate'];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 border border-carbon-gray-20 bg-white hover:bg-carbon-gray-10 transition-colors text-sm"
        title="Switch active patient"
      >
        {/* Patient icon */}
        <svg
          className="w-4 h-4 text-carbon-gray-50 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>

        {/* Name + risk */}
        <span className="font-medium text-carbon-gray-100 max-w-[120px] truncate">
          {active?.name ?? 'Select Patient'}
        </span>
        {active && (
          <span
            className="text-2xs font-semibold px-1.5 py-0.5 flex-shrink-0"
            style={{ background: riskStyle.bg, color: riskStyle.text }}
          >
            {active.riskTier}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-carbon-gray-50 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-carbon-gray-20 shadow-lg z-50 py-1">
          <p className="px-3 py-1.5 text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wider border-b border-carbon-gray-10">
            Active Patient
          </p>
          {patients.map((p) => {
            const rs = RISK_STYLES[p.riskTier] ?? RISK_STYLES.Moderate;
            const isActive = p.platformId === activePatientId;
            return (
              <button
                key={p.platformId}
                onClick={() => {
                  setActivePatientId(p.platformId);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-carbon-gray-10 ${
                  isActive ? 'bg-[#d0e2ff]' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: rs.text }}
                >
                  {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-carbon-gray-100 truncate">
                      {p.name}
                    </span>
                    {isActive && (
                      <span className="text-2xs font-medium text-[#0043ce] bg-[#d0e2ff] px-1.5 py-0.5 flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-2xs font-semibold px-1.5 py-0.5"
                      style={{ background: rs.bg, color: rs.text }}
                    >
                      {p.riskTier}
                    </span>
                    <span className="text-2xs text-carbon-gray-50 truncate">
                      {p.episodeType}
                    </span>
                  </div>
                  <div className="text-2xs text-carbon-gray-50 truncate mt-0.5">
                    {p.organization}
                  </div>
                </div>

                {/* Gap count */}
                {p.openCareGaps > 0 && (
                  <span className="text-2xs font-bold text-[#da1e28] bg-[#fff1f1] px-1.5 py-0.5 flex-shrink-0">
                    {p.openCareGaps} gaps
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
