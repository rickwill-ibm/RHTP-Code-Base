// careTeam/graph/keystones.ts — Thin query over the EXISTING knowledge graph.
// Reuses wholePersonGraphData.ts (no parallel model). Surfaces the keystone
// barriers via the BLOCKS edges already in the data:
//   MATCH (b:SDOHNode)-[:BLOCKS]->(g:CareGap) RETURN b, collect(g)

import { graphNodes, graphEdges } from '@/lib/wholePersonGraphData';

export interface Keystone {
  barrierId: string;
  barrier: string; // SDOH barrier node label
  blockedGapIds: string[];
  blockedGaps: string[]; // care-gap node labels this barrier blocks
  cypher: string;
}

function nodeLabel(id: string): string {
  return graphNodes.find((n) => n.id === id)?.label ?? id;
}

/** Keystone barriers, ranked by how many open care gaps they unblock. */
export function keystones(): Keystone[] {
  const blocks = graphEdges.filter((e) => e.type === 'BLOCKS');
  const byBarrier: Record<string, string[]> = {};
  for (const e of blocks) {
    (byBarrier[e.source] ??= []).push(e.target);
  }
  return Object.entries(byBarrier)
    .map(([barrierId, gapIds]) => ({
      barrierId,
      barrier: nodeLabel(barrierId),
      blockedGapIds: gapIds,
      blockedGaps: gapIds.map(nodeLabel),
      cypher: `MATCH (b:SDOHNode {id:'${barrierId}'})-[:BLOCKS]->(g:CareGap) RETURN g`,
    }))
    .sort((a, b) => b.blockedGaps.length - a.blockedGaps.length);
}

/** Distinct care gaps unblocked across all keystones (for the "unblocks N gaps" line). */
export function totalUnblockedGaps(): number {
  const ks = keystones();
  return new Set(ks.flatMap((k) => k.blockedGapIds)).size;
}
