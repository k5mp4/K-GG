import type { CSSProperties } from 'react';

export type IconName =
  | 'arrowForward'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronUp'
  | 'close'
  | 'copy'
  | 'delete'
  | 'distributeHorizontal'
  | 'download'
  | 'expand'
  | 'error'
  | 'firstPage'
  | 'gripVertical'
  | 'grid'
  | 'help'
  | 'lastPage'
  | 'list'
  | 'memory'
  | 'pause'
  | 'play'
  | 'progress'
  | 'reverse'
  | 'restart'
  | 'save'
  | 'settings'
  | 'shuffle'
  | 'skipNext'
  | 'skipPrevious'
  | 'systemUpdate'
  | 'timer'
  | 'upload'
  | 'window'
  | 'verified'
  | 'warning';

type IconProps = {
  name: IconName;
  className?: string;
  style?: CSSProperties;
};

const PATHS: Record<IconName, string[]> = {
  arrowForward: ['M5 12h14', 'm13 6 6 6-6 6'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronLeft: ['m15 18-6-6 6-6'],
  chevronRight: ['m9 18 6-6-6-6'],
  chevronUp: ['m18 15-6-6-6 6'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  copy: ['M8 8h11v11H8z', 'M5 16H4V5h11v1'],
  delete: ['M4 7h16', 'M9 7V4h6v3', 'm7 4-.7 9H8.7L8 11'],
  distributeHorizontal: ['M4 4v16', 'M20 4v16', 'M8 8v8', 'M16 8v8', 'M12 6v12'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  expand: ['M8 3H3v5', 'M16 3h5v5', 'M8 21H3v-5', 'M16 21h5v-5', 'M3 8l6-6', 'm21 8-6-6', 'M3 16l6 6', 'm21-6-6 6'],
  error: ['M12 8v4', 'M12 16h.01', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z'],
  firstPage: ['M6 5v14', 'm18 6-6 6 6 6'],
  gripVertical: ['M9 5h.01', 'M15 5h.01', 'M9 12h.01', 'M15 12h.01', 'M9 19h.01', 'M15 19h.01'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  help: ['M9.1 9a3 3 0 1 1 5.8 1c0 2-2.9 2.4-2.9 4', 'M12 18h.01', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z'],
  lastPage: ['M18 5v14', 'm6-6 6 6-6 6'],
  list: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  memory: [
    'M7 7h10v10H7z',
    'M9 1v3',
    'M15 1v3',
    'M9 20v3',
    'M15 20v3',
    'M20 9h3',
    'M20 14h3',
    'M1 9h3',
    'M1 14h3',
  ],
  pause: ['M9 5v14', 'M15 5v14'],
  play: ['m8 5 11 7-11 7Z'],
  progress: ['M21 12a9 9 0 1 1-5.3-8.2'],
  reverse: ['M17 3l4 4-4 4', 'M3 7h18', 'm7 21-4-4 4-4', 'M21 17H3'],
  restart: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v6h6'],
  save: ['M5 3h12l2 2v16H5z', 'M8 3v6h8V3', 'M8 21v-7h8v7'],
  settings: [
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.08 15a1.7 1.7 0 0 0-1.56-1H5.4v-3h.12a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.8 5.94l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.56V4.7h3v.08a1.7 1.7 0 0 0 1 1.56A1.7 1.7 0 0 0 17.62 6l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1h.12v3h-.12a1.7 1.7 0 0 0-1.56 1Z',
  ],
  shuffle: ['M16 3h5v5', 'M4 20 21 3', 'M21 16v5h-5', 'm15 21 6-6', 'M4 4l5 5'],
  skipNext: ['m6 5 9 7-9 7Z', 'M18 5v14'],
  skipPrevious: ['m18 5-9 7 9 7Z', 'M6 5v14'],
  systemUpdate: ['M12 3v11', 'm8 10 4 4 4-4', 'M5 19h14'],
  timer: ['M12 8v5l3 2', 'M9 2h6', 'M12 5a8 8 0 1 1-8 8'],
  upload: ['M12 21V9', 'm17 14-5-5-5 5', 'M5 3h14'],
  window: ['M3 5h18v14H3z', 'M3 9h18', 'm14 3 4 4', 'M18 12v4h-4'],
  verified: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', 'm8 12 2.5 2.5L16 9'],
  warning: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z', 'M12 9v4', 'M12 17h.01'],
};

export function Icon({ name, className = '', style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}
