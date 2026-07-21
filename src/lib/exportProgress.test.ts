import { describe, expect, it } from 'vitest';
import { MP4_QUALITY_PRESETS } from '../adapters';
import type { ExportStage } from '../adapters';
import { exportDisplayProgress, exportProgressPercent, exportStageLabel } from './exportProgress';

describe('export progress display', () => {
  it('keeps the documented stage order and labels', () => {
    const stages: ExportStage[] = ['preparing', 'rendering', 'encoding', 'saving'];
    expect(stages.map(exportStageLabel)).toEqual([
      '準備中…', 'フレーム生成中', 'FFmpegでエンコード中…', '保存中…',
    ]);
  });

  it('does not show an estimated percentage during encoding', () => {
    expect(exportProgressPercent('rendering', 0.7)).toBe(' 70%');
    expect(exportProgressPercent('encoding', 0.82)).toBe('');
    expect(exportDisplayProgress('encoding', 0.7)).toBe(0.7);
  });

  it('defines the three MP4 quality values shared by the UI', () => {
    expect(MP4_QUALITY_PRESETS.map(({ value, crf }) => ({ value, crf }))).toEqual([
      { value: 'high', crf: 18 },
      { value: 'balanced', crf: 22 },
      { value: 'small', crf: 27 },
    ]);
  });
});
