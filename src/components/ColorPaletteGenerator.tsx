import { useState, useRef, useEffect } from 'react';
import { SliderField } from './SliderField';
import { CustomSelect } from './CustomSelect';
import { useGradientStore } from '../store/gradientStore';
import {
  extractColorsFromPixels,
  extractPixelsFromImage,
  sortPalette,
  rgbToHex,
  type RGB,
} from '../lib/colorExtractor';

interface ColorPaletteGeneratorProps {
  overlayImageElement: HTMLImageElement | null;
}

export function ColorPaletteGenerator({ overlayImageElement }: ColorPaletteGeneratorProps) {
  const setGradient = useGradientStore((state) => state.setGradient);

  const [colorCount, setColorCount] = useState<number>(5);
  const [sortBy, setSortBy] = useState<'dominance' | 'luminance' | 'hue'>('dominance');
  const [pixels, setPixels] = useState<RGB[]>([]);
  const [palette, setPalette] = useState<{ color: RGB; count: number }[]>([]);
  
  // プレビュー表示用
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [imageName, setImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // pixels または colorCount, sortBy が変化した時にパレットを再計算する
  useEffect(() => {
    if (pixels.length === 0) {
      setPalette([]);
      return;
    }
    const extracted = extractColorsFromPixels(pixels, colorCount);
    const sorted = sortPalette(extracted, sortBy);
    setPalette(sorted);
  }, [pixels, colorCount, sortBy]);

  // コピー状態をクリアするタイマー
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => setCopiedIndex(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);

  // 画像オブジェクトからピクセルを抽出する共通処理
  const processImageElement = (img: HTMLImageElement, name: string, src?: string) => {
    setErrorMsg('');
    try {
      const extractedPixels = extractPixelsFromImage(img, 128);
      if (extractedPixels.length === 0) {
        setErrorMsg('画像からカラーデータを抽出できませんでした。');
        return;
      }
      setPixels(extractedPixels);
      setImageName(name);
      if (src) {
        setPreviewSrc(src);
      } else {
        setPreviewSrc(img.src);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('画像の解析中にエラーが発生しました。');
    }
  };

  // ローカルファイル読み込み
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFromFile(file);
  };

  const loadFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('画像ファイルを選択してください。');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      processImageElement(img, file.name, url);
    };
    img.onerror = () => {
      setErrorMsg('画像の読み込みに失敗しました。');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Image Overlay からの取得
  const handleLoadFromOverlay = () => {
    if (!overlayImageElement) return;
    processImageElement(overlayImageElement, 'Overlay Image');
  };

  // ドラッグ＆ドロップ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFromFile(file);
    }
  };

  // グラデーションへの適用
  const handleApply = () => {
    if (palette.length === 0) return;
    const stops = palette.map((item, index) => {
      const position = palette.length > 1 ? index / (palette.length - 1) : 0;
      return {
        stopId: crypto.randomUUID(),
        position,
        color: rgbToHex(item.color),
      };
    });
    setGradient({ stops });
  };

  return (
    <div className="border-t border-panel-border border-t-panel pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-k-text">
          Color Palette Generator
        </h2>
        {overlayImageElement && (
          <button
            type="button"
            onClick={handleLoadFromOverlay}
            className="text-[10px] text-cream hover:text-k-text px-2 py-0.5 rounded-none bg-cream/10 hover:bg-cream/20 transition-all duration-150 cursor-pointer"
            title="現在設定されているOverlay/Mask画像から色を抽出します"
          >
            Overlayから取得
          </button>
        )}
      </div>

      {/* ドラッグ＆ドロップ領域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-none p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] bg-k-bg/20 ${
          isDragging
            ? 'border-fire bg-fire/5'
            : 'border-panel-border/60 hover:border-cream/40 hover:bg-cream/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {previewSrc ? (
          <div className="flex items-center gap-3 w-full">
            <img
              src={previewSrc}
              alt="Preview"
              className="w-12 h-12 object-cover border border-panel-border"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-k-text font-medium truncate">
                {imageName || '読み込まれた画像'}
              </p>
              <p className="text-[9px] text-k-muted">
                クリックまたはドロップで画像を変更
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 select-none">
            <svg
              className="mx-auto h-5 w-5 text-k-muted"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[10px] text-k-muted leading-tight">
              画像をドロップするか、<br />クリックして選択してください
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-[10px] text-red-400 bg-red-950/20 p-2 border border-red-900/30">
          {errorMsg}
        </p>
      )}

      {pixels.length > 0 && (
        <div className="space-y-4">
          {/* コントロール群 */}
          <div className="space-y-3">
            <SliderField
              label="色数"
              min={2}
              max={10}
              step={1}
              value={colorCount}
              onChange={setColorCount}
              format={(v) => `${v}色`}
              defaultValue={5}
            />

            <CustomSelect
              label="ソート順"
              value={sortBy}
              options={[
                { value: 'dominance', label: '出現頻度順' },
                { value: 'luminance', label: '輝度順 (暗→明)' },
                { value: 'hue', label: '色相順' },
              ]}
              onChange={(val) => setSortBy(val as 'dominance' | 'luminance' | 'hue')}
            />
          </div>

          {/* 抽出カラープレビュー */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-display font-semibold uppercase tracking-wider text-k-muted">
              抽出されたカラーパレット
            </label>
            <div className="flex w-full h-8 border border-panel-border overflow-hidden bg-k-bg">
              {palette.map((item, idx) => {
                const hex = rgbToHex(item.color);
                const isCopied = copiedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="flex-1 h-full cursor-pointer transition-all duration-150 hover:scale-y-110 relative group"
                    style={{ backgroundColor: hex }}
                    onClick={() => {
                      navigator.clipboard.writeText(hex);
                      setCopiedIndex(idx);
                    }}
                    title={`${hex} (クリックでHexをコピー)`}
                  >
                    {isCopied && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] text-cream font-bold">
                        Copied
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[8px] text-k-muted text-right">
              カラーブロックをクリックしてカラーコードをコピー
            </p>
          </div>

          {/* グラデーション適用ボタン */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full text-xs text-k-bg bg-cream hover:bg-white active:scale-[0.98] py-2 rounded-none font-display font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-black/10 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            グラデーションに適用
          </button>
        </div>
      )}
    </div>
  );
}
