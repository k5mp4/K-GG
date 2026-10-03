import type { MovCodec, NativeFfmpegStatus, NativeVideoFormat } from '../adapters';

export const MOV_CODECS = [
  { value: 'h264', label: 'H.264', supportsQuality: true, description: '容量を抑える圧縮形式です。品質を上げるとサイズも増えます。透過には対応しません。' },
  { value: 'prores', label: 'ProRes 422', supportsQuality: true, description: '編集向けの形式です。HighはHQ、Balancedは422、SmallはLTで出力します。透過には対応しません。' },
  { value: 'qtrle', label: 'Animation (Lossless)', supportsQuality: false, description: 'RGBをロスレスで保持します。ファイルサイズは大きくなります。透過には対応しません。' },
] as const;

export function availableMovCodecs(status: NativeFfmpegStatus | null): MovCodec[] {
  if (!status?.available) return [];
  const reported = status.movCodecs ?? ['qtrle'];
  return MOV_CODECS.map(codec => codec.value).filter(codec => reported.includes(codec));
}

/**
 * 動画書き出し形式の登録表。
 *
 * FFmpegで生成するネイティブ形式を追加する場合は、Rust側の`NativeVideoFormat`
 * （`src-tauri/src/lib.rs`）へFFmpeg引数を登録し、ここへ同じIDの表示情報を追加する。
 */
export type NativeVideoFormatDefinition = {
  value: NativeVideoFormat;
  label: string;
  /** ボタンなど短い表示で使う形式名。 */
  shortLabel: string;
  extension: NativeVideoFormat;
  /** 保存ファイル名の拡張子前に付ける識別子。 */
  fileSuffix: string;
  /** 品質プリセット（CRF）を選べる形式か。 */
  supportsQuality: boolean;
  /** After Effectsへ送信できる形式か。 */
  afterEffectsCompatible: boolean;
  description: string;
};

export const NATIVE_VIDEO_FORMATS: readonly NativeVideoFormatDefinition[] = [
  {
    value: 'mov',
    label: 'MOV',
    shortLabel: 'MOV',
    extension: 'mov',
    fileSuffix: '',
    supportsQuality: true,
    afterEffectsCompatible: true,
    description: 'コーデックと品質を選んでQuickTime動画を書き出します。',
  },
  {
    value: 'mp4',
    label: 'MP4 (H.264)',
    shortLabel: 'MP4',
    extension: 'mp4',
    // 既存連携との互換性のため`_h264rgb`を維持する（実際のRGBエンコードではない）。
    fileSuffix: '_h264rgb',
    supportsQuality: true,
    afterEffectsCompatible: true,
    description: '標準的なYUV 4:2:0（BT.709）で圧縮します。',
  },
  {
    value: 'webm',
    label: 'WebM (VP9)',
    shortLabel: 'WebM',
    extension: 'webm',
    fileSuffix: '',
    supportsQuality: true,
    afterEffectsCompatible: false,
    description: 'Web向けのVP9（YUV 4:2:0・BT.709）で圧縮します。FFmpegにlibvpx-vp9が必要です。',
  },
  {
    value: 'gif',
    label: 'GIF',
    shortLabel: 'GIF',
    extension: 'gif',
    fileSuffix: '',
    supportsQuality: false,
    afterEffectsCompatible: false,
    description: '全フレームから生成した256色パレットで無限ループGIFを書き出します。60fpsは多くのビューアーで約50fpsとして再生されます。',
  },
];

export const FRAME_ZIP_FORMAT = 'zip' as const;
export type VideoExportFormat = NativeVideoFormat | typeof FRAME_ZIP_FORMAT;

/** FFmpeg状態に`videoFormats`がない旧バックエンドでも必須形式は利用可能とみなす。 */
export const REQUIRED_NATIVE_VIDEO_FORMATS: readonly NativeVideoFormat[] = ['mov', 'mp4'];

export function nativeVideoFormatDefinition(format: NativeVideoFormat): NativeVideoFormatDefinition {
  const definition = NATIVE_VIDEO_FORMATS.find(item => item.value === format);
  if (!definition) throw new Error(`Unknown native video format: ${format}`);
  return definition;
}

export function isNativeVideoFormat(format: VideoExportFormat): format is NativeVideoFormat {
  return format !== FRAME_ZIP_FORMAT;
}

export function availableNativeVideoFormats(status: NativeFfmpegStatus | null): NativeVideoFormat[] {
  if (!status?.available) return [];
  const reported = status.videoFormats ?? REQUIRED_NATIVE_VIDEO_FORMATS;
  return NATIVE_VIDEO_FORMATS
    .map(format => format.value)
    .filter(format => reported.includes(format));
}

const GPU_ENCODER_LABELS: Record<string, string> = {
  h264_nvenc: 'NVIDIA NVENC',
  h264_qsv: 'Intel Quick Sync',
  h264_amf: 'AMD AMF',
  h264_videotoolbox: 'Apple VideoToolbox',
};

/** 検出したGPUエンコーダーの表示名。GPUエンコードできない場合はnull。 */
export function gpuEncoderLabel(encoder: string | null | undefined): string | null {
  if (!encoder) return null;
  return GPU_ENCODER_LABELS[encoder] ?? encoder;
}

export function nativeVideoFileName(stem: string, format: NativeVideoFormat): string {
  const { fileSuffix, extension } = nativeVideoFormatDefinition(format);
  return `${stem}${fileSuffix}.${extension}`;
}

export type ImageExportFormat = 'png' | 'jpg' | 'webp';

export const IMAGE_EXPORT_FORMATS: readonly { value: ImageExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
];

export const LOSSY_IMAGE_QUALITY = 0.92;
