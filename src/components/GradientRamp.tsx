import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { useGradientStore, GRADIENT_ANCHOR_DEFAULTS, defaultBezierControlsForAnchors } from '../store/gradientStore';
import { gradientRampPresets, getColorAtPosition, getOpacityAtPosition, applyMirrorT, normalizeRampSettings } from '../lib/gradientRampUtils';
import { buildGradientPreviewStyle } from '../lib/gradientPreview';
import { moveStopsProportionally } from '../lib/proportionalRampEdit';
import { RAMP_W, RAMP_BAR_H, RAMP_HANDLE_AREA, RAMP_HANDLE_HALF, RAMP_WHEEL_STEP } from '../lib/constants';
import type { ColorStop, OpacityStop, RampColorMode, RampInterpolation } from '../types/gradient';
import { CustomSelect } from './CustomSelect';
import { Icon } from './Icon';
import { undo, redo } from '../lib/history'; // 追加
import {
  deleteUserColorPalette,
  loadUserColorPalettes,
  saveUserColorPalette,
  type UserColorPalette,
} from '../lib/colorPalettes';

import { ColorPicker } from './ColorPicker';
import { ColorPaletteGenerator } from './ColorPaletteGenerator';
import { SidebarSection } from './SidebarSection';
import { SliderField } from './SliderField';
import { GradientTypeSelector } from './GradientTypeSelector';
import { IconButton } from './IconButton';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';
import { InputNumber, InputShuffle } from 'tweeq';

const BAR_H = RAMP_BAR_H;
const HANDLE_AREA = RAMP_HANDLE_AREA;
const HANDLE_HALF = RAMP_HANDLE_HALF;
const WHEEL_STEP = RAMP_WHEEL_STEP;
const OPACITY_HANDLE_AREA = HANDLE_AREA + HANDLE_HALF + 4;
const OPACITY_HANDLE_HIT_PX = HANDLE_HALF + 10;
const RAMP_EDGE_PAD = HANDLE_HALF + 3;

const MODAL_BAR_H = BAR_H * 4; // 128px — モーダル用の高いキャンバス
const DEFAULT_OPACITY_STOPS: OpacityStop[] = [
  { position: 0, opacity: 1 },
  { position: 1, opacity: 1 },
];
const RAMP_SUPERSAMPLE_OFFSETS = [-0.25, 0.25] as const;

type RampDiceSnapshot = {
  stops: ColorStop[];
};

type RampHoverInfo = {
  scope: 'sidebar' | 'modal';
  kind: 'color' | 'opacity';
  index: number;
  position: number;
  x: number;
  y: number;
};

function isPrimaryPointerButton(e: React.PointerEvent): boolean {
  return e.pointerType === 'touch' || e.pointerType === 'pen' || e.button === 0;
}

function stopTouchPropagation(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType === 'touch') e.stopPropagation();
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('button, input, textarea, select, [role="button"], [data-no-window-drag]');
}

function formatStopPosition(position: number): string {
  return `${Math.round(Math.max(0, Math.min(1, position)) * 100)}%`;
}

const COLOR_MODE_OPTIONS: { value: RampColorMode; label: string }[] = [
  { value: 'rgb', label: 'RGB' },
  { value: 'linearrgb', label: 'Linear RGB' },
  { value: 'hsv', label: 'HSV' },
  { value: 'hsl', label: 'HSL' },
  { value: 'lab', label: 'LAB' },
  { value: 'lch', label: 'LCH' },
  { value: 'xyz', label: 'XYZ' },
  { value: 'oklab', label: 'OKLab' },
  { value: 'oklch', label: 'OKLCH' },
];

const RGB_INTERP_OPTIONS: { value: RampInterpolation; label: string }[] = [
  { value: 'ease', label: 'Ease' },
  { value: 'cardinal', label: 'Cardinal' },
  { value: 'linear', label: 'Linear' },
  { value: 'b-spline', label: 'B-Spline' },
  { value: 'constant', label: 'Constant' },
  { value: 'variable', label: 'Variable' },
];

const HUE_INTERP_OPTIONS: { value: RampInterpolation; label: string }[] = [
  { value: 'near', label: 'Near' },
  { value: 'far', label: 'Far' },
  { value: 'clockwise', label: 'Clockwise' },
  { value: 'counterclockwise', label: 'Counter-Clockwise' },
];

function defaultInterpolationForColorMode(colorMode: RampColorMode): RampInterpolation {
  return colorMode === 'hsv' || colorMode === 'hsl' || colorMode === 'lch' || colorMode === 'oklch'
    ? 'near'
    : 'ease';
}

function RampOptionPreview({
  stops,
  opacityStops,
  colorMode,
  interpolation,
  variable,
}: {
  stops: ColorStop[];
  opacityStops?: OpacityStop[];
  colorMode: RampColorMode;
  interpolation: RampInterpolation;
  variable: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="block h-full w-full"
      style={buildGradientPreviewStyle(stops, opacityStops, colorMode, interpolation, variable)}
    />
  );
}

// ===== 共通描画関数 =====
function drawRamp(
  canvas: HTMLCanvasElement,
  bH: number,
  stops: ColorStop[],
  opacityStops: OpacityStop[] | undefined,
  selectedIdxs: Set<number>,
  selectedOpacityIdxs: Set<number>,
  interpolation: RampInterpolation,
  colorMode: RampColorMode,
  variable = 0,
  mirror = false,
) {
  const cH = bH + HANDLE_AREA + OPACITY_HANDLE_AREA;
  const dpr = window.devicePixelRatio || 1;
  const drawW = canvas.clientWidth || RAMP_W;
  const rampX = RAMP_EDGE_PAD;
  const rampW = Math.max(1, drawW - RAMP_EDGE_PAD * 2);
  const posToX = (pos: number) => rampX + pos * rampW;

  canvas.width = Math.round(drawW * dpr);
  canvas.height = Math.round(cH * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, drawW, cH);

  const barY = OPACITY_HANDLE_AREA;
  const colorHandleY = barY + bH;
  const colorHandleMid = colorHandleY + HANDLE_AREA / 2 + 2;
  const alphaStops = opacityStops ?? DEFAULT_OPACITY_STOPS;
  const alphaTrackY = OPACITY_HANDLE_AREA - 10;

  const grad = ctx.createLinearGradient(rampX, alphaTrackY, rampX + rampW, alphaTrackY);
  alphaStops
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach(stop => {
      grad.addColorStop(stop.position, `rgba(255,255,255,${Math.max(0, Math.min(1, stop.opacity))})`);
    });
  drawChecker(ctx, rampX, alphaTrackY, rampW, 8, 6);
  ctx.fillStyle = grad;
  ctx.fillRect(rampX, alphaTrackY, rampW, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rampX + 0.5, alphaTrackY + 0.5, rampW - 1, 7);

  alphaStops.forEach((stop, i) => {
    const x = posToX(stop.position);
    const tipY = alphaTrackY;
    const baseY = alphaTrackY - HANDLE_HALF * 1.8;
    const isSelected = selectedOpacityIdxs.has(i);
    const g = Math.round(255 * Math.max(0, Math.min(1, stop.opacity)));
    ctx.beginPath();
    ctx.moveTo(x, tipY);
    ctx.lineTo(x - HANDLE_HALF, baseY);
    ctx.lineTo(x + HANDLE_HALF, baseY);
    ctx.closePath();
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#d11402' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
    if (isSelected) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, tipY + 2);
      ctx.lineTo(x - HANDLE_HALF - 2, baseY - 2);
      ctx.lineTo(x + HANDLE_HALF + 2, baseY - 2);
      ctx.closePath();
      ctx.stroke();
    }
  });

  drawChecker(ctx, rampX, barY, rampW, bH, 8);

  if (stops.length > 0) {
    const rampPixelW = Math.max(1, Math.round(rampW * dpr));
    const rampPixelH = Math.max(1, Math.round(bH * dpr));
    const rampBuffer = document.createElement('canvas');
    rampBuffer.width = rampPixelW;
    rampBuffer.height = rampPixelH;
    const rampCtx = rampBuffer.getContext('2d')!;
    const imageData = rampCtx.createImageData(rampPixelW, rampPixelH);

    for (let x = 0; x < rampPixelW; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      RAMP_SUPERSAMPLE_OFFSETS.forEach(offset => {
        const rawT = Math.max(0, Math.min(1, (x + 0.5 + offset) / rampPixelW));
        const t = mirror ? applyMirrorT(rawT) : rawT;
        const color = getColorAtPosition(stops, t, interpolation, colorMode, variable);
        const alpha = getOpacityAtPosition(opacityStops, t);
        rSum += parseInt(color.slice(1, 3), 16);
        gSum += parseInt(color.slice(3, 5), 16);
        bSum += parseInt(color.slice(5, 7), 16);
        aSum += Math.max(0, Math.min(1, alpha)) * 255;
      });

      const r = Math.round(rSum / RAMP_SUPERSAMPLE_OFFSETS.length);
      const g = Math.round(gSum / RAMP_SUPERSAMPLE_OFFSETS.length);
      const b = Math.round(bSum / RAMP_SUPERSAMPLE_OFFSETS.length);
      const a = Math.round(aSum / RAMP_SUPERSAMPLE_OFFSETS.length);

      for (let y = 0; y < rampPixelH; y++) {
        const idx = (y * rampPixelW + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = a;
      }
    }

    rampCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rampBuffer, rampX, barY, rampW, bH);
  }

  ctx.fillStyle = '#333';
  ctx.fillRect(rampX, colorHandleY, rampW, 2);

  stops.forEach((stop, i) => {
    const x = posToX(stop.position);
    const isSelected = selectedIdxs.has(i);
    ctx.beginPath();
    ctx.moveTo(x, colorHandleY + 2);
    ctx.lineTo(x - HANDLE_HALF, colorHandleMid + HANDLE_HALF);
    ctx.lineTo(x + HANDLE_HALF, colorHandleMid + HANDLE_HALF);
    ctx.closePath();
    ctx.fillStyle = stop.color;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
  });

  // Mirror モード時：右半分を暗くして操作不可であることを表示
  if (mirror) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(rampX + rampW / 2, 0, rampW / 2, cH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Mirror', rampX + rampW * 0.75, cH / 2);
  }
}

function drawChecker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, size: number) {
  for (let yy = y; yy < y + h; yy += size) {
    for (let xx = x; xx < x + w; xx += size) {
      const odd = (Math.floor((xx - x) / size) + Math.floor((yy - y) / size)) % 2 === 0;
      ctx.fillStyle = odd ? '#3a3a3a' : '#555';
      ctx.fillRect(xx, yy, Math.min(size, x + w - xx), Math.min(size, y + h - yy));
    }
  }
}

function cloneColorStops(stops: ColorStop[]): ColorStop[] {
  return stops.map(stop => ({ ...stop }));
}

function normalizeToMirrorStopPositions<T extends { position: number }>(stops: T[]): T[] {
  return stops.map(stop => ({
    ...stop,
    position: Math.max(0, Math.min(0.5, stop.position * 0.5)),
  }));
}

function normalizeFromMirrorStopPositions<T extends { position: number }>(stops: T[]): T[] {
  return stops.map(stop => ({
    ...stop,
    position: Math.max(0, Math.min(1, stop.position * 2)),
  }));
}

function randomizeStopPositions<T extends { position: number }>(stops: T[], maxPosition: number): T[] {
  return stops.map(stop => ({
    ...stop,
    position: Number((Math.random() * maxPosition).toFixed(4)),
  }));
}

function diceStopPositions<T extends { position: number }>(stops: T[], maxPosition: number): T[] {
  if (stops.length === 0) return [];

  const sorted = stops
    .map((stop, index) => ({ stop, index }))
    .sort((a, b) => a.stop.position - b.stop.position);
  const positions = Array.from({ length: sorted.length }, () => Number((Math.random() * maxPosition).toFixed(4)))
    .sort((a, b) => a - b);
  const next = stops.map(stop => ({ ...stop }));

  sorted.forEach(({ index }, order) => {
    next[index] = { ...next[index], position: positions[order] };
  });

  return next;
}

function AnimatedOpacityControls({ visible, children }: { visible: boolean; children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    const el = wrapperRef.current;
    if (visible) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        if (!wrapperRef.current) return;
        gsap.killTweensOf(wrapperRef.current);
        gsap.fromTo(
          wrapperRef.current,
          { height: 0, autoAlpha: 0, y: -4, marginBottom: 0 },
          { height: 'auto', autoAlpha: 1, y: 0, marginBottom: 0, duration: 0.22, ease: 'power2.out' }
        );
      });
      return;
    }

    if (!el) return;
    gsap.killTweensOf(el);
    gsap.to(el, {
      height: 0,
      autoAlpha: 0,
      y: -4,
      marginBottom: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => setShouldRender(false),
    });
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div ref={wrapperRef} className="overflow-hidden">
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

type GradientRampProps = {
  overlayImageElement?: HTMLImageElement | null;
  showHeader?: boolean;
};

export function GradientRamp({ overlayImageElement = null, showHeader = true }: GradientRampProps = {}) {
  const { t, language } = useLanguage();
  const { gradient, setGradient, resetMeshGradient, isSlitAdjusting, selectedStops, setSelectedStops, keyframeTracks, setKeyframeTracks, addKeyframe, setKeyframe, currentTime } = useGradientStore();
  const selectedIdxs = new Set(selectedStops);
  const [selectedOpacityStops, setSelectedOpacityStops] = useState<number[]>([]);
  const selectedOpacityIdxs = new Set(selectedOpacityStops);
  const [isOpacityControlsDismissed, setIsOpacityControlsDismissed] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showPaletteGenerator, setShowPaletteGenerator] = useState(false);
  const [showRampOptionPreviews, setShowRampOptionPreviews] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paletteName, setPaletteName] = useState('');
  const [userPalettes, setUserPalettes] = useState<UserColorPalette[]>(() => loadUserColorPalettes());
  const [diceSnapshot, setDiceSnapshot] = useState<RampDiceSnapshot | null>(null);
  const [rampHover, setRampHover] = useState<RampHoverInfo | null>(null);
  const rampShuffleRandomRef = useRef(false);

  // 内部的な更新用ヘルパー
  const updateSelectedStops = (newSet: Set<number>) => {
    setSelectedStops(Array.from(newSet));
  };
  const updateSelectedOpacityStops = (newSet: Set<number>) => {
    setSelectedOpacityStops(Array.from(newSet));
  };

  const clearRampSelection = () => {
    const empty = new Set<number>();
    updateSelectedStops(empty);
    selectedIdxsRef.current = empty;
    updateSelectedOpacityStops(empty);
    selectedOpacityIdxsRef.current = empty;
  };

  const applyColorPalette = (stops: ColorStop[]) => {
    setGradient({
      stops: gradient.rampMirror ? normalizeToMirrorStopPositions(stops) : stops,
      opacityStops: gradient.rampMirror ? normalizeToMirrorStopPositions(DEFAULT_OPACITY_STOPS) : DEFAULT_OPACITY_STOPS,
    });
    setDiceSnapshot(null);
    clearRampSelection();
  };

  const resetDiceRampPositions = () => {
    if (!diceSnapshot) return;
    setGradient({
      stops: cloneColorStops(diceSnapshot.stops),
    });
    setDiceSnapshot(null);
    clearRampSelection();
  };

  const handleSavePalette = () => {
    const trimmed = paletteName.trim();
    if (!trimmed) return;
    saveUserColorPalette(trimmed, gradient.stops);
    setUserPalettes(loadUserColorPalettes());
    setPaletteName('');
  };

  const handleDeletePalette = (id: string) => {
    deleteUserColorPalette(id);
    setUserPalettes(loadUserColorPalettes());
  };

  useEffect(() => {
    const refreshPalettes = () => setUserPalettes(loadUserColorPalettes());
    window.addEventListener('kagaribi15_color_palettes_changed', refreshPalettes);
    return () => window.removeEventListener('kagaribi15_color_palettes_changed', refreshPalettes);
  }, []);

  const [floatPos, setFloatPos] = useState(() => ({
    x: Math.max(20, Math.round((window.innerWidth - 700) / 2)),
    y: Math.max(20, Math.round((window.innerHeight - 520) / 2)),
  }));
  const [floatSize, setFloatSize] = useState({ w: 700, h: 520 });
  const pickerWrapperRef = useRef<HTMLDivElement>(null);

  // フローティングウィンドウ ドラッグ用
  const titleDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (!isPrimaryPointerButton(e)) return;
    if (isInteractiveTarget(e.target)) return;
    titleDragRef.current = { sx: e.clientX, sy: e.clientY, ox: floatPos.x, oy: floatPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onTitlePointerMove = (e: React.PointerEvent) => {
    if (!titleDragRef.current) return;
    setFloatPos({
      x: titleDragRef.current.ox + (e.clientX - titleDragRef.current.sx),
      y: titleDragRef.current.oy + (e.clientY - titleDragRef.current.sy),
    });
  };
  const onTitlePointerUp = () => { titleDragRef.current = null; };

  // フローティングウィンドウ リサイズ用
  const resizeDragRef = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);
  const onResizePointerDown = (e: React.PointerEvent) => {
    if (!isPrimaryPointerButton(e)) return;
    e.stopPropagation();
    resizeDragRef.current = { sx: e.clientX, sy: e.clientY, ow: floatSize.w, oh: floatSize.h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeDragRef.current) return;
    setFloatSize({
      w: Math.max(420, resizeDragRef.current.ow + (e.clientX - resizeDragRef.current.sx)),
      h: Math.max(320, resizeDragRef.current.oh + (e.clientY - resizeDragRef.current.sy)),
    });
  };
  const onResizePointerUp = () => { resizeDragRef.current = null; };

  const normalizedRamp = normalizeRampSettings(gradient.rampColorMode ?? gradient.rampInterpolation, gradient.rampInterpolation);
  const colorMode = normalizedRamp.colorMode;
  const interpolation = normalizedRamp.interpolation;
  const rampVariable = Math.max(-1, Math.min(1, gradient.rampVariable ?? 0));
  const rampRepeat = Math.max(1, Math.min(20, Math.round(gradient.rampRepeat ?? 1)));
  const usesHueInterpolation = colorMode === 'hsv' || colorMode === 'hsl' || colorMode === 'lch' || colorMode === 'oklch';
  const interpolationOptions = usesHueInterpolation ? HUE_INTERP_OPTIONS : RGB_INTERP_OPTIONS;
  const renderColorModePreview = (option: { value: string }) => (
    <RampOptionPreview
      stops={gradient.stops}
      opacityStops={gradient.opacityStops}
      colorMode={option.value as RampColorMode}
      interpolation={defaultInterpolationForColorMode(option.value as RampColorMode)}
      variable={rampVariable}
    />
  );
  const renderInterpolationPreview = (option: { value: string }) => (
    <RampOptionPreview
      stops={gradient.stops}
      opacityStops={gradient.opacityStops}
      colorMode={colorMode}
      interpolation={option.value as RampInterpolation}
      variable={rampVariable}
    />
  );

  // 最新 state を ref で保持（ホイール/ドラッグハンドラ内から参照）
  const selectedIdxsRef = useRef(selectedIdxs);
  const selectedOpacityIdxsRef = useRef(selectedOpacityIdxs);
  const stopsRef = useRef(gradient.stops);
  const opacityStopsRef = useRef(gradient.opacityStops ?? DEFAULT_OPACITY_STOPS);
  const setGradientRef = useRef(setGradient);
  const mirrorRef = useRef(gradient.rampMirror ?? false);
  useEffect(() => { selectedIdxsRef.current = selectedIdxs; });
  useEffect(() => { selectedOpacityIdxsRef.current = selectedOpacityIdxs; });
  useEffect(() => { stopsRef.current = gradient.stops; });
  useEffect(() => { opacityStopsRef.current = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS; });
  useEffect(() => { setGradientRef.current = setGradient; });
  useEffect(() => { mirrorRef.current = gradient.rampMirror ?? false; });

  // ドラッグ状態（サイドバー・モーダル共用）
  const draggingRef = useRef<number | null>(null);
  const opacityDraggingRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const didPointerDownOnHandleRef = useRef(false);
  const dragStartPosRef = useRef(0);
  const dragStartStopsRef = useRef<ColorStop[]>([]);
  const dragStartOpacityStopsRef = useRef<OpacityStop[]>([]);
  const pendingShiftSelectionToggleRef = useRef<number | null>(null);

  // ===== ピッカーアニメーション =====
  useEffect(() => {
    if (selectedStops.length > 0) setIsPickerOpen(true);
  }, [selectedStops]);

  useEffect(() => {
    if (selectedOpacityStops.length > 0) setIsOpacityControlsDismissed(false);
  }, [selectedOpacityStops]);

  useEffect(() => {
    if (!pickerWrapperRef.current) return;
    if (isPickerOpen && selectedIdxs.size > 0) {
      gsap.to(pickerWrapperRef.current, {
        height: 'auto', opacity: 1, marginBottom: 12,
        duration: 0.4, ease: 'power3.out', display: 'block'
      });
    } else {
      gsap.to(pickerWrapperRef.current, {
        height: 0, opacity: 0, marginBottom: 0,
        duration: 0.3, ease: 'power3.in',
        onComplete: () => { if (pickerWrapperRef.current) pickerWrapperRef.current.style.display = 'none'; }
      });
    }
  }, [isPickerOpen, selectedIdxs.size]);

  // ===== サイドバーキャンバス =====
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);

  const doDrawRef = useRef<() => void>(() => {});
  doDrawRef.current = () => {
    if (canvasRef.current) drawRamp(canvasRef.current, BAR_H, gradient.stops, gradient.opacityStops, selectedIdxs, selectedOpacityIdxs, interpolation, colorMode, rampVariable, gradient.rampMirror ?? false);
  };

  const canvasCallbackRef = (el: HTMLCanvasElement | null) => {
    if (canvasRef.current) {
      if (wheelHandlerRef.current) canvasRef.current.removeEventListener('wheel', wheelHandlerRef.current);
      if (roRef.current) roRef.current.disconnect();
    }
    (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    if (!el) return;
    wheelHandlerRef.current = (e: WheelEvent) => {
      const alphaIdxs = selectedOpacityIdxsRef.current;
      if (alphaIdxs.size > 0) {
        e.preventDefault();
        const step = e.shiftKey ? WHEEL_STEP * 10 : WHEEL_STEP;
        const delta = e.deltaY < 0 ? step : -step;
        const maxPos = mirrorRef.current ? 0.5 : 1;
        setGradientRef.current({
          opacityStops: opacityStopsRef.current.map((s, i): OpacityStop =>
            alphaIdxs.has(i) ? { ...s, position: Number(Math.max(0, Math.min(maxPos, s.position + delta)).toFixed(4)) } : s
          ),
        });
        return;
      }
      const idxs = selectedIdxsRef.current;
      if (idxs.size === 0) return;
      e.preventDefault();
      const step = e.shiftKey ? WHEEL_STEP * 10 : WHEEL_STEP;
      const delta = e.deltaY < 0 ? step : -step;
      const maxPos = mirrorRef.current ? 0.5 : 1;
      setGradientRef.current({
        stops: stopsRef.current.map((s, i): ColorStop =>
          idxs.has(i) ? { ...s, position: Number(Math.max(0, Math.min(maxPos, s.position + delta)).toFixed(4)) } : s
        ),
      });
    };
    el.addEventListener('wheel', wheelHandlerRef.current, { passive: false });
    roRef.current = new ResizeObserver(() => doDrawRef.current());
    roRef.current.observe(el);
  };

  useEffect(() => { doDrawRef.current(); }, [gradient.stops, gradient.opacityStops, selectedIdxs, selectedOpacityIdxs, interpolation, colorMode, rampVariable, gradient.rampMirror]);

  function sidebarPos(e: { clientX: number }): number {
    const rect = canvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    return Math.max(0, Math.min(1, (e.clientX - rect.left - RAMP_EDGE_PAD) / rampW));
  }
  function sidebarFindHandle(pos: number): number | null {
    const rect = canvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    const threshold = (HANDLE_HALF + 4) / rampW;
    for (let i = 0; i < gradient.stops.length; i++) {
      if (Math.abs(gradient.stops[i].position - pos) < threshold) return i;
    }
    return null;
  }
  function sidebarFindOpacityHandle(pos: number): number | null {
    const rect = canvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    const threshold = OPACITY_HANDLE_HIT_PX / rampW;
    const alphaStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
    let nearest: number | null = null;
    let nearestDist = Infinity;
    for (let i = 0; i < alphaStops.length; i++) {
      const dist = Math.abs(alphaStops[i].position - pos);
      if (dist <= threshold && dist < nearestDist) {
        nearest = i;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  function updateSidebarHover(e: React.PointerEvent) {
    if (draggingRef.current !== null || opacityDraggingRef.current !== null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    const pos = sidebarPos(e);
    const localY = e.clientY - rect.top;
    if (localY < OPACITY_HANDLE_AREA) {
      const hit = sidebarFindOpacityHandle(pos);
      const stop = hit !== null ? (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS)[hit] : null;
      setRampHover(stop ? {
        scope: 'sidebar',
        kind: 'opacity',
        index: hit!,
        position: stop.position,
        x: RAMP_EDGE_PAD + stop.position * rampW,
        y: Math.max(0, OPACITY_HANDLE_AREA - HANDLE_HALF * 2 - 6),
      } : null);
      return;
    }

    if (localY >= OPACITY_HANDLE_AREA && localY <= OPACITY_HANDLE_AREA + BAR_H + HANDLE_AREA) {
      const hit = sidebarFindHandle(pos);
      const stop = hit !== null ? gradient.stops[hit] : null;
      setRampHover(stop ? {
        scope: 'sidebar',
        kind: 'color',
        index: hit!,
        position: stop.position,
        x: RAMP_EDGE_PAD + stop.position * rampW,
        y: OPACITY_HANDLE_AREA + BAR_H + HANDLE_AREA + 8,
      } : null);
      return;
    }

    setRampHover(null);
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPrimaryPointerButton(e)) return;
    if (e.pointerType === 'touch') {
      e.stopPropagation();
    }
    didDragRef.current = false;
    didPointerDownOnHandleRef.current = false;
    pendingShiftSelectionToggleRef.current = null;
    const pos = sidebarPos(e);
    const rect = canvasRef.current!.getBoundingClientRect();
    const localY = e.clientY - rect.top;
    if (localY < OPACITY_HANDLE_AREA) {
      const hit = sidebarFindOpacityHandle(pos);
      if (hit !== null) {
        didPointerDownOnHandleRef.current = true;
        let newSel: Set<number>;
        if (e.shiftKey) {
          newSel = new Set(selectedOpacityIdxs);
          if (newSel.has(hit)) newSel.delete(hit); else newSel.add(hit);
        } else if (selectedOpacityIdxs.has(hit)) {
          newSel = selectedOpacityIdxs;
        } else {
          newSel = new Set([hit]);
        }
        updateSelectedOpacityStops(newSel);
        selectedOpacityIdxsRef.current = newSel;
        updateSelectedStops(new Set());
        selectedIdxsRef.current = new Set();
        opacityDraggingRef.current = hit;
        dragStartPosRef.current = pos;
        dragStartOpacityStopsRef.current = (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS).map(s => ({ ...s }));
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (!e.shiftKey) {
        const empty = new Set<number>();
        updateSelectedOpacityStops(empty);
        selectedOpacityIdxsRef.current = empty;
      }
      return;
    }
    const hit = sidebarFindHandle(pos);
    if (hit !== null) {
      didPointerDownOnHandleRef.current = true;
      let newSel: Set<number>;
      if (e.shiftKey) {
        newSel = new Set(selectedIdxs);
        if (newSel.has(hit)) {
          pendingShiftSelectionToggleRef.current = hit;
        } else {
          newSel.add(hit);
        }
      } else if (selectedIdxs.has(hit)) {
        newSel = selectedIdxs;
      } else {
        newSel = new Set([hit]);
      }
      updateSelectedStops(newSel);
      selectedIdxsRef.current = newSel;
      updateSelectedOpacityStops(new Set());
      selectedOpacityIdxsRef.current = new Set();
      draggingRef.current = hit;
      dragStartPosRef.current = pos;
      dragStartStopsRef.current = gradient.stops.map(s => ({ ...s }));
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (!e.shiftKey) {
      const empty = new Set<number>();
      updateSelectedStops(empty);
      selectedIdxsRef.current = empty;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    updateSidebarHover(e);
    if (e.pointerType === 'touch' && (opacityDraggingRef.current !== null || draggingRef.current !== null)) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (opacityDraggingRef.current !== null) {
      didDragRef.current = true;
      const pos = sidebarPos(e);
      const delta = pos - dragStartPosRef.current;
      const idxs = selectedOpacityIdxsRef.current;
      const maxPos = gradient.rampMirror ? 0.5 : 1;
      const activeIdx = opacityDraggingRef.current;
      const activePosition = Math.max(0, Math.min(maxPos, dragStartOpacityStopsRef.current[activeIdx].position + delta));
      const rect = canvasRef.current!.getBoundingClientRect();
      const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
      setRampHover({
        scope: 'sidebar',
        kind: 'opacity',
        index: activeIdx,
        position: activePosition,
        x: RAMP_EDGE_PAD + activePosition * rampW,
        y: Math.max(0, OPACITY_HANDLE_AREA - HANDLE_HALF * 2 - 6),
      });
      setGradient({
        opacityStops: (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS).map((s, i): OpacityStop =>
          idxs.has(i) ? { ...s, position: Math.max(0, Math.min(maxPos, dragStartOpacityStopsRef.current[i].position + delta)) } : s
        )
      });
      return;
    }
    if (draggingRef.current === null) return;
    didDragRef.current = true;
    const pos = sidebarPos(e);
    const delta = pos - dragStartPosRef.current;
    const idxs = selectedIdxsRef.current;
    const maxPos = gradient.rampMirror ? 0.5 : 1;
    const activeIdx = draggingRef.current;
    if (didDragRef.current) pendingShiftSelectionToggleRef.current = null;
    const nextStops = e.shiftKey
      ? moveStopsProportionally(dragStartStopsRef.current, idxs, activeIdx, delta, maxPos)
      : gradient.stops.map((s, i): ColorStop =>
        idxs.has(i) ? { ...s, position: Math.max(0, Math.min(maxPos, dragStartStopsRef.current[i].position + delta)) } : s
      );
    const activePosition = nextStops[activeIdx].position;
    const rect = canvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    setRampHover({
      scope: 'sidebar',
      kind: 'color',
      index: activeIdx,
      position: activePosition,
      x: RAMP_EDGE_PAD + activePosition * rampW,
      y: OPACITY_HANDLE_AREA + BAR_H + HANDLE_AREA + 8,
    });
    setGradient({ stops: nextStops });
  };

  function addSidebarStopAt(e: { clientX: number; clientY: number; detail?: number }) {
    if ((e.detail ?? 1) >= 2) return;
    const pos = sidebarPos(e);
    const rect = canvasRef.current!.getBoundingClientRect();
    const localY = e.clientY - rect.top;

    if (localY < OPACITY_HANDLE_AREA) {
      const isMirror = gradient.rampMirror ?? false;
      const clampedPos = isMirror ? Math.min(0.5, pos) : pos;
      const alphaT = isMirror ? applyMirrorT(pos) : pos;
      const currentOpacityStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
      const newStops = [...currentOpacityStops, { position: clampedPos, opacity: getOpacityAtPosition(currentOpacityStops, alphaT) }];
      const newSel = new Set([newStops.length - 1]);
      setGradient({ opacityStops: newStops });
      updateSelectedOpacityStops(newSel);
      selectedOpacityIdxsRef.current = newSel;
      updateSelectedStops(new Set());
      selectedIdxsRef.current = new Set();
      return;
    }

    if (localY >= OPACITY_HANDLE_AREA && localY <= OPACITY_HANDLE_AREA + BAR_H) {
      const isMirror = gradient.rampMirror ?? false;
      const clampedPos = isMirror ? Math.min(0.5, pos) : pos;
      const colorT = isMirror ? applyMirrorT(pos) : pos;
      const newStops = [...gradient.stops, { position: clampedPos, color: getColorAtPosition(gradient.stops, colorT, interpolation, colorMode, rampVariable) }];
      const newSel = new Set([newStops.length - 1]);
      setGradient({ stops: newStops });
      updateSelectedStops(newSel);
      selectedIdxsRef.current = newSel;
      updateSelectedOpacityStops(new Set());
      selectedOpacityIdxsRef.current = new Set();
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      e.stopPropagation();
    }
    const shouldAddStop = e.pointerType === 'touch' && !didDragRef.current && !didPointerDownOnHandleRef.current;
    if (!didDragRef.current && pendingShiftSelectionToggleRef.current !== null) {
      const newSel = new Set(selectedIdxsRef.current);
      newSel.delete(pendingShiftSelectionToggleRef.current);
      updateSelectedStops(newSel);
      selectedIdxsRef.current = newSel;
    }
    pendingShiftSelectionToggleRef.current = null;
    if (draggingRef.current !== null) e.currentTarget?.releasePointerCapture?.(e.pointerId);
    if (opacityDraggingRef.current !== null) e.currentTarget?.releasePointerCapture?.(e.pointerId);
    draggingRef.current = null;
    opacityDraggingRef.current = null;
    if (shouldAddStop) {
      e.preventDefault();
      addSidebarStopAt(e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (didDragRef.current) return;
    if (didPointerDownOnHandleRef.current) {
      didPointerDownOnHandleRef.current = false;
      return;
    }
    // 削除ロジックを削除（ボタンからのみ削除可能にする）
    addSidebarStopAt(e);
  };

  const clearRampHover = () => setRampHover(null);

  // ===== モーダルキャンバス =====
  const mCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mRoRef = useRef<ResizeObserver | null>(null);
  const mWheelRef = useRef<((e: WheelEvent) => void) | null>(null);

  const doDrawModalRef = useRef<() => void>(() => {});
  doDrawModalRef.current = () => {
    if (mCanvasRef.current) drawRamp(mCanvasRef.current, MODAL_BAR_H, gradient.stops, gradient.opacityStops, selectedIdxs, selectedOpacityIdxs, interpolation, colorMode, rampVariable, gradient.rampMirror ?? false);
  };

  const mCanvasCallbackRef = (el: HTMLCanvasElement | null) => {
    if (mCanvasRef.current) {
      if (mWheelRef.current) mCanvasRef.current.removeEventListener('wheel', mWheelRef.current);
      if (mRoRef.current) mRoRef.current.disconnect();
    }
    mCanvasRef.current = el;
    if (!el) return;
    mWheelRef.current = (e: WheelEvent) => {
      const alphaIdxs = selectedOpacityIdxsRef.current;
      if (alphaIdxs.size > 0) {
        e.preventDefault();
        const step = e.shiftKey ? WHEEL_STEP * 10 : WHEEL_STEP;
        const delta = e.deltaY < 0 ? step : -step;
        const maxPos = mirrorRef.current ? 0.5 : 1;
        setGradientRef.current({
          opacityStops: opacityStopsRef.current.map((s, i): OpacityStop =>
            alphaIdxs.has(i) ? { ...s, position: Number(Math.max(0, Math.min(maxPos, s.position + delta)).toFixed(4)) } : s
          ),
        });
        return;
      }
      const idxs = selectedIdxsRef.current;
      if (idxs.size === 0) return;
      e.preventDefault();
      const step = e.shiftKey ? WHEEL_STEP * 10 : WHEEL_STEP;
      const delta = e.deltaY < 0 ? step : -step;
      const maxPos = mirrorRef.current ? 0.5 : 1;
      setGradientRef.current({
        stops: stopsRef.current.map((s, i): ColorStop =>
          idxs.has(i) ? { ...s, position: Number(Math.max(0, Math.min(maxPos, s.position + delta)).toFixed(4)) } : s
        ),
      });
    };
    el.addEventListener('wheel', mWheelRef.current, { passive: false });
    mRoRef.current = new ResizeObserver(() => doDrawModalRef.current());
    mRoRef.current.observe(el);
  };

  useEffect(() => { doDrawModalRef.current(); }, [gradient.stops, gradient.opacityStops, selectedIdxs, selectedOpacityIdxs, interpolation, colorMode, rampVariable, isModalOpen, gradient.rampMirror]);

  function modalPos(e: { clientX: number }): number {
    const rect = mCanvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    return Math.max(0, Math.min(1, (e.clientX - rect.left - RAMP_EDGE_PAD) / rampW));
  }
  function modalFindHandle(pos: number): number | null {
    const rect = mCanvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    const threshold = (HANDLE_HALF + 4) / rampW;
    for (let i = 0; i < gradient.stops.length; i++) {
      if (Math.abs(gradient.stops[i].position - pos) < threshold) return i;
    }
    return null;
  }
  function modalFindOpacityHandle(pos: number): number | null {
    const rect = mCanvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    const threshold = OPACITY_HANDLE_HIT_PX / rampW;
    const alphaStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
    let nearest: number | null = null;
    let nearestDist = Infinity;
    for (let i = 0; i < alphaStops.length; i++) {
      const dist = Math.abs(alphaStops[i].position - pos);
      if (dist <= threshold && dist < nearestDist) {
        nearest = i;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  function updateModalHover(e: React.PointerEvent) {
    if (draggingRef.current !== null || opacityDraggingRef.current !== null || !mCanvasRef.current) return;
    const rect = mCanvasRef.current.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    const pos = modalPos(e);
    const localY = e.clientY - rect.top;
    if (localY < OPACITY_HANDLE_AREA) {
      const hit = modalFindOpacityHandle(pos);
      const stop = hit !== null ? (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS)[hit] : null;
      setRampHover(stop ? {
        scope: 'modal',
        kind: 'opacity',
        index: hit!,
        position: stop.position,
        x: RAMP_EDGE_PAD + stop.position * rampW,
        y: Math.max(0, OPACITY_HANDLE_AREA - HANDLE_HALF * 2 - 6),
      } : null);
      return;
    }

    if (localY >= OPACITY_HANDLE_AREA && localY <= OPACITY_HANDLE_AREA + MODAL_BAR_H + HANDLE_AREA) {
      const hit = modalFindHandle(pos);
      const stop = hit !== null ? gradient.stops[hit] : null;
      setRampHover(stop ? {
        scope: 'modal',
        kind: 'color',
        index: hit!,
        position: stop.position,
        x: RAMP_EDGE_PAD + stop.position * rampW,
        y: OPACITY_HANDLE_AREA + MODAL_BAR_H + HANDLE_AREA + 8,
      } : null);
      return;
    }

    setRampHover(null);
  }

  const mHandlePointerDown = (e: React.PointerEvent) => {
    if (!isPrimaryPointerButton(e)) return;
    if (e.pointerType === 'touch') {
      e.stopPropagation();
    }
    didDragRef.current = false;
    didPointerDownOnHandleRef.current = false;
    pendingShiftSelectionToggleRef.current = null;
    const pos = modalPos(e);
    const rect = mCanvasRef.current!.getBoundingClientRect();
    const localY = e.clientY - rect.top;
    if (localY < OPACITY_HANDLE_AREA) {
      const hit = modalFindOpacityHandle(pos);
      if (hit !== null) {
        didPointerDownOnHandleRef.current = true;
        let newSel: Set<number>;
        if (e.shiftKey) {
          newSel = new Set(selectedOpacityIdxs);
          if (newSel.has(hit)) newSel.delete(hit); else newSel.add(hit);
        } else if (selectedOpacityIdxs.has(hit)) {
          newSel = selectedOpacityIdxs;
        } else {
          newSel = new Set([hit]);
        }
        updateSelectedOpacityStops(newSel);
        selectedOpacityIdxsRef.current = newSel;
        updateSelectedStops(new Set());
        selectedIdxsRef.current = new Set();
        opacityDraggingRef.current = hit;
        dragStartPosRef.current = pos;
        dragStartOpacityStopsRef.current = (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS).map(s => ({ ...s }));
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (!e.shiftKey) {
        const empty = new Set<number>();
        updateSelectedOpacityStops(empty);
        selectedOpacityIdxsRef.current = empty;
      }
      return;
    }
    const hit = modalFindHandle(pos);
    if (hit !== null) {
      didPointerDownOnHandleRef.current = true;
      let newSel: Set<number>;
      if (e.shiftKey) {
        newSel = new Set(selectedIdxs);
        if (newSel.has(hit)) {
          pendingShiftSelectionToggleRef.current = hit;
        } else {
          newSel.add(hit);
        }
      } else if (selectedIdxs.has(hit)) {
        newSel = selectedIdxs;
      } else {
        newSel = new Set([hit]);
      }
      updateSelectedStops(newSel);
      selectedIdxsRef.current = newSel;
      updateSelectedOpacityStops(new Set());
      selectedOpacityIdxsRef.current = new Set();
      draggingRef.current = hit;
      dragStartPosRef.current = pos;
      dragStartStopsRef.current = gradient.stops.map(s => ({ ...s }));
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (!e.shiftKey) {
      const empty = new Set<number>();
      updateSelectedStops(empty);
      selectedIdxsRef.current = empty;
    }
  };

  const mHandlePointerMove = (e: React.PointerEvent) => {
    updateModalHover(e);
    if (e.pointerType === 'touch' && (opacityDraggingRef.current !== null || draggingRef.current !== null)) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (opacityDraggingRef.current !== null) {
      didDragRef.current = true;
      const pos = modalPos(e);
      const delta = pos - dragStartPosRef.current;
      const idxs = selectedOpacityIdxsRef.current;
      const maxPos = gradient.rampMirror ? 0.5 : 1;
      const activeIdx = opacityDraggingRef.current;
      const activePosition = Math.max(0, Math.min(maxPos, dragStartOpacityStopsRef.current[activeIdx].position + delta));
      const rect = mCanvasRef.current!.getBoundingClientRect();
      const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
      setRampHover({
        scope: 'modal',
        kind: 'opacity',
        index: activeIdx,
        position: activePosition,
        x: RAMP_EDGE_PAD + activePosition * rampW,
        y: Math.max(0, OPACITY_HANDLE_AREA - HANDLE_HALF * 2 - 6),
      });
      setGradient({
        opacityStops: (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS).map((s, i): OpacityStop =>
          idxs.has(i) ? { ...s, position: Math.max(0, Math.min(maxPos, dragStartOpacityStopsRef.current[i].position + delta)) } : s
        )
      });
      return;
    }
    if (draggingRef.current === null) return;
    didDragRef.current = true;
    const pos = modalPos(e);
    const delta = pos - dragStartPosRef.current;
    const idxs = selectedIdxsRef.current;
    const maxPos = gradient.rampMirror ? 0.5 : 1;
    const activeIdx = draggingRef.current;
    if (didDragRef.current) pendingShiftSelectionToggleRef.current = null;
    const nextStops = e.shiftKey
      ? moveStopsProportionally(dragStartStopsRef.current, idxs, activeIdx, delta, maxPos)
      : gradient.stops.map((s, i): ColorStop =>
        idxs.has(i) ? { ...s, position: Math.max(0, Math.min(maxPos, dragStartStopsRef.current[i].position + delta)) } : s
      );
    const activePosition = nextStops[activeIdx].position;
    const rect = mCanvasRef.current!.getBoundingClientRect();
    const rampW = Math.max(1, rect.width - RAMP_EDGE_PAD * 2);
    setRampHover({
      scope: 'modal',
      kind: 'color',
      index: activeIdx,
      position: activePosition,
      x: RAMP_EDGE_PAD + activePosition * rampW,
      y: OPACITY_HANDLE_AREA + MODAL_BAR_H + HANDLE_AREA + 8,
    });
    setGradient({ stops: nextStops });
  };

  function addModalStopAt(e: { clientX: number; clientY: number; detail?: number }) {
    if ((e.detail ?? 1) >= 2) return;
    const pos = modalPos(e);
    const rect = mCanvasRef.current!.getBoundingClientRect();
    const localY = e.clientY - rect.top;

    if (localY < OPACITY_HANDLE_AREA) {
      const isMirror = gradient.rampMirror ?? false;
      const clampedPos = isMirror ? Math.min(0.5, pos) : pos;
      const alphaT = isMirror ? applyMirrorT(pos) : pos;
      const currentOpacityStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
      const newStops = [...currentOpacityStops, { position: clampedPos, opacity: getOpacityAtPosition(currentOpacityStops, alphaT) }];
      const newSel = new Set([newStops.length - 1]);
      setGradient({ opacityStops: newStops });
      updateSelectedOpacityStops(newSel);
      selectedOpacityIdxsRef.current = newSel;
      updateSelectedStops(new Set());
      selectedIdxsRef.current = new Set();
      return;
    }

    if (localY >= OPACITY_HANDLE_AREA && localY <= OPACITY_HANDLE_AREA + MODAL_BAR_H) {
      const isMirror = gradient.rampMirror ?? false;
      const clampedPos = isMirror ? Math.min(0.5, pos) : pos;
      const colorT = isMirror ? applyMirrorT(pos) : pos;
      const newStops = [...gradient.stops, { position: clampedPos, color: getColorAtPosition(gradient.stops, colorT, interpolation, colorMode, rampVariable) }];
      const newSel = new Set([newStops.length - 1]);
      setGradient({ stops: newStops });
      updateSelectedStops(newSel);
      selectedIdxsRef.current = newSel;
      updateSelectedOpacityStops(new Set());
      selectedOpacityIdxsRef.current = new Set();
    }
  }

  const mHandlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      e.stopPropagation();
    }
    const shouldAddStop = e.pointerType === 'touch' && !didDragRef.current && !didPointerDownOnHandleRef.current;
    if (!didDragRef.current && pendingShiftSelectionToggleRef.current !== null) {
      const newSel = new Set(selectedIdxsRef.current);
      newSel.delete(pendingShiftSelectionToggleRef.current);
      updateSelectedStops(newSel);
      selectedIdxsRef.current = newSel;
    }
    pendingShiftSelectionToggleRef.current = null;
    if (draggingRef.current !== null) e.currentTarget?.releasePointerCapture?.(e.pointerId);
    if (opacityDraggingRef.current !== null) e.currentTarget?.releasePointerCapture?.(e.pointerId);
    draggingRef.current = null;
    opacityDraggingRef.current = null;
    if (shouldAddStop) {
      e.preventDefault();
      addModalStopAt(e);
    }
  };

  const mHandleClick = (e: React.MouseEvent) => {
    if (didDragRef.current) return;
    if (didPointerDownOnHandleRef.current) {
      didPointerDownOnHandleRef.current = false;
      return;
    }
    // 削除ロジックを削除（ボタンからのみ削除可能にする）
    addModalStopAt(e);
  };

  // ===== ストップ操作 =====
  function copySelectedStops() {
    if (selectedIdxs.size === 0) return;
    const newStops = [...gradient.stops];
    const newIdxs: number[] = [];
    const maxPos = gradient.rampMirror ? 0.5 : 1;
    [...selectedIdxs].sort((a, b) => a - b).forEach(i => {
      const stop = gradient.stops[i];
      // stopId をリセット → setGradient の自動付与で新しい ID が割り当てられる
      newStops.push({ ...stop, stopId: undefined, position: Math.min(maxPos, stop.position + 0.05) });
      newIdxs.push(newStops.length - 1);
    });
    const newSel = new Set(newIdxs);
    setGradient({ stops: newStops });
    updateSelectedStops(newSel);
    selectedIdxsRef.current = newSel;
  }

  function distributeEvenly() {
    const sorted = [...gradient.stops].sort((a, b) => a.position - b.position);
    if (sorted.length < 2) return;
    const maxPosition = gradient.rampMirror ? 0.5 : 1;
    setGradient({ stops: sorted.map((s, i) => ({ ...s, position: maxPosition * i / (sorted.length - 1) })) });
  }

  function reverseGradient() {
    const maxPosition = gradient.rampMirror ? 0.5 : 1;
    setGradient({
      stops: gradient.stops.map(s => ({ ...s, position: Math.max(0, Math.min(maxPosition, maxPosition - s.position)) })),
      opacityStops: (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS).map(s => ({ ...s, position: Math.max(0, Math.min(maxPosition, maxPosition - s.position)) })),
    });
  }

  function toggleRampMirror() {
    const nextMirror = !(gradient.rampMirror ?? false);
    if (nextMirror) {
      setGradient({
        rampMirror: true,
        stops: normalizeToMirrorStopPositions(gradient.stops),
        opacityStops: normalizeToMirrorStopPositions(gradient.opacityStops ?? DEFAULT_OPACITY_STOPS),
      });
    } else {
      setGradient({
        rampMirror: false,
        stops: normalizeFromMirrorStopPositions(gradient.stops),
        opacityStops: normalizeFromMirrorStopPositions(gradient.opacityStops ?? DEFAULT_OPACITY_STOPS),
      });
    }
    setDiceSnapshot(null);
  }

  const firstSelectedIdx = selectedIdxs.size > 0 ? [...selectedIdxs].sort((a, b) => a - b)[0] : null;
  const pickerColor = firstSelectedIdx !== null ? (gradient.stops[firstSelectedIdx]?.color ?? '#ffffff') : '#ffffff';
  const firstSelectedOpacityIdx = selectedOpacityIdxs.size > 0 ? [...selectedOpacityIdxs].sort((a, b) => a - b)[0] : null;
  const pickerOpacity = firstSelectedOpacityIdx !== null ? ((gradient.opacityStops ?? DEFAULT_OPACITY_STOPS)[firstSelectedOpacityIdx]?.opacity ?? 1) : 1;
  const selectedOpacityLabel = selectedOpacityIdxs.size === 0
    ? ''
    : [...selectedOpacityIdxs]
      .sort((a, b) => a - b)
      .map(i => {
        const stop = (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS)[i];
        const pos = stop ? `${Math.round(stop.position * 100)}%` : '--';
        return `A${i + 1} ${pos}`;
      })
      .join(' / ');

  const onColorChange = useCallback((newColor: string) => {
    const idxs = selectedIdxsRef.current;
    const currentStops = stopsRef.current;
    if (idxs.size === 0) return;

    // 実際に変更があるかチェック
    const hasChange = Array.from(idxs).some(i => {
      const stop = currentStops[i];
      return stop && stop.color.toUpperCase() !== newColor.toUpperCase();
    });
    if (!hasChange) return;

    setGradientRef.current({
      stops: currentStops.map((s, i): ColorStop => idxs.has(i) ? { ...s, color: newColor } : s)
    });
  }, []);

  const onOpacityChange = useCallback((nextOpacity: number) => {
    const idxs = selectedOpacityIdxsRef.current;
    const currentStops = opacityStopsRef.current;
    if (idxs.size === 0) return;
    const opacity = Math.max(0, Math.min(1, nextOpacity));
    setGradientRef.current({
      opacityStops: currentStops.map((s, i): OpacityStop => idxs.has(i) ? { ...s, opacity } : s)
    });
  }, []);

  function recordStopKeyframes() {
    if (selectedIdxs.size === 0) return;
    const nt = currentTime;
    [...selectedIdxs].forEach(idx => {
      const stop = gradient.stops[idx];
      if (!stop?.stopId) return;
      const sid = stop.stopId;
      const r = parseInt(stop.color.slice(1, 3), 16);
      const g = parseInt(stop.color.slice(3, 5), 16);
      const b = parseInt(stop.color.slice(5, 7), 16);
      const stopNum = idx + 1;
      const fields: Array<{ field: string; value: number; label: string }> = [
        { field: 'position', value: stop.position, label: `#${stopNum} Pos` },
        { field: 'r', value: r, label: `#${stopNum} R` },
        { field: 'g', value: g, label: `#${stopNum} G` },
        { field: 'b', value: b, label: `#${stopNum} B` },
      ];
      fields.forEach(({ field, value, label }) => {
        const trackId = `gradientStop.${sid}.${field}`;
        const existing = keyframeTracks[trackId];
        if (existing) {
          const nearKf = existing.keyframes.find(k => Math.abs(k.time - nt) < 1e-4);
          if (nearKf) setKeyframe(trackId, { id: nearKf.id, value });
          else addKeyframe(trackId, { time: nt, value, interpolation: 'linear' });
        } else {
          setKeyframeTracks(prev => ({
            ...prev,
            [trackId]: {
              propertyId: trackId,
              label,
              enabled: true,
              keyframes: [{ id: crypto.randomUUID(), time: nt, value, interpolation: 'linear' as const }],
            },
          }));
        }
      });
    });
  }

  function recordOpacityKeyframes() {
    if (selectedOpacityIdxs.size === 0) return;
    const nt = currentTime;
    [...selectedOpacityIdxs].forEach(idx => {
      const stop = (gradient.opacityStops ?? DEFAULT_OPACITY_STOPS)[idx];
      if (!stop?.stopId) return;
      const sid = stop.stopId;
      const stopNum = idx + 1;
      const fields: Array<{ field: string; value: number; label: string }> = [
        { field: 'position', value: stop.position, label: `A#${stopNum} Pos` },
        { field: 'opacity', value: stop.opacity, label: `A#${stopNum} Opacity` },
      ];
      fields.forEach(({ field, value, label }) => {
        const trackId = `opacityStop.${sid}.${field}`;
        const existing = keyframeTracks[trackId];
        if (existing) {
          const nearKf = existing.keyframes.find(k => Math.abs(k.time - nt) < 1e-4);
          if (nearKf) setKeyframe(trackId, { id: nearKf.id, value });
          else addKeyframe(trackId, { time: nt, value, interpolation: 'linear' });
        } else {
          setKeyframeTracks(prev => ({
            ...prev,
            [trackId]: {
              propertyId: trackId,
              label,
              enabled: true,
              keyframes: [{ id: crypto.randomUUID(), time: nt, value, interpolation: 'linear' as const }],
            },
          }));
        }
      });
    });
  }

  const hasSelectedWithId = selectedIdxs.size > 0 && [...selectedIdxs].some(i => !!gradient.stops[i]?.stopId);
  const hasSelectedOpacityWithId = selectedOpacityIdxs.size > 0 && [...selectedOpacityIdxs].some(i => !!(gradient.opacityStops ?? DEFAULT_OPACITY_STOPS)[i]?.stopId);
  const runTouchAction = (e: React.TouchEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const stopOpButtons = (
    <div className="flex gap-1 flex-wrap items-center">
      <IconButton
        icon="delete"
        label={t('gradient.deleteStop')}
        onClick={() => {
          if (selectedIdxs.size === 0) return;
          const empty = new Set<number>();
          setGradient({ stops: gradient.stops.filter((_, i) => !selectedIdxs.has(i)) });
          updateSelectedStops(empty);
          selectedIdxsRef.current = empty;
        }}
        onTouchEnd={(e) => runTouchAction(e, () => {
          if (selectedIdxs.size === 0) return;
          const empty = new Set<number>();
          setGradient({ stops: gradient.stops.filter((_, i) => !selectedIdxs.has(i)) });
          updateSelectedStops(empty);
          selectedIdxsRef.current = empty;
        })}
        disabled={selectedIdxs.size === 0}
        className="h-7 w-7 bg-k-muted text-k-text hover:bg-k-muted/70"
      />
      <IconButton
        icon="copy"
        label={t('gradient.duplicateStop')}
        onClick={copySelectedStops}
        onTouchEnd={(e) => runTouchAction(e, copySelectedStops)}
        disabled={selectedIdxs.size === 0}
        className="h-7 w-7 bg-k-muted text-k-text hover:bg-k-muted/70"
      />
      <IconButton
        icon="distributeHorizontal"
        label={t('gradient.distributeStops')}
        onClick={distributeEvenly}
        onTouchEnd={(e) => runTouchAction(e, distributeEvenly)}
        className="h-7 w-7 bg-k-muted text-k-text hover:bg-k-muted/70"
      />
      <IconButton
        icon="reverse"
        label={t('gradient.reverseStops')}
        onClick={reverseGradient}
        onTouchEnd={(e) => runTouchAction(e, reverseGradient)}
        className="h-7 w-7 bg-k-muted text-k-text hover:bg-k-muted/70"
      />
      <InputShuffle
        value={gradient.stops}
        generate={(previous) => {
          const maxPosition = gradient.rampMirror ? 0.5 : 1;
          return rampShuffleRandomRef.current
            ? randomizeStopPositions(previous, maxPosition)
            : diceStopPositions(previous, maxPosition);
        }}
        onChange={(stops) => {
          if (!diceSnapshot) setDiceSnapshot({ stops: cloneColorStops(gradient.stops) });
          setGradient({ stops });
          clearRampSelection();
        }}
        onClick={(event) => { rampShuffleRandomRef.current = event.shiftKey; }}
        aria-label={t('common.shuffle')}
        title={t('common.shuffleHint')}
      />
      {diceSnapshot && (
        <IconButton
          icon="restart"
          label={t('common.restoreShuffle')}
          onClick={resetDiceRampPositions}
          onTouchEnd={(e) => runTouchAction(e, resetDiceRampPositions)}
          className="h-7 w-7 text-fire bg-fire/10 hover:bg-fire/20 border-fire/50"
        />
      )}
      <button
        onClick={recordStopKeyframes}
        onTouchEnd={(e) => runTouchAction(e, recordStopKeyframes)}
        disabled={!hasSelectedWithId}
        className="flex items-center gap-1 text-xs text-k-text bg-k-muted hover:bg-k-muted/70 px-2 py-1 rounded-none disabled:opacity-40"
        title={t('gradient.recordColorKeyframe')}
      >
        <Icon name="timer" className="text-[10.5px] text-fire" />
      </button>
    </div>
  );

  const hasOpacitySelection = selectedOpacityIdxs.size > 0;
  const showOpacityControls = hasOpacitySelection && !isOpacityControlsDismissed;
  const opacitySliderControls = (
    <div className="space-y-2 border border-k-muted/50 bg-k-bg/40 p-2 pb-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] text-tab-inactive uppercase tracking-wider truncate"
          title={selectedOpacityLabel}
        >
          Opacity {selectedOpacityLabel}
        </span>
        <span className="text-[10px] text-k-text tabular-nums">{`${Math.round(pickerOpacity * 100)}%`}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pickerOpacity * 100)}
        onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
        className="w-full"
      />
    </div>
  );

  const opacityActionButtons = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-1 flex-wrap">
        <IconButton
          icon="delete"
          label={t('gradient.deleteStop')}
          onClick={() => {
            if (selectedOpacityIdxs.size === 0) return;
            const currentStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
            const firstDeletedIdx = Math.min(...selectedOpacityIdxs);
            const nextStops = currentStops.filter((_, i) => !selectedOpacityIdxs.has(i));
            const safeStops = nextStops.length > 0 ? nextStops : [{ position: 0, opacity: 1 }];
            const nextSelectedIdx = Math.max(0, Math.min(firstDeletedIdx, safeStops.length - 1));
            const nextSel = new Set([nextSelectedIdx]);
            setGradient({ opacityStops: safeStops });
            updateSelectedOpacityStops(nextSel);
            selectedOpacityIdxsRef.current = nextSel;
          }}
          onTouchEnd={(e) => runTouchAction(e, () => {
            if (selectedOpacityIdxs.size === 0) return;
            const currentStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
            const firstDeletedIdx = Math.min(...selectedOpacityIdxs);
            const nextStops = currentStops.filter((_, i) => !selectedOpacityIdxs.has(i));
            const safeStops = nextStops.length > 0 ? nextStops : [{ position: 0, opacity: 1 }];
            const nextSelectedIdx = Math.max(0, Math.min(firstDeletedIdx, safeStops.length - 1));
            const nextSel = new Set([nextSelectedIdx]);
            setGradient({ opacityStops: safeStops });
            updateSelectedOpacityStops(nextSel);
            selectedOpacityIdxsRef.current = nextSel;
          })}
          className="h-7 w-7 bg-k-muted text-k-text hover:bg-k-muted/70"
        />
        <IconButton
          icon="copy"
          label={t('gradient.duplicateStop')}
          onClick={() => {
            const currentStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
            const maxPos = gradient.rampMirror ? 0.5 : 1;
            const newStops = [...currentStops];
            const newIdxs: number[] = [];
            [...selectedOpacityIdxs].sort((a, b) => a - b).forEach(i => {
              const stop = currentStops[i];
              newStops.push({ ...stop, stopId: undefined, position: Math.min(maxPos, stop.position + 0.05) });
              newIdxs.push(newStops.length - 1);
            });
            const newSel = new Set(newIdxs);
            setGradient({ opacityStops: newStops });
            updateSelectedOpacityStops(newSel);
            selectedOpacityIdxsRef.current = newSel;
          }}
          onTouchEnd={(e) => runTouchAction(e, () => {
            const currentStops = gradient.opacityStops ?? DEFAULT_OPACITY_STOPS;
            const maxPos = gradient.rampMirror ? 0.5 : 1;
            const newStops = [...currentStops];
            const newIdxs: number[] = [];
            [...selectedOpacityIdxs].sort((a, b) => a - b).forEach(i => {
              const stop = currentStops[i];
              newStops.push({ ...stop, stopId: undefined, position: Math.min(maxPos, stop.position + 0.05) });
              newIdxs.push(newStops.length - 1);
            });
            const newSel = new Set(newIdxs);
            setGradient({ opacityStops: newStops });
            updateSelectedOpacityStops(newSel);
            selectedOpacityIdxsRef.current = newSel;
          })}
          className="h-7 w-7 bg-k-muted text-k-text hover:bg-k-muted/70"
        />
        <button
          onClick={recordOpacityKeyframes}
          onTouchEnd={(e) => runTouchAction(e, recordOpacityKeyframes)}
          disabled={!hasSelectedOpacityWithId}
          className="flex items-center gap-1 text-xs text-k-text bg-k-muted hover:bg-k-muted/70 px-2 py-1 rounded-none disabled:opacity-35"
          title={t('gradient.recordOpacityKeyframe')}
        >
          <Icon name="timer" className="text-[10.5px] text-fire" />
        </button>
      </div>
      <IconButton
        icon="close"
        label={t('common.close')}
        onClick={() => setIsOpacityControlsDismissed(true)}
        onTouchEnd={(e) => runTouchAction(e, () => setIsOpacityControlsDismissed(true))}
        className="w-6 h-6 p-0 flex items-center justify-center text-k-text/55 hover:text-k-text hover:bg-white/10 rounded-none border border-white/10"
      />
    </div>
  );

  const renderRampHover = (scope: RampHoverInfo['scope']) => {
    if (!rampHover || rampHover.scope !== scope) return null;
    return (
      <div
        className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-sm border border-cream/25 bg-k-surface/95 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-k-text shadow-lg"
        style={{ left: rampHover.x, top: rampHover.y }}
      >
        {formatStopPosition(rampHover.position)}
      </div>
    );
  };

  return (
    <>
      <div
        className="space-y-3 k-touch-controls"
        onPointerDown={stopTouchPropagation}
        onPointerMove={stopTouchPropagation}
        onPointerUp={stopTouchPropagation}
        onPointerCancel={stopTouchPropagation}
      >
        <div className={`flex items-center mb-1 ${showHeader ? 'justify-between' : 'justify-end'}`}>
          {showHeader && <h2 className="font-semibold text-sm text-k-text tracking-wide">Gradient Ramp</h2>}
          <div className="flex items-center gap-1">
              <IconButton
                icon="expand"
                label={t('gradient.openEditor')}
                onClick={() => setIsModalOpen(true)}
                onTouchEnd={(e) => runTouchAction(e, () => setIsModalOpen(true))}
                className="flex items-center justify-center w-7 h-7 p-0 bg-[#2A2A2A] border border-white/10 text-[#F0EAD9] hover:bg-[#3A3A3A] hover:border-white/20 transition-all duration-200"
              />
          </div>
        </div>

        <div className="space-y-4">
          {/* グラデーションタイプ選択 */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <GradientTypeSelector
                value={gradient.gradientType ?? 'linear'}
                onChange={(gradientType) => setGradient({ gradientType })}
              />
            </div>
            <IconButton
              icon="restart"
              label={t('common.reset')}
              onClick={() => {
                if (gradient.gradientType === 'mesh') {
                  resetMeshGradient();
                  return;
                }
                const anchors = GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
                setGradient({
                  anchors,
                  ...((gradient.gradientType ?? 'linear') === 'bezier'
                  ? { bezierControls: defaultBezierControlsForAnchors(anchors) }
                  : {}),
                });
              }}
              onTouchEnd={(e) => runTouchAction(e, () => {
                if (gradient.gradientType === 'mesh') {
                  resetMeshGradient();
                  return;
                }
                const anchors = GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
                setGradient({
                  anchors,
                  ...((gradient.gradientType ?? 'linear') === 'bezier'
                    ? { bezierControls: defaultBezierControlsForAnchors(anchors) }
                    : {}),
                });
              })}
              className="mb-0.5 h-8 w-8 shrink-0 bg-k-surface border-k-muted hover:border-k-text hover:text-k-text"
            />
          </div>

          {/* ストップ編集: 頻繁に操作するためグラデーションタイプの直下に固定 */}
          <p className="text-xs text-tab-inactive">
            {t('gradient.editInstructions')}
          </p>

          <div className="relative space-y-1">
            <AnimatedOpacityControls visible={showOpacityControls}>
              {opacityActionButtons}
              {opacitySliderControls}
            </AnimatedOpacityControls>

            {/* サイドバーキャンバス */}
            <canvas
              ref={canvasCallbackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={clearRampHover}
              onClick={handleClick}
              className="w-full rounded-none cursor-crosshair touch-none"
              style={{ height: BAR_H + HANDLE_AREA + OPACITY_HANDLE_AREA, pointerEvents: isSlitAdjusting ? 'none' : 'auto', touchAction: 'none' }}
            />
            {renderRampHover('sidebar')}
          </div>

          {/* ストップ操作 */}
          <div className="space-y-3">
            <div
              ref={pickerWrapperRef}
              style={{ overflow: 'hidden', opacity: 0, height: 0, display: 'none' }}
            >
              <ColorPicker
                color={pickerColor}
                onChange={onColorChange}
                onClose={() => setIsPickerOpen(false)}
              />
            </div>
            {stopOpButtons}
          </div>

          {/* カラーモード / 補間モード選択 */}
          <div className="grid grid-cols-2 gap-2">
            <CustomSelect
              label="Color Mode"
              value={colorMode}
              options={COLOR_MODE_OPTIONS}
              optionPreview={renderColorModePreview}
              alwaysShowPreviews={showRampOptionPreviews}
              previewOnly={showRampOptionPreviews}
              localizeOptions={false}
              onChange={(val) => {
                const nextMode = val as RampColorMode;
                setGradient({
                  rampColorMode: nextMode,
                  rampInterpolation: defaultInterpolationForColorMode(nextMode),
                });
              }}
            />
            <CustomSelect
              label="Interp"
              value={interpolation}
              options={interpolationOptions}
              optionPreview={renderInterpolationPreview}
              alwaysShowPreviews={showRampOptionPreviews}
              previewOnly={showRampOptionPreviews}
              localizeOptions={false}
              onChange={(val) => setGradient({ rampInterpolation: val as RampInterpolation })}
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              aria-pressed={showRampOptionPreviews}
              onClick={() => setShowRampOptionPreviews((visible) => !visible)}
              className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-fire ${showRampOptionPreviews ? 'border-fire/70 bg-fire/15 text-cream' : 'border-panel-border text-tab-inactive hover:border-cream/50 hover:text-k-text'}`}
              title="常時プレビューを切り替え"
            >
              <span className="h-2.5 w-5 border border-current/40 bg-[linear-gradient(90deg,#d11402,#e5dabd,#6075a4)]" aria-hidden="true" />
              {showRampOptionPreviews ? 'Hide previews' : 'Show previews'}
            </button>
          </div>

          {interpolation === 'variable' && (
            <div className="group/row">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="select-none cursor-default font-body text-xs text-deep">{localizeUiLabel('Variable', language)}</label>
              </div>
              <div className="tq-input-number-shell w-full">
                <InputNumber
                className="tq-input-number w-full"
                value={rampVariable}
                min={-1}
                max={1}
                step={0.001}
                precision={3}
                bar={0}
                clampMin
                clampMax
                aria-label={`${localizeUiLabel('Variable', language)}: ${rampVariable.toFixed(3)}`}
                onChange={(value) => {
                  if (Number.isFinite(value)) {
                    setGradient({ rampVariable: Math.max(-1, Math.min(1, value)) });
                  }
                }}
                />
              </div>
            </div>
          )}

          <SliderField
            label={t('gradient.repeat')}
            min={1}
            max={20}
            step={1}
            value={rampRepeat}
            onChange={(value) => setGradient({ rampRepeat: Math.round(value) })}
            format={(value) => `${Math.round(value)}x`}
            defaultValue={1}
          />

          {/* Mirror モード */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-tab-inactive">{t('gradient.mirror')}</span>
            <button
              onClick={toggleRampMirror}
              onTouchEnd={(e) => runTouchAction(e, toggleRampMirror)}
              className={`text-xs px-2 py-1 rounded-none transition-colors ${
                gradient.rampMirror
                  ? 'bg-fire/30 text-fire border border-fire/50'
                  : 'bg-k-muted text-k-text border border-transparent hover:bg-k-muted/70'
              }`}
              title={t('gradient.mirrorDescription')}
            >
              {t('gradient.mirror')}
            </button>
          </div>

          <SidebarSection
            id="gradient-palette-generator"
            title={t('gradient.paletteGenerator')}
            description={t('gradient.paletteGeneratorDescription')}
            open={showPaletteGenerator}
            onToggle={() => setShowPaletteGenerator(value => !value)}
            nested
          >
          <ColorPaletteGenerator
              overlayImageElement={overlayImageElement}
              embedded
            />
          </SidebarSection>

          {/* プリセット */}
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSavePalette(); }}
                placeholder={t('gradient.paletteName')}
                className="min-w-0 flex-1 bg-k-surface text-k-text text-[10px] rounded-none px-2 py-1 border border-cream/30 focus:border-fire focus:outline-none"
              />
              <button
                onClick={handleSavePalette}
                onTouchEnd={(e) => runTouchAction(e, handleSavePalette)}
                disabled={!paletteName.trim()}
                className="text-[10px] bg-fire hover:brightness-110 disabled:opacity-40 text-k-text px-2 py-1 rounded-none shrink-0 font-bold"
              >
                {t('common.save')}
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold text-tab-inactive uppercase tracking-widest">{t('gradient.builtInPresets')}</p>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(gradientRampPresets).map(([name, stops]) => (
                  <button
                    key={name}
                    onClick={() => applyColorPalette(stops)}
                    onTouchEnd={(e) => runTouchAction(e, () => applyColorPalette(stops))}
                    style={{ background: stopsToGradient(stops) }}
                    className="text-xs px-2 py-1 rounded-none capitalize font-medium text-k-text"
                    title={`${name} (built-in)`}
                  >
                    <span style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9)) drop-shadow(0 0 4px rgba(0,0,0,0.6))' }}>
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {userPalettes.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-tab-inactive uppercase tracking-widest">{t('gradient.userPalettes')}</p>
                <div className="flex gap-1 flex-wrap">
                  {userPalettes.map((palette) => (
                    <div key={palette.id} className="inline-flex items-stretch border border-cream/20 bg-k-surface">
                      <button
                        onClick={() => applyColorPalette(palette.stops)}
                        onTouchEnd={(e) => runTouchAction(e, () => applyColorPalette(palette.stops))}
                        style={{ background: stopsToGradient(palette.stops) }}
                        className="text-xs px-2 py-1 rounded-none capitalize font-medium text-k-text border-0"
                        title={palette.name}
                      >
                        <span style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9)) drop-shadow(0 0 4px rgba(0,0,0,0.6))' }}>
                          {palette.name}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeletePalette(palette.id)}
                        onTouchEnd={(e) => runTouchAction(e, () => handleDeletePalette(palette.id))}
                        className="w-6 px-0 py-1 text-[11px] text-red-300 hover:text-red-100 hover:bg-red-900/40 rounded-none border-0"
                        title="Delete user palette"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== フローティングウィンドウ (portal で body に描画) ===== */}
      {isModalOpen && createPortal(
        <div
          className="bg-k-surface flex flex-col k-touch-controls fixed z-50 border border-cream/25 shadow-2xl"
          onPointerDown={stopTouchPropagation}
          onPointerMove={stopTouchPropagation}
          onPointerUp={stopTouchPropagation}
          onPointerCancel={stopTouchPropagation}
          style={{
            left: floatPos.x,
            top: floatPos.y,
            width: floatSize.w,
            height: floatSize.h,
            minWidth: 420,
            minHeight: 320,
          }}
        >
          {/* タイトルバー（ドラッグハンドル）※PiP時はOSの枠があるため非表示にしても良いが、一応残す */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-cream/15 cursor-move select-none shrink-0 bg-k-surface/80"
            onPointerDown={onTitlePointerDown}
            onPointerMove={onTitlePointerMove}
            onPointerUp={onTitlePointerUp}
            onPointerLeave={onTitlePointerUp}
          >
            <span className="font-semibold text-sm tracking-wide">Gradient Ramp</span>
            
            <div className="flex items-center gap-1.5 ml-auto mr-4">
              <button 
                onClick={(e) => { e.stopPropagation(); undo(); }}
                onTouchEnd={(e) => runTouchAction(e, undo)}
                className="w-7 h-7 p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5"
                title={`${t('common.undo')} (Ctrl+Z)`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                  <path d="M9 14L4 9L9 4"></path>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                </svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); redo(); }}
                onTouchEnd={(e) => runTouchAction(e, redo)}
                className="w-7 h-7 p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5"
                title={`${t('common.redo')} (Ctrl+Y)`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                  <path d="M15 14l5-5-5-5"></path>
                  <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                </svg>
              </button>
            </div>

            <IconButton
              icon="close"
              label={t('gradient.closeEditor')}
              onClick={() => {
                setIsModalOpen(false);
              }}
              onTouchEnd={(e) => runTouchAction(e, () => {
                setIsModalOpen(false);
              })}
              className="w-8 h-8 p-0 text-k-text/50 hover:text-k-text hover:bg-white/10 rounded-full"
            />
          </div>

          {/* コンテンツ */}
          <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
            <p className="text-xs text-tab-inactive">
              {t('gradient.editInstructionsCompact')}
            </p>

            <div className="relative space-y-1">
              <AnimatedOpacityControls visible={showOpacityControls}>
                {opacityActionButtons}
                {opacitySliderControls}
              </AnimatedOpacityControls>

              {/* キャンバス */}
              <canvas
                ref={mCanvasCallbackRef}
                onPointerDown={mHandlePointerDown}
                onPointerMove={mHandlePointerMove}
                onPointerUp={mHandlePointerUp}
                onPointerLeave={clearRampHover}
                onClick={mHandleClick}
                className="w-full rounded-none cursor-crosshair touch-none"
                style={{ height: MODAL_BAR_H + HANDLE_AREA + OPACITY_HANDLE_AREA, touchAction: 'none' }}
              />
              {renderRampHover('modal')}
            </div>

            {/* Mirror モード */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-tab-inactive">{t('gradient.mirror')}</span>
              <button
                onClick={toggleRampMirror}
                onTouchEnd={(e) => runTouchAction(e, toggleRampMirror)}
                className={`text-xs px-2 py-1 rounded-none transition-colors ${
                  gradient.rampMirror
                    ? 'bg-fire/30 text-fire border border-fire/50'
                    : 'bg-k-muted text-k-text border border-transparent hover:bg-k-muted/70'
                }`}
                title={t('gradient.mirrorDescription')}
              >
                {t('gradient.mirror')}
              </button>
            </div>

            <div className="max-w-md">
              <SliderField
                label={t('gradient.repeat')}
                min={1}
                max={20}
                step={1}
                value={rampRepeat}
                onChange={(value) => setGradient({ rampRepeat: Math.round(value) })}
                format={(value) => `${Math.round(value)}x`}
                defaultValue={1}
              />
            </div>

            {/* カラーピッカー＋ストップ操作（横並び） */}
            <div className="flex gap-4 items-start flex-wrap">
              {selectedIdxs.size > 0 && (
                <div style={{ width: 280, flexShrink: 0 }}>
                  <ColorPicker
                    color={pickerColor}
                    onChange={onColorChange}
                    onClose={() => {
                      const empty = new Set<number>();
                      updateSelectedStops(empty);
                      selectedIdxsRef.current = empty;
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 justify-start pt-1">
                {stopOpButtons}
              </div>
            </div>

            {/* プリセット */}
            <div className="space-y-2">
              <div className="flex gap-1 max-w-md">
                <input
                  type="text"
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSavePalette(); }}
                  placeholder={t('gradient.paletteName')}
                  className="min-w-0 flex-1 bg-k-surface text-k-text text-xs rounded-none px-2 py-1 border border-cream/30 focus:border-fire focus:outline-none"
                />
                <button
                  onClick={handleSavePalette}
                  onTouchEnd={(e) => runTouchAction(e, handleSavePalette)}
                  disabled={!paletteName.trim()}
                  className="text-xs bg-fire hover:brightness-110 disabled:opacity-40 text-k-text px-3 py-1 rounded-none shrink-0 font-bold"
                >
                  {t('common.save')}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-tab-inactive uppercase tracking-widest">{t('gradient.builtInPresets')}</p>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(gradientRampPresets).map(([name, stops]) => (
                    <button
                      key={name}
                      onClick={() => applyColorPalette(stops)}
                      onTouchEnd={(e) => runTouchAction(e, () => applyColorPalette(stops))}
                      style={{ background: stopsToGradient(stops) }}
                      className="text-xs px-2 py-1 rounded-none capitalize font-medium text-k-text"
                      title={`${name} (built-in)`}
                    >
                      <span style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9)) drop-shadow(0 0 4px rgba(0,0,0,0.6))' }}>
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {userPalettes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-tab-inactive uppercase tracking-widest">User Palettes</p>
                  <div className="flex gap-1 flex-wrap">
                    {userPalettes.map((palette) => (
                      <div key={palette.id} className="inline-flex items-stretch border border-cream/20 bg-k-surface">
                        <button
                          onClick={() => applyColorPalette(palette.stops)}
                          onTouchEnd={(e) => runTouchAction(e, () => applyColorPalette(palette.stops))}
                          style={{ background: stopsToGradient(palette.stops) }}
                          className="text-xs px-2 py-1 rounded-none capitalize font-medium text-k-text border-0"
                          title={palette.name}
                        >
                          <span style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9)) drop-shadow(0 0 4px rgba(0,0,0,0.6))' }}>
                            {palette.name}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeletePalette(palette.id)}
                          onTouchEnd={(e) => runTouchAction(e, () => handleDeletePalette(palette.id))}
                          className="w-6 px-0 py-1 text-[11px] text-red-300 hover:text-red-100 hover:bg-red-900/40 rounded-none border-0"
                          title="Delete user palette"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* リサイズハンドル（右下角） */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.18) 50%)',
            }}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerLeave={onResizePointerUp}
          />
        </div>,
        document.body
      )}
    </>
  );
}

/** ColorStop[] を CSS linear-gradient 文字列に変換する */
function stopsToGradient(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) return '#555';
  if (sorted.length === 1) return sorted[0].color;
  const parts = sorted.map(s => `${s.color} ${(s.position * 100).toFixed(1)}%`).join(', ');
  return `linear-gradient(to right, ${parts})`;
}
