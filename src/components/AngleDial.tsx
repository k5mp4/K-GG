import { useRef, useCallback, useState, useEffect } from 'react';

type Props = {
  label: string;
  value: number; // degrees. 0=12時(top), CW=正, CCW=負, range -180~+180
  onChange: (v: number) => void;
  defaultValue?: number;
};

export function AngleDial({ label, value, onChange, defaultValue }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isDirty = defaultValue !== undefined && Math.abs(value - defaultValue) > 0.5;

  function startEdit() {
    setDraft(String(value));
    setEditing(true);
  }

  function commit(raw: string) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // -180~+180 にクランプ後、範囲外なら折り返し
      let v = parsed % 360;
      if (v > 180) v -= 360;
      if (v < -180) v += 360;
      onChangeRef.current(Math.round(v));
    }
    setEditing(false);
  }

  // ポインター位置から時計角度を計算 (0=12時, CW=正, 範囲 -180~+180)
  const angleFromPointer = useCallback((e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    onChangeRef.current(Math.round(deg));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    dragging.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    angleFromPointer(e);
  }, [angleFromPointer]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    angleFromPointer(e);
  }, [angleFromPointer]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ホイールサポート（DOM直接登録）
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);
  const svgCallbackRef = useCallback((el: SVGSVGElement | null) => {
    if (svgRef.current && wheelHandlerRef.current) {
      svgRef.current.removeEventListener('wheel', wheelHandlerRef.current);
    }
    svgRef.current = el;
    if (!el) return;
    wheelHandlerRef.current = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const delta = e.deltaY < 0 ? step : -step;
      let next = valueRef.current + delta;
      if (next > 180) next -= 360;
      if (next < -180) next += 360;
      onChangeRef.current(next);
    };
    el.addEventListener('wheel', wheelHandlerRef.current, { passive: false });
  }, []);

  // SVG描画: 0°=12時, CW=正
  // drawRad: value=0 → 上(-PI/2), value=90 → 右(0), value=-90 → 左(-PI)
  const size = 44;
  const r = 18;
  const cx = size / 2;
  const cy = size / 2;
  const drawRad = (value * Math.PI) / 180 - Math.PI / 2;
  const dotX = cx + r * Math.cos(drawRad);
  const dotY = cy + r * Math.sin(drawRad);

  const displayed = `${value >= 0 ? '+' : ''}${value}°`;

  return (
    <div className="flex items-center gap-3 group/dial">
      {/* Dial */}
      <svg
        ref={svgCallbackRef}
        width={size}
        height={size}
        className="shrink-0 cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <circle cx={cx} cy={cy} r={r + 2} fill="#374151" stroke="#4b5563" strokeWidth="1" />
        {/* 12時ティック */}
        <line x1={cx} y1={cy - r + 3} x2={cx} y2={cy - r - 1} stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={dotX} y2={dotY} stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={2} fill="#6366f1" />
        <circle cx={dotX} cy={dotY} r={3} fill="#6366f1" />
      </svg>

      {/* Label + value + reset */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs text-deep select-none">{label}</span>
          {defaultValue !== undefined && (
            <button
              onClick={() => isDirty && onChangeRef.current(defaultValue)}
              title={`デフォルト値 (${defaultValue}°) にリセット`}
              className={`leading-none text-xs shrink-0 transition-opacity ${isDirty && !editing
                ? 'opacity-0 group-hover/dial:opacity-100 text-tab-inactive hover:text-k-text cursor-pointer'
                : 'opacity-0 pointer-events-none'
              }`}
            >
              ↺
            </button>
          )}
        </div>

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
            className="w-16 bg-k-surface border border-fire rounded-none px-1 text-k-text text-xs leading-none outline-none font-display"
          />
        ) : (
          <span
            className="text-xs text-k-text font-display cursor-default select-none"
            onDoubleClick={startEdit}
            title="ダブルクリックで数値を直接入力"
          >
            {displayed}
          </span>
        )}
      </div>
    </div>
  );
}
