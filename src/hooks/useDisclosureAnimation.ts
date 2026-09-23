import { useLayoutEffect, useRef, type RefObject } from 'react';

/** Native UI animation only; never participates in the rendered/exported scene. */
export function useDisclosureAnimation(
  ref: RefObject<HTMLDivElement | null>,
  open: boolean,
  duration = 300,
  marginBottom = 0,
) {
  const initialized = useRef(false);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = { height: `${node.getBoundingClientRect().height}px`, opacity: getComputedStyle(node).opacity };
    node.inert = !open;
    node.style.overflow = 'hidden';
    node.style.display = 'block';
    node.style.height = open ? 'auto' : '0px';
    node.style.opacity = open ? '1' : '0';
    node.style.marginBottom = open ? `${marginBottom}px` : '0px';
    const finish = () => {
      node.style.display = open ? 'block' : 'none';
      node.style.overflow = open ? '' : 'hidden';
    };
    if (!initialized.current || !node.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      initialized.current = true;
      finish();
      return;
    }
    const animation = node.animate([
      from,
      { height: open ? `${node.scrollHeight}px` : '0px', opacity: open ? 1 : 0 },
    ], { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    animation.onfinish = finish;
    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [ref, open, duration, marginBottom]);
}
