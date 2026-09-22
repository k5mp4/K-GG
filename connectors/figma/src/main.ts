import { inspectPng, KGG_IMAGE_LIMITS } from '../../../packages/kgg-image/src';
import {
  getFigmaImageBounds,
  safeFigmaNodeName,
} from './figmaConnector';

type PluginRequest =
  | { type: 'import-png'; transferId: string; name: string; bytes: Uint8Array }
  | { type: 'ready' };

type PluginResponse =
  | { type: 'status'; level: 'info' | 'success' | 'error'; message: string }
  | { type: 'file-name'; name: string }
  | { type: 'import-result'; transferId: string; result: 'delivered' | 'failed'; message: string };

const KGG_IMAGE_NAME_PREFIX = '[K-GG] ';
const importedTransferIds = new Set<string>();
let importQueue: Promise<void> = Promise.resolve();

function isKggRectangle(node: FigmaSceneNodeLike): node is FigmaRectangleLike {
  return node.type === 'RECTANGLE' && node.name.startsWith(KGG_IMAGE_NAME_PREFIX);
}

function respond(message: PluginResponse): void {
  figma.ui.postMessage(message);
}

async function importPng(request: Extract<PluginRequest, { type: 'import-png' }>): Promise<string> {
  if (importedTransferIds.has(request.transferId)) return 'この画像はすでに配置済みです。';
  if (!(request.bytes instanceof Uint8Array)) throw new Error('受信したPNGデータを読み取れませんでした。');
  if (request.bytes.byteLength > KGG_IMAGE_LIMITS.maxPngBytes) throw new Error('受信PNGが20 MiBの上限を超えています。');
  const dimensions = inspectPng(request.bytes);
  const page = figma.currentPage;
  await page.loadAsync();
  if (figma.currentPage !== page) throw new Error('配置先のFigmaページが切り替わりました。現在のページで再送してください。');
  const image = figma.createImage(request.bytes);
  const selectedRectangle = page.selection.find(isKggRectangle);
  const rectangle = selectedRectangle ?? figma.createRectangle();
  const bounds = getFigmaImageBounds(figma.viewport.center, dimensions);
  rectangle.name = `${KGG_IMAGE_NAME_PREFIX}${safeFigmaNodeName(request.name)}`;
  rectangle.x = bounds.x;
  rectangle.y = bounds.y;
  rectangle.resize(bounds.width, bounds.height);
  rectangle.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FIT' }];
  if (rectangle.parent !== page) page.appendChild(rectangle);
  page.selection = [rectangle];
  figma.viewport.scrollAndZoomIntoView([rectangle]);
  importedTransferIds.add(request.transferId);
  return `${rectangle.name} を現在のFigmaファイルへ配置しました。`;
}

function isPluginRequest(value: unknown): value is PluginRequest {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  const type = (value as { type?: unknown }).type;
  return type === 'import-png' || type === 'ready';
}

figma.showUI(__html__, { width: 360, height: 290, title: 'K-GG Direct Send' });
figma.ui.onmessage = async (value: unknown) => {
  if (!isPluginRequest(value)) {
    respond({ type: 'status', level: 'error', message: '操作を読み取れませんでした。' });
    return;
  }
  try {
    if (value.type === 'import-png') {
      const task = importQueue.then(() => importPng(value));
      importQueue = task.then(() => undefined, () => undefined);
      const message = await task;
      respond({ type: 'import-result', transferId: value.transferId, result: 'delivered', message });
      respond({ type: 'status', level: 'success', message });
    }
    if (value.type === 'ready') {
      respond({ type: 'file-name', name: figma.root.name });
      respond({ type: 'status', level: 'info', message: 'K-GG Desktopへ接続し、送られたPNGをこのファイルへ配置します。' });
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'PNGをFigmaへ配置できませんでした。';
    if (value.type === 'import-png') {
      respond({ type: 'import-result', transferId: value.transferId, result: 'failed', message });
    }
    respond({ type: 'status', level: 'error', message });
  }
};
