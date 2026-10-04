import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CONTROLLER_PARAMETER_INFO } from '../features/native/useControllerActions';
import { useOscReceiverStatus } from '../features/native/controllerReceiver';
import { useGcActivity } from '../features/native/useGcInput';
import {
  CONTROLLER_AXES,
  CONTROLLER_BUTTONS,
  CONTROLLER_PARAMETER_TARGETS,
  CONTROLLER_PORT_MAX,
  CONTROLLER_PORT_MIN,
  CONTROLLER_SCRUB_SPEED_MAX,
  CONTROLLER_SCRUB_SPEED_MIN,
  DEFAULT_CONTROLLER_SETTINGS,
  MAX_PARAMETER_BINDINGS,
  isValidBpmAddress,
  getControllerSettings,
  subscribeControllerSettings,
  updateControllerSettings,
  type ControllerAxis,
  type ControllerButton,
  type ControllerButtonAction,
  type ControllerParameterBinding,
  type ControllerParameterTarget,
  type ControllerSettings,
} from '../lib/controllerSettings';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

const BUTTON_LABELS: Record<ControllerButton, string> = {
  a: 'A', b: 'B', x: 'X', y: 'Y', start: 'Start', z: 'Z', l: 'L (click)', r: 'R (click)',
  'dpad/left': 'D-Pad ←', 'dpad/right': 'D-Pad →', 'dpad/up': 'D-Pad ↑', 'dpad/down': 'D-Pad ↓',
};

const AXIS_LABELS: Record<ControllerAxis, string> = {
  'stick/x': 'Stick X', 'stick/y': 'Stick Y', 'cstick/x': 'C-Stick X', 'cstick/y': 'C-Stick Y',
  'trigger/l': 'L Trigger', 'trigger/r': 'R Trigger',
};

const NONE = '';

/** Preset以外のボタン操作。Presetの決定は専用の行で扱う。 */
const BUTTON_ACTION_ROWS: { action: ControllerButtonAction; label: string }[] = [
  { action: 'presetConfirm', label: 'Load selected Preset' },
  { action: 'togglePlayback', label: 'Play / Pause' },
  { action: 'resetTime', label: 'Jump to start' },
  { action: 'folderPrev', label: 'Previous folder' },
  { action: 'folderNext', label: 'Next folder' },
  { action: 'folderRoot', label: 'Library root' },
  { action: 'toggleSpout', label: 'Spout output on / off' },
  { action: 'beatRateDown', label: 'Beat slower (×1/4 · ×1/2 · ×1)' },
  { action: 'beatRateUp', label: 'Beat faster (×1 · ×2)' },
];

const buttonOptions = [
  { value: NONE, label: 'None' },
  ...CONTROLLER_BUTTONS.map(button => ({ value: button, label: BUTTON_LABELS[button] })),
];
const axisOptions = CONTROLLER_AXES.map(axis => ({ value: axis, label: AXIS_LABELS[axis] }));
const axisOptionsWithNone = [{ value: NONE, label: 'None' }, ...axisOptions];
const targetOptions = CONTROLLER_PARAMETER_TARGETS.map(target => ({ value: target, label: CONTROLLER_PARAMETER_INFO[target].label }));

function useControllerSettings(): ControllerSettings {
  return useSyncExternalStore(subscribeControllerSettings, getControllerSettings, getControllerSettings);
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-cream">{title}</h3>
        {hint && <p className="mt-0.5 text-[10px] leading-snug text-tab-inactive">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function PortField({ port }: { port: number }) {
  const [text, setText] = useState(String(port));
  useEffect(() => { setText(String(port)); }, [port]);

  const commit = () => {
    const next = Number(text);
    if (Number.isInteger(next) && next >= CONTROLLER_PORT_MIN && next <= CONTROLLER_PORT_MAX) {
      updateControllerSettings({ port: next });
    } else {
      setText(String(port));
    }
  };

  return (
    <label className="flex items-center justify-between gap-3 text-[11px] text-k-text">
      <span>UDP port</span>
      <input
        type="number"
        inputMode="numeric"
        min={CONTROLLER_PORT_MIN}
        max={CONTROLLER_PORT_MAX}
        value={text}
        onChange={event => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        className="w-24 bg-k-surface px-2 py-1 text-right text-[11px] text-k-text outline-none ring-1 ring-cream/15 focus:ring-fire/70"
      />
    </label>
  );
}

function BpmAddressField({ label, field, address, disabled }: {
  label: string;
  field: 'address' | 'resetAddress';
  address: string;
  disabled: boolean;
}) {
  const [text, setText] = useState(address);
  useEffect(() => { setText(address); }, [address]);

  const commit = () => {
    const next = text.trim();
    if (isValidBpmAddress(next)) updateControllerSettings({ bpm: { ...getControllerSettings().bpm, [field]: next } });
    else setText(address);
  };

  return (
    <label className="flex items-center justify-between gap-3 text-[11px] text-k-text">
      <span>{label}</span>
      <input
        type="text"
        value={text}
        disabled={disabled}
        spellCheck={false}
        onChange={event => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        className="w-32 bg-k-surface px-2 py-1 text-right text-[11px] text-k-text outline-none ring-1 ring-cream/15 focus:ring-fire/70 disabled:opacity-50"
      />
    </label>
  );
}

function ReceiverStatus({ enabled }: { enabled: boolean }) {
  const receiver = useOscReceiverStatus();
  const activity = useGcActivity();
  // 受信が約2秒途切れたら「待機中」へ戻す。
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  let text: string;
  let tone = 'text-cream/60';
  if (!receiver.supported) {
    text = 'Available in the desktop app only';
  } else if (receiver.error) {
    text = receiver.error;
    tone = 'text-red-300';
  } else if (!enabled || !receiver.listening) {
    text = 'Off';
  } else if (activity.lastReceivedAt !== null && now - activity.lastReceivedAt < 2000) {
    const ports = activity.ports.length > 0 ? ` · Controller ${activity.ports.join(', ')}` : '';
    text = `Receiving on 127.0.0.1:${receiver.port}${ports}`;
    tone = 'text-emerald-300';
  } else {
    text = `Listening on 127.0.0.1:${receiver.port} · waiting for input`;
    tone = 'text-amber-300';
  }
  return <p role="status" className={`break-words text-[10px] leading-snug ${tone}`}>{text}</p>;
}

function ParameterRow({ binding, onChange, onRemove }: {
  binding: ControllerParameterBinding;
  onChange: (binding: ControllerParameterBinding) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-end gap-1.5">
      <CustomSelect
        className="min-w-0 flex-1"
        label="Input"
        value={binding.source}
        localizeOptions={false}
        localizeLabel={false}
        options={axisOptions}
        onChange={value => onChange({ ...binding, source: value as ControllerAxis })}
      />
      <CustomSelect
        className="min-w-0 flex-[1.4]"
        label="Parameter"
        value={binding.target}
        localizeOptions={false}
        localizeLabel={false}
        options={targetOptions}
        onChange={value => onChange({ ...binding, target: value as ControllerParameterTarget })}
      />
      <button
        type="button"
        aria-label={`Remove ${AXIS_LABELS[binding.source]} mapping`}
        onClick={onRemove}
        className="shrink-0 px-2 py-1.5 text-[12px] text-red-400 hover:text-red-300"
      >
        ×
      </button>
    </div>
  );
}

/** SANDBOXのController。OSC（GameCubeコントローラー）の受信設定と操作の割り当てを編集する。 */
export function ControllerPanel() {
  const settings = useControllerSettings();
  const setButton = (action: ControllerButtonAction, value: string) =>
    updateControllerSettings({ buttons: { ...settings.buttons, [action]: value === NONE ? null : value as ControllerButton } });
  const setParameters = (parameters: ControllerParameterBinding[]) => updateControllerSettings({ parameters });

  return (
    <div className="space-y-5" data-controller-panel>
      <Group title="OSC input" hint="kg_GCcontrollerなどが送るOSCを、このPCの中だけで受信します（他のPCからは受信しません）。">
        <PortField port={settings.port} />
        <ReceiverStatus enabled={settings.enabled} />
      </Group>

      <Group title="Preset browsing" hint="スティックで選び、決定ボタンで読み込みます。画面上のPresetライブラリが対象です。">
        <CustomSelect
          label="Select with"
          value={settings.browseStick}
          localizeOptions={false}
          localizeLabel={false}
          options={[{ value: 'stick', label: 'Stick' }, { value: 'cstick', label: 'C-Stick' }]}
          onChange={value => updateControllerSettings({ browseStick: value === 'cstick' ? 'cstick' : 'stick' })}
        />
      </Group>

      <Group title="Buttons">
        {BUTTON_ACTION_ROWS.map(({ action, label }) => (
          <CustomSelect
            key={action}
            label={label}
            value={settings.buttons[action] ?? NONE}
            localizeOptions={false}
            localizeLabel={false}
            options={buttonOptions}
            onChange={value => setButton(action, value)}
          />
        ))}
      </Group>

      <Group title="Parameters" hint="軸の値を、パラメータの最小〜最大へ割り当てます。接続直後の値は基準にするだけで、パラメータは変わりません。">
        {settings.parameters.map((binding, index) => (
          <ParameterRow
            // 割り当ての順序が識別子になる。重複を許すためindexをkeyに含める。
            key={`${index}-${binding.source}-${binding.target}`}
            binding={binding}
            onChange={next => setParameters(settings.parameters.map((current, i) => (i === index ? next : current)))}
            onRemove={() => setParameters(settings.parameters.filter((_, i) => i !== index))}
          />
        ))}
        {settings.parameters.length < MAX_PARAMETER_BINDINGS && (
          <button
            type="button"
            onClick={() => setParameters([...settings.parameters, { source: 'cstick/y', target: 'noise.scale' }])}
            className="w-full border border-cream/15 bg-k-surface/70 py-1.5 text-[10px] text-tab-inactive hover:border-fire/50 hover:text-k-text"
          >
            + Add mapping
          </button>
        )}
      </Group>

      <Group title="BPM sync" hint="OSCで届くテンポを、Loop TimingのBeat SyncのBPMへ反映します（小数第2位まで）。Beat Syncをオンにするとループの長さへ反映されます。Beatの倍率はBeat Syncの設定で変えられます。拍の先頭リセットが届くと、再生位置を先頭へ戻します。">
        <label className="flex items-center justify-between gap-3 text-[11px] text-k-text">
          <span>Follow OSC BPM</span>
          <Toggle
            variant="switch"
            size="xs"
            checked={settings.bpm.enabled}
            ariaLabel="Follow OSC BPM"
            onChange={enabled => updateControllerSettings({ bpm: { ...settings.bpm, enabled } })}
          />
        </label>
        <BpmAddressField label="BPM address" field="address" address={settings.bpm.address} disabled={!settings.bpm.enabled} />
        <BpmAddressField label="Beat reset address" field="resetAddress" address={settings.bpm.resetAddress} disabled={!settings.bpm.enabled} />
      </Group>

      <Group title="Time scrub" hint="倒した量に応じて再生位置を動かします。小さく倒すと細かく動きます。">
        <CustomSelect
          label="Input"
          value={settings.scrub.source ?? NONE}
          localizeOptions={false}
          localizeLabel={false}
          options={axisOptionsWithNone}
          onChange={value => updateControllerSettings({ scrub: { ...settings.scrub, source: value === NONE ? null : value as ControllerAxis } })}
        />
        <SliderField
          label="Speed"
          min={CONTROLLER_SCRUB_SPEED_MIN}
          max={CONTROLLER_SCRUB_SPEED_MAX}
          step={0.05}
          value={settings.scrub.speed}
          defaultValue={DEFAULT_CONTROLLER_SETTINGS.scrub.speed}
          onChange={speed => updateControllerSettings({ scrub: { ...settings.scrub, speed } })}
          format={value => `${value.toFixed(2)} loop/s`}
        />
      </Group>

      <button
        type="button"
        onClick={() => updateControllerSettings({ ...DEFAULT_CONTROLLER_SETTINGS, enabled: settings.enabled, port: settings.port })}
        className="w-full border border-cream/15 bg-k-surface/70 py-1.5 text-[10px] text-tab-inactive hover:border-fire/50 hover:text-k-text"
      >
        Reset mapping to defaults
      </button>
    </div>
  );
}
