import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'title' | 'aria-label'> & {
  icon: IconName;
  label: string;
  text?: string;
  iconClassName?: string;
};

export function IconButton({ icon, label, text, className = '', iconClassName = '', type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      title={label}
      aria-label={label}
      data-icon-button
      className={`inline-flex min-h-7 min-w-7 items-center justify-center gap-1.5 border border-transparent text-tab-inactive transition-colors hover:border-cream/20 hover:bg-k-border hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire disabled:cursor-not-allowed disabled:opacity-35 ${className}`}
    >
      <Icon name={icon} className={iconClassName} />
      {text && <span>{text}</span>}
    </button>
  );
}
