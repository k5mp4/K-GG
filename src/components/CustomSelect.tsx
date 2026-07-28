import { useState, useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useInteractionSettings } from './InteractionSettingsContext';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  optionPreview?: (option: Option) => ReactNode;
  alwaysShowPreviews?: boolean;
  previewOnly?: boolean;
  localizeOptions?: boolean;
}

export function CustomSelect({
  value,
  options,
  onChange,
  label,
  className = '',
  optionPreview,
  alwaysShowPreviews = false,
  previewOnly = false,
  localizeOptions = true,
}: CustomSelectProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { hoverInteractionsEnabled } = useInteractionSettings();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];
  const isPreviewOnly = previewOnly && alwaysShowPreviews && Boolean(optionPreview);

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
    if (isPreviewOnly) setIsOpen(false);
  }, [isPreviewOnly]);

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
        if (!isPreviewOnly && hoverInteractionsEnabled) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (!isPreviewOnly && hoverInteractionsEnabled) setIsOpen(false);
      }}
    >
      {label && <label className="block text-xs mb-1 text-deep font-display uppercase tracking-wider">{localizeUiLabel(label, language)}</label>}
      {!isPreviewOnly && (
        <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="relative w-full overflow-hidden bg-k-surface border border-panel-border border-panel rounded-none px-2 py-1 text-sm text-cream text-left flex justify-between items-center hover:border-fire transition-colors focus:outline-none focus:ring-1 focus:ring-fire"
          >
            {optionPreview && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                {optionPreview(selectedOption)}
              </span>
            )}
            {optionPreview && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/45" />}
            <span className="relative z-10 min-w-0 mr-2 flex-1 truncate">
              {localizeOptions ? localizeUiLabel(selectedOption.label, language) : selectedOption.label}
            </span>
            <svg
              className={`relative z-10 w-3 h-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="var(--color-k-text)" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
      )}

      <div
        ref={dropdownRef}
        className={`${isPreviewOnly ? 'hidden ' : ''}absolute z-50 w-full mt-0 bg-k-surface border border-panel-border border-panel rounded-none shadow-xl overflow-hidden`}
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
                  className={`relative w-full overflow-hidden text-left px-3 py-1.5 text-sm transition-all duration-150 hover:bg-fire ${
                    option.value === value ? 'bg-fire/20 text-cream' : 'text-k-text hover:text-k-text'
                  }`}
                >
                  {optionPreview && (
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                      {optionPreview(option)}
                    </span>
                  )}
                  {optionPreview && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/45" />}
                  <span className="relative z-10 block truncate text-cream">
                    {localizeOptions ? localizeUiLabel(option.label, language) : option.label}
                  </span>
                </button>
              ))}
            </div>
        </div>

      {alwaysShowPreviews && optionPreview && (
        <div className="mt-1 grid grid-cols-2 gap-px border border-panel-border/70 bg-panel-border/70 p-px" aria-label="Option previews">
          {options.map((option) => (
            <button
              key={`preview-${option.value}`}
              type="button"
              onClick={() => onChange(option.value)}
              className={`relative min-w-0 h-8 overflow-hidden text-left transition-colors hover:bg-fire/30 focus:outline-none focus:ring-1 focus:ring-fire ${option.value === value ? 'bg-fire/20' : 'bg-k-surface'}`}
              title={localizeOptions ? localizeUiLabel(option.label, language) : option.label}
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                {optionPreview(option)}
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/45" />
              <span className="relative z-10 flex h-full items-center truncate px-1.5 text-[9px] text-cream [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                {localizeOptions ? localizeUiLabel(option.label, language) : option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
