import type { ColorStop } from '../types/gradient';
import { adapters } from '../adapters';

export type UserColorPalette = {
  id: string;
  name: string;
  createdAt: number;
  stops: ColorStop[];
};

const CHANGE_EVENT = 'kagaribi15_color_palettes_changed';

export function loadUserColorPalettes(): UserColorPalette[] {
  return adapters.colorPaletteRepository.loadUserColorPalettes() as UserColorPalette[];
}

export function saveUserColorPalette(name: string, stops: ColorStop[]): UserColorPalette {
  return adapters.colorPaletteRepository.saveUserColorPalette(name, stops) as UserColorPalette;
}

export function deleteUserColorPalette(id: string): void {
  void adapters.colorPaletteRepository.deleteUserColorPalette(id);
}

export function mergeUserColorPalettes(palettes: UserColorPalette[] | undefined): void {
  void adapters.colorPaletteRepository.mergeUserColorPalettes(palettes);
}

export { CHANGE_EVENT };
