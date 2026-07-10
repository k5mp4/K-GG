import { useRef, useState } from 'react';
import { imageFileToCanvas } from '../lib/applySlitToImage';
import { useGradientStore } from '../store/gradientStore';
import type { ImageGradientChannel } from '../types/imageGradient';
import { Toggle } from './Toggle';
import { CustomSelect } from './CustomSelect';

type Props = {
  sourceImageCanvas: HTMLCanvasElement | null;
  sourceImageName: string;
  onSourceImageLoad: (canvas: HTMLCanvasElement, name: string) => void;
  onSourceImageClear: () => void;
};

export function ImageGradientSourcePanel({ sourceImageCanvas, sourceImageName, onSourceImageLoad, onSourceImageClear }: Props) {
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
      setImageGradient({ enabled: true });
    } catch (cause) {
      console.error('Image gradient source load failed:', cause);
      setError('画像の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-panel-border border-t-panel pt-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-k-text">Image Gradient Source</h2>
        <div className="flex items-center gap-2">
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
      </div>
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
      <p className="text-[10px] text-tab-inactive">画像のトーンを現在のGradient Rampへ再配色します。中央基準のCoverで配置されます。</p>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
