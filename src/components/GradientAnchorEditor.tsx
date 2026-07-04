import { useRef, useEffect } from 'react';
import { useGradientStore, GRADIENT_ANCHOR_DEFAULTS, defaultBezierControlsForAnchors } from '../store/gradientStore';
import { interpolateKeyframes } from '../lib/keyframeInterpolator';
import { getTrackMode } from '../types/keyframe';
import { Icon } from './Icon';

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

/** アンカーのスタイル定義: [塗り, ボーダー色, ラベル] */
const ANCHOR_STYLES = [
  { fill: 'rgba(255,255,255,0.95)', border: '#ffffff', label: 'A', labelColor: '#1a1a2e' },
  { fill: 'rgba(20,20,35,0.75)',    border: '#94a3b8', label: 'B', labelColor: '#94a3b8' },
  { fill: 'rgba(20,20,35,0.75)',    border: '#60a5fa', label: 'C', labelColor: '#60a5fa' },
  { fill: 'rgba(20,20,35,0.75)',    border: '#f472b6', label: 'D', labelColor: '#f472b6' },
] as const;

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

    let result: [number, number] = [uvPos[0], uvPos[1]];
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
    const label = ANCHOR_STYLES[index].label;
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

  // ライン色を決定：垂直 = 緑、水平 = 赤、辺の中心スナップ = オレンジ
  let lineColor = 'rgba(255,255,255,0.55)'; // デフォルト：白
  if (isABVertical) {
    lineColor = 'rgba(34,197,94,0.85)'; // 緑
  } else if (isABHorizontal) {
    lineColor = 'rgba(209,20,2,0.85)'; // 赤
  } else if (isSnappedToEdgeCenter) {
    lineColor = 'rgba(251,146,60,0.85)'; // オレンジ
  }

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
        {gradientType !== 'fourcolor' ? (
          showBezierControls ? (
            <>
              <line
                x1={positions[0].x} y1={positions[0].y}
                x2={bezierControlPositions[0].x} y2={bezierControlPositions[0].y}
                stroke="rgba(236,219,190,0.36)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <line
                x1={positions[1].x} y1={positions[1].y}
                x2={bezierControlPositions[1].x} y2={bezierControlPositions[1].y}
                stroke="rgba(236,219,190,0.36)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <path
                d={`M ${positions[0].x} ${positions[0].y} C ${bezierControlPositions[0].x} ${bezierControlPositions[0].y}, ${bezierControlPositions[1].x} ${bezierControlPositions[1].y}, ${positions[1].x} ${positions[1].y}`}
                fill="none"
                stroke={lineColor}
                strokeWidth="1.8"
                strokeDasharray="5,3"
              />
            </>
          ) : (
            <line
              x1={positions[0].x} y1={positions[0].y}
              x2={positions[1].x} y2={positions[1].y}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="5,3"
            />
          )
        ) : (
          fourColorLines.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={positions[a].x} y1={positions[a].y}
              x2={positions[b].x} y2={positions[b].y}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              strokeDasharray="3,4"
            />
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
        const s = ANCHOR_STYLES[i];
        const isSelected = selectedGradientAnchors.includes(i);
        return (
          <div key={i} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', zIndex: 20 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: s.fill,
                border: `2px solid ${isSelected ? '#D11402' : s.border}`,
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(236,219,190,0.85), 0 0 12px rgba(209,20,2,0.75)'
                  : '0 1px 4px rgba(0,0,0,0.5)',
                cursor: 'move',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                fontWeight: 'bold',
                color: s.labelColor,
                userSelect: 'none',
              }}
              onPointerDown={handlePointerDown(i)}
            >
              {s.label}
            </div>
            {/* タイマーボタン: animation.affectRamp が有効な場合のみ表示 */}
            {showKfButton && (
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); recordAnchorKeyframe(i); }}
                title={`${s.label} のキーフレームを記録`}
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
