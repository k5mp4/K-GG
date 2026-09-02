import type { AeStatus } from '../adapters';

export type AeDisplayStatus = AeStatus | 'idle' | 'sending';

export function createAeStatusController(setStatus: (status: AeDisplayStatus) => void) {
  let requestId = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearIdleTimer = () => {
    if (idleTimer === null) return;
    clearTimeout(idleTimer);
    idleTimer = null;
  };

  return {
    begin() {
      clearIdleTimer();
      requestId += 1;
      setStatus('sending');
      return requestId;
    },

    isCurrent(id: number) {
      return requestId === id;
    },

    complete(id: number, status: AeStatus) {
      if (requestId !== id) return;
      clearIdleTimer();
      setStatus(status);
      idleTimer = setTimeout(() => {
        if (requestId !== id) return;
        idleTimer = null;
        setStatus('idle');
      }, 4000);
    },

    dispose() {
      requestId += 1;
      clearIdleTimer();
    },
  };
}
