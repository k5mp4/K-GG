import { useEffect, useState, useRef, type MutableRefObject } from 'react';
import { createEmptyManualDistortMap, createEmptyManualSmoothMask, normalizePostprocessConfig, STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import {
  loadPresets,
  savePreset,
  deletePreset,
  exportPresetsJSON,
  importPresetsJSON,
  type Preset,
} from '../lib/presets';
import { sanitizeStem } from '../lib/export';
import { loadUserColorPalettes, mergeUserColorPalettes } from '../lib/colorPalettes';
import defaultPresets from '../assets/gradPreset_kg_defaultPresets.json';

type PresetPanelProps = {
  canvasW: number;
  canvasH: number;
  setCanvasW: (w: number) => void;
  setCanvasH: (h: number) => void;
  aspectRatioRef: MutableRefObject<number>;
};

export function PresetPanel({ canvasW, canvasH, setCanvasW, setCanvasH, aspectRatioRef }: PresetPanelProps) {
  const store = useGradientStore();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setPresets(await loadPresets());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    // store の中から snapshot に必要なものだけを抽出（関数などを除外）
    const { 
      gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch,
      animation, normalMap, radon, iridescence, manualDistort, postprocess, matcap, keyframeTracks
    } = store;

    // 保存時に、操作中の状態（選択中のインデックスなど）はリセットして保存するのが一般的
    const slitScanToSave = { ...slitScan, selectedSlitIdx: -1 };

    await savePreset(trimmed, {
      gradient, noiseDistortion, diffuse, bezierAxis,
      slitScan: slitScanToSave, stretch,
      animation, normalMap, radon, iridescence, manualDistort, postprocess, matcap,
      keyframeTracks,
      colorPalettes: loadUserColorPalettes(),
      resolution: { width: canvasW, height: canvasH },
    });
    
    store.setPresetName(trimmed);
    setName('');
    await refresh();
  }

  function handleLoad(preset: Preset) {
    const s = preset.state;
    if (s.gradient) store.setGradient(s.gradient);
    if (s.noiseDistortion) store.setNoiseDistortion(s.noiseDistortion);
    if (s.diffuse) store.setDiffuse(s.diffuse);
    if (s.bezierAxis) store.setBezierAxis(s.bezierAxis);
    if (s.slitScan) store.setSlitScan({ ...STORE_DEFAULTS.slitScan, ...s.slitScan });
    if (s.stretch) store.setStretch(s.stretch);
    if (s.normalMap) store.setNormalMap(s.normalMap);
    if (s.radon) store.setRadon(s.radon);
    if (s.iridescence) store.setIridescence(s.iridescence);
    {
      const resolution = s.manualDistort?.mapResolution ?? STORE_DEFAULTS.manualDistort.mapResolution;
      store.setManualDistort({
        ...STORE_DEFAULTS.manualDistort,
        ...s.manualDistort,
        mapResolution: resolution,
        displacement: s.manualDistort?.displacement ?? createEmptyManualDistortMap(resolution),
        smoothMask: s.manualDistort?.smoothMask ?? createEmptyManualSmoothMask(resolution),
      });
    }
    {
      const savedPostprocess = s.postprocess ?? s.postprocessDistort;
      store.setPostprocess(normalizePostprocessConfig(savedPostprocess));
    }
    if (s.matcap) store.setMatcap(s.matcap);
    store.setKeyframeTracks(s.keyframeTracks ?? {});
    if (s.animation) store.setAnimation({ ...s.animation, previewLoop: s.animation.previewLoop ?? true });
    if (s.colorPalettes) mergeUserColorPalettes(s.colorPalettes);
    if (s.resolution) {
      setCanvasW(s.resolution.width);
      setCanvasH(s.resolution.height);
      aspectRatioRef.current = s.resolution.width / s.resolution.height;
    }
    store.setPresetName(preset.name);
  }

  async function handleDelete(id: string) {
    await deletePreset(id);
    await refresh();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importPresetsJSON(file, true);
      await refresh();
    } catch {
      alert('インポートに失敗しました。有効な JSON ファイルを選択してください。');
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-k-text">Presets</h2>

      {/* 保存フォーム */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          placeholder="Preset name..."
          className="flex-1 bg-k-surface text-k-text text-xs rounded-none px-2 py-1 min-w-0 border border-cream/40 focus:border-fire focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="text-xs bg-fire hover:brightness-110 disabled:opacity-40 text-k-text px-3 py-1 rounded-none shrink-0"
        >
          Save
        </button>
      </div>

      {/* プリセット一覧 (ユーザー保存) */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-tab-inactive uppercase tracking-widest">Saved Presets</p>
        {presets.length === 0 ? (
          <p className="text-xs text-tab-inactive italic px-1">保存済みプリセットなし</p>
        ) : (
          <ul className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            {presets.map((p) => (
              <li key={p.id} className={`flex items-center gap-1 bg-k-surface rounded-none px-2 py-1.5 ${store.presetName === p.name ? 'ring-2 ring-fire' : ''}`}>
                <span className="flex-1 text-[11px] truncate" title={p.name}>{p.name}</span>
                <button
                  onClick={() => handleLoad(p)}
                  className="text-[10px] text-fire hover:text-cream shrink-0 px-1 font-bold"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-[10px] text-red-400 hover:text-red-300 shrink-0 px-1 font-bold"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* プリセット一覧 (組み込み) */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-tab-inactive uppercase tracking-widest">Built-in Presets</p>
        <ul className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {(defaultPresets as any[]).map((p) => (
            <li key={p.id} className={`flex items-center gap-1 bg-deep/10 border border-deep/30 rounded-none px-2 py-1.5 ${store.presetName === p.name ? 'ring-2 ring-fire bg-deep/20' : ''}`}>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-[11px] font-medium truncate text-k-text" title={p.name}>{p.name}</span>
              </div>
              <button
                onClick={() => handleLoad(p)}
                className="text-[10px] text-fire hover:text-cream shrink-0 px-2 py-0.5 bg-fire/10 rounded-none font-bold"
              >
                Load
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* JSON エクスポート / インポート */}
      <div className="border-t border-cream/40 pt-3 space-y-2">
        <button
          onClick={() => void exportPresetsJSON(store.presetName ? sanitizeStem(store.presetName) : undefined)}
          disabled={presets.length === 0}
          className="w-full text-xs bg-k-muted hover:bg-k-muted/70 disabled:opacity-40 text-k-text py-1.5 rounded-none"
        >
          Export JSON
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="w-full text-xs bg-gray-600 hover:bg-gray-500 text-white py-1.5 rounded"
        >
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </div>
  );
}
