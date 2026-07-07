#!/usr/bin/env node
const base = 'http://localhost:8080/fhir';
const h = { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' };

// Create a test CarePlan
const cp = {
  resourceType: 'CarePlan', status: 'active', intent: 'plan',
  title: 'Test Plan', subject: { reference: 'Patient/patient-maria-001' },
};
const cr = await fetch(`${base}/CarePlan`, { method: 'POST', headers: h, body: JSON.stringify(cp) });
const crj = await cr.json();
console.log('Created CarePlan id:', crj.id, 'HTTP', cr.status);

// Search by subject (various forms)
for (const q of [
  `CarePlan?subject=Patient/patient-maria-001`,
  `CarePlan?subject=patient-maria-001`,
  `CarePlan?patient=Patient/patient-maria-001`,
  `CarePlan?patient=patient-maria-001`,
  `CarePlan?subject=Patient%2Fpatient-maria-001`,
]) {
  const r = await fetch(`${base}/${q}`, { headers: h });
  const j = await r.json();
  console.log(`${q}: ${j.entry?.length ?? 0} results`);
}

// Search by id directly
const dr = await fetch(`${base}/CarePlan/${crj.id}`, { headers: h });
const dj = await dr.json();
console.log('Direct read CarePlan:', dj.id, dj.subject?.reference);

// Clean up
await fetch(`${base}/CarePlan/${crj.id}`, { method: 'DELETE', headers: h });
console.log('Deleted test CarePlan');
