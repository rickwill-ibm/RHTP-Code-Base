// ─── sdResourceData.ts ───────────────────────────────────────────────────────
// Barrel re-export — import from here as before.
// Actual data lives in sdResourceData.data1.ts / sdResourceData.data2.ts.
// Types live in sdResourceData.types.ts.

export type { SDCountyOffice, SDCBO, SDProgram, SDCrisisResource, SDProvider } from './sdResourceData.types';

export {
  SD_MAP_CENTER,
  SD_ZIP_CODES,
  SD_COUNTIES,
  SD_COUNTY_OFFICES,
  SD_CBOS,
  SD_PROGRAMS,
  SD_CRISIS_RESOURCES,
  SD_PROVIDERS,
} from './sdResourceData.data1';

export {
  SD_TRANSPORT,
  MARIA_CONFIRMED_PRAPARE,
  SD_RECOMMENDATIONS,
  SD_CARE_TEAM,
} from './sdResourceData.data2';
