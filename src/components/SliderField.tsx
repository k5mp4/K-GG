import { useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { InputAngle, InputNumber } from 'tweeq';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { getTimelineTime, getTimelineTimeSnapshot, subscribeTimelineTime } from '../lib/timelineClock';
import { interpolateKeyframesWithLoop, getKeyframeEditTime } from '../lib/loopKeyframes';
import { inferFormatInfo } from '../lib/tweeqNumberFormat';
import { getTweeqValuePosition } from '../lib/tweeqNumberPosition';
import { fromTweeqAngle, toTweeqAngle } from '../lib/tweeqAngle';
import { getTrackMode } from '../types/keyframe';
import { AnimationPropertyControls } from './AnimationPropertyControls';
import type { ParameterLimitKey } from '../lib/parameterLimits';
import { getParameterLimit, wrapAngleDegrees, wrapAngleRadians } from '../lib/parameterLimits';
import { clampSliderValue, isSliderValueOutOfRange } from '../lib/sliderValue';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';

type Props = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  labelClassName?: string;
  defaultValue?: number;
  trackId?: string;
  control?: 'number' | 'angle';
  angleUnit?: 'degrees' | 'radians';
  limitKey?: ParameterLimitKey;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
};

function decimalPlaces(value: number): number {
  const text = String(value);
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
}

const noopSubscribe = () => () => {};
const zeroSnapshot = () => 0;

export function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
  labelClassName = 'text-xs text-deep',
  defaultValue,
  trackId,
  control = 'number',
  angleUnit = 'degrees',
  limitKey,
  compact = false,
  disabled = false,
  className = '',
}: Props) {
  const { language, t } = useLanguage();
  const localizedLabel = localizeUiLabel(label, language);
  const { keyframeTracks, currentTime, animation } = useGradientStore();
  const { addKeyframe, setKeyframe } = applicationCommands;
  const track = trackId ? keyframeTracks[trackId] : null;
  const isKeyframed = getTrackMode(track) === 'keys';
  const loopEnabled = animation.previewLoop ?? true;
  useSyncExternalStore(
    isKeyframed ? subscribeTimelineTime : noopSubscribe,
    isKeyframed ? getTimelineTimeSnapshot : zeroSnapshot,
    isKeyframed ? getTimelineTimeSnapshot : zeroSnapshot,
  );
  const timelineTime = getTimelineTime(currentTime);
  const configuredLimit = limitKey ? getParameterLimit(limitKey) : null;
  const effectiveMin = configuredLimit?.min ?? min;
  const effectiveMax = configuredLimit?.max ?? max;
  const effectiveStep = configuredLimit?.step ?? step;
  const [inputRevision, setInputRevision] = useState(0);
  const inputOutOfRangeRef = useRef(false);
  const formatInfo = useMemo(
    () => inferFormatInfo(format, value, effectiveMin, effectiveMax, effectiveStep),
    [effectiveMax, effectiveMin, effectiveStep, format, value],
  );

  const toDisplay = (modelValue: number) => (
    formatInfo ? formatInfo.scale * modelValue + formatInfo.offset : modelValue
  );
  const toModel = (displayValue: number) => (
    formatInfo ? (displayValue - formatInfo.offset) / formatInfo.scale : displayValue
  );
  const lowerBound = Math.min(effectiveMin, effectiveMax);
  const upperBound = Math.max(effectiveMin, effectiveMax);
  const boundedValue = Number.isFinite(value)
    ? control === 'angle'
      ? angleUnit === 'radians' ? wrapAngleRadians(value) : wrapAngleDegrees(value)
      : clampSliderValue(value, lowerBound, upperBound)
    : lowerBound;
  const liveValue = isKeyframed && track && track.keyframes.length > 0
    ? interpolateKeyframesWithLoop(timelineTime, track.keyframes, loopEnabled)
    : boundedValue;
  const boundedLiveValue = Number.isFinite(liveValue)
    ? control === 'angle'
      ? angleUnit === 'radians' ? wrapAngleRadians(liveValue) : wrapAngleDegrees(liveValue)
      : clampSliderValue(liveValue, lowerBound, upperBound)
    : boundedValue;
  const inputValue = isKeyframed && Boolean(track?.keyframes.length) ? boundedLiveValue : boundedValue;
  const angleDegrees = angleUnit === 'radians' ? inputValue * 180 / Math.PI : inputValue;
  const angleInputValue = control === 'angle' ? toTweeqAngle(angleDegrees) : inputValue;
  const displayed = format
    ? format(control === 'angle' ? angleDegrees : inputValue)
    : String(control === 'angle' ? angleDegrees : inputValue);
  const isDirty = defaultValue !== undefined && Math.abs(boundedValue - defaultValue) > 1e-9;

  // Auto-keyframing remains at the K-GG adapter boundary; Tweeq only owns the input gesture.
  const handleValueChange = (displayValue: number) => {
    if (disabled) return;
    const rawAngleDegrees = control === 'angle' ? fromTweeqAngle(displayValue) : 0;
    const rawNext = control === 'angle'
      ? angleUnit === 'radians' ? rawAngleDegrees * Math.PI / 180 : rawAngleDegrees
      : toModel(displayValue);
    if (!Number.isFinite(rawNext)) return;
    if (control !== 'angle') {
      const outOfRange = isSliderValueOutOfRange(rawNext, lowerBound, upperBound);
      if (outOfRange && !inputOutOfRangeRef.current) {
        // Tweeq updates its internal draft before invoking onChange. Remounting
        // once at the boundary replaces that draft with the clamped controlled value.
        inputOutOfRangeRef.current = true;
        setInputRevision(revision => revision + 1);
      } else if (!outOfRange) {
        inputOutOfRangeRef.current = false;
      }
    }
    const next = control === 'angle'
      ? angleUnit === 'radians' ? wrapAngleRadians(rawNext) : wrapAngleDegrees(rawNext)
      : clampSliderValue(rawNext, lowerBound, upperBound);

    if (isKeyframed && trackId) {
      const state = useGradientStore.getState();
      const currentTrack = state.keyframeTracks[trackId];
      const editTime = getKeyframeEditTime(
        getTimelineTime(state.currentTime),
        state.animation.previewLoop ?? true,
      );
      const existingKf = currentTrack?.keyframes.find(k => Math.abs(k.time - editTime) < 0.005);
      if (existingKf) {
        setKeyframe(trackId, { id: existingKf.id, value: next });
      } else {
        addKeyframe(trackId, { time: editTime, value: next, interpolation: 'linear' });
      }
    }
    onChange(next);
  };

  const displayValue = toDisplay(inputValue);
  const displayMin = toDisplay(effectiveMin);
  const displayMax = toDisplay(effectiveMax);
  const displayStep = Math.abs((formatInfo?.scale ?? 1) * effectiveStep) || effectiveStep;
  const displayDefault = defaultValue === undefined
    ? undefined
    : control === 'angle'
      ? toTweeqAngle(angleUnit === 'radians' ? defaultValue * 180 / Math.PI : defaultValue)
      : toDisplay(defaultValue);
  const displayBar = formatInfo ? toDisplay(0) : 0;
  const valuePosition = getTweeqValuePosition(
    displayValue,
    Math.min(displayMin, displayMax),
    Math.max(displayMin, displayMax),
  );
  const numberShellStyle = { '--tq-value-position': `${valuePosition * 100}%` } as CSSProperties;

  return (
    <div className={`group/row ${compact ? 'flex min-w-0 items-center gap-1' : ''} ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className={`${compact ? 'mb-0 shrink-0' : 'mb-1.5'} flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <label
            className={`select-none cursor-default font-body ${labelClassName}`}
            title={t('input.editNumber')}
          >
            {localizedLabel}
          </label>
          {trackId && (
            <AnimationPropertyControls trackId={trackId} label={localizedLabel} value={value} compact />
          )}
        </div>
        {defaultValue !== undefined && (
          <button
            type="button"
            onClick={() => isDirty && handleValueChange(
              control === 'angle'
                ? toTweeqAngle(angleUnit === 'radians' ? defaultValue * 180 / Math.PI : defaultValue)
                : toDisplay(defaultValue),
            )}
            title={t('input.resetDefault', { value: defaultValue })}
            style={{ width: 40, height: 20, padding: 0, background: 'none' }}
            className={`inline-flex items-center justify-center shrink-0 rounded text-sm transition-opacity ${
              isDirty && !disabled
                ? 'opacity-30 group-hover/row:opacity-100 text-tab-inactive hover:text-k-text cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            ↺
          </button>
        )}
      </div>
      {control === 'angle' ? (
        <div className={`${compact ? 'w-[112px]' : 'w-full'} tq-input-angle ${disabled ? 'pointer-events-none' : ''}`} title={displayed}>
          <InputAngle
            value={angleInputValue}
            snap={15}
            angleOffset={-90}
            onChange={handleValueChange}
          />
        </div>
      ) : (
        <div className={`${compact ? 'w-[118px]' : 'w-full'} tq-input-number-shell ${disabled ? 'pointer-events-none' : ''}`} style={numberShellStyle}>
          <InputNumber
            key={`bounded-input-${inputRevision}`}
            className="tq-input-number w-full"
            value={displayValue}
            min={Math.min(displayMin, displayMax)}
            max={Math.max(displayMin, displayMax)}
            step={displayStep}
            precision={formatInfo?.precision ?? Math.max(2, decimalPlaces(displayStep))}
            prefix={formatInfo?.prefix}
            suffix={formatInfo?.suffix}
            bar={displayBar}
            clampMin
            clampMax
            default={displayDefault}
            aria-label={`${localizedLabel}: ${displayed}`}
            title={displayed}
            aria-disabled={disabled}
            onChange={handleValueChange}
          />
        </div>
      )}
    </div>
  );
}
