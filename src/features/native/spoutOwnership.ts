/**
 * Counts the UI surfaces (Export panel, VJ deck) that currently drive the Spout
 * controller. Spout is released only after the last owner has gone, so moving
 * between the editor and the VJ layout keeps the sender running. The release is
 * deferred to the end of the current task: React runs every unmount cleanup of a
 * commit before the mount effects of the same commit.
 */
export function createSpoutOwnership(release: () => void, defer: (callback: () => void) => void = queueMicrotask) {
  let owners = 0;
  return {
    acquire(): () => void {
      owners += 1;
      let held = true;
      return () => {
        if (!held) return;
        held = false;
        owners -= 1;
        if (owners === 0) defer(() => { if (owners === 0) release(); });
      };
    },
  };
}
