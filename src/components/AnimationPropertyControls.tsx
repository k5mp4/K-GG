import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { getTrackMode, type AnimationMode } from '../types/keyframe';
import { isAutoCapableProperty } from '../lib/animationRegistry';
import { getTimelineTime, setTimelineTime } from '../lib/timelineClock';
import { getKeyframeEditTime } from '../lib/loopKeyframes';
import { renderBridge } from '../lib/renderBridge';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = {
  trackId: string;
  label: string;
  value: number;
  compact?: boolean;
};

export function AnimationPropertyControls({ trackId, label, value, compact = false }: Props) {
  const { t } = useLanguage();
  const { animation, keyframeTracks } = useGradientStore();
  const { setTrackMode, addKeyframe, removeKeyframe } = applicationCommands;
  const track = keyframeTracks[trackId];
  const mode = getTrackMode(track);
  const autoCapable = isAutoCapableProperty(trackId);
  const loopEnabled = animation.previewLoop ?? true;
  const displayTime = getKeyframeEditTime(
    getTimelineTime(useGradientStore.getState().currentTime),
    loopEnabled,
  );
  const keyAtTime = track?.keyframes.find(keyframe => Math.abs(keyframe.time - displayTime) < 0.005);

  const changeMode = (nextMode: AnimationMode) => {
    const time = getKeyframeEditTime(
      getTimelineTime(useGradientStore.getState().currentTime),
      loopEnabled,
    );
    setTrackMode(trackId, nextMode, { label, value, time });
  };

  const toggleKeyAtTime = () => {
    const time = getKeyframeEditTime(
      getTimelineTime(useGradientStore.getState().currentTime),
      loopEnabled,
    );
    const currentTrack = useGradientStore.getState().keyframeTracks[trackId];
    const currentKey = currentTrack?.keyframes.find(keyframe => Math.abs(keyframe.time - time) < 0.005);
    if (currentKey) {
      removeKeyframe(trackId, currentKey.id);
      return;
    }
    if (mode !== 'keys') {
      setTrackMode(trackId, 'keys', { label, value, time });
      return;
    }
    addKeyframe(trackId, { time, value, interpolation: 'linear' });
  };

  const moveToKey = (direction: -1 | 1) => {
    const time = getKeyframeEditTime(
      getTimelineTime(useGradientStore.getState().currentTime),
      loopEnabled,
    );
    const keys = [...(useGradientStore.getState().keyframeTracks[trackId]?.keyframes ?? [])]
      .sort((a, b) => a.time - b.time);
    const target = direction < 0
      ? [...keys].reverse().find(keyframe => keyframe.time < time - 0.0001)
      : keys.find(keyframe => keyframe.time > time + 0.0001);
    if (!target) return;
    setTimelineTime(target.time);
    renderBridge.seekTo(target.time);
  };

  const modeColor = mode === 'auto'
    ? 'border-emerald-400/60 text-emerald-300 bg-emerald-400/10'
    : mode === 'keys'
      ? 'border-fire/70 text-fire bg-fire/10'
      : 'border-k-muted/50 text-tab-inactive bg-k-bg';

  return (
    <div
      className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}
      title={animation.enabled ? t('animation.mode', { label }) : t('animation.disabledRetained')}
    >
      <select
        aria-label={t('animation.mode', { label })}
        value={mode}
        onChange={event => changeMode(event.target.value as AnimationMode)}
        className={`${compact ? 'h-4 w-[42px] px-0 text-[7px]' : 'h-5 max-w-[54px] px-1 text-[9px]'} border font-display font-semibold uppercase tracking-wide outline-none ${modeColor}`}
      >
        <option value="static">{t('animation.mode.static')}</option>
        {autoCapable && <option value="auto">{t('animation.mode.auto')}</option>}
        <option value="keys">{t('animation.mode.keys')}</option>
      </select>
      <button
        type="button"
        onClick={() => moveToKey(-1)}
        disabled={!track?.keyframes.length}
        aria-label={t('animation.previousKey', { label })}
        title={t('animation.previousKey', { label })}
        className={`${compact ? 'h-4 w-3 text-[9px]' : 'h-5 w-4 text-[11px]'} bg-transparent p-0 text-tab-inactive hover:text-k-text disabled:opacity-25`}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={toggleKeyAtTime}
        aria-label={keyAtTime ? t('animation.removeKey', { label }) : t('animation.addKey', { label })}
        title={keyAtTime ? t('animation.removeKey', { label }) : t('animation.addKey', { label })}
        className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} flex items-center justify-center bg-transparent p-0 transition-colors ${
          mode === 'keys' ? 'text-fire hover:text-cream' : 'text-k-muted hover:text-fire'
        }`}
      >
        <span className={`${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'} rotate-45 border ${
          keyAtTime ? 'border-fire bg-fire' : 'border-current bg-transparent'
        }`} />
      </button>
      <button
        type="button"
        onClick={() => moveToKey(1)}
        disabled={!track?.keyframes.length}
        aria-label={t('animation.nextKey', { label })}
        title={t('animation.nextKey', { label })}
        className={`${compact ? 'h-4 w-3 text-[9px]' : 'h-5 w-4 text-[11px]'} bg-transparent p-0 text-tab-inactive hover:text-k-text disabled:opacity-25`}
      >
        ›
      </button>
    </div>
  );
}
