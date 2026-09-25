import { createContentLoader } from 'vitepress'

export interface AdrEntry {
  id: string
  title: string
  status: string
  url: string
}

declare const data: AdrEntry[]
export { data }

// ADR一覧は各ADRのfrontmatterから描画し、index.mdへ行をコミットしない。
// 並列PRが同じ表へ追記してmerge conflictになるのを避けるため。
export default createContentLoader('adr/*.md', {
  transform(pages): AdrEntry[] {
    return pages
      .filter(page => !/\/adr\/(?:index|_template)(?:\.html)?$|\/adr\/$/.test(page.url))
      .map(page => ({
        id: String(page.frontmatter.id ?? ''),
        title: String(page.frontmatter.title ?? ''),
        status: String(page.frontmatter.status ?? ''),
        url: page.url,
      }))
      .sort((a, b) => a.id.localeCompare(b.id, 'en'))
  },
})
