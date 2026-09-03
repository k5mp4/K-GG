import { useEffect, useRef } from 'react';
import { getConeApexCanvasPoint } from '../lib/coneView';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { CONE_APEX_LIMIT } from '../types/coneView';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = {
  width: number;
  height: number;
  visible?: boolean;
};

function clampApex(value: number): number {
  return Math.max(-CONE_APEX_LIMIT, Math.min(CONE_APEX_LIMIT, value));
}

export function ConeApexEditor({ width, height, visible = true }: Props) {
  const { t } = useLanguage();
  const { coneView } = useGradientStore();
  const { setConeView } = applicationCommands;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const cleanupDragRef = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    cleanupDragRef.current?.();
    draggingRef.current = false;
  }, []);

  if (!visible) return null;

  const position = getConeApexCanvasPoint(width, height, coneView.apexX, coneView.apexY);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const visualX = rect.width * (0.5 + coneView.apexX * 0.5);
    const visualY = rect.height * (0.5 - coneView.apexY * 0.5);
    const grabOffsetX = event.clientX - rect.left - visualX;
    const grabOffsetY = event.clientY - rect.top - visualY;
    draggingRef.current = true;

    const updatePosition = (clientX: number, clientY: number) => {
      const currentRect = container.getBoundingClientRect();
      if (currentRect.width <= 0 || currentRect.height <= 0) return;
      const x = (clientX - currentRect.left - grabOffsetX) / currentRect.width;
      const y = (clientY - currentRect.top - grabOffsetY) / currentRect.height;
      setConeView({
        apexX: clampApex((x - 0.5) * 2),
        apexY: clampApex((0.5 - y) * 2),
      });
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (draggingRef.current) updatePosition(moveEvent.clientX, moveEvent.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      cleanupDragRef.current = null;
    };

    cleanupDragRef.current = onUp;

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
  };

  return (
    <div
      ref={containerRef}
      data-cone-apex-editor
      aria-label={t('cone.apexPosition')}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 25 }}
    >
      <button
        type="button"
        data-cone-apex-anchor
        aria-label={t('cone.dragApex')}
        title={t('cone.dragApex')}
        onPointerDown={handlePointerDown}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: 22,
          height: 22,
          transform: 'translate(-50%, -50%)',
          border: '2px solid #071b24',
          borderRadius: '50%',
          background: '#56e0f5',
          boxShadow: '0 2px 8px rgba(7,27,36,0.45)',
          cursor: 'grab',
          pointerEvents: 'auto',
          touchAction: 'none',
          padding: 0,
        }}
      />
    </div>
  );
}
