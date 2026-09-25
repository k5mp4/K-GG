import { useEffect, useState } from 'react';
import { InputRadio, InputString } from 'tweeq';
import { useLanguage } from '../i18n/LanguageProvider';
import { useSpoutOutput } from '../features/native/useSpoutOutput';
import { SPOUT_FRAME_RATES, validateSpoutSenderName, type SpoutOutputStatus } from '../lib/spoutOutput';
import { Toggle } from './Toggle';

type Props = {
  /** The processed 2D preview canvas (not the Cloth/Cone display canvas). */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

const FRAME_RATE_LABELS = SPOUT_FRAME_RATES.map(rate => `${rate} FPS`);

const STATUS_DOT: Record<SpoutOutputStatus, string> = {
  checking: 'bg-k-muted',
  unsupported: 'bg-k-muted',
  off: 'bg-k-muted',
  starting: 'bg-yellow-400',
  ready: 'bg-yellow-400',
  sending: 'bg-emerald-400',
  error: 'bg-red-500',
};

export function SpoutOutputPanel({ canvasRef }: Props) {
  const { t } = useLanguage();
  const { state, setEnabled, setSenderName, setTargetFps } = useSpoutOutput(canvasRef);
  const [nameDraft, setNameDraft] = useState(state.senderName);
  useEffect(() => setNameDraft(state.senderName), [state.senderName]);
  const nameInvalid = validateSpoutSenderName(nameDraft) !== null;
  const commitName = () => {
    if (nameInvalid) return;
    setSenderName(nameDraft);
  };
  const renamed = state.activeSenderName !== null && state.activeSenderName !== state.senderName;

  return (
    <section className="space-y-3 border-t border-panel-border border-t-panel pt-4" aria-labelledby="spout-output-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="spout-output-title" className="font-display text-xs font-semibold uppercase tracking-wider text-k-text">{t('spout.title')}</h3>
        <span className="flex items-center gap-1.5 text-[10px] text-deep" role="status" aria-live="polite">
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[state.status]}`} aria-hidden="true" />
          {t(`spout.status.${state.status}`)}
        </span>
      </div>

      {!state.supported ? (
        <p className="border border-panel-border bg-k-surface px-2.5 py-2 text-[10px] leading-relaxed text-deep">
          {state.status === 'checking' ? t('common.checking') : t('spout.unsupported')}
        </p>
      ) : (
        <>
          <p className="text-[10px] leading-relaxed text-tab-inactive">{t('spout.description')}</p>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Toggle variant="switch" size="xs" checked={state.enabled} onChange={(enabled) => void setEnabled(enabled)} ariaLabel={t('spout.enable')} />
            <span className="text-xs text-k-text/80">{t('spout.enable')}</span>
          </label>

          <div className="space-y-1">
            <p className="text-xs text-deep">{t('spout.senderName')}</p>
            <InputString
              value={nameDraft}
              onChange={setNameDraft}
              onConfirm={commitName}
              onBlur={commitName}
              invalid={nameInvalid}
              aria-label={t('spout.senderName')}
              className="w-full"
            />
            {nameInvalid && <p className="text-[10px] text-red-400">{t('spout.senderNameInvalid')}</p>}
            {renamed && <p className="text-[10px] text-yellow-400">{t('spout.registeredAs', { name: state.activeSenderName ?? '' })}</p>}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-deep">{t('spout.frameRate')}</p>
            <InputRadio
              value={state.targetFps}
              options={SPOUT_FRAME_RATES}
              labels={FRAME_RATE_LABELS}
              onChange={(fps) => fps !== undefined && setTargetFps(fps)}
              aria-label={t('spout.frameRate')}
              className="w-full"
            />
          </div>

          {(state.status === 'sending' || state.status === 'ready') && state.framesSent > 0 && (
            <p className="text-[10px] font-mono text-tab-inactive">
              {t('spout.stats', {
                width: state.width,
                height: state.height,
                fps: state.sendFps,
                sent: state.framesSent,
                dropped: state.framesDropped,
              })}
              <br />
              {t('spout.timings', { readback: state.readbackMs, transfer: state.transferMs })}
            </p>
          )}

          {state.lastError && (
            <p className="border border-red-500/40 bg-red-950/30 px-2.5 py-2 text-[10px] leading-relaxed text-red-300" role="alert">
              {state.lastError}
            </p>
          )}
        </>
      )}
    </section>
  );
}
