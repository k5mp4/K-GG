// 並列ブランチで衝突しない文書IDの規則。
// 連番時代のIDは既存リンクと履歴のため有効なまま残し、新しい文書は日付+slugで作る。
export const legacyChangeIdMax = 56;
export const legacyAdrIdMax = 23;

const slugPattern = '[a-z0-9]+(?:-[a-z0-9]+)*';

function validateDatedId(prefix, id) {
  const match = new RegExp(`^${prefix}-(\\d{4})(\\d{2})(\\d{2})-${slugPattern}$`).exec(id ?? '');
  if (!match) return `invalid ${prefix.toLowerCase()} id "${id ?? ''}"; use ${prefix}-YYYYMMDD-slug`;
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) {
    return `invalid date in ${prefix.toLowerCase()} id "${id}"`;
  }
  return null;
}

export function datedId(prefix, slug, date) {
  return `${prefix}-${date.replaceAll('-', '')}-${slug}`;
}

// directoryを渡した場合、日付+slug IDはdirectory名と一致する必要がある。
export function validateChangeId(id, directory) {
  const legacy = /^CHANGE-(\d{3})$/.exec(id ?? '');
  if (legacy) {
    return Number(legacy[1]) <= legacyChangeIdMax
      ? null
      : `sequential change id "${id}" is reserved for history; use CHANGE-YYYYMMDD-slug (npm run change:new)`;
  }
  const error = validateDatedId('CHANGE', id);
  if (error) return error;
  if (directory !== undefined && directory !== id) return `directory name must equal change id "${id}"`;
  return null;
}

// fileNameを渡した場合、連番ADRは`NNNN-*.md`、日付+slug ADRは`YYYYMMDD-slug.md`である必要がある。
export function validateAdrId(id, fileName) {
  const legacy = /^ADR-(\d{4})$/.exec(id ?? '');
  if (legacy) {
    if (Number(legacy[1]) > legacyAdrIdMax) return `sequential ADR id "${id}" is reserved for history; use ADR-YYYYMMDD-slug (npm run adr:new)`;
    if (fileName !== undefined && !fileName.startsWith(`${legacy[1]}-`)) return `filename must start with "${legacy[1]}-"`;
    return null;
  }
  const error = validateDatedId('ADR', id);
  if (error) return error;
  const expected = `${id.slice('ADR-'.length)}.md`;
  if (fileName !== undefined && fileName !== expected) return `filename must be "${expected}"`;
  return null;
}
