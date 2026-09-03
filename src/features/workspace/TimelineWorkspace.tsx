import type { PointerEvent, RefObject } from 'react';
import { Collapsible } from '../../components/Collapsible';
import { PanelEdgeToggle } from '../../components/PanelEdgeToggle';
import { TimelineBar } from '../../components/TimelineBar';
import type { ExportStage } from '../../adapters';
import type { AnimationLoop } from '../../lib/animation';
import type { MessageKey } from '../../i18n/messages';

export type TimelineWorkspaceProps = {
  isOpen: boolean;
  height: number;
  animationEnabled: boolean;
  showTimeRemap: boolean;
  exportProgress: number | null;
  exportStage: ExportStage;
  selectedEffectPrefix: string | undefined;
  animLoopRef: RefObject<AnimationLoop | null>;
  translate: (key: MessageKey) => string;
  onSeek: () => void;
  onToggleTimeRemap: () => void;
  onToggle: () => void;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
};

export function TimelineWorkspace({
  isOpen,
  height,
  animationEnabled,
  showTimeRemap,
  exportProgress,
  exportStage,
  selectedEffectPrefix,
  animLoopRef,
  translate,
  onSeek,
  onToggleTimeRemap,
  onToggle,
  onResizeStart,
}: TimelineWorkspaceProps) {
  return (
    <div className="relative z-20 shrink-0">
      <Collapsible isOpen={isOpen}>
        <div id="animation-timeline-panel" className="relative group/timeline border-t border-panel-border bg-k-bg/95">
          <div
            className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-[70] hover:bg-fire/40 transition-colors"
            onPointerDown={onResizeStart}
          />
          <div className="flex min-h-0" style={{ height }}>
            <div className="min-w-0 flex-1">
              <TimelineBar
                animLoopRef={animLoopRef}
                onSeek={onSeek}
                exportProgress={exportProgress}
                exportStage={exportStage}
                height={height}
                showTimeRemap={showTimeRemap}
                onToggleTimeRemap={onToggleTimeRemap}
                selectedEffectPrefix={selectedEffectPrefix}
              />
            </div>
          </div>
        </div>
      </Collapsible>
      <PanelEdgeToggle
        edge="bottom"
        open={isOpen}
        panelTitle={translate('animation.title')}
        controlsId="animation-timeline-panel"
        onToggle={onToggle}
      >
        <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-k-text">
          {translate('animation.title')}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${animationEnabled ? 'bg-emerald-400' : 'bg-k-muted'}`}
          aria-hidden="true"
        />
      </PanelEdgeToggle>
    </div>
  );
}
