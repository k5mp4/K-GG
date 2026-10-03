import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NativeFfmpegStatus } from '../adapters';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { ExportPanel } from './ExportPanel';

vi.mock('../lib/exportVideo', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/exportVideo')>(),
  nativeFfmpegSupported: () => true,
}));

function renderPanel(movCodecs?: NativeFfmpegStatus['movCodecs']) {
  const ffmpegStatus: NativeFfmpegStatus = {
    platform: 'windows', supported: true, available: true, source: 'system-path',
    path: 'C:/ffmpeg.exe', version: 'test', error: null, warning: null,
    folderPath: null, ffprobePath: null, ffprobeVersion: null,
    videoFormats: ['mov', 'mp4'], movCodecs,
  };
  return renderToStaticMarkup(
    <LanguageProvider>
      <ExportPanel canvasRef={{ current: null }} ffmpegStatus={ffmpegStatus}
        ffmpegChecking={false} onCheckFfmpeg={async () => ffmpegStatus} />
    </LanguageProvider>,
  );
}

describe('MOV export controls', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
    useGradientStore.setState({ animation: { ...useGradientStore.getState().animation, enabled: true } });
  });

  it('starts with H.264 and Balanced quality', () => {
    const markup = renderPanel(['h264', 'prores', 'qtrle']);
    expect(markup).toContain('MOV codec');
    expect(markup).toContain('H.264');
    expect(markup).toContain('Balanced');
  });

  it('hides quality when only lossless Animation is available', () => {
    const markup = renderPanel(['qtrle']);
    expect(markup).toContain('Animation (Lossless)');
    expect(markup).not.toContain('Balanced');
    expect(markup).not.toContain('>Quality<');
  });

  it('keeps legacy backends on Animation without a quality control', () => {
    const markup = renderPanel();
    expect(markup).toContain('Animation (Lossless)');
    expect(markup).not.toContain('Balanced');
  });
});
