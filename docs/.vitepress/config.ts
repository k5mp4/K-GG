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
      { text: '変更', link: '/changes/' },
      { text: 'ADR', link: '/adr/' },
    ],

    sidebar: {
      '/development/': [
        {
          text: '開発者向け',
          items: [
            { text: '入口', link: '/development/' },
            { text: '開発ワークフロー', link: '/development/workflow' },
            { text: 'ValidationとCI', link: '/development/validation' },
            { text: 'AI駆動開発', link: '/development/ai-development' },
            { text: 'Change Capsule運用', link: '/development/change-workflow' },
            { text: 'Releaseと環境検証', link: '/development/releasing' },
            { text: 'プロジェクト概要', link: '/development/project-overview' },
            { text: 'アーキテクチャ', link: '/development/architecture' },
            { text: '開発・検証', link: '/development/development-guide' },
            { text: 'DocDD運用', link: '/development/docdd' },
            { text: 'MCP Developer Interface', link: '/development/mcp' },
          ],
        },
      ],
      '/specs/': [
        {
          text: '現行仕様',
          items: [
            { text: '仕様の入口', link: '/specs/' },
            { text: '現行仕様一覧', link: '/specs/current/' },
            { text: 'Gradient System', link: '/specs/current/gradient-system' },
            { text: 'Effect Stack', link: '/specs/current/effect-stack' },
            { text: 'MCP Developer Interface', link: '/specs/current/mcp-developer-interface' },
            { text: 'Preset System', link: '/specs/current/preset-system' },
            { text: 'Legacy SPEC一覧', link: '/specs/#legacy-change-specifications' },
            { text: 'Legacy SPECテンプレート', link: '/specs/_template' },
          ],
        },
      ],
      '/changes/': [
        {
          text: '変更仕様',
          items: [
            { text: '変更の入口', link: '/changes/' },
            { text: '進行中の変更', link: '/changes/active/' },
            { text: '完了済み変更', link: '/changes/archive/' },
            { text: '変更テンプレート', link: '/changes/_template/proposal' },
          ],
        },
      ],
      '/specs/current/': [
        {
          text: '現行仕様',
          items: [
            { text: '現行仕様一覧', link: '/specs/current/' },
            { text: 'Gradient System', link: '/specs/current/gradient-system' },
            { text: 'Effect Stack', link: '/specs/current/effect-stack' },
            { text: 'Preset System', link: '/specs/current/preset-system' },
            {
              text: 'Legacy SPEC一覧',
              link: '/specs/#legacy-change-specifications',
            },
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
            {
              text: 'ADR-0016 MCP Control APIとtarball',
              link: '/adr/0016-mcp-control-api-and-local-distribution',
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
