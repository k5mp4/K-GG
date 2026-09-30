import { create } from 'zustand';
import type { ShapesMask } from '../../lib/shapesLibrary';

/**
 * Session-only custom SVG for SANDBOX Shapes. Like the Texture image, it is
 * not part of the document, history, or Presets: a Preset only remembers that
 * its source is `custom`, and draws the Star fallback until an SVG is loaded.
 */
type ShapesMaskState = {
  customMask: ShapesMask | null;
  customName: string;
  setCustomMask: (mask: ShapesMask, name: string) => void;
  clearCustomMask: () => void;
};

export const useShapesMaskStore = create<ShapesMaskState>()(set => ({
  customMask: null,
  customName: '',
  setCustomMask: (customMask, customName) => set({ customMask, customName }),
  clearCustomMask: () => set({ customMask: null, customName: '' }),
}));
