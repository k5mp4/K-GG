import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/docs/',
  title: "K-GG",
  description: "A professional gradient generator tool for creators.",
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '使い方', link: '/' },
      { text: '開発者向け', link: '/development/' },
      { text: '仕様', link: '/specs/' },
      { text: 'ADR', link: '/adr/' },
    ],

    sidebar: {
      '/development/': [
        {
          text: '開発者向け',
          items: [
            { text: '入口', link: '/development/' },
            { text: 'プロジェクト概要', link: '/development/project-overview' },
            { text: 'アーキテクチャ', link: '/development/architecture' },
            { text: '開発・検証', link: '/development/development-guide' },
            { text: 'DocDD運用', link: '/development/docdd' },
          ],
        },
      ],
      '/specs/': [
        {
          text: '機能仕様',
          items: [
            { text: '仕様一覧', link: '/specs/' },
            { text: 'SPEC-000 DocDD基盤', link: '/specs/SPEC-000-docdd-foundation' },
            {
              text: 'SPEC-001 Postprocessアニメーション判定',
              link: '/specs/SPEC-001-postprocess-animation-policy',
            },
            {
              text: 'SPEC-002 Tauri WebGL互換性',
              link: '/specs/SPEC-002-tauri-frame-scheduler-compatibility',
            },
            {
              text: 'SPEC-003 Organic Glass',
              link: '/specs/SPEC-003-organic-glass-postprocess',
            },
            {
              text: 'SPEC-004 内蔵SVGアイコン',
              link: '/specs/SPEC-004-bundled-svg-icons',
            },
            {
              text: 'SPEC-005 動画出力名',
              link: '/specs/SPEC-005-video-export-naming',
            },
            {
              text: 'SPEC-006 統合検証',
              link: '/specs/SPEC-006-verification-commands',
            },
            { text: '仕様テンプレート', link: '/specs/_template' },
          ],
        },
      ],
      '/adr/': [
        {
          text: 'ADR',
          items: [
            { text: 'ADR一覧', link: '/adr/' },
            {
              text: 'ADR-0001 文書を一次情報とする',
              link: '/adr/0001-documentation-source-of-truth',
            },
            { text: 'ADRテンプレート', link: '/adr/_template' },
          ],
        },
      ],
    },

    outline: {
      level: [1, 3],
      label: '目次'
    }
  }
})
