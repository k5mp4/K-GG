type AffinityHttpRequestResult = {
  response?: unknown;
  reason?: string;
};

declare module 'affinity:network' {
  export const HttpRequestApi: {
    create(url: string, method: unknown): unknown;
    setHeaderValue(request: unknown, key: string, value: string): void;
    setTimeoutInSec(request: unknown, timeout: number): void;
    doAsync(request: unknown, callback: (result: AffinityHttpRequestResult) => void): void;
  };
  export const HttpResponseApi: {
    getContent(response: unknown): string;
    getStatusCode(response: unknown): number;
  };
  export const RequestMethod: { Get: unknown };
}

declare module 'affinity:timers' {
  export const TimerApi: {
    create(): unknown;
    setExpiryFromNow(timer: unknown, durationMs: number): void;
    waitAsync(timer: unknown, callback: () => void): void;
    dispose(timer: unknown): void;
  };
}

declare module 'affinity:dom' {
  export const DocumentApi: {
    load(path: string, options: unknown): unknown;
  };
  export const LoadDocumentOptionsApi: { createDefault(): unknown };
}

declare module 'affinity:ui' {
  export const UiApi: {
    alert(message: string, title: string): void;
    prompt(message: string, title: string, initialText: string): string;
  };
}
