import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { DEFAULT_CONE_VIEW, type ConeShape } from '../types/coneView';
import { ConeViewPanel } from './ConeViewPanel';

// Server rendering reads the store's initial state (zustand useStore), so
// the shape is set there for the duration of one render.
function renderShape(shape: ConeShape): string {
  const initialState = useGradientStore.getInitialState();
  const previousConeView = initialState.coneView;
  initialState.coneView = { ...DEFAULT_CONE_VIEW, shape };
  try {
    return renderToStaticMarkup(
      <LanguageProvider>
        <ConeViewPanel />
      </LanguageProvider>,
    );
  } finally {
    initialState.coneView = previousConeView;
  }
}

/** Slider labels rendered as element text, e.g. `>Bend<`. */
function hasLabel(markup: string, label: string): boolean {
  return markup.includes(`>${label}<`);
}

describe('ConeViewPanel shape controls', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('shows the Torus controls and not the Cone-only Depth and Rotation', () => {
    const markup = renderShape('torus');
    for (const label of ['Bend', 'Ring Repeat', 'Twist', 'Spin']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    expect(hasLabel(markup, 'Depth')).toBe(false);
    expect(hasLabel(markup, 'Rotation')).toBe(false);
    // Rotation is the torus camera roll.
    expect(hasLabel(markup, 'Camera Roll')).toBe(true);
  });

  it('shows the Square Rings controls with the pattern amount only where it applies', () => {
    const markup = renderShape('rings');
    for (const label of ['Pattern', 'Ring Mapping', 'Rings per Tile', 'Spacing', 'Thickness', 'Frame Depth', 'Twist', 'Spin', 'Pulse', 'Beats']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    // The default Corridor has no Curve or Scatter.
    expect(hasLabel(markup, 'Curve')).toBe(false);
    expect(hasLabel(markup, 'Scatter')).toBe(false);
    expect(hasLabel(markup, 'Depth')).toBe(false);
    expect(hasLabel(markup, 'Camera Roll')).toBe(true);
  });

  it('shows the Geometry Field controls', () => {
    const markup = renderShape('field');
    for (const label of ['Geometry', 'Render', 'Wire Width', 'Loop Length', 'Density', 'Size', 'Clearance', 'Spread', 'Arms', 'Twist', 'Arm Width', 'Spin', 'Variation']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    // The GLB loader is offered with a .glb file input.
    expect(markup).toContain('data-field-model-loader');
    expect(markup).toContain('accept=".glb,model/gltf-binary"');
    expect(hasLabel(markup, 'Depth')).toBe(false);
    expect(hasLabel(markup, 'Camera Roll')).toBe(true);
  });

  it('keeps Depth and Rotation for the Cone and adds Twist and the camera', () => {
    const markup = renderShape('cone');
    for (const label of ['Depth', 'Rotation', 'Twist', 'FOV', 'Dolly', 'Camera Yaw', 'Camera Pitch', 'Camera Wiggle', 'Wiggle Amount']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    expect(markup).toContain('data-three-d-camera-position');
    // Rotation is the Cone's texture rotation, so there is no separate camera roll.
    expect(hasLabel(markup, 'Camera Roll')).toBe(false);
    // The Cone stays unlit.
    expect(hasLabel(markup, 'Shade')).toBe(false);
    expect(hasLabel(markup, 'Bend')).toBe(false);
  });

  it('shows the Ribbon controls', () => {
    const markup = renderShape('ribbon');
    for (const label of ['Ribbons', 'Radius', 'Width', 'Stagger', 'Loop Length', 'Twist', 'Band Twist', 'Spin', 'Ring Repeat']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    expect(hasLabel(markup, 'Depth')).toBe(false);
    expect(hasLabel(markup, 'Camera Roll')).toBe(true);
  });

  it('shows the Discs controls', () => {
    const markup = renderShape('discs');
    for (const label of ['Form', 'Rings', 'Gap', 'Thickness', 'Z Spread', 'Waves', 'Scatter', 'Spin Pattern', 'Spin', 'Twist', 'Offset', 'Tilt', 'Tilt Turns', 'View Angle', 'Orbit']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    expect(hasLabel(markup, 'Depth')).toBe(false);
    expect(hasLabel(markup, 'Camera Roll')).toBe(true);
  });

  it('no longer offers the Extrusion shape', () => {
    const markup = renderShape('cone');
    expect(markup).not.toContain('Pixel city');
  });
});
