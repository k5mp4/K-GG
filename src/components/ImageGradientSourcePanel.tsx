import { useRef, useState } from 'react';
import { imageFileToCanvas } from '../lib/applySlitToImage';
import { useGradientStore } from '../store/gradientStore';
import type { ImageGradientChannel } from '../types/imageGradient';
import { Toggle } from './Toggle';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';

type Props = {
  sourceImageCanvas: HTMLCanvasElement | null;
  sourceImageName: string;
  onSourceImageLoad: (canvas: HTMLCanvasElement, name: string) => void;
  onSourceImageClear: () => void;
  embedded?: boolean;
};

export function ImageGradientSourcePanel({ sourceImageCanvas, sourceImageName, onSourceImageLoad, onSourceImageClear, embedded = false }: Props) {
  const { imageGradient, setImageGradient } = useGradientStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const canvas = await imageFileToCanvas(file);
      onSourceImageLoad(canvas, file.name);
      setImageGradient({ enabled: true, anchorInfluence: 0.5 });
    } catch (cause) {
      console.error('Image gradient source load failed:', cause);
      setError('画像の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  const controls = (
    <div className="flex items-center justify-end gap-2">
      <Toggle variant="switch" size="sm" checked={imageGradient.enabled} onChange={(enabled) => setImageGradient({ enabled })} />
      {sourceImageCanvas && (
        <button
          type="button"
          onClick={onSourceImageClear}
          className="text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 bg-red-900/30 hover:bg-red-900/50 transition-colors"
        >
          削除
        </button>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-[10px] text-cream hover:text-k-text px-2 py-0.5 bg-cream/10 hover:bg-cream/20 transition-all disabled:opacity-50"
      >
        {loading ? 'Loading...' : '読み込み'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );

  return (
    <div className={`${embedded ? 'space-y-3' : 'border-t border-panel-border border-t-panel pt-4 space-y-3'}`}>
      {embedded ? controls : (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-k-text">Image Gradient Source</h2>
          {controls}
        </div>
      )}
      {sourceImageCanvas ? (
        <p className="text-[10px] text-deep truncate">{sourceImageName}</p>
      ) : (
        <p className={imageGradient.enabled ? 'text-[10px] text-amber-300' : 'text-[10px] text-k-muted'}>
          {imageGradient.enabled ? '画像を再読み込みしてください' : '画像未選択'}
        </p>
      )}
      <CustomSelect
        label="Channel"
        value={imageGradient.channel}
        options={[
          { value: 'luminance', label: 'Luminance' },
          { value: 'red', label: 'Red' },
          { value: 'green', label: 'Green' },
          { value: 'blue', label: 'Blue' },
        ]}
        onChange={(channel) => setImageGradient({ channel: channel as ImageGradientChannel })}
      />
      <SliderField
        label="Anchor Influence"
        min={0}
        max={100}
        step={1}
        value={imageGradient.anchorInfluence * 100}
        onChange={(value) => setImageGradient({ anchorInfluence: value / 100 })}
        format={(value) => `${value}%`}
        defaultValue={50}
      />
      <p className="text-[10px] text-tab-inactive">画像は固定し、アンカー配色のみを歪ませます。中央基準のCoverで配置されます。</p>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
