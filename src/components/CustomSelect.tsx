import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useInteractionSettings } from './InteractionSettingsContext';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function CustomSelect({ value, options, onChange, label, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hoverInteractionsEnabled } = useInteractionSettings();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    if (!dropdownRef.current) return;
    
    // 初期状態をセット（非表示）
    gsap.set(dropdownRef.current, { 
      display: 'none', 
      height: 0, 
      opacity: 0, 
      scaleY: 0.95,
      transformOrigin: 'top'
    });
    
    // Timelineの構築
    timeline.current = gsap.timeline({ paused: true })
      .to(dropdownRef.current, { // CSS仕様でdisplay中間状態が無いため瞬間表示させる
        display: 'block', 
        duration: 0 
      })
      .to(dropdownRef.current, { // 見た目のアニメーション実行
        height: 'auto',
        opacity: 1,
        scaleY: 1,
        duration: 0.3,
        ease: 'power4.out'
      });

    return () => {
      timeline.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      timeline.current?.play();
    } else {
      timeline.current?.reverse();// timelineの逆再生
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => {
        if (hoverInteractionsEnabled) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (hoverInteractionsEnabled) setIsOpen(false);
      }}
    >
      {label && <label className="block text-xs mb-1 text-deep font-display uppercase tracking-wider">{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full bg-k-surface border border-panel-border border-panel rounded-none px-2 py-1 text-sm text-k-text text-left flex justify-between items-center hover:border-fire transition-colors focus:outline-none focus:ring-1 focus:ring-fire"
      >
        <span className="truncate mr-2">{selectedOption.label}</span>
        <svg 
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="var(--color-k-text)" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={dropdownRef}
        className="absolute z-50 w-full mt-0 bg-k-surface border border-panel-border border-panel rounded-none shadow-xl overflow-hidden"
      >
        <div className="py-1 max-h-60 overflow-y-auto scrollbar-thin">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-all duration-150 hover:bg-fire ${
                option.value === value ? 'bg-fire/20 text-cream' : 'text-k-text hover:text-k-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
