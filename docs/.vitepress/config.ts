import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/docs/',
  title: "K-GG",
  description: "A professional gradient generator tool for creators.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Release Guide', link: '/releasing' },
    ],

    sidebar: [],

    outline: {
      level: [1, 3],
      label: 'How to use this App'
    }
  }
})
