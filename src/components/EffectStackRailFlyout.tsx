import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { EffectStackKind } from '../types/distortion';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { EFFECT_STACK_LABELS, EFFECT_STACK_RAIL_ABBREVIATIONS, effectDescriptionKey } from '../features/effectStack/effectStackLabels';

/** Width the hovered rail icon stretches to. */
const FLYOUT_WIDTH = 340;

export type RailFlyoutAnchor = {
  kind: EffectStackKind;
  enabled: boolean;
  selected: boolean;
  statusKey: MessageKey;
  statusClassName: string;
  /** The icon's box in viewport coordinates. */
  rect: { left: number; top: number; width: number; height: number };
};

/**
 * The detail card a rail icon stretches into while hovered or focused.
 * It is drawn over the workspace (outside the scrolling rail) and ignores the pointer,
 * so the icon square stays the only hit area.
 */
export function EffectStackRailFlyout({ anchor }: { anchor: RailFlyoutAnchor }) {
  const { t } = useLanguage();
  const { rect } = anchor;
  // Stretch toward the side with room; the rail normally sits at the left edge.
  const openLeft = rect.left + FLYOUT_WIDTH > window.innerWidth - 8 && rect.left + rect.width - FLYOUT_WIDTH >= 8;
  const style = {
    top: rect.top,
    left: openLeft ? rect.left + rect.width - FLYOUT_WIDTH : rect.left,
    width: FLYOUT_WIDTH,
    minHeight: rect.height,
    '--rail-icon-width': `${rect.width}px`,
    '--rail-icon-height': `${rect.height}px`,
  } as CSSProperties;

  return createPortal(
    <div
      aria-hidden="true"
      className="effect-stack-rail-flyout"
      data-side={openLeft ? 'left' : 'right'}
      data-enabled={anchor.enabled ? 'true' : 'false'}
      data-selected={anchor.selected ? 'true' : 'false'}
      data-effect-stack-flyout={anchor.kind}
      style={style}
    >
      <span className="effect-stack-rail-flyout__icon">
        {EFFECT_STACK_RAIL_ABBREVIATIONS[anchor.kind]}
      </span>
      <span className="effect-stack-rail-flyout__body">
        <span className="effect-stack-rail-flyout__head">
          <span className="effect-stack-rail-flyout__name">{EFFECT_STACK_LABELS[anchor.kind]}</span>
          <span className={`effect-stack-rail-flyout__status ${anchor.statusClassName}`}>{t(anchor.statusKey)}</span>
        </span>
        <span className="effect-stack-rail-flyout__description">{t(effectDescriptionKey(anchor.kind))}</span>
      </span>
    </div>,
    document.body,
  );
}
