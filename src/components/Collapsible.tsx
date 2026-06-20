import { useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';

interface CollapsibleProps {
  isOpen: boolean;
  children: ReactNode;
  duration?: number;
}

export function Collapsible({ isOpen, children, duration = 0.3 }: CollapsibleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    if (isFirstRender.current) {
      // 初期状態の設定
      gsap.set(containerRef.current, {
        height: isOpen ? 'auto' : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        display: isOpen ? 'block' : 'none'
      });
      isFirstRender.current = false;
      return;
    }

    let tween: gsap.core.Tween | gsap.core.Timeline | null = null;

    if (isOpen) {
      // 展開アニメーション
      gsap.set(containerRef.current, { display: 'block' });
      tween = gsap.to(containerRef.current, {
        height: 'auto',
        opacity: 1,
        duration: duration,
        ease: "power2.out",
        overwrite: 'auto',
        clearProps: "overflow"
      });
    } else {
      // 折りたたみアニメーション
      tween = gsap.to(containerRef.current, {
        height: 0,
        opacity: 0,
        duration: duration,
        ease: "power2.in",
        overwrite: 'auto',
        overflow: "hidden",
        onComplete: () => {
          if (containerRef.current) {
            gsap.set(containerRef.current, { display: 'none' });
          }
        }
      });
    }

    return () => {
      tween?.kill();
    };
  }, [isOpen, duration]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
