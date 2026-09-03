export type Pan = {
  x: number;
  y: number;
};

export type GestureFeedback = {
  id: number;
  x: number;
  y: number;
  action: 'undo' | 'redo';
};

export type OverlayImageMode = 'overlay' | 'mask' | 'off';
