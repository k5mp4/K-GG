import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { InputAngle, InputNumber } from 'tweeq';
import { useGradientStore } from '../store/gradientStore';
import { getTimelineTime } from '../lib/timelineClock';
import { inferFormatInfo } from '../lib/tweeqNumberFormat';
import { getTweeqValuePosition } from '../lib/tweeqNumberPosition';
import { fromTweeqAngle, toTweeqAngle } from '../lib/tweeqAngle';
import { getTrackMode } from '../types/keyframe';
import { AnimationPropertyControls } from './AnimationPropertyControls';
import type { ParameterLimitKey } from '../lib/parameterLimits';
import { getParameterLimit, wrapAngleDegrees, wrapAngleRadians } from '../lib/parameterLimits';
import { clampSliderValue, isSliderValueOutOfRange } from '../lib/sliderValue';

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
};

function decimalPlaces(value: number): number {
  const text = String(value);
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
}

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
}: Props) {
  const { keyframeTracks, addKeyframe, setKeyframe } = useGradientStore();
  const track = trackId ? keyframeTracks[trackId] : null;
  const isKeyframed = getTrackMode(track) === 'keys';
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
  const angleDegrees = angleUnit === 'radians' ? boundedValue * 180 / Math.PI : boundedValue;
  const angleInputValue = control === 'angle' ? toTweeqAngle(angleDegrees) : boundedValue;
  const displayed = format
    ? format(control === 'angle' ? angleDegrees : boundedValue)
    : String(control === 'angle' ? angleDegrees : boundedValue);
  const isDirty = defaultValue !== undefined && Math.abs(boundedValue - defaultValue) > 1e-9;

  // Auto-keyframing remains at the K-GG adapter boundary; Tweeq only owns the input gesture.
  const handleValueChange = (displayValue: number) => {
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
    onChange(next);

    if (isKeyframed && trackId && track) {
      const nt = getTimelineTime(useGradientStore.getState().currentTime);
      const existingKf = track.keyframes.find(k => Math.abs(k.time - nt) < 0.01);
      if (existingKf) {
        setKeyframe(trackId, { id: existingKf.id, value: next });
      } else {
        addKeyframe(trackId, { time: nt, value: next, interpolation: 'linear' });
      }
    }
  };

  const displayValue = toDisplay(boundedValue);
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
    <div className="group/row">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label
            className={`select-none cursor-default font-body ${labelClassName}`}
            title="Tweeqの数値フィールドをドラッグまたはクリックして編集"
          >
            {label}
          </label>
          {trackId && (
            <AnimationPropertyControls trackId={trackId} label={label} value={value} compact />
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
            title={`デフォルト値 (${defaultValue}) にリセット`}
            style={{ width: 40, height: 20, padding: 0, background: 'none' }}
            className={`inline-flex items-center justify-center shrink-0 rounded text-sm transition-opacity ${
              isDirty
                ? 'opacity-30 group-hover/row:opacity-100 text-tab-inactive hover:text-k-text cursor-pointer'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            ↺
          </button>
        )}
      </div>
      {control === 'angle' ? (
        <div className="tq-input-angle w-full" title={displayed}>
          <InputAngle
            value={angleInputValue}
            snap={15}
            angleOffset={-90}
            onChange={handleValueChange}
          />
        </div>
      ) : (
        <div className="tq-input-number-shell" style={numberShellStyle}>
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
            aria-label={`${label}: ${displayed}`}
            title={displayed}
            onBlur={() => handleValueChange(displayValue)}
            onChange={handleValueChange}
          />
        </div>
      )}
    </div>
  );
}
