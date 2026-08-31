### License / Terms of Use

K-GG source code is distributed under the Apache License 2.0. © 2026 ke-go.

Images, videos, and other materials generated with this application may be used for personal, non-commercial, or commercial purposes. Use, copying, modification, and redistribution of the application itself are governed by the Apache License 2.0. See the repository `LICENSE` for details.

You are responsible for ensuring generated materials do not infringe third-party copyrights, trademarks, event logos, characters, or other rights.

#### Third-party software

For MOV and MP4 export, the K-GG Tauri desktop app launches FFmpeg placed in the K-GG-specific folder or available on PATH. K-GG does not bundle or distribute FFmpeg and does not use ffmpeg.wasm.

FFmpeg is primarily licensed under GNU LGPL 2.1 or later. GPL applies when a build includes GPL components. The recommended build from gyan.dev is GPLv3. FFmpeg licensing is separate from the Apache License 2.0 that covers K-GG.

K-GG uses third-party libraries including React, Tauri, fflate, ogl, Tweeq, Zustand, and react-markdown. See `NOTICE` in the repository for a summary of third-party licenses.

GSAP is used for UI animation under the GSAP Standard License. Review that license or remove the dependency before distributing K-GG in a way that competes with animation-production services or Webflow-style visual animation tools.

The web build loads Noto Sans JP and Open Sans from Google Fonts in `index.html`. Self-host the fonts and bundle their license files for offline or privacy-sensitive distribution.

- FFmpeg: https://ffmpeg.org
- FFmpeg Windows builds: https://www.gyan.dev/ffmpeg/builds/
- FFmpeg license information: https://ffmpeg.org/legal.html
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- LGPL v2.1: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
- GSAP Standard License: https://gsap.com/standard-license/

## K-GG Guide

## Basic settings (right panel)

- **Canvas Size** sets the output resolution. Choose Full HD, HD, 400×400, or 800×800, or enter W and H directly. Mouse wheel changes by 1; Shift+wheel changes by 10. Use the lock icon to preserve the aspect ratio.
- **Gradient Ramp** is the main editing area below the resolution controls. Adjust color, position, and opacity for each stop. Color Palette Generator extracts colors from an image and applies them as gradient stops.
- **Image Overlay / Mask** overlays an image or uses it as an alpha mask.
- **Gradient Type** provides Linear, Radial, 4-color, Diamond, Angle, Bezier, and **Mesh Gradation** layouts. Mesh Gradation is one 2×2 Coons Patch: drag its four corners and eight cubic-Bezier handles, then choose the four corner positions from the existing Gradient Ramp. The shader uses Newton inversion to map pixels back to patch coordinates and bilinearly interpolates the four Ramp colors. Preview and export use the same WebGL path. Multiple cells are not supported yet, and self-intersecting patches are not guaranteed.
- **Image Gradient Source** recolors the luminance or RGB channels of an image with the current Gradient Ramp. The image is placed using Cover and the source image itself is not stored in presets.
  - **S** scales handles or multiple points.
  - **A** selects all points.
  - **G** moves points on the canvas; add **X** or **Y** to constrain an axis.

## Effects (left panel)

### Diffuse

Adds deterministic diffusion to the gradient. In V2 it is placed at the final image-processing stage by default. Smooth reduces the visible grid pattern. Adjust Scatter, Grain, and Seed. Adaptive Luminance maps input luminance through one cubic Bezier curve; its histogram is a read-only preview.

### Noise

Distorts the gradient with multiple noise algorithms. Strength controls the amount and Scale controls detail. Curl and Domain Warp are useful for organic textures. Seamless uses polar coordinates to create tileable textures; Radial (Expand) radiates outward from the center.

### Postprocess Effect Stack

Use the Effect Stack panel at the upper-left of the canvas to reorder Noise, Slit, Stretch, Distort, Mirror, Kaleidoscope, Voronoi, Glass, and Diffuse. Drag a row by its grip and toggle it with the switch. Postprocess is shown as enabled whenever one of Stretch, Distort, Mirror, Kaleidoscope, Voronoi, or Glass is enabled in the Effect Stack. Edit hand-drawn `Distort` from Postprocess's `Edit Layer`; old `manualDistort` preset data is migrated there on load. The fixed stages are `Surface → Main Stack → Prism → Particles`; edit Normal, Prism, and Particles from the `SANDBOX` tab in the top bar.

Glass uses the GLASS V2 screen-space optical approximation with smooth gradient noise and separate RGB refraction. The Postprocess properties show one Glass entry; Chromatic Aberration reaches 80px, and Transmission Tint / Highlight Tint use color inputs.

Use the shuffle button in the Effect Stack header to randomize the main-stack order. The preview transitions smoothly from the current result to the new order, and rows move from their current positions. Alt-click a layer row or its on/off toggle to solo that layer; layers temporarily hidden by solo are marked with a yellow `STAY` status. Alt-click the same target again to restore the previous enabled state. The Effect Stack can also be opened in another window; closing it restores the inline panel.

If the screen or GPU rendering becomes corrupted, open Settings in the top bar and use **Refresh app**. Unsaved edits are discarded.

### Slit

Stretches pixels along an axis. Enable Animate for motion. PingPong provides a seamless loop.

### SANDBOX

The top bar is ordered `Diffuse → Noise → Slit → Postprocess → SANDBOX → Export → Preset`; Stretch has no standalone tab and is not shown in the Postprocess property module. Select an Edit Layer in Postprocess to operate that layer's detailed properties. SANDBOX uses the same text color as Postprocess. The `SANDBOX` top-bar tab groups drawing modules that sit outside the reorderable gradient stack. Use its `Edit Layer` selector to edit Cloth, Cone, Normal, Prism, or Particles; changing the selection does not change the render order.

Normal builds a normal map from the gradient luminance. Strength, Blur, Angle, and Bevel Size control the surface relief. Prism controls the post-stack light rays and glow; Particles controls the final particle overlay.
Turn the Cloth or Cone module on in SANDBOX to switch the processed Canvas to its corresponding 3D view. There is no separate `Preview Surface` mode selector. Drag the Cone vertex handle beyond the canvas edge; its normalized position is limited to -2..2. The handle is a single cyan circle with no auxiliary ring, crosshair, or inner marker. Use Reset Position to return it to the center. The shared gradient-anchor visibility control also hides the Cone vertex handle. Seam Mode is always labeled `Mirror Repeat`, `Edge Weld`, or `Gradient Reapply`, regardless of language, and Seam Blend makes texture-repeat and flow seams continuous. Gradient Reapply corrects the RGB color field toward the opposing edge color while preserving the center sample's alpha. Canvas remains visible while a 3D surface prepares and is restored if that surface is unavailable; the view state is not saved in presets.
If WebGL2 is unavailable in the browser or WebView, K-GG stops retrying the 3D surface and returns to the 2D Canvas so editing can continue. Reload the page to re-detect WebGL2 after changing the environment.

Cone provides Mapping (Flow / Direct Projection), Depth (up to 30), Rotation, Texture Repeat, Seam Mode, Seam Blend, and Flow Cycles (±30). Perspective is not exposed. Mirror Repeat is the default Seam Mode. Direct Projection fixes the V offset so the processed 2D frame is projected onto the cone without an approaching Flow. Edit Gradient Ramp in the right sidebar; the processed Canvas updates while 3D Cone is selected, gradient anchors remain over the preview, and Mapping changes re-map the latest completed frame immediately. It adds no environment or surface lighting, and Flow follows the shared Animation timeline and export frames. Cone settings are saved in presets.

### Normal

Builds a normal map from the gradient luminance. Height controls relief strength. A monochrome gradient is applied while enabled; reapply the desired gradient after disabling it. Normal Map stays off while Diffuse is enabled, matching the legacy rendering rule.

### Animation

Each property can be Static, Auto, or Keys. Switching from Auto to Keys records the current value; created keys remain when returning to Auto. The Animation Workspace controls playback, frame stepping, Preview Loop, Duration, FPS, and Loop Timing. Filter tracks with Moving, Selected, or All, then edit Keys interpolation in Graph Editor.

### Export

- **Image** exports the current result as PNG, JPG, or WebP.
- **Slit PNGs** exports one PNG for each slit.
- **MOV** uses external FFmpeg in the Tauri desktop app to create QuickTime Animation (qtrle) MOV.
- **MP4 (H.264 RGB)** uses external FFmpeg and offers High (CRF 18), Balanced (CRF 22), and Small (CRF 27). High is the default.
- **ZIP PNG** exports a numbered PNG sequence in both web and Tauri builds without FFmpeg.

For MOV or MP4, place `ffmpeg.exe` in the K-GG FFmpeg folder or make the `ffmpeg` command available on PATH. Open the preferred folder with **Open K-GG FFmpeg folder** in Export. K-GG does not download FFmpeg.

### Preset

Saves and loads the current settings. In the desktop app, presets are stored in `presets/presets.json` beside the executable. Reset restores the initial settings. Display language is an application preference and is not stored in presets.

## Preview controls

- **Mouse wheel**: Zoom at the pointer.
- **Middle mouse drag**: Pan.
- **Space**: Play / pause animation.
- **Ctrl+Z**: Undo.
- **Ctrl+Y / Ctrl+Shift+Z**: Redo.
