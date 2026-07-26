import { useState, useRef, useEffect } from 'react';

export const CANVAS_SIZE_WHEEL_ARM_DELAY_MS = 2000;

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
  const wheelArmedRef = useRef({ w: false, h: false });
  const wheelTimersRef = useRef<{
    w: ReturnType<typeof setTimeout> | null;
    h: ReturnType<typeof setTimeout> | null;
  }>({ w: null, h: null });

  useEffect(() => { canvasWRef.current = canvasW; }, [canvasW]);
  useEffect(() => { canvasHRef.current = canvasH; }, [canvasH]);
  useEffect(() => { lockAspectRef.current = lockAspect; }, [lockAspect]);

  // 外部から canvasW/H が変わったとき（プリセットロード・ボタン・matcap切替など）にドラフトも同期
  useEffect(() => { setWDraft(String(canvasW)); }, [canvasW]);
  useEffect(() => { setHDraft(String(canvasH)); }, [canvasH]);

  // W/H 入力のホイールハンドラ（passive: false が必要なので DOM 直接登録）。
  // 誤操作を避けるため、入力へ2秒ホバーした後だけホイール変更を有効にする。
  useEffect(() => {
    const clamp = (v: number) => Math.max(1, Math.min(3840, v));
    const arm = (axis: 'w' | 'h') => {
      const timer = wheelTimersRef.current[axis];
      if (timer) clearTimeout(timer);
      wheelArmedRef.current[axis] = false;
      wheelTimersRef.current[axis] = setTimeout(() => {
        wheelArmedRef.current[axis] = true;
        wheelTimersRef.current[axis] = null;
      }, CANVAS_SIZE_WHEEL_ARM_DELAY_MS);
    };
    const disarm = (axis: 'w' | 'h') => {
      const timer = wheelTimersRef.current[axis];
      if (timer) clearTimeout(timer);
      wheelTimersRef.current[axis] = null;
      wheelArmedRef.current[axis] = false;
    };
    const onWheelW = (e: WheelEvent) => {
      e.preventDefault();
      if (!wheelArmedRef.current.w) return;
      const step = e.shiftKey ? 10 : 1;
      const v = clamp(canvasWRef.current + (e.deltaY < 0 ? step : -step));
      setCanvasW(v);
      if (lockAspectRef.current) setCanvasH(clamp(Math.round(v / aspectRatioRef.current)));
    };
    const onWheelH = (e: WheelEvent) => {
      e.preventDefault();
      if (!wheelArmedRef.current.h) return;
      const step = e.shiftKey ? 10 : 1;
      const v = clamp(canvasHRef.current + (e.deltaY < 0 ? step : -step));
      setCanvasH(v);
      if (lockAspectRef.current) setCanvasW(clamp(Math.round(v * aspectRatioRef.current)));
    };
    const wEl = wInputRef.current;
    const hEl = hInputRef.current;
    const onEnterW = () => arm('w');
    const onLeaveW = () => disarm('w');
    const onEnterH = () => arm('h');
    const onLeaveH = () => disarm('h');
    wEl?.addEventListener('pointerenter', onEnterW);
    wEl?.addEventListener('pointerleave', onLeaveW);
    hEl?.addEventListener('pointerenter', onEnterH);
    hEl?.addEventListener('pointerleave', onLeaveH);
    wEl?.addEventListener('wheel', onWheelW, { passive: false });
    hEl?.addEventListener('wheel', onWheelH, { passive: false });
    return () => {
      disarm('w');
      disarm('h');
      wEl?.removeEventListener('pointerenter', onEnterW);
      wEl?.removeEventListener('pointerleave', onLeaveW);
      hEl?.removeEventListener('pointerenter', onEnterH);
      hEl?.removeEventListener('pointerleave', onLeaveH);
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
