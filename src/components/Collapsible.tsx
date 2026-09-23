import { useRef, type ReactNode } from 'react';
import { useDisclosureAnimation } from '../hooks/useDisclosureAnimation';

interface CollapsibleProps {
  isOpen: boolean;
  children: ReactNode;
  duration?: number;
}

export function Collapsible({ isOpen, children, duration = 0.3 }: CollapsibleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDisclosureAnimation(containerRef, isOpen, duration * 1000);
  return <div ref={containerRef} inert={!isOpen}>{children}</div>;
}
