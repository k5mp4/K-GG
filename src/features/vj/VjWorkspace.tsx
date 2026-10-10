import { VjDeck } from './VjDeck';
import { useVjSession } from './useVjSession';

/** Keep beat and parameter updates within the deck, without rendering the hidden editor. */
export function VjWorkspace(props: { canvasW: number; canvasH: number; windowFailed: boolean; canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const session = useVjSession();
  return session.enabled ? <VjDeck session={session} {...props} /> : null;
}
