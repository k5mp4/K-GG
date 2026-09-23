import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { isTauriRuntime } from '../adapters/tauri/exportService';

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
};

export function ExternalLink({
  href,
  target = '_blank',
  rel = 'noopener noreferrer',
  onClick,
  className,
  ...props
}: ExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      !isTauriRuntime() ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    event.preventDefault();
    void import('@tauri-apps/plugin-opener')
      .then(({ openUrl }) => openUrl(url.toString()))
      .catch(error => console.error('外部リンクを開けませんでした:', error));
  };

  return (
    <a
      {...props}
      href={href}
      target={target}
      rel={rel}
      className={['cursor-pointer', className].filter(Boolean).join(' ')}
      onClick={handleClick}
    />
  );
}
