import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Viewport } from 'tweeq'
import 'tweeq/style.css'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageProvider'
import { SplashScreen } from './features/splash/SplashScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Viewport appId="k-gg">
        <App />
      </Viewport>
      <SplashScreen />
    </LanguageProvider>
  </StrictMode>,
)
