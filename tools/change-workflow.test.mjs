import { describe, expect, it } from 'vitest';
import {
  buildNewAdr,
  buildNewProposal,
  findBrokenMarkdownLinks,
  hasMergeGatePass,
  parseFrontmatter,
  newAdrId,
  newChangeId,
  updateFrontmatter,
  validateAdrId,
  validateChangeId,
} from './change-workflow.mjs';

describe('change workflow tooling', () => {
  it('parses one-line metadata lists and preserves the document body', () => {
    const parsed = parseFrontmatter(`---\ntype: change\ncurrent_specs: [CURRENT-ONE, CURRENT-TWO]\n---\n\n# Body`);

    expect(parsed.data.type).toBe('change');
    expect(parsed.data.current_specs).toEqual(['CURRENT-ONE', 'CURRENT-TWO']);
    expect(parsed.body).toContain('# Body');
  });

  it('updates existing metadata and appends new metadata without changing the body', () => {
    const result = updateFrontmatter(`---\nstatus: approved\n---\n\n# Change`, {
      status: 'archived',
      outcome: 'follow-up',
    });

    expect(result).toContain('status: archived');
    expect(result).toContain('outcome: follow-up');
    expect(result).toContain('# Change');
  });

  it('round-trips quoted scalar metadata containing a colon', () => {
    const result = updateFrontmatter(`---\nstatus: approved\n---\n\n# Change`, {
      follow_up: 'issue-needed: verify the release gate',
    });

    expect(parseFrontmatter(result).data.follow_up).toBe('issue-needed: verify the release gate');
  });

  it('requires every Merge Gate result to pass or be not-applicable', () => {
    expect(hasMergeGatePass('## Merge Gate\n| Check | Status |\n| --- | --- |\n| docs | pass |')).toBe(true);
    expect(hasMergeGatePass('## Merge Gate\n| Check | Status |\n| --- | --- |\n| docs | pass |\n| native | pending |')).toBe(false);
    expect(hasMergeGatePass('## Release Gate\n| Check | Status |\n| --- | --- |\n| GPU | pass |')).toBe(false);
  });

  it('finds broken local links while ignoring external URLs', () => {
    const file = 'docs/development/workflow.md';
    expect(findBrokenMarkdownLinks(file, '[ok](./validation) [bad](./missing) [web](https://example.com)')).toEqual(['./missing']);
  });

  it('accepts historical sequential IDs but requires dated IDs for new changes', () => {
    expect(validateChangeId('CHANGE-001', '2026-07-27-docdd-current-and-change-specs')).toBeNull();
    expect(validateChangeId('CHANGE-054', 'CHANGE-054-export-format-select')).toBeNull();
    expect(validateChangeId('CHANGE-057', 'CHANGE-057-next')).toContain('reserved for history');
    expect(validateChangeId('CHANGE-20260925-export-format', 'CHANGE-20260925-export-format')).toBeNull();
  });

  it('rejects malformed dated IDs and directories that do not match the ID', () => {
    expect(validateChangeId('CHANGE-20260230-bad-date', 'CHANGE-20260230-bad-date')).toContain('invalid date');
    expect(validateChangeId('CHANGE-20260925-Upper_Case', 'CHANGE-20260925-Upper_Case')).toContain('invalid change id');
    expect(validateChangeId('CHANGE-20260925-export', 'CHANGE-20260925-export-format')).toContain('directory name');
  });

  it('creates a proposal from the template with a dated ID', () => {
    const id = newChangeId('export-format', '2026-09-25');
    const proposal = buildNewProposal(
      `---\nid: CHANGE-YYYYMMDD-slug\ntitle: 変更の短い名前\ncreated: YYYY-MM-DD\nupdated: YYYY-MM-DD\n---\n\n# 変更の短い名前\n\n[spec](../../specs/current/)\n`,
      { id, title: '書き出し形式', date: '2026-09-25' },
    );

    expect(id).toBe('CHANGE-20260925-export-format');
    expect(parseFrontmatter(proposal).data).toMatchObject({ id, title: '書き出し形式', created: '2026-09-25', updated: '2026-09-25' });
    expect(proposal).toContain('# 書き出し形式');
    expect(proposal).toContain('[spec](../../../specs/current/)');
  });

  it('accepts historical sequential ADR IDs but requires dated IDs for new ADRs', () => {
    expect(validateAdrId('ADR-0001', '0001-documentation-source-of-truth.md')).toBeNull();
    expect(validateAdrId('ADR-0023', '0023-spout-output-cpu-readback.md')).toBeNull();
    expect(validateAdrId('ADR-0024', '0024-next.md')).toContain('reserved for history');
    expect(validateAdrId('ADR-0001', '0002-mismatch.md')).toContain('filename must start with');
    expect(validateAdrId('ADR-20260925-doc-ids', '20260925-doc-ids.md')).toBeNull();
    expect(validateAdrId('ADR-20260925-doc-ids', '20260925-other.md')).toContain('filename must be');
    expect(validateAdrId('ADR-20261301-doc-ids', '20261301-doc-ids.md')).toContain('invalid date');
  });

  it('creates an ADR from the template with a dated ID', () => {
    const id = newAdrId('doc-ids', '2026-09-25');
    const adr = buildNewAdr(
      `---\nid: ADR-YYYYMMDD-slug\ntitle: 判断のタイトル\ndate: YYYY-MM-DD\n---\n\n# ADR-YYYYMMDD-slug: 判断のタイトル\n`,
      { id, title: '文書ID', date: '2026-09-25' },
    );

    expect(id).toBe('ADR-20260925-doc-ids');
    expect(parseFrontmatter(adr).data).toMatchObject({ id, title: '文書ID', date: '2026-09-25' });
    expect(adr).toContain('# ADR-20260925-doc-ids: 文書ID');
  });
});
