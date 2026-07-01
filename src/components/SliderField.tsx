import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import type React from 'react';
import { useGradientStore } from '../store/gradientStore';
import { getTimelineTime } from '../lib/timelineClock';
import { getTrackMode } from '../types/keyframe';
import { AnimationPropertyControls } from './AnimationPropertyControls';

type Props = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  labelClassName?: string;
  defaultValue?: number;
  trackId?: string;
};

export function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
  labelClassName = 'text-xs text-deep',
  defaultValue,
  trackId,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);

  const { keyframeTracks, addKeyframe, setKeyframe } = useGradientStore();
  const track = trackId ? keyframeTracks[trackId] : null;
  const isKeyframed = getTrackMode(track) === 'keys';
  const getKeyframeTime = () => getTimelineTime(useGradientStore.getState().currentTime);

  // オートキーフレーム: 値が変更されたときにキーフレームを打つ
  const handleValueChange = (v: number) => {
    onChange(v);
    if (isKeyframed && trackId && track) {
      const nt = getKeyframeTime();
      // 現在時刻に近いキーフレームがあるかチェック (誤差 0.01 以内 ≈ 24fps 1フレーム分)
      const existingKf = track.keyframes.find(k => Math.abs(k.time - nt) < 0.01);
      if (existingKf) {
        setKeyframe(trackId, { id: existingKf.id, value: v });
      } else {
        addKeyframe(trackId, { time: nt, value: v, interpolation: 'linear' });
      }
    }
  };

  // wheel ハンドラ内で常に最新の handleValueChange を参照するための ref
  const handleValueChangeRef = useRef(handleValueChange);
  useLayoutEffect(() => { handleValueChangeRef.current = handleValueChange; });

  // valueとonChangeをrefで持ち、ホイールハンドラ内で最新値を参照できるようにする
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  // レンダリング中ではなく、コミットフェーズで最新値を反映する
  useLayoutEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  const displayed = format ? format(value) : String(value);
  const isDirty = defaultValue !== undefined && Math.abs(value - defaultValue) > 1e-9;

  function startEdit() {
    setDraft(String(value));
    setEditing(true);
  }

  function commit(raw: string) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // テキスト入力時はスライダーの min/max 制限を無視できるようにする
      // また、スライダーの step に関わらず最低でも小数点第2位（0.01刻み）の精度を保証する
      const stepDecimals = (step.toString().split('.')[1] ?? '').length;
      const decimals = Math.max(2, stepDecimals);
      handleValueChange(Number(parsed.toFixed(decimals)));
    }
    setEditing(false);
  }

  // ドラッグ状態: ピボット方式でAltのON/OFFに対応
  type DragState = {
    pointerId: number;
    startX: number;   // クリック判定用の元の位置
    pivotX: number;   // 現在セグメントの起点X（Alt切替時にリセット）
    pivotValue: number; // 現在セグメントの起点value
    wasAlt: boolean;
  };
  const dragStateRef = useRef<DragState | null>(null);

  // ホイールイベントをDOM直接登録（ReactのpassiveリスナーではpreventDefaultが呼べないため）
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);
  const pointerDownHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const pointerMoveHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const pointerUpHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const pointerCancelHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);

  const rangeCallbackRef = useCallback((el: HTMLInputElement | null) => {
    if (rangeRef.current) {
      if (wheelHandlerRef.current) rangeRef.current.removeEventListener('wheel', wheelHandlerRef.current);
      if (pointerDownHandlerRef.current) rangeRef.current.removeEventListener('pointerdown', pointerDownHandlerRef.current);
      if (pointerMoveHandlerRef.current) rangeRef.current.removeEventListener('pointermove', pointerMoveHandlerRef.current);
      if (pointerUpHandlerRef.current) rangeRef.current.removeEventListener('pointerup', pointerUpHandlerRef.current);
      if (pointerCancelHandlerRef.current) rangeRef.current.removeEventListener('pointercancel', pointerCancelHandlerRef.current);
    }
    rangeRef.current = el;
    if (!el) return;

    wheelHandlerRef.current = (e: WheelEvent) => {
      e.preventDefault();
      // Shift: 10倍速 / Alt: 1/10速 / 通常: 1倍
      const multiplier = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const delta = e.deltaY < 0 ? step * multiplier : -step * multiplier;
      const decimals = Math.max((step.toString().split('.')[1] ?? '').length, e.altKey ? 3 : 0);
      const next = Number(Math.min(max, Math.max(min, valueRef.current + delta)).toFixed(decimals));
      handleValueChangeRef.current(next);
    };
    el.addEventListener('wheel', wheelHandlerRef.current, { passive: false });

    // 全ドラッグを乗っ取り、Alt ON/OFFをピボットリセットで処理
    pointerDownHandlerRef.current = (e: PointerEvent) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      dragStateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        pivotX: e.clientX,
        pivotValue: valueRef.current,
        wasAlt: e.altKey,
      };
    };

    pointerMoveHandlerRef.current = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      // Alt状態が変わったらピボットを現在位置・現在値にリセット
      if (e.altKey !== drag.wasAlt) {
        drag.pivotX = e.clientX;
        drag.pivotValue = valueRef.current;
        drag.wasAlt = e.altKey;
      }

      const rect = el.getBoundingClientRect();
      const deltaX = e.clientX - drag.pivotX;
      const multiplier = drag.wasAlt ? 0.1 : 1.0;
      const deltaValue = (deltaX / rect.width) * (max - min) * multiplier;
      const decimals = Math.max((step.toString().split('.')[1] ?? '').length, drag.wasAlt ? 3 : 0);
      const next = Number(Math.min(max, Math.max(min, drag.pivotValue + deltaValue)).toFixed(decimals));
      handleValueChangeRef.current(next);
    };

    pointerUpHandlerRef.current = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      // ほぼ動いていない場合はクリックとみなしてクリック位置にジャンプ
      if (Math.abs(e.clientX - drag.startX) <= 3) {
        const rect = el.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const decimals = (step.toString().split('.')[1] ?? '').length;
        handleValueChangeRef.current(Number((min + pct * (max - min)).toFixed(decimals)));
      }
      dragStateRef.current = null;
    };

    pointerCancelHandlerRef.current = (e: PointerEvent) => {
      if (dragStateRef.current?.pointerId === e.pointerId) dragStateRef.current = null;
    };

    el.addEventListener('pointerdown', pointerDownHandlerRef.current);
    el.addEventListener('pointermove', pointerMoveHandlerRef.current);
    el.addEventListener('pointerup', pointerUpHandlerRef.current);
    el.addEventListener('pointercancel', pointerCancelHandlerRef.current);
  }, [max, min, step]);

  // スライダーの視覚的な位置は min/max 内に収める
  const pct = max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0;

  return (
    <div className="group/row">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label
            className={`select-none cursor-default font-body ${labelClassName}`}
            onDoubleClick={startEdit}
            title="ダブルクリックで数値を直接入力"
          >
            {label}
          </label>
          {trackId && (
            <AnimationPropertyControls trackId={trackId} label={label} value={value} compact />
          )}
        </div>
        <div className="flex items-center gap-1">
          {defaultValue !== undefined && (
            <button
              onClick={() => isDirty && onChangeRef.current(defaultValue)}
              title={`デフォルト値 (${defaultValue}) にリセット`}
              style={{ width: 40, height: 20, padding: 0, background: 'none' }}
              className={`inline-flex items-center justify-center shrink-0 rounded text-sm transition-opacity ${
                isDirty && !editing
                  ? 'opacity-30 group-hover/row:opacity-100 text-tab-inactive hover:text-k-text cursor-pointer'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              ↺
            </button>
          )}
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditing(false);
              }}
              autoFocus
              className="w-14 bg-k-surface border border-fire rounded-none px-1.5 text-k-text text-xs text-right leading-none outline-none"
            />
          ) : (
            <span
              className="text-xs text-k-text tabular-nums cursor-default select-none min-w-8 text-right"
              onDoubleClick={startEdit}
              title="ダブルクリックで数値を直接入力"
            >
              {displayed}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        ref={rangeCallbackRef}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => { if (!dragStateRef.current) handleValueChange(Number(e.target.value)); }}
        className="w-full slider"
        style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}
