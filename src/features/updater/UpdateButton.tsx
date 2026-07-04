import type { UpdateStatus } from './types';
import { Icon } from '../../components/Icon';

type UpdateButtonProps = {
  status: UpdateStatus;
  onClick: () => void;
};

export function UpdateButton({ status, onClick }: UpdateButtonProps) {
  const available = status === 'available';
  const busy = status === 'checking' || status === 'downloading' || status === 'installing';
  const failed = status === 'error';

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      className={`relative inline-flex min-w-10 items-center justify-center border px-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${
        available
          ? 'border-fire bg-fire/15 text-fire hover:bg-fire/25'
          : failed
            ? 'border-red-400/50 bg-red-400/10 text-red-300 hover:bg-red-400/20'
            : 'border-cream/25 bg-k-surface text-tab-inactive hover:border-cream/45 hover:text-k-text'
      }`}
      title={available ? 'アップデートを利用できます' : 'アップデートを確認'}
      aria-label={available ? 'アップデートを利用できます' : 'アップデートを確認'}
    >
      <Icon
        name={busy ? 'progress' : 'systemUpdate'}
        className={`text-[18px] ${busy ? 'animate-spin' : ''}`}
      />
      {(available || failed) && (
        <span
          className={`absolute -right-1 -top-1 h-2.5 w-2.5 border-2 border-k-bg ${
            available ? 'bg-fire' : 'bg-red-400'
          }`}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
