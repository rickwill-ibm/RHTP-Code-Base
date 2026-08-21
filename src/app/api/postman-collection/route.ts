import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readRuntimeConfig } from '@/lib/runtimeConfig';
import type { RuntimeConfig } from '@/lib/runtimeConfig';

// GET /api/postman-collection?patient=MARIA_SD_001&scopes=patientAccess,priorAuth
// Reads the base collection from tools/contract/cms0057f.postman_collection.json,
// filters items by requested mandate scopes, and streams it as a download.
// The collection is already fully parameterised with {{variables}} — this route
// just handles scope filtering so users can get a focused subset for demos.

const SECTION_PREFIXES: Record<string, string[]> = {
  patientAccess:  ['§1'],
  providerAccess: ['§2'],
  payerToPayer:   ['§3'],
  priorAuth:      ['§4', '§0 — Establish', '§0 — Config'],  // always include setup
  infrastructure: ['Infrastructure'],
};

// §0 setup requests are always included
const ALWAYS_INCLUDE = ['§0 —'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cfg = readRuntimeConfig();

  const patientId = searchParams.get('patient') ?? cfg.postmanPatientId;
  const scopeParam = searchParams.get('scopes');

  // Build active scopes from query param or runtime config
  const activeScopes: Set<string> = new Set();
  if (scopeParam) {
    scopeParam.split(',').forEach(s => activeScopes.add(s.trim()));
  } else {
    const s = cfg.postmanScopes;
    if (s.patientAccess)  activeScopes.add('patientAccess');
    if (s.providerAccess) activeScopes.add('providerAccess');
    if (s.payerToPayer)   activeScopes.add('payerToPayer');
    if (s.priorAuth)      activeScopes.add('priorAuth');
    if (s.infrastructure) activeScopes.add('infrastructure');
  }

  // Read base collection
  const collectionPath = path.resolve(process.cwd(), 'tools/contract/cms0057f.postman_collection.json');
  if (!fs.existsSync(collectionPath)) {
    return NextResponse.json({ error: 'Collection file not found' }, { status: 404 });
  }

  const base = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

  // Filter items by active scopes
  const allowedPrefixes = new Set<string>();
  ALWAYS_INCLUDE.forEach(p => allowedPrefixes.add(p));
  activeScopes.forEach(scope => {
    (SECTION_PREFIXES[scope] ?? []).forEach(p => allowedPrefixes.add(p));
  });

  const filteredItems = (base.item as any[]).filter(item =>
    [...allowedPrefixes].some(prefix => (item.name as string).startsWith(prefix)),
  );

  // Build the scenario info for the collection description
  const scenario = (() => {
    const SCENARIOS: Record<string, { name: string; cpt: string }> = {
      MARIA_SD_001: { name: 'Maria Redhawk', cpt: '72148' },
      'PAT-0042':   { name: 'James Thunderbird', cpt: '75561' },
      'PAT-0087':   { name: 'Dorothy Simmons', cpt: '93306' },
      'PAT-0103':   { name: 'Robert Yellowhorse', cpt: '99243' },
      'PAT-0156':   { name: 'Lisa Thompson', cpt: '99244' },
    };
    return SCENARIOS[patientId] ?? SCENARIOS['MARIA_SD_001'];
  })();

  const collection = {
    ...base,
    info: {
      ...base.info,
      name: `CMS-0057-F — ${scenario.name} (${patientId}) — ${[...activeScopes].join(', ')}`,
      description:
        `Generated ${new Date().toISOString()}. Patient: ${scenario.name} (${patientId}), CPT: ${scenario.cpt}. ` +
        `Active scopes: ${[...activeScopes].join(', ')}. ` +
        `Load with the matching .postman_environment.json from GET /api/postman-environment?patient=${patientId}.`,
    },
    item: filteredItems,
  };

  const filename = `cms0057f-${patientId.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${[...activeScopes].join('-')}.postman_collection.json`;

  return new NextResponse(JSON.stringify(collection, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
