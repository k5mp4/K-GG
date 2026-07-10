export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 3D RGB 色空間内の直方体を表すクラス。
 * MMCQ (Modified Median Cut Quantization) に基づき、ピクセル数と体積で分割を制御します。
 */
export class ColorBox {
  rMin: number = 255;
  rMax: number = 0;
  gMin: number = 255;
  gMax: number = 0;
  bMin: number = 255;
  bMax: number = 0;
  pixels: RGB[];

  constructor(pixels: RGB[]) {
    this.pixels = pixels;
    this.updateBounds();
  }

  updateBounds() {
    this.rMin = 255; this.rMax = 0;
    this.gMin = 255; this.gMax = 0;
    this.bMin = 255; this.bMax = 0;

    for (let i = 0; i < this.pixels.length; i++) {
      const p = this.pixels[i];
      if (p.r < this.rMin) this.rMin = p.r;
      if (p.r > this.rMax) this.rMax = p.r;
      if (p.g < this.gMin) this.gMin = p.g;
      if (p.g > this.gMax) this.gMax = p.g;
      if (p.b < this.bMin) this.bMin = p.b;
      if (p.b > this.bMax) this.bMax = p.b;
    }
  }

  getVolume(): number {
    return (this.rMax - this.rMin + 1) * (this.gMax - this.gMin + 1) * (this.bMax - this.bMin + 1);
  }

  getLongestAxis(): 'r' | 'g' | 'b' {
    const rRange = this.rMax - this.rMin;
    const gRange = this.gMax - this.gMin;
    const bRange = this.bMax - this.bMin;
    if (rRange >= gRange && rRange >= bRange) return 'r';
    if (gRange >= rRange && gRange >= bRange) return 'g';
    return 'b';
  }

  getPriorityScore(): number {
    // MMCQにおける分割優先度: ピクセル数 × ボックス体積
    return this.pixels.length * this.getVolume();
  }

  getAverageColor(): RGB {
    if (this.pixels.length === 0) return { r: 0, g: 0, b: 0 };
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < this.pixels.length; i++) {
      const p = this.pixels[i];
      rSum += p.r;
      gSum += p.g;
      bSum += p.b;
    }
    return {
      r: Math.round(rSum / this.pixels.length),
      g: Math.round(gSum / this.pixels.length),
      b: Math.round(bSum / this.pixels.length),
    };
  }
}

/**
 * 1つの ColorBox を最も長いRGB軸の「中央値」で2つの子ボックスに分割します。
 */
export function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  if (box.pixels.length <= 1) {
    return [box, new ColorBox([])];
  }

  const axis = box.getLongestAxis();
  
  // 該当する軸の値でピクセルをソート
  box.pixels.sort((a, b) => a[axis] - b[axis]);

  const median = Math.floor(box.pixels.length / 2);
  const part1 = box.pixels.slice(0, median);
  const part2 = box.pixels.slice(median);

  return [new ColorBox(part1), new ColorBox(part2)];
}

/**
 * 相対輝度を算出します (Luminance)。
 */
export function getLuminance(color: RGB): number {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

/**
 * RGB を HSL に変換し、色相 H (0–360) を返します。
 */
export function getHue(color: RGB): number {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta === 0) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }
  return h;
}

/**
 * RGBの値を16進数カラーコード（#RRGGBB）に変換します。
 */
export function rgbToHex(color: RGB): string {
  const toHexPart = (v: number) => {
    const hex = Math.max(0, Math.min(255, v)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHexPart(color.r)}${toHexPart(color.g)}${toHexPart(color.b)}`.toUpperCase();
}

/**
 * ピクセル配列から Median Cut (MMCQ) を用いて K 個の代表色を抽出します。
 */
export function extractColorsFromPixels(pixels: RGB[], k: number): { color: RGB; count: number }[] {
  if (pixels.length === 0) return [];
  if (k <= 0) return [];

  // 初期ボックスを作成
  const initialBox = new ColorBox(pixels);
  const boxes: ColorBox[] = [initialBox];

  // ボックス数が K に達するまで、優先スコアが最大のボックスを選んで分割する
  while (boxes.length < k) {
    // 分割可能な（ピクセルが2つ以上ある）ボックスの中でスコアが最大のものを選ぶ
    let targetIndex = -1;
    let maxScore = -1;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.pixels.length > 1) {
        const score = box.getPriorityScore();
        if (score > maxScore) {
          maxScore = score;
          targetIndex = i;
        }
      }
    }

    // 分割できるボックスがこれ以上ない場合はループを抜ける
    if (targetIndex === -1) {
      break;
    }

    // ボックスを分割
    const targetBox = boxes[targetIndex];
    const [box1, box2] = splitBox(targetBox);

    // 古いボックスを削除し、新しい子ボックスを追加
    boxes.splice(targetIndex, 1, box1, box2);
  }

  // 各ボックスの平均色と、そのボックスに属していたピクセル数（頻度）を返す
  return boxes.map((box) => ({
    color: box.getAverageColor(),
    count: box.pixels.length,
  }));
}

/**
 * 画像またはキャンバス要素からピクセルデータをダウンサンプリングして抽出します。
 * 透明背景のピクセル (Alpha < 50) は自動で除外されます。
 */
export function extractPixelsFromImage(
  imageOrCanvas: HTMLImageElement | HTMLCanvasElement,
  maxDimension: number = 128
): RGB[] {
  // オフスクリーンCanvasを作成
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // 元のサイズ
  let width = 0;
  let height = 0;
  if (imageOrCanvas instanceof HTMLImageElement) {
    width = imageOrCanvas.naturalWidth || imageOrCanvas.width;
    height = imageOrCanvas.naturalHeight || imageOrCanvas.height;
  } else {
    width = imageOrCanvas.width;
    height = imageOrCanvas.height;
  }

  if (width === 0 || height === 0) return [];

  // アスペクト比を維持しつつ、最大寸法以下にリサイズ
  let targetWidth = width;
  let targetHeight = height;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      targetWidth = maxDimension;
      targetHeight = Math.max(1, Math.round((height * maxDimension) / width));
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.max(1, Math.round((width * maxDimension) / height));
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // 描画
  ctx.drawImage(imageOrCanvas, 0, 0, targetWidth, targetHeight);

  // ピクセル値を取得
  try {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;
    const pixels: RGB[] = [];

    // 透明度が低すぎる (Alpha < 50) ピクセルを除外してRGBデータを集める
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a >= 50) {
        pixels.push({ r, g, b });
      }
    }

    return pixels;
  } catch (e) {
    console.error('Failed to get image data (CORS issue or corrupted canvas):', e);
    return [];
  }
}

/**
 * 抽出されたパレットをソートします。
 */
export function sortPalette(
  palette: { color: RGB; count: number }[],
  sortBy: 'dominance' | 'luminance' | 'hue'
): { color: RGB; count: number }[] {
  const result = [...palette];
  if (sortBy === 'dominance') {
    // 出現頻度順（多い順）
    result.sort((a, b) => b.count - a.count);
  } else if (sortBy === 'luminance') {
    // 輝度順（暗い順から明るい順）
    result.sort((a, b) => getLuminance(a.color) - getLuminance(b.color));
  } else if (sortBy === 'hue') {
    // 色相順（角度 0 から 360 の順）
    result.sort((a, b) => getHue(a.color) - getHue(b.color));
  }
  return result;
}
