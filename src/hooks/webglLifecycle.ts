export type SharedWebGLInitRequest<TCanvas, TResult> = {
  canvas: TCanvas;
  shaderVersion: number;
  promise: Promise<TResult>;
  activeConsumers: number;
};

export function acquireSharedWebGLInitRequest<TCanvas, TResult>(
  current: SharedWebGLInitRequest<TCanvas, TResult> | null,
  canvas: TCanvas,
  shaderVersion: number,
  initialize: () => Promise<TResult>,
): { request: SharedWebGLInitRequest<TCanvas, TResult>; reused: boolean } {
  if (current && current.canvas === canvas && current.shaderVersion === shaderVersion) {
    current.activeConsumers += 1;
    return { request: current, reused: true };
  }

  const waitForPrevious = current
    ? current.promise.then(() => undefined, () => undefined)
    : Promise.resolve();
  const request: SharedWebGLInitRequest<TCanvas, TResult> = {
    canvas,
    shaderVersion,
    promise: waitForPrevious.then(initialize),
    activeConsumers: 1,
  };
  return { request, reused: false };
}

export function releaseSharedWebGLInitRequest<TCanvas, TResult>(
  request: SharedWebGLInitRequest<TCanvas, TResult>,
): number {
  request.activeConsumers = Math.max(0, request.activeConsumers - 1);
  return request.activeConsumers;
}

export function shouldDisposeResolvedWebGLRequest<TCanvas, TResult>(
  request: SharedWebGLInitRequest<TCanvas, TResult>,
  consumerDisposed: boolean,
): boolean {
  return consumerDisposed && request.activeConsumers === 0;
}
