import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import 'tweeq/style.css'
import './index.css'
import { LanguageProvider } from './i18n/LanguageProvider'
import { SplashScreen } from './features/splash/SplashScreen'
import { currentToolWindow } from './adapters/tauri/toolWindows'
import { WindowRoot } from './WindowRoot'

const toolWindow = currentToolWindow()
if (toolWindow) document.documentElement.dataset.toolWindow = toolWindow

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Suspense fallback={null}>
        <WindowRoot toolWindow={toolWindow} />
      </Suspense>
      {!toolWindow && <SplashScreen />}
    </LanguageProvider>
  </StrictMode>,
)
