export type DemoMode = 'SCRIPTED' | 'LIVE';

export const DEMO_MODE: DemoMode = 'SCRIPTED';

export const FALLBACK_TO_SCRIPTED = true;

export const config = {
  mode: DEMO_MODE,
  signalRate: 4,
  typewriterSpeed: 30,
  graphZoomDuration: 1500,
  progressBarDuration: 3000,
};