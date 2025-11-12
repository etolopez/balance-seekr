import { Platform } from 'react-native';

export type SeekerInfo = {
  isSeeker: boolean;
  matched: string[];
  brand?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  deviceName?: string | null;
};

// Best-effort Seeker/Saga detection using device identifiers.
// This is heuristic and may evolve; adjust as Solana Mobile updates guidance.
export function detectSeeker(): SeekerInfo {
  // Preferred per docs: Platform.constants.Model === 'Seeker'
  const constants: any = (Platform as any).constants ?? {};
  const model = constants?.Model || constants?.model || '';
  const brand = constants?.Brand || constants?.brand || '';
  const manufacturer = constants?.Manufacturer || constants?.manufacturer || '';
  const deviceName = '';

  const haystack = [brand, manufacturer, model, deviceName]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const matched: string[] = [];
  if ((model || '').toLowerCase() === 'seeker') matched.push('model:seeker');
  if ((brand || '').toLowerCase() === 'solanamobile') matched.push('brand:solanamobile');
  if ((manufacturer || '').toLowerCase().includes('solana')) matched.push('manufacturer:solana');

  const heuristics = ['seeker', 'saga', 'solana'];
  heuristics.forEach((n) => {
    if (haystack.some((h) => h.includes(n))) matched.push(`heuristic:${n}`);
  });

  return {
    isSeeker: matched.length > 0,
    matched,
    brand,
    manufacturer,
    model,
    deviceName,
  };
}

export function isSeekerDevice(): boolean {
  return detectSeeker().isSeeker;
}
