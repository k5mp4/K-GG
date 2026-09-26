import { createContentLoader } from 'vitepress'

export interface ChangeEntry {
  bucket: 'active' | 'archive'
  id: string
  title: string
  status: string
  currentSpecs: string[]
  url: string
}

declare const data: ChangeEntry[]
export { data }

// Change一覧はproposal.mdのfrontmatterから描画し、index.mdへ行をコミットしない。
// 並列PRが同じ表へ追記してmerge conflictになるのを避けるため。
export default createContentLoader(['changes/active/*/proposal.md', 'changes/archive/*/proposal.md'], {
  transform(pages): ChangeEntry[] {
    return pages
      .map(page => {
        const bucket = page.url.includes('/changes/active/') ? 'active' : 'archive'
        const frontmatter = page.frontmatter
        return {
          bucket,
          id: String(frontmatter.id ?? ''),
          title: String(frontmatter.title ?? ''),
          status: String(frontmatter.status ?? ''),
          currentSpecs: Array.isArray(frontmatter.current_specs) ? frontmatter.current_specs.map(String) : [],
          url: page.url,
        } satisfies ChangeEntry
      })
      .sort((a, b) => a.id.localeCompare(b.id, 'en'))
  },
})
