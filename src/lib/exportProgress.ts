import type { ExportStage } from '../adapters';

export function exportStageLabel(stage: ExportStage): string {
  switch (stage) {
    case 'preparing': return '準備中…';
    case 'rendering': return 'フレーム生成中';
    case 'encoding': return 'FFmpegでエンコード中…';
    case 'saving': return '保存中…';
  }
}

export function exportProgressPercent(stage: ExportStage, progress: number): string {
  return stage === 'rendering' ? ` ${Math.round(progress * 100)}%` : '';
}

export function exportDisplayProgress(stage: ExportStage, progress: number): number {
  return stage === 'encoding' ? Math.max(progress, 0.7) : progress;
}
