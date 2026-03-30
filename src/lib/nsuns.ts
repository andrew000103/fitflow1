export type TmKey = 'bench' | 'squat' | 'deadlift' | 'ohp';

export interface NsunsSetDef {
  pct: number;
  targetReps: number;
  is_amrap: boolean;
  isProgressionSet: boolean;
}

export const NSUNS_VOLUME: NsunsSetDef[] = [
  { pct: 0.65, targetReps: 8, is_amrap: false, isProgressionSet: false },
  { pct: 0.75, targetReps: 6, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 4, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 4, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 4, is_amrap: false, isProgressionSet: false },
  { pct: 0.80, targetReps: 5, is_amrap: false, isProgressionSet: false },
  { pct: 0.75, targetReps: 6, is_amrap: false, isProgressionSet: false },
  { pct: 0.70, targetReps: 7, is_amrap: false, isProgressionSet: false },
  { pct: 0.65, targetReps: 8, is_amrap: true,  isProgressionSet: true  },
];

export const NSUNS_531: NsunsSetDef[] = [
  { pct: 0.75, targetReps: 5, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 3, is_amrap: false, isProgressionSet: false },
  { pct: 0.95, targetReps: 1, is_amrap: true,  isProgressionSet: true  },
  { pct: 0.90, targetReps: 3, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 3, is_amrap: false, isProgressionSet: false },
  { pct: 0.80, targetReps: 3, is_amrap: false, isProgressionSet: false },
  { pct: 0.75, targetReps: 5, is_amrap: false, isProgressionSet: false },
  { pct: 0.70, targetReps: 5, is_amrap: false, isProgressionSet: false },
  { pct: 0.65, targetReps: 5, is_amrap: true,  isProgressionSet: false },
];

export const NSUNS_ACCESSORY: NsunsSetDef[] = [
  { pct: 0.65, targetReps: 6, is_amrap: false, isProgressionSet: false },
  { pct: 0.75, targetReps: 5, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 3, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 5, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 7, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 4, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 6, is_amrap: false, isProgressionSet: false },
  { pct: 0.85, targetReps: 8, is_amrap: false, isProgressionSet: false },
];

export type NsunsPattern = 'volume' | '531' | 'accessory';

export function getNsunsSets(pattern: NsunsPattern): NsunsSetDef[] {
  if (pattern === 'volume') return NSUNS_VOLUME;
  if (pattern === '531') return NSUNS_531;
  return NSUNS_ACCESSORY;
}

export function detectNsunsPattern(targetSets: number, targetReps: number): NsunsPattern | null {
  if (targetSets === 9 && targetReps === 8) return 'volume';
  if (targetSets === 9 && targetReps === 5) return '531';
  if (targetSets === 8) return 'accessory';
  return null;
}

export function getTmKey(nameKo: string, nameEn: string | null): TmKey | null {
  const ko = nameKo.toLowerCase();
  const en = (nameEn ?? '').toLowerCase();
  if (ko.includes('오버헤드') || en.includes('overhead')) return 'ohp';
  if (ko.includes('벤치') || en.includes('bench')) return 'bench';
  if (ko.includes('데드') || en.includes('dead')) return 'deadlift';
  if (ko.includes('스쿼트') || en.includes('squat')) return 'squat';
  return null;
}

export function roundToPlate(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}

export function isNsunsProgram(creatorName: string | null, programName: string): boolean {
  return creatorName === 'nSuns' || programName.toLowerCase().startsWith('nsuns');
}

export function isUpperBody(key: TmKey): boolean {
  return key === 'bench' || key === 'ohp';
}

export function suggestTmIncrease(amrapReps: number, upperBody: boolean): number {
  if (amrapReps <= 1) return 0;
  if (amrapReps <= 3) return 2.5;
  if (amrapReps <= 5) return upperBody ? 2.5 : 5;
  return upperBody ? 5 : 7.5;
}

export const TM_KEY_LABELS: Record<TmKey, string> = {
  bench: '벤치프레스',
  squat: '스쿼트',
  deadlift: '데드리프트',
  ohp: '오버헤드프레스',
};
