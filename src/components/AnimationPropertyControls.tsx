import { useGradientStore } from '../store/gradientStore';
import { getTrackMode, type AnimationMode } from '../types/keyframe';
import { isAutoCapableProperty } from '../lib/animationRegistry';
import { getTimelineTime, setTimelineTime } from '../lib/timelineClock';
import { renderBridge } from '../lib/renderBridge';

type Props = {
  trackId: string;
  label: string;
  value: number;
  compact?: boolean;
};

export function AnimationPropertyControls({ trackId, label, value, compact = false }: Props) {
  const { animation, keyframeTracks, setTrackMode, addKeyframe, removeKeyframe } = useGradientStore();
  const track = keyframeTracks[trackId];
  const mode = getTrackMode(track);
  const autoCapable = isAutoCapableProperty(trackId);
  const displayTime = getTimelineTime(useGradientStore.getState().currentTime);
  const keyAtTime = track?.keyframes.find(keyframe => Math.abs(keyframe.time - displayTime) < 0.005);

  const changeMode = (nextMode: AnimationMode) => {
    const time = getTimelineTime(useGradientStore.getState().currentTime);
    setTrackMode(trackId, nextMode, { label, value, time });
  };

  const toggleKeyAtTime = () => {
    const time = getTimelineTime(useGradientStore.getState().currentTime);
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
    const time = getTimelineTime(useGradientStore.getState().currentTime);
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
      title={animation.enabled ? `${label} animation mode` : 'Animation is disabled; the mode is retained'}
    >
      <select
        aria-label={`${label} animation mode`}
        value={mode}
        onChange={event => changeMode(event.target.value as AnimationMode)}
        className={`${compact ? 'h-4 w-[42px] px-0 text-[7px]' : 'h-5 max-w-[54px] px-1 text-[9px]'} border font-display font-semibold uppercase tracking-wide outline-none ${modeColor}`}
      >
        <option value="static">Static</option>
        {autoCapable && <option value="auto">Auto</option>}
        <option value="keys">Keys</option>
      </select>
      <button
        type="button"
        onClick={() => moveToKey(-1)}
        disabled={!track?.keyframes.length}
        aria-label={`${label} previous keyframe`}
        title="前のキー"
        className={`${compact ? 'h-4 w-3 text-[9px]' : 'h-5 w-4 text-[11px]'} bg-transparent p-0 text-tab-inactive hover:text-k-text disabled:opacity-25`}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={toggleKeyAtTime}
        aria-label={keyAtTime ? `${label} keyframeを削除` : `${label} keyframeを追加`}
        title={keyAtTime ? '現在時刻のキーを削除' : '現在時刻にキーを追加'}
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
        aria-label={`${label} next keyframe`}
        title="次のキー"
        className={`${compact ? 'h-4 w-3 text-[9px]' : 'h-5 w-4 text-[11px]'} bg-transparent p-0 text-tab-inactive hover:text-k-text disabled:opacity-25`}
      >
        ›
      </button>
    </div>
  );
}
