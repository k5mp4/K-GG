import type { ShapesSource } from '../types/shapes';

/**
 * Shape sources for the SANDBOX Shapes stage.
 *
 * Every source becomes one alpha mask canvas. Only alpha is used: colours,
 * strokes' colours and styles of the input never reach the output. The mask
 * carries transparent padding around the content (30% of the longer side on
 * every edge, like an SVG filter region of x/y = -30%, width/height = 160%),
 * so blurs and the aura never hit the texture border.
 *
 * Replacing the input shape:
 * - Built-in: pick Circle / Star / Text in the SANDBOX Shapes panel. They are
 *   defined below as path data and rasterized synchronously, so Presets,
 *   Thumbnails and exports reproduce them exactly.
 * - Custom: load any .svg file in the panel (or paste markup through
 *   `prepareShapeSvg`). The file is parsed with DOMParser, sanitized,
 *   normalized to opaque alpha and rasterized once. It stays in the session and
 *   is not written to Presets.
 */

export type ShapesMask = {
  /** Alpha mask (top-down canvas rows) including the transparent padding. */
  canvas: HTMLCanvasElement;
  /** Fraction of the mask width / height covered by the content box. */
  contentScale: [number, number];
  /** Content box width / height, taken from the SVG viewBox. */
  aspect: number;
  /** Stable identity for texture upload caching and UI labels. */
  key: string;
};

type ViewBox = { x: number; y: number; width: number; height: number };

/** Padding on every edge as a fraction of the content's longer side. */
export const SHAPES_MASK_PADDING = 0.3;
/** Longest side of the mask canvas. Mipmaps provide the blurred levels. */
export const SHAPES_MASK_MAX_DIMENSION = 2048;
/** Custom SVG files larger than this are rejected before parsing. */
export const SHAPES_SVG_MAX_BYTES = 2 * 1024 * 1024;

type BuiltinShape = { viewBox: ViewBox; paths: string[] };

function polygonPath(points: Array<[number, number]>): string {
  return `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`;
}

function starPath(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const vertices: Array<[number, number]> = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    vertices.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return polygonPath(vertices);
}

/** Thick arc as a polygon. Angles are in SVG space (y down, clockwise positive). */
function ringArcPath(cx: number, cy: number, outer: number, inner: number, startDeg: number, endDeg: number): string {
  const steps = 64;
  const vertices: Array<[number, number]> = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = ((startDeg + ((endDeg - startDeg) * index) / steps) * Math.PI) / 180;
    vertices.push([cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer]);
  }
  for (let index = steps; index >= 0; index -= 1) {
    const angle = ((startDeg + ((endDeg - startDeg) * index) / steps) * Math.PI) / 180;
    vertices.push([cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner]);
  }
  return polygonPath(vertices);
}

function rectPath(x: number, y: number, width: number, height: number): string {
  return polygonPath([[x, y], [x + width, y], [x + width, y + height], [x, y + height]]);
}

/** "G" outline: an open ring with a bar pointing inwards. */
function letterGPaths(cx: number): string[] {
  const cy = 50;
  const outer = 48;
  return [
    ringArcPath(cx, cy, outer, 28, 8, 318),
    rectPath(cx + 2, cy - 2, outer - 2, 18),
    rectPath(cx + outer - 20, cy - 2, 20, 28),
  ];
}

/**
 * Sample silhouettes. Each path is filled separately so overlapping strokes
 * of the text outline always form a union regardless of winding direction.
 */
const BUILTIN_SHAPES: Record<Exclude<ShapesSource, 'custom'>, BuiltinShape> = {
  circle: {
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
    paths: ['M100 50 A50 50 0 1 1 0 50 A50 50 0 1 1 100 50 Z'],
  },
  star: {
    viewBox: { x: 0, y: 0, width: 100, height: 96 },
    paths: [starPath(50, 52, 50, 21, 5)],
  },
  // "KGG" as outlined block letters (text converted to paths, no font needed).
  text: {
    viewBox: { x: 0, y: 0, width: 318, height: 100 },
    paths: [
      rectPath(0, 0, 22, 100),
      polygonPath([[20, 40], [58, 0], [86, 0], [40, 56]]),
      polygonPath([[34, 46], [88, 100], [60, 100], [20, 62]]),
      ...letterGPaths(152),
      ...letterGPaths(268),
    ],
  },
};

export function getBuiltinShape(source: Exclude<ShapesSource, 'custom'>): BuiltinShape {
  return BUILTIN_SHAPES[source];
}

/** Mask canvas size and content placement for a content box. */
export function getShapesMaskLayout(viewBox: Pick<ViewBox, 'width' | 'height'>, maxDimension = SHAPES_MASK_MAX_DIMENSION) {
  const padding = SHAPES_MASK_PADDING * Math.max(viewBox.width, viewBox.height);
  const extentWidth = viewBox.width + padding * 2;
  const extentHeight = viewBox.height + padding * 2;
  const pixelScale = maxDimension / Math.max(extentWidth, extentHeight);
  return {
    padding,
    pixelScale,
    canvasWidth: Math.max(1, Math.round(extentWidth * pixelScale)),
    canvasHeight: Math.max(1, Math.round(extentHeight * pixelScale)),
    contentScale: [viewBox.width / extentWidth, viewBox.height / extentHeight] as [number, number],
    aspect: viewBox.width / viewBox.height,
  };
}

function createMaskCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

let builtinCache: ShapesMask | null = null;

/**
 * Synchronous raster of a built-in shape. Only the most recent shape is kept,
 * which bounds the CPU canvas memory to one mask.
 */
export function getBuiltinShapesMask(source: Exclude<ShapesSource, 'custom'>): ShapesMask | null {
  const key = `builtin:${source}`;
  if (builtinCache?.key === key) return builtinCache;
  if (typeof document === 'undefined' || typeof Path2D === 'undefined') return null;
  const shape = BUILTIN_SHAPES[source];
  const layout = getShapesMaskLayout(shape.viewBox);
  const canvas = createMaskCanvas(layout.canvasWidth, layout.canvasHeight);
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.setTransform(
    layout.pixelScale,
    0,
    0,
    layout.pixelScale,
    (layout.padding - shape.viewBox.x) * layout.pixelScale,
    (layout.padding - shape.viewBox.y) * layout.pixelScale,
  );
  context.fillStyle = '#fff';
  for (const path of shape.paths) context.fill(new Path2D(path));
  builtinCache = { canvas, contentScale: layout.contentScale, aspect: layout.aspect, key };
  return builtinCache;
}

/**
 * The mask a scene draws with. A Custom source without a loaded SVG (for
 * example after reloading a Preset) falls back to the Star sample.
 */
export function resolveShapesMask(source: ShapesSource, customMask: ShapesMask | null | undefined): ShapesMask | null {
  if (source === 'custom') return customMask ?? getBuiltinShapesMask('star');
  return getBuiltinShapesMask(source);
}

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Elements that could run code or pull in HTML; they never affect a plain silhouette. */
const REMOVED_ELEMENTS = ['script', 'foreignObject', 'iframe', 'audio', 'video', 'animate', 'animateMotion', 'animateTransform', 'set'];
/** Presentation attributes that would lower or reshape the alpha. */
const REMOVED_ALPHA_ATTRIBUTES = ['opacity', 'fill-opacity', 'stroke-opacity', 'filter', 'mask'];
/**
 * Overrides authored styles (including <style> rules and inline `style`) so
 * the rasterized alpha is the shape's full silhouette: fills that exist stay
 * filled, strokes that exist stay stroked, and transparency / filters go.
 */
const NORMALIZE_STYLE = '*{opacity:1!important;fill-opacity:1!important;stroke-opacity:1!important;filter:none!important;mask:none!important}';

function parseLength(value: string | null): number | null {
  if (!value) return null;
  const match = /^\s*([0-9]*\.?[0-9]+(?:e[-+]?\d+)?)\s*(px)?\s*$/i.exec(value);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseSvgViewBox(svg: Element): ViewBox | null {
  const raw = svg.getAttribute('viewBox');
  if (raw) {
    const parts = raw.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }
  const width = parseLength(svg.getAttribute('width'));
  const height = parseLength(svg.getAttribute('height'));
  if (width && height) return { x: 0, y: 0, width, height };
  return null;
}

/** Measures content without a usable viewBox by laying the SVG out off-screen. */
function measureSvgBounds(svg: SVGSVGElement): ViewBox | null {
  if (typeof document === 'undefined' || !document.body) return null;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;width:0;height:0;overflow:hidden;visibility:hidden';
  const clone = document.importNode(svg, true) as SVGSVGElement;
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    const box = typeof clone.getBBox === 'function' ? clone.getBBox() : null;
    if (!box || !(box.width > 0) || !(box.height > 0)) return null;
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  } catch {
    return null;
  } finally {
    host.remove();
  }
}

export type PreparedShapeSvg = {
  /** Sanitized markup whose viewBox already includes the mask padding. */
  markup: string;
  viewBox: ViewBox;
  width: number;
  height: number;
  contentScale: [number, number];
  aspect: number;
};

/**
 * Sanitizes one SVG document for alpha rasterization and sets its viewBox to
 * the padded extent. Throws when the markup is not a usable SVG.
 */
export function prepareShapeSvg(markup: string, maxDimension = SHAPES_MASK_MAX_DIMENSION): PreparedShapeSvg {
  if (markup.length > SHAPES_SVG_MAX_BYTES) throw new Error('SVG file is too large');
  const documentNode = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = documentNode.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || documentNode.getElementsByTagName('parsererror').length > 0) {
    throw new Error('The file is not a valid SVG document');
  }

  for (const name of REMOVED_ELEMENTS) {
    for (const element of Array.from(svg.getElementsByTagName(name))) element.remove();
  }
  for (const element of [svg, ...Array.from(svg.getElementsByTagName('*'))]) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || REMOVED_ALPHA_ATTRIBUTES.includes(name)) element.removeAttribute(attribute.name);
    }
  }

  const viewBox = parseSvgViewBox(svg) ?? measureSvgBounds(svg as unknown as SVGSVGElement);
  if (!viewBox) throw new Error('The SVG has no measurable size');
  const layout = getShapesMaskLayout(viewBox, maxDimension);

  const style = documentNode.createElementNS(SVG_NS, 'style');
  style.textContent = NORMALIZE_STYLE;
  svg.insertBefore(style, svg.firstChild);
  svg.setAttribute('viewBox', [
    viewBox.x - layout.padding,
    viewBox.y - layout.padding,
    viewBox.width + layout.padding * 2,
    viewBox.height + layout.padding * 2,
  ].join(' '));
  svg.setAttribute('width', String(layout.canvasWidth));
  svg.setAttribute('height', String(layout.canvasHeight));
  svg.setAttribute('preserveAspectRatio', 'none');
  if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', SVG_NS);

  return {
    markup: new XMLSerializer().serializeToString(svg),
    viewBox,
    width: layout.canvasWidth,
    height: layout.canvasHeight,
    contentScale: layout.contentScale,
    aspect: layout.aspect,
  };
}

let customMaskSerial = 0;

/**
 * Rasterizes an SVG into a Shapes mask. The SVG is decoded as an image, so
 * scripts never run and external resources are not fetched.
 */
export async function rasterizeShapeSvg(markup: string): Promise<ShapesMask> {
  const prepared = prepareShapeSvg(markup);
  const url = URL.createObjectURL(new Blob([prepared.markup], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    const canvas = createMaskCanvas(prepared.width, prepared.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to create 2D context for the SVG mask');
    context.drawImage(image, 0, 0, prepared.width, prepared.height);
    customMaskSerial += 1;
    return {
      canvas,
      contentScale: prepared.contentScale,
      aspect: prepared.aspect,
      key: `custom:${customMaskSerial}`,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
