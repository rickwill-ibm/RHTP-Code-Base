// Export utilities — CSV download and PDF generation for all screens

// ─── HTML Sanitizer (XSS prevention) ─────────────────────────────────────────

function escapeHtml(value: string | number | null | undefined): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function downloadCSV(filename: string, rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null | undefined): string => {
    const s = v == null ? '' : String(v);
    // Wrap in quotes if contains comma, quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF via Print Window ─────────────────────────────────────────────────────

export interface PDFSection {
  title: string;
  rows: { label: string; value: string }[];
}

export function generatePDFReport(opts: {
  reportTitle: string;
  subtitle?: string;
  generatedBy?: string;
  sections: PDFSection[];
  tableHeaders?: string[];
  tableRows?: string[][];
}) {
  const { reportTitle, subtitle, generatedBy, sections, tableHeaders, tableRows } = opts;
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const sectionHTML = sections
    .map(
      (s) => `
      <div class="section">
        <h3>${escapeHtml(s.title)}</h3>
        <table class="kv-table">
          ${s.rows.map((r) => `<tr><td class="label">${escapeHtml(r.label)}</td><td class="value">${escapeHtml(r.value)}</td></tr>`).join('')}
        </table>
      </div>`
    )
    .join('');

  const tableHTML =
    tableHeaders && tableRows && tableRows.length > 0
      ? `<div class="section">
          <table class="data-table">
            <thead><tr>${tableHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
            <tbody>${tableRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>`
      : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #161616; padding: 32px; }
    .header { border-bottom: 2px solid #0f62fe; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; font-weight: 700; color: #0f62fe; }
    .header .meta { font-size: 10px; color: #6f6f6f; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #393939; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 8px; }
    .kv-table { width: 100%; border-collapse: collapse; }
    .kv-table td { padding: 4px 8px; border-bottom: 1px solid #f4f4f4; vertical-align: top; }
    .kv-table td.label { width: 40%; font-weight: 600; color: #525252; }
    .kv-table td.value { color: #161616; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table th { background: #f4f4f4; font-weight: 700; text-align: left; padding: 5px 8px; border: 1px solid #e0e0e0; }
    .data-table td { padding: 4px 8px; border: 1px solid #e0e0e0; }
    .data-table tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 8px; font-size: 9px; color: #a8a8a8; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(reportTitle)}</h1>
    <div class="meta">
      ${subtitle ? `<span>${escapeHtml(subtitle)}</span> &nbsp;|&nbsp; ` : ''}
      Generated: ${now}
      ${generatedBy ? ` &nbsp;|&nbsp; By: ${escapeHtml(generatedBy)}` : ''}
    </div>
  </div>
  ${sectionHTML}
  ${tableHTML}
  <div class="footer">TCOC Platform — Confidential. For authorized care team use only. Generated ${now}.</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

// ─── Panel Cohort CSV ─────────────────────────────────────────────────────────

export interface PanelPatientRow {
  name: string;
  riskTier: string;
  rafScore: number;
  rafScoreDelta: number;
  predictedErRisk: number;
  openHCCSuspects: number;
  openCareGaps: number;
  pmpmCost: number;
  pmpmTarget: number;
  attributionStatus: string;
  lastContactDate: string;
  primaryCareProvider: string;
  payer: string;
}

export function exportPanelCSV(patients: PanelPatientRow[]) {
  const rows = patients.map((p) => ({
    'Patient Name': p.name,
    'Risk Tier': p.riskTier,
    'RAF Score': p.rafScore,
    'RAF Delta': p.rafScoreDelta,
    'ER Risk (%)': Math.round(p.predictedErRisk * 100),
    'HCC Suspects': p.openHCCSuspects,
    'Open Care Gaps': p.openCareGaps,
    'PMPM Cost ($)': p.pmpmCost,
    'PMPM Target ($)': p.pmpmTarget,
    'Attribution': p.attributionStatus,
    'Last Contact': p.lastContactDate,
    'PCP': p.primaryCareProvider,
    'Payer': p.payer,
  }));
  downloadCSV(`panel-cohort-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

// ─── Financial CSV ────────────────────────────────────────────────────────────

export interface FinancialPatientRow {
  name: string;
  riskTier: string;
  pmpmCost: number;
  pmpmTarget: number;
  rafScore: number;
  openHCCSuspects: number;
  hccSuspectValue: number;
  payer: string;
  attributionStatus: string;
}

export function exportFinancialCSV(patients: FinancialPatientRow[]) {
  const rows = patients.map((p) => ({
    'Patient Name': p.name,
    'Risk Tier': p.riskTier,
    'PMPM Cost ($)': p.pmpmCost,
    'PMPM Target ($)': p.pmpmTarget,
    'Variance ($)': p.pmpmCost - p.pmpmTarget,
    'RAF Score': p.rafScore,
    'HCC Suspects': p.openHCCSuspects,
    'HCC Revenue at Risk ($)': p.hccSuspectValue,
    'Payer': p.payer,
    'Attribution': p.attributionStatus,
  }));
  downloadCSV(`financial-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

// ─── Referral CSV ─────────────────────────────────────────────────────────────

export interface ReferralExportRow {
  id: string;
  patientName: string;
  referralDate: string;
  specialty: string;
  urgency: string;
  status: string;
  assignedProvider: string | null;
  providerTier: string | null;
  icdCode: string;
  icdDescription: string;
  submissionChannel: string | null;
  submittedDate: string | null;
  appointmentDate: string | null;
  closedDate: string | null;
  outcome: string | null;
  coordinatorName: string;
  daysOpen: number;
}

export function exportReferralsCSV(referrals: ReferralExportRow[]) {
  const rows = referrals.map((r) => ({
    'Referral ID': r.id,
    'Patient Name': r.patientName,
    'Referral Date': r.referralDate,
    'Specialty': r.specialty,
    'Urgency': r.urgency,
    'Status': r.status,
    'Assigned Provider': r.assignedProvider ?? 'Unassigned',
    'Provider Tier': r.providerTier ?? '',
    'ICD Code': r.icdCode,
    'ICD Description': r.icdDescription,
    'Submission Channel': r.submissionChannel ?? '',
    'Submitted Date': r.submittedDate ?? '',
    'Appointment Date': r.appointmentDate ?? '',
    'Closed Date': r.closedDate ?? '',
    'Outcome': r.outcome ?? 'Pending',
    'Coordinator': r.coordinatorName,
    'Days Open': r.daysOpen,
  }));
  downloadCSV(`referrals-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

// ─── STARS/HEDIS/MIPS CSV ─────────────────────────────────────────────────────

export function exportSTARSCSV(measures: Array<{
  measureId: string; measureName: string; domain: string; contractName: string;
  currentRating: number; targetRating: number; gapCount: number; bonusEstimate: number;
  deadline: string; status: string;
}>) {
  const rows = measures.map((m) => ({
    'Measure ID': m.measureId,
    'Measure Name': m.measureName,
    'Domain': m.domain,
    'Contract': m.contractName,
    'Current Rating': m.currentRating,
    'Target Rating': m.targetRating,
    'Gap Count': m.gapCount,
    'Bonus Estimate ($)': m.bonusEstimate,
    'Deadline': m.deadline,
    'Status': m.status,
  }));
  downloadCSV(`stars-measures-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function exportHEDISCSV(measures: Array<{
  measureId: string; measureName: string; domain: string; contractName: string;
  complianceRate: number; targetRate: number; patientsDue: number; patientsCompliant: number;
  dueDate: string; status: string;
}>) {
  const rows = measures.map((m) => ({
    'Measure ID': m.measureId,
    'Measure Name': m.measureName,
    'Domain': m.domain,
    'Contract': m.contractName,
    'Compliance Rate (%)': m.complianceRate,
    'Target Rate (%)': m.targetRate,
    'Patients Due': m.patientsDue,
    'Patients Compliant': m.patientsCompliant,
    'Patients Remaining': m.patientsDue - m.patientsCompliant,
    'Due Date': m.dueDate,
    'Status': m.status,
  }));
  downloadCSV(`hedis-measures-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function exportMIPSCSV(adjustments: Array<{
  noticeId: string; performanceYear: string; compositeScore: number;
  adjustmentPct: number; adjustmentAmount: number; qualityScore: number;
  promotingInteropScore: number; improvementActScore: number; costScore: number;
  deadline: string; status: string; appealEligible: boolean;
}>) {
  const rows = adjustments.map((a) => ({
    'Notice ID': a.noticeId,
    'Performance Year': a.performanceYear,
    'Composite Score': a.compositeScore,
    'Adjustment (%)': a.adjustmentPct,
    'Adjustment Amount ($)': a.adjustmentAmount,
    'Quality Score': a.qualityScore,
    'Promoting Interop Score': a.promotingInteropScore,
    'Improvement Activity Score': a.improvementActScore,
    'Cost Score': a.costScore,
    'Deadline': a.deadline,
    'Status': a.status,
    'Appeal Eligible': a.appealEligible ? 'Yes' : 'No',
  }));
  downloadCSV(`mips-adjustments-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

// ─── Demo Track Export ────────────────────────────────────────────────────────

export interface DemoPatientExportRow {
  name: string;
  mrn: string;
  age: number;
  gender: string;
  payer: string;
  riskTier: string;
  rafScore: number;
  rafDelta: number;
  predictedErRisk: number;
  openHCCSuspects: number;
  hccSuspectValue: number;
  openCareGaps: number;
  clinicalGaps: number;
  bhGaps: number;
  socialGaps: number;
  pmpmCost: number;
  pmpmTarget: number;
  attributionStatus: string;
  primaryCareProvider: string;
  lastContactDate: string;
  phq9Score: number;
  auditC: number;
  bhReferralStatus: string;
  transportStatus: string;
  foodSecurity: string;
  housingStatus: string;
  cohortFlag: string;
  ruralDistance: string;
  disparityFlag: string;
  episodeType: string;
  episodeStatus: string;
  carePlanStatus: string;
  pathwayProgress: string;
  gainShareEstimate: number;
  contract: string;
  exportedBy: string;
  exportedAt: string;
}

export function exportDemoTrackCSV(patients: DemoPatientExportRow[]) {
  const rows = patients.map((p) => ({
    'Patient Name': p.name,
    'MRN': p.mrn,
    'Age': p.age,
    'Gender': p.gender,
    'Payer': p.payer,
    'Contract': p.contract,
    'Risk Tier': p.riskTier,
    'RAF Score': p.rafScore,
    'RAF Delta (YTD)': p.rafDelta,
    'ER Risk (%)': Math.round(p.predictedErRisk * 100),
    'Open HCC Suspects': p.openHCCSuspects,
    'HCC Revenue at Risk ($)': p.hccSuspectValue,
    'Open Care Gaps (Total)': p.openCareGaps,
    'Clinical Gaps': p.clinicalGaps,
    'BH Gaps': p.bhGaps,
    'Social Gaps': p.socialGaps,
    'PMPM Cost ($)': p.pmpmCost,
    'PMPM Target ($)': p.pmpmTarget,
    'PMPM Variance ($)': p.pmpmCost - p.pmpmTarget,
    'Attribution Status': p.attributionStatus,
    'Primary Care Provider': p.primaryCareProvider,
    'Last Contact Date': p.lastContactDate,
    'PHQ-9 Score': p.phq9Score,
    'AUDIT-C Score': p.auditC,
    'BH Referral Status': p.bhReferralStatus,
    'Transport Status': p.transportStatus,
    'Food Security': p.foodSecurity,
    'Housing Status': p.housingStatus,
    'Cohort Flag': p.cohortFlag,
    'Rural Distance': p.ruralDistance,
    'Disparity Flag': p.disparityFlag,
    'Episode Type': p.episodeType,
    'Episode Status': p.episodeStatus,
    'Care Plan Status': p.carePlanStatus,
    'Pathway Progress': p.pathwayProgress,
    'Gain Share Estimate ($)': p.gainShareEstimate,
    'Exported By': p.exportedBy,
    'Exported At': p.exportedAt,
  }));
  downloadCSV(`demo-track-export-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function generateDemoTrackPDF(patient: DemoPatientExportRow) {
  generatePDFReport({
    reportTitle: `Demo Track Export — ${patient.name}`,
    subtitle: `MRN: ${patient.mrn} · ${patient.payer} · ${patient.contract}`,
    generatedBy: patient.exportedBy,
    sections: [
      {
        title: 'Patient Demographics',
        rows: [
          { label: 'Name', value: patient.name },
          { label: 'MRN', value: patient.mrn },
          { label: 'Age / Gender', value: `${patient.age}y ${patient.gender}` },
          { label: 'Payer', value: patient.payer },
          { label: 'Contract', value: patient.contract },
          { label: 'Attribution Status', value: patient.attributionStatus },
          { label: 'Primary Care Provider', value: patient.primaryCareProvider },
          { label: 'Last Contact', value: patient.lastContactDate },
        ],
      },
      {
        title: 'Clinical Risk Profile',
        rows: [
          { label: 'Risk Tier', value: patient.riskTier },
          { label: 'RAF Score', value: `${patient.rafScore.toFixed(2)} (Δ +${patient.rafDelta.toFixed(2)} YTD)` },
          { label: 'Predicted ER Risk (30d)', value: `${Math.round(patient.predictedErRisk * 100)}%` },
          { label: 'Open HCC Suspects', value: String(patient.openHCCSuspects) },
          { label: 'HCC Revenue at Risk', value: `$${patient.hccSuspectValue.toLocaleString()}` },
          { label: 'Episode', value: `${patient.episodeType} · ${patient.episodeStatus}` },
        ],
      },
      {
        title: 'Care Gaps — Unified (Clinical + BH + Social)',
        rows: [
          { label: 'Total Open Gaps', value: String(patient.openCareGaps) },
          { label: 'Clinical Gaps', value: String(patient.clinicalGaps) },
          { label: 'Behavioral Health Gaps', value: String(patient.bhGaps) },
          { label: 'Social Gaps', value: String(patient.socialGaps) },
          { label: 'Care Plan Status', value: patient.carePlanStatus },
          { label: 'Pathway Progress', value: patient.pathwayProgress },
        ],
      },
      {
        title: 'Behavioral Health',
        rows: [
          { label: 'PHQ-9 Score', value: String(patient.phq9Score) },
          { label: 'AUDIT-C Score', value: String(patient.auditC) },
          { label: 'BH Referral Status', value: patient.bhReferralStatus },
        ],
      },
      {
        title: 'Social & Equity',
        rows: [
          { label: 'Transport Status', value: patient.transportStatus },
          { label: 'Food Security', value: patient.foodSecurity },
          { label: 'Housing Status', value: patient.housingStatus },
          { label: 'Cohort Flag', value: patient.cohortFlag },
          { label: 'Rural Distance', value: patient.ruralDistance },
          { label: 'Disparity Flag', value: patient.disparityFlag },
        ],
      },
      {
        title: 'Financial & Gain Share',
        rows: [
          { label: 'PMPM Cost', value: `$${patient.pmpmCost.toLocaleString()}` },
          { label: 'PMPM Target', value: `$${patient.pmpmTarget.toLocaleString()}` },
          { label: 'PMPM Variance', value: `$${(patient.pmpmCost - patient.pmpmTarget).toLocaleString()}` },
          { label: 'Gain Share Estimate', value: `$${patient.gainShareEstimate.toLocaleString()}` },
        ],
      },
    ],
  });
}
