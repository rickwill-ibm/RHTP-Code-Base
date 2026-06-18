'use client';
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import CohortKPIStrip from './components/CohortKPIStrip';
import PanelFilterBar from './components/PanelFilterBar';
import PatientPanelTable from './components/PatientPanelTable';
import PanelActionBar from './components/PanelActionBar';

export interface PanelFilters {
  search: string;
  risk: string;
  gap: string;
  hcc: string;
  alert: string;
  sort: string;
  sortDir: 'asc' | 'desc';
  attribution: string;
}

function PanelCohortContent() {
  const searchParams = useSearchParams();
  const physicianName = searchParams.get('physicianName') || '';
  const physicianId = searchParams.get('physician') || '';
  const providerName = searchParams.get('providerName') || '';
  const providerId = searchParams.get('provider') || '';
  const regionName = searchParams.get('regionName') || '';
  const regionId = searchParams.get('region') || '';

  const [filters, setFilters] = useState<PanelFilters>({
    search: '',
    risk: 'All',
    gap: 'All Gaps',
    hcc: 'All HCC',
    alert: 'All Alerts',
    sort: 'Risk Tier',
    sortDir: 'asc',
    attribution: 'All',
  });
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());

  // Build dynamic breadcrumbs: RHTP Overview → Region → Provider → Physician → Panel & Cohort
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: 'RHTP Overview', href: '/contract-program-selection' },
  ];
  if (regionName) {
    breadcrumbs.push({ label: regionName, href: `/provider-level?region=${regionId}&regionName=${encodeURIComponent(regionName)}` });
  }
  if (providerName) {
    const physicianHref = providerId
      ? `/physician-view?provider=${providerId}&providerName=${encodeURIComponent(providerName)}&region=${regionId}&regionName=${encodeURIComponent(regionName)}`
      : '/physician-view';
    breadcrumbs.push({ label: providerName, href: physicianHref });
  }
  if (physicianName) {
    const physicianHref = providerId
      ? `/physician-view?provider=${providerId}&providerName=${encodeURIComponent(providerName)}&region=${regionId}&regionName=${encodeURIComponent(regionName)}`
      : '/physician-view';
    breadcrumbs.push({ label: physicianName, href: physicianHref });
  }
  breadcrumbs.push({ label: 'Panel & Cohort' });

  const pageTitle = physicianName
    ? `${physicianName} — Patient Panel`
    : providerName
    ? `${providerName} — Patient Panel`
    : 'Medicaid RHTP Track 3 — Patient Panel';

  return (
    <AppLayout
      pageTitle={pageTitle}
      breadcrumbs={breadcrumbs}
      contextBanner={
        <div className="bg-[#d0e2ff] border-b border-[#97c1ff] px-6 py-2 flex items-center gap-6 flex-wrap">
          <span className="text-xs font-medium text-[#0043ce]">Contract: Medicaid RHTP Track 3</span>
          <span className="text-xs text-[#0043ce]">Payer: State Medicaid / RHTP</span>
          <span className="text-xs text-[#0043ce]">Period: Jan 2025 – Dec 2025</span>
          <span className="text-xs text-[#0043ce]">4,872 attributed lives</span>
          {providerName && !physicianName && (
            <span className="text-xs font-semibold text-[#0043ce]">Provider: {providerName}</span>
          )}
          {physicianName && (
            <span className="text-xs font-semibold text-[#0043ce]">Physician: {physicianName}</span>
          )}
          <span className="text-xs font-semibold text-[#0043ce] ml-auto bg-[#0043ce]/10 px-2 py-0.5 border border-[#0043ce]/30">
            Track 3 — Prospective Attribution
          </span>
        </div>
      }
    >
      <CohortKPIStrip />
      <PanelActionBar selectedPatients={selectedPatients} onClearSelection={() => setSelectedPatients(new Set())} />
      <PanelFilterBar filters={filters} onFiltersChange={setFilters} />
      <PatientPanelTable filters={filters} onFiltersChange={setFilters} selectedPatients={selectedPatients} onSelectionChange={setSelectedPatients} />
    </AppLayout>
  );
}

export default function PanelCohortViewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-carbon-gray-50 text-sm">Loading panel...</div>}>
      <PanelCohortContent />
    </Suspense>
  );
}