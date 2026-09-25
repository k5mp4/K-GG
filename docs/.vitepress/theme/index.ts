// kagaribi15_grad/docs/.vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import CldImage from './components/CldImage.vue'
import ChangeIndex from './components/ChangeIndex.vue'
import AdrIndex from './components/AdrIndex.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // CldImage という名前でコンポーネントを登録
    app.component('CldImage', CldImage)
    app.component('ChangeIndex', ChangeIndex)
    app.component('AdrIndex', AdrIndex)
  }
}
