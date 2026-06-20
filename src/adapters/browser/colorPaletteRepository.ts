import type { ColorStop } from '../../types/gradient';
import type { ColorPaletteRepository } from '../types';

export type UserColorPalette = {
  id: string;
  name: string;
  createdAt: number;
  stops: ColorStop[];
};

const STORAGE_KEY = 'kagaribi15_color_palettes';
const CHANGE_EVENT = 'kagaribi15_color_palettes_changed';

const cloneStops = (stops: ColorStop[]): ColorStop[] =>
  stops.map(({ position, color }) => ({ position, color }));

function isUserColorPalette(v: unknown): v is UserColorPalette {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as UserColorPalette).id === 'string' &&
    typeof (v as UserColorPalette).name === 'string' &&
    typeof (v as UserColorPalette).createdAt === 'number' &&
    Array.isArray((v as UserColorPalette).stops)
  );
}

function saveAllColorPalettes(palettes: UserColorPalette[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function loadUserColorPalettes(): UserColorPalette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isUserColorPalette) : [];
  } catch {
    return [];
  }
}

function saveUserColorPalette(name: string, stops: ColorStop[]): UserColorPalette {
  const palette: UserColorPalette = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    stops: cloneStops(stops),
  };
  saveAllColorPalettes([...loadUserColorPalettes(), palette]);
  return palette;
}

function deleteUserColorPalette(id: string): void {
  saveAllColorPalettes(loadUserColorPalettes().filter((palette) => palette.id !== id));
}

function mergeUserColorPalettes(palettes: UserColorPalette[] | undefined): void {
  if (!palettes?.length) return;
  const existing = loadUserColorPalettes();
  const existingIds = new Set(existing.map((palette) => palette.id));
  const toAdd = palettes
    .filter(isUserColorPalette)
    .filter((palette) => !existingIds.has(palette.id))
    .map((palette) => ({ ...palette, stops: cloneStops(palette.stops) }));
  if (toAdd.length > 0) saveAllColorPalettes([...existing, ...toAdd]);
}

export const browserColorPaletteRepository: ColorPaletteRepository = {
  loadUserColorPalettes,
  saveUserColorPalette,
  deleteUserColorPalette,
  mergeUserColorPalettes,
};
