type FigmaSceneNodeLike = {
  id: string;
  name: string;
  type: string;
  exportAsync?: (settings: { format: 'PNG' }) => Promise<Uint8Array>;
};

type FigmaImageLike = { hash: string };

type FigmaRectangleLike = FigmaSceneNodeLike & {
  type: 'RECTANGLE';
  x: number;
  y: number;
  width: number;
  height: number;
  fills: readonly unknown[];
  parent: unknown;
  resize(width: number, height: number): void;
};

declare const __html__: string;

declare const figma: {
  root: { name: string };
  showUI(html: string, options: { width: number; height: number; title: string }): void;
  ui: {
    onmessage: ((message: unknown) => void) | null;
    postMessage(message: unknown): void;
  };
  currentPage: {
    selection: FigmaSceneNodeLike[];
    children: FigmaSceneNodeLike[];
    loadAsync(): Promise<void>;
    appendChild(node: FigmaSceneNodeLike): void;
  };
  viewport: {
    center: { x: number; y: number };
    scrollAndZoomIntoView(nodes: FigmaSceneNodeLike[]): void;
  };
  createImage(bytes: Uint8Array): FigmaImageLike;
  createRectangle(): FigmaRectangleLike;
};
