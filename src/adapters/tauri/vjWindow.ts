import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';

export type VjWindowSize = { width: number; height: number };
export type VjWindowHost = {
  readSize: () => Promise<VjWindowSize>;
  isMaximized: () => Promise<boolean>;
  unmaximize: () => Promise<void>;
  maximize: () => Promise<void>;
  setMinSize: (size: VjWindowSize) => Promise<void>;
  setSize: (size: VjWindowSize) => Promise<void>;
};

/** Serialize mode changes so a quick return to the editor cannot leave the native window compact. */
export class VjWindowController {
  private pending: Promise<void> = Promise.resolve();
  private original: VjWindowSize | null = null;
  private wasMaximized = false;

  private readonly host: VjWindowHost;

  constructor(host: VjWindowHost) { this.host = host; }

  setMode(compact: boolean): Promise<void> {
    const operation = this.pending.catch(() => undefined).then(async () => {
      if (compact) {
        if (this.original) return;
        const size = await this.host.readSize();
        const maximized = await this.host.isMaximized();
        try {
          if (maximized) await this.host.unmaximize();
          await this.host.setMinSize({ width: 640, height: 270 });
          await this.host.setSize({ width: Math.max(640, size.width), height: 270 });
          this.original = size;
          this.wasMaximized = maximized;
        } catch (error) {
          await this.host.setMinSize({ width: 640, height: 480 }).catch(() => undefined);
          await this.host.setSize(size).catch(() => undefined);
          if (maximized) await this.host.maximize().catch(() => undefined);
          throw error;
        }
      } else if (this.original) {
        await this.host.setMinSize({ width: 640, height: 480 });
        await this.host.setSize(this.original);
        if (this.wasMaximized) await this.host.maximize();
        this.original = null;
      }
    });
    this.pending = operation;
    return operation;
  }
}

export function createTauriVjWindowController(): VjWindowController {
  const window = getCurrentWindow();
  return new VjWindowController({
    readSize: async () => (await window.innerSize()).toLogical(await window.scaleFactor()),
    isMaximized: () => window.isMaximized(),
    unmaximize: () => window.unmaximize(),
    maximize: () => window.maximize(),
    setMinSize: size => window.setMinSize(new LogicalSize(size.width, size.height)),
    setSize: size => window.setSize(new LogicalSize(size.width, size.height)),
  });
}
