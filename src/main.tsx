import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Viewport } from 'tweeq'
import 'tweeq/style.css'
import './index.css'
import App from './App.tsx'
import { DetachedEffectStackApp } from './components/DetachedEffectStackApp'
import { isEffectStackWindow } from './lib/effectStackWindow'
import { LanguageProvider } from './i18n/LanguageProvider'

const rootContent = isEffectStackWindow() ? <DetachedEffectStackApp /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Viewport appId="k-gg">
        {rootContent}
      </Viewport>
    </LanguageProvider>
  </StrictMode>,
)
