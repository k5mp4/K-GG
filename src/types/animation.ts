/**
 * Animation domain types shared by the editor, scene evaluation, export
 * services, and persisted preset boundary.
 *
 * This module intentionally has no dependency on React, Zustand, or a
 * platform adapter.  Keeping these types here prevents the store from being
 * the source of truth for consumers that only need the animation contract.
 */

export type AnimationEasing = {
  enabled: boolean;
  p1: [number, number];
  p2: [number, number];
  linkMode: 'none' | 'symmetric' | 'coincide';
  beatSync?: {
    enabled: boolean;
    bpm: number;
    beatsPerBar: number;
    subdivision: 3 | 4;
    /** Tempo multiplier for the loop (1 = 4 beats at `bpm`). Missing means 1. */
    rate?: 0.25 | 0.5 | 1 | 2;
  };
};

export type AnimationConfig = {
  enabled: boolean;
  previewLoop: boolean;
  speed: number;
  /** Whole ramp cycles per loop for the Gradient Ramp color offset (signed integer, 0 = off). Integers keep the loop seamless. */
  rampOffsetSpeed?: number;
  intensity: number;
  duration: number;
  fps: 24 | 30 | 60;
  direction: number;
  easing: AnimationEasing;
  affectNoise: boolean;
  affectSlit: boolean;
  affectRamp: boolean;
  affectStretch: boolean;
};
