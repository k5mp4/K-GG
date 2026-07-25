import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Viewport } from 'tweeq'
import 'tweeq/style.css'
import './index.css'
import App from './App.tsx'
import { DetachedEffectStackApp } from './components/DetachedEffectStackApp'
import { isEffectStackWindow } from './lib/effectStackWindow'

const rootContent = isEffectStackWindow() ? <DetachedEffectStackApp /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Viewport appId="k-gg">
      {rootContent}
    </Viewport>
  </StrictMode>,
)
