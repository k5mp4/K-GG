import { lazy } from 'react'
import { Viewport } from 'tweeq'
import type { ToolWindowLabel } from './adapters/tauri/toolWindows'

// Tool windows must not load the renderer and workspace, so each window
// loads only its own root module.
const App = lazy(() => import('./App.tsx'))
const GradientRampEditorWindowApp = lazy(() => import('./features/gradientRampEditor/GradientRampEditorWindowApp').then(m => ({ default: m.GradientRampEditorWindowApp })))
const EffectStackWindowApp = lazy(() => import('./features/effectStack/EffectStackWindowApp').then(m => ({ default: m.EffectStackWindowApp })))

/** Root of the main window or of a native tool window. */
export function WindowRoot({ toolWindow }: { toolWindow: ToolWindowLabel | null }) {
  if (toolWindow === 'gradient-ramp-editor') {
    return (
      <Viewport appId="k-gg-gradient-ramp-editor">
        <GradientRampEditorWindowApp />
      </Viewport>
    )
  }
  if (toolWindow === 'effect-stack') {
    return (
      <Viewport appId="k-gg-effect-stack">
        <EffectStackWindowApp />
      </Viewport>
    )
  }
  return (
    <Viewport appId="k-gg">
      <App />
    </Viewport>
  )
}
