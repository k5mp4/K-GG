import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Viewport } from 'tweeq'
import 'tweeq/style.css'
import './index.css'
import { LanguageProvider } from './i18n/LanguageProvider'
import { SplashScreen } from './features/splash/SplashScreen'
import { isGradientRampEditorWindow } from './adapters/tauri/gradientRampEditorWindow'

// The Gradient Ramp editor window must not load the renderer and workspace,
// so each window loads only its own root module.
const App = lazy(() => import('./App.tsx'))
const GradientRampEditorWindowApp = lazy(() => import('./features/gradientRampEditor/GradientRampEditorWindowApp').then(m => ({ default: m.GradientRampEditorWindowApp })))

const isEditorWindow = isGradientRampEditorWindow()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Suspense fallback={null}>
        {isEditorWindow ? (
          <Viewport appId="k-gg-gradient-ramp-editor">
            <GradientRampEditorWindowApp />
          </Viewport>
        ) : (
          <Viewport appId="k-gg">
            <App />
          </Viewport>
        )}
      </Suspense>
      {!isEditorWindow && <SplashScreen />}
    </LanguageProvider>
  </StrictMode>,
)
