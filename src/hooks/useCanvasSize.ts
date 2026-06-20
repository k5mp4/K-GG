import { useState, useRef, useEffect } from 'react';

export function useCanvasSize(defaultW = 1920, defaultH = 1080) {
  const [canvasW, setCanvasW] = useState(defaultW);
  const [canvasH, setCanvasH] = useState(defaultH);
  const [lockAspect, setLockAspect] = useState(true);

  // 入力中の一時的な文字列（確定前の編集値を保持する）
  const [wDraft, setWDraft] = useState(String(defaultW));
  const [hDraft, setHDraft] = useState(String(defaultH));

  const aspectRatioRef = useRef(defaultW / defaultH);
  const canvasWRef = useRef(defaultW);
  const canvasHRef = useRef(defaultH);
  const lockAspectRef = useRef(true);
  const wInputRef = useRef<HTMLInputElement>(null);
  const hInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { canvasWRef.current = canvasW; }, [canvasW]);
  useEffect(() => { canvasHRef.current = canvasH; }, [canvasH]);
  useEffect(() => { lockAspectRef.current = lockAspect; }, [lockAspect]);

  // 外部から canvasW/H が変わったとき（プリセットロード・ボタン・matcap切替など）にドラフトも同期
  useEffect(() => { setWDraft(String(canvasW)); }, [canvasW]);
  useEffect(() => { setHDraft(String(canvasH)); }, [canvasH]);

  // W/H 入力のホイールハンドラ（passive: false が必要なので DOM 直接登録）
  useEffect(() => {
    const clamp = (v: number) => Math.max(1, Math.min(3840, v));
    const onWheelW = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const v = clamp(canvasWRef.current + (e.deltaY < 0 ? step : -step));
      setCanvasW(v);
      if (lockAspectRef.current) setCanvasH(clamp(Math.round(v / aspectRatioRef.current)));
    };
    const onWheelH = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const v = clamp(canvasHRef.current + (e.deltaY < 0 ? step : -step));
      setCanvasH(v);
      if (lockAspectRef.current) setCanvasW(clamp(Math.round(v * aspectRatioRef.current)));
    };
    const wEl = wInputRef.current;
    const hEl = hInputRef.current;
    wEl?.addEventListener('wheel', onWheelW, { passive: false });
    hEl?.addEventListener('wheel', onWheelH, { passive: false });
    return () => {
      wEl?.removeEventListener('wheel', onWheelW);
      hEl?.removeEventListener('wheel', onWheelH);
    };
  }, []);

  return {
    canvasW, setCanvasW,
    canvasH, setCanvasH,
    lockAspect, setLockAspect,
    aspectRatioRef,
    wInputRef, hInputRef,
    wDraft, setWDraft,
    hDraft, setHDraft,
  };
}
