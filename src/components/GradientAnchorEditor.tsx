import { useRef, useEffect } from 'react';
import { useGradientStore, GRADIENT_ANCHOR_DEFAULTS, defaultBezierControlsForAnchors } from '../store/gradientStore';
import { interpolateKeyframes } from '../lib/keyframeInterpolator';
import { getTrackMode } from '../types/keyframe';
import { Icon } from './Icon';
import { getColorAtPosition } from '../lib/gradientRampUtils';

// デバッグ用：ブラウザコンソールから調整可能
const SNAP_CONFIG = {
  SNAP_THRESHOLD: 0.01,        // スナップポイント範囲（大きい = スナップしやすい）。0.05～0.2推奨
  RELEASE_THRESHOLD: 0.10,     // スナップ解除距離（大きい = スナップが続きやすい）。0.15～0.5推奨
  DRAG_START_THRESHOLD: 0.02,  // ドラッグ開始判定（小さい = スナップ判定が早い）
};

type Props = {
  width: number;
  height: number;
};

/**
 * アンカーインデックスからランプのt値へのマッピング。
 * シェーダー (gradient.frag.glsl L242-243) と同じ対応：
 *   linear/radial/diamond/angle/bezier: index0=0, index1=1
 *   fourcolor: index0=0, index1=1/3, index2=2/3, index3=1
 */
const ANCHOR_T_VALUES = {
  default: [0, 1, 0, 1],
  fourcolor: [0, 1 / 3, 2 / 3, 1],
} as const;

/** hexカラーから輝度 (0–1) を算出する */
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // sRGB 輝度（ITU-R BT.709）
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * アンカーindex の実際のグラデーション色と視認性用スタイルを計算する。
 * - fill: アンカーの実際のグラデーション色
 * - innerBorder: fillの輝度に応じた自動コントラスト色 (白 or 黒)
 * - outerGlow: 外側のコントラストglow
 */
function computeAnchorColors(
  index: number,
  gradientType: string,
  stops: import('../types/gradient').ColorStop[],
  interpolation: import('../types/gradient').RampInterpolation,
  colorMode: import('../types/gradient').RampColorMode | undefined,
  rampMirror?: boolean,
): { fill: string; innerBorder: string; outerGlow: string } {
  const tValues = gradientType === 'fourcolor'
    ? ANCHOR_T_VALUES.fourcolor
    : ANCHOR_T_VALUES.default;
  let t = tValues[index] ?? 0;
  if (rampMirror) {
    // mirrorモード: t=0.5 を超えたら折り返す
    t = t <= 0.5 ? t : 1 - t;
  }
  const fill = getColorAtPosition(stops, t, interpolation, colorMode);
  const lum = getLuminance(fill);
  // 輝度0.45を境に白/黒を切り替えるコントラストボーダー
  const innerBorder = lum > 0.45 ? '#000000' : '#ffffff';
  const outerGlow   = lum > 0.45 ? '#ffffff' : '#000000';
  return { fill, innerBorder, outerGlow };
}

export function GradientAnchorEditor({ width, height }: Props) {
  const { gradient, keyframeTracks, setKeyframeTracks, addKeyframe, setKeyframe, currentTime, animation, selectedGradientAnchors, setSelectedGradientAnchors, setIsGradientAnchorDragging } = useGradientStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);
  const draggingBezierControlRef = useRef<0 | 1 | null>(null);
  const selectedGradientAnchorsRef = useRef(selectedGradientAnchors);
  useEffect(() => {
    selectedGradientAnchorsRef.current = selectedGradientAnchors;
  }, [selectedGradientAnchors]);

  // デバッグ用：window に SNAP_CONFIG を露出させる
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).GRADIENT_ANCHOR_SNAP_CONFIG = SNAP_CONFIG;
  }, []);

  const { gradientType } = gradient;
  const numAnchors = gradientType === 'fourcolor' ? 4 : 2;
  const anchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradientType ?? 'linear'];
  const fallbackBezierControls = defaultBezierControlsForAnchors(anchors);
  const bezierControls = gradient.bezierControls ?? fallbackBezierControls;
  const showBezierControls = gradientType === 'bezier' && numAnchors === 2;

  // UV空間(y=0が底辺) → CSS座標(y=0が上辺)
  const uvToCss = (uv: [number, number]) => ({
    x: uv[0] * width,
    y: (1 - uv[1]) * height,
  });

  // スナップ処理：ドラッグ中も常にスナップ判定を行う
  const snapToGuidelines = (uvPos: [number, number], dragIndex: number): [number, number] => {
    const { SNAP_THRESHOLD } = SNAP_CONFIG;

    const result: [number, number] = [uvPos[0], uvPos[1]];
    const snapPoints = [0, 0.5, 1];

    // キャンバス中心・上下左右へのスナップ
    for (const point of snapPoints) {
      if (Math.abs(result[0] - point) < SNAP_THRESHOLD) result[0] = point;
      if (Math.abs(result[1] - point) < SNAP_THRESHOLD) result[1] = point;
    }

    // A（index 0）との水平・垂直スナップ（自分以外）
    if (dragIndex !== 0) {
      const anchorA = anchors[0];
      if (Math.abs(result[0] - anchorA[0]) < SNAP_THRESHOLD) result[0] = anchorA[0];
      if (Math.abs(result[1] - anchorA[1]) < SNAP_THRESHOLD) result[1] = anchorA[1];
    }

    // B（index 1）との水平・垂直スナップ（自分以外）
    if (dragIndex !== 1) {
      const anchorB = anchors[1];
      if (Math.abs(result[0] - anchorB[0]) < SNAP_THRESHOLD) result[0] = anchorB[0];
      if (Math.abs(result[1] - anchorB[1]) < SNAP_THRESHOLD) result[1] = anchorB[1];
    }

    return result;
  };

  const handlePointerDown = (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = index;
    setIsGradientAnchorDragging(true);
    if (!selectedGradientAnchorsRef.current.includes(index)) {
      setSelectedGradientAnchors(e.shiftKey ? [...selectedGradientAnchorsRef.current, index] : [index]);
    }

    // ビジュアル位置（effectiveAnchors）からオフセットを計算
    const rect = containerRef.current?.getBoundingClientRect();
    const grabOffsetX = rect ? (e.clientX - rect.left) - effectiveAnchors[index][0] * rect.width : 0;
    const grabOffsetY = rect ? (e.clientY - rect.top) - (1 - effectiveAnchors[index][1]) * rect.height : 0;

    const onMove = (ev: PointerEvent) => {
      if (draggingRef.current !== index) return;
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      let uvPos: [number, number] = [
        (ev.clientX - r.left - grabOffsetX) / r.width,
        1 - (ev.clientY - r.top - grabOffsetY) / r.height,
      ];

      // スナップ処理を適用
      uvPos = snapToGuidelines(uvPos, index);

      const state = useGradientStore.getState();
      const nt = state.currentTime;
      const xTrackId = `gradientAnchor.${index}.x`;
      const yTrackId = `gradientAnchor.${index}.y`;
      const xTrack = state.keyframeTracks[xTrackId];
      const yTrack = state.keyframeTracks[yTrackId];
      const xActive = Boolean(xTrack && getTrackMode(xTrack) === 'keys' && xTrack.keyframes.length > 0);
      const yActive = Boolean(yTrack && getTrackMode(yTrack) === 'keys' && yTrack.keyframes.length > 0);

      if (xActive || yActive) {
        // キーフレームが有効な軸はキーフレームを更新 or 作成
        const upsertKf = (trackId: string, track: typeof xTrack, val: number) => {
          const nearKf = track!.keyframes.find(k => Math.abs(k.time - nt) < 1e-4);
          if (nearKf) state.setKeyframe(trackId, { id: nearKf.id, value: val });
          else state.addKeyframe(trackId, { time: nt, value: val, interpolation: 'linear' });
        };
        if (xActive) upsertKf(xTrackId, xTrack, uvPos[0]);
        if (yActive) upsertKf(yTrackId, yTrack, uvPos[1]);
        // キーフレームがない軸はrawアンカーを更新
        if (!xActive || !yActive) {
          const cur = state.gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[state.gradient.gradientType ?? 'linear'];
          state.setGradient({ anchors: cur.map((a, j) => j !== index ? a : [
            xActive ? a[0] : uvPos[0],
            yActive ? a[1] : uvPos[1],
          ] as [number, number]) as typeof cur });
        }
      } else {
        const cur = state.gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[state.gradient.gradientType ?? 'linear'];
        const selected = selectedGradientAnchorsRef.current.includes(index)
          ? selectedGradientAnchorsRef.current
          : [index];
        const base = cur[index];
        const dx = uvPos[0] - base[0];
        const dy = uvPos[1] - base[1];
        const nextAnchors = cur.map((a, j) => (
          selected.includes(j)
            ? [a[0] + dx, a[1] + dy] as [number, number]
            : a
        )) as typeof cur;
        const currentControls = state.gradient.bezierControls;
        const nextControls = currentControls && state.gradient.gradientType === 'bezier'
          ? currentControls.map((cp, j) => (
              selected.includes(j)
                ? [cp[0] + dx, cp[1] + dy] as [number, number]
                : cp
            )) as [[number, number], [number, number]]
          : currentControls;
        state.setGradient({
          anchors: nextAnchors,
          ...(nextControls ? { bezierControls: nextControls } : {}),
        });
      }
    };

    const onUp = () => {
      draggingRef.current = null;
      setIsGradientAnchorDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
  };

  const handleBezierControlPointerDown = (index: 0 | 1) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    draggingBezierControlRef.current = index;
    const rect = containerRef.current?.getBoundingClientRect();
    const grabOffsetX = rect ? (e.clientX - rect.left) - bezierControls[index][0] * rect.width : 0;
    const grabOffsetY = rect ? (e.clientY - rect.top) - (1 - bezierControls[index][1]) * rect.height : 0;

    const onMove = (ev: PointerEvent) => {
      if (draggingBezierControlRef.current !== index) return;
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const uvPos: [number, number] = [
        (ev.clientX - r.left - grabOffsetX) / r.width,
        1 - (ev.clientY - r.top - grabOffsetY) / r.height,
      ];
      const state = useGradientStore.getState();
      const controls = state.gradient.bezierControls ?? fallbackBezierControls;
      state.setGradient({
        bezierControls: controls.map((cp, j) => (
          j === index ? uvPos : cp
        )) as [[number, number], [number, number]],
      });
    };

    const onUp = () => {
      draggingBezierControlRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  function recordAnchorKeyframe(index: number) {
    const anchor = anchors[index];
    const nt = currentTime;
    const label = ['A', 'B', 'C', 'D'][index] ?? String(index);
    const fields: Array<{ field: 'x' | 'y'; value: number }> = [
      { field: 'x', value: anchor[0] },
      { field: 'y', value: anchor[1] },
    ];
    fields.forEach(({ field, value }) => {
      const trackId = `gradientAnchor.${index}.${field}`;
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
            label: `${label}.${field.toUpperCase()}`,
            enabled: true,
            keyframes: [{ id: crypto.randomUUID(), time: nt, value, interpolation: 'linear' as const }],
          },
        }));
      }
    });
  }

  const showKfButton = animation.enabled;

  // アニメーション再生中はキーフレームを補間した位置を使用
  const effectiveAnchors: typeof anchors = anchors.map((anchor, idx) => {
        const xTrack = keyframeTracks[`gradientAnchor.${idx}.x`];
        const yTrack = keyframeTracks[`gradientAnchor.${idx}.y`];
        const x = xTrack && getTrackMode(xTrack) === 'keys' && xTrack.keyframes.length > 0
          ? interpolateKeyframes(currentTime, xTrack.keyframes)
          : anchor[0];
        const y = yTrack && getTrackMode(yTrack) === 'keys' && yTrack.keyframes.length > 0
          ? interpolateKeyframes(currentTime, yTrack.keyframes)
          : anchor[1];
        return [x, y] as [number, number];
      }) as typeof anchors;

  const positions = effectiveAnchors.slice(0, numAnchors).map(uvToCss);
  const bezierControlPositions = bezierControls.map(uvToCss) as [{ x: number; y: number }, { x: number; y: number }];

  // fourcolor用の接続線ペア
  const fourColorLines: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3]];

  // A/B が垂直に揃っているかチェック（x座標が同じ）
  const isABVertical = numAnchors === 2 && Math.abs(effectiveAnchors[0][0] - effectiveAnchors[1][0]) < 0.01;

  // A/B が水平に揃っているかチェック（y座標が同じ）
  const isABHorizontal = numAnchors === 2 && Math.abs(effectiveAnchors[0][1] - effectiveAnchors[1][1]) < 0.01;

  // 上下左右の辺の中心にスナップしているかチェック
  // 左辺中心: (0, 0.5), 右辺中心: (1, 0.5), 下辺中心: (0.5, 0), 上辺中心: (0.5, 1)
  const edgeCenterSnapThreshold = SNAP_CONFIG.SNAP_THRESHOLD;
  const edgeCenters: [number, number][] = [[0, 0.5], [1, 0.5], [0.5, 0], [0.5, 1]];
  const isSnappedToEdgeCenter = numAnchors === 2 && (
    edgeCenters.some(([ex, ey]) =>
      Math.abs(effectiveAnchors[0][0] - ex) < edgeCenterSnapThreshold && Math.abs(effectiveAnchors[0][1] - ey) < edgeCenterSnapThreshold
    ) ||
    edgeCenters.some(([ex, ey]) =>
      Math.abs(effectiveAnchors[1][0] - ex) < edgeCenterSnapThreshold && Math.abs(effectiveAnchors[1][1] - ey) < edgeCenterSnapThreshold
    )
  );

  // ライン色を決定：垂直 = 緑、水平 = 赤、辺の中心スナップ = オレンジ（スナップ強調用）
  let snapLineColor: string | null = null;
  if (isABVertical) {
    snapLineColor = 'rgba(34,197,94,0.9)'; // 緑
  } else if (isABHorizontal) {
    snapLineColor = 'rgba(209,20,2,0.9)'; // 赤
  } else if (isSnappedToEdgeCenter) {
    snapLineColor = 'rgba(251,146,60,0.9)'; // オレンジ
  }

  // 各アンカーの実色を取得（接続線のグラデーション用）
  const anchorColors = Array.from({ length: numAnchors }, (_, i) =>
    computeAnchorColors(i, gradientType, gradient.stops, gradient.rampInterpolation, gradient.rampColorMode, gradient.rampMirror)
  );

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width, height, pointerEvents: 'none', overflow: 'visible' }}
    >
      {/* 接続線 */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
        width={width}
        height={height}
      >
        <defs>
          {/* linear/bezier用: A→Bグラデーション線 */}
          {gradientType !== 'fourcolor' && (
            <linearGradient id="anchorLineGrad" x1={positions[0].x} y1={positions[0].y} x2={positions[1]?.x ?? positions[0].x} y2={positions[1]?.y ?? positions[0].y} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={anchorColors[0]?.fill ?? '#ffffff'} stopOpacity={0.7} />
              <stop offset="100%" stopColor={anchorColors[1]?.fill ?? '#ffffff'} stopOpacity={0.7} />
            </linearGradient>
          )}
          {/* fourcolor用: ペアごとのグラデーション */}
          {gradientType === 'fourcolor' && fourColorLines.map(([a, b]) => (
            <linearGradient key={`grad-${a}-${b}`} id={`anchorLineGrad-${a}-${b}`} x1={positions[a]?.x} y1={positions[a]?.y} x2={positions[b]?.x} y2={positions[b]?.y} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={anchorColors[a]?.fill ?? '#ffffff'} stopOpacity={0.6} />
              <stop offset="100%" stopColor={anchorColors[b]?.fill ?? '#ffffff'} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>

        {gradientType !== 'fourcolor' ? (
          showBezierControls ? (
            <>
              {/* ベジェ制御点へのガイド線 */}
              <line x1={positions[0].x} y1={positions[0].y} x2={bezierControlPositions[0].x} y2={bezierControlPositions[0].y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3,3" />
              <line x1={positions[0].x} y1={positions[0].y} x2={bezierControlPositions[0].x} y2={bezierControlPositions[0].y} stroke={anchorColors[0]?.fill ?? 'rgba(236,219,190,0.4)'} strokeWidth="0.75" strokeDasharray="3,3" strokeOpacity={0.45} />
              <line x1={positions[1].x} y1={positions[1].y} x2={bezierControlPositions[1].x} y2={bezierControlPositions[1].y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3,3" />
              <line x1={positions[1].x} y1={positions[1].y} x2={bezierControlPositions[1].x} y2={bezierControlPositions[1].y} stroke={anchorColors[1]?.fill ?? 'rgba(236,219,190,0.4)'} strokeWidth="0.75" strokeDasharray="3,3" strokeOpacity={0.45} />
              {/* ベジェ曲線本体: アウトライン白 + 色付き本線 */}
              <path d={`M ${positions[0].x} ${positions[0].y} C ${bezierControlPositions[0].x} ${bezierControlPositions[0].y}, ${bezierControlPositions[1].x} ${bezierControlPositions[1].y}, ${positions[1].x} ${positions[1].y}`} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={snapLineColor ? 3 : 2.5} strokeDasharray="5,3" />
              <path d={`M ${positions[0].x} ${positions[0].y} C ${bezierControlPositions[0].x} ${bezierControlPositions[0].y}, ${bezierControlPositions[1].x} ${bezierControlPositions[1].y}, ${positions[1].x} ${positions[1].y}`} fill="none" stroke={snapLineColor ?? 'url(#anchorLineGrad)'} strokeWidth="1.2" strokeDasharray="5,3" />
            </>
          ) : (
            <>
              {/* 直線: アウトライン白 + 色付き本線 */}
              <line x1={positions[0].x} y1={positions[0].y} x2={positions[1].x} y2={positions[1].y} stroke="rgba(255,255,255,0.15)" strokeWidth={snapLineColor ? 3 : 2.5} strokeDasharray="5,3" />
              <line x1={positions[0].x} y1={positions[0].y} x2={positions[1].x} y2={positions[1].y} stroke={snapLineColor ?? 'url(#anchorLineGrad)'} strokeWidth="1.2" strokeDasharray="5,3" />
            </>
          )
        ) : (
          fourColorLines.map(([a, b]) => (
            <g key={`${a}-${b}`}>
              <line x1={positions[a].x} y1={positions[a].y} x2={positions[b].x} y2={positions[b].y} stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="3,4" />
              <line x1={positions[a].x} y1={positions[a].y} x2={positions[b].x} y2={positions[b].y} stroke={`url(#anchorLineGrad-${a}-${b})`} strokeWidth="1" strokeDasharray="3,4" />
            </g>
          ))
        )}
      </svg>

      {showBezierControls && bezierControlPositions.map((pos, i) => (
        <div
          key={`bezier-cp-${i}`}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 19,
            pointerEvents: 'auto',
          }}
        >
          <div
            title={`${i === 0 ? 'A' : 'B'} Bezier Control`}
            onPointerDown={handleBezierControlPointerDown(i as 0 | 1)}
            style={{
              width: 14,
              height: 14,
              background: i === 0 ? 'rgba(236,219,190,0.96)' : 'rgba(20,20,35,0.92)',
              border: `2px solid ${i === 0 ? '#F0EAD9' : '#94a3b8'}`,
              boxShadow: '0 1px 5px rgba(0,0,0,0.55)',
              cursor: 'grab',
              transform: 'rotate(45deg)',
              userSelect: 'none',
            }}
          />
        </div>
      ))}

      {/* アンカーハンドル */}
      {positions.map((pos, i) => {
        const isSelected = selectedGradientAnchors.includes(i);
        const { fill, innerBorder, outerGlow } = computeAnchorColors(
          i,
          gradientType,
          gradient.stops,
          gradient.rampInterpolation,
          gradient.rampColorMode,
          gradient.rampMirror,
        );
        // 選択時: 赤グロー二重リング / 非選択時: 薄いコントラスト二重アウトライン
        const boxShadow = isSelected
          ? `0 0 0 1.5px #D11402, 0 0 0 3px rgba(209,20,2,0.3), 0 0 7px rgba(209,20,2,0.45)`
          : `0 0 0 1px ${innerBorder}55, 0 0 0 2.5px ${outerGlow}28, 0 1px 4px rgba(0,0,0,0.45)`;
        const label = ['A', 'B', 'C', 'D'][i] ?? String(i);
        return (
          <div key={i} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', zIndex: 20 }}>
            <div
              title={label}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: fill,
                border: `1.5px solid ${isSelected ? '#D11402' : innerBorder}`,
                boxShadow,
                cursor: 'move',
                pointerEvents: 'auto',
                userSelect: 'none',
              }}
              onPointerDown={handlePointerDown(i)}
            />
            {/* タイマーボタン: animation.affectRamp が有効な場合のみ表示 */}
            {showKfButton && (
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); recordAnchorKeyframe(i); }}
                title={`${label} のキーフレームを記録`}
                style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'auto',
                  background: 'rgba(20,20,35,0.9)',
                  border: '1px solid transparent',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 0,
                  lineHeight: 1,
                  color: '#D11402',
                }}
              >
                <Icon name="timer" style={{ fontSize: 10 }} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
