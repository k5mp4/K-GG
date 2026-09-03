import { describe, expect, it } from 'vitest';
import {
  findBrokenMarkdownLinks,
  hasMergeGatePass,
  parseFrontmatter,
  updateFrontmatter,
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
});
