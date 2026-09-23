import { useState } from 'react';
import catalogText from '../generated/thirdPartyLicenses.json?raw';
import { useLanguage } from '../i18n/LanguageProvider';
import { ExternalLink } from './ExternalLink';

const textClass = 'mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-k-text/85';
type LicenseEntry = {
  ecosystem: string;
  name: string;
  version: string;
  license: string;
  source: string;
  notices: { file: string; text: string }[];
};
const catalog = JSON.parse(catalogText) as {
  applicationLicense: string;
  applicationNotice: string;
  entries: LicenseEntry[];
};

function ComponentLicense({ entry }: { entry: LicenseEntry }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return <details onToggle={event => setOpen(event.currentTarget.open)} className="border border-panel-border p-3">
    <summary className="cursor-pointer break-words text-sm">
      <strong>{entry.name}</strong> {entry.version} — {entry.license}
    </summary>
    {open && <>
      <ExternalLink href={entry.source} className="mt-3 inline-block break-all text-sm text-fire underline">{t('help.licenseSource')}</ExternalLink>
      {entry.notices.map((notice, index) => <div key={index}>
        <p className="mt-4 break-all text-xs font-semibold">{notice.file}</p>
        <pre className={textClass}>{notice.text}</pre>
      </div>)}
    </>}
  </details>;
}

export default function ThirdPartyLicenses() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const entries = catalog.entries.filter(entry => `${entry.name} ${entry.license}`.toLowerCase().includes(query.toLowerCase()));
  return <section aria-label={t('help.licenses')} className="min-w-0 space-y-4">
    <p className="text-sm leading-relaxed">{t('help.licensesDescription')}</p>
    <details className="border border-panel-border p-3">
      <summary className="cursor-pointer font-semibold">K-GG — Apache-2.0 / NOTICE</summary>
      <pre className={textClass}>{catalog.applicationLicense}</pre>
      <pre className={textClass}>{catalog.applicationNotice}</pre>
    </details>
    <label className="block text-sm">
      {t('help.licenseSearch')}
      <input value={query} onChange={event => setQuery(event.target.value)} type="search"
        className="mt-2 w-full border border-panel-border bg-k-bg p-2 text-k-text" />
    </label>
    <p className="text-xs text-k-text/70">{entries.length} / {catalog.entries.length}</p>
    {entries.map(entry => <ComponentLicense key={`${entry.ecosystem}:${entry.name}:${entry.version}`} entry={entry} />)}
  </section>;
}
