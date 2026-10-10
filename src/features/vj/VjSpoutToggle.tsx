import { Toggle } from '../../components/Toggle';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useSpoutOutput } from '../native/useSpoutOutput';

/** Compact Spout on/off for the VJ toolbar; sender name and frame rate stay in the Export panel. */
export function VjSpoutToggle({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const { t } = useLanguage();
  const { state, setEnabled } = useSpoutOutput(canvasRef);
  if (!state.supported) return null;
  return <label className={`vj-spout${state.status === 'error' ? ' is-error' : ''}`} title={state.lastError ?? t('spout.description')}>
    <span>{t('spout.title')}</span>
    <Toggle variant="switch" size="xs" checked={state.enabled}
      onChange={enabled => void setEnabled(enabled)} ariaLabel={t('spout.enable')} />
    <span className="vj-spout-status" role="status">{t(`spout.status.${state.status}`)}</span>
  </label>;
}
