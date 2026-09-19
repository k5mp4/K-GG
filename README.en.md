# K-GG

[Japanese README](README.md)

Create gradients, textures, and motion-ready visuals for KAGARIBI visual production.

K-GG is a WebGL-based gradient generator. Edit color fields and effects, export still images or PNG sequences, and use the published Windows desktop app for FFmpeg-backed MOV/MP4 export.

[Open the Web App](https://kagaribi15-grad.ke-goworks.com/)

[Download Windows x64](https://github.com/k5mp4/K-GG/releases/latest) · [Read the User Guide](docs/index.md)

## Visual preview

The README hero visual is intentionally pending an owner-provided and approved output capture. The required asset, format, placement, and approval checklist are recorded in the [README visual asset brief](docs/development/readme-visual-assets.md). No generated, sample, or broken image link is used as a substitute.

## What can you make?

- **Gradient fields** - Linear, Radial, 4-color, Diamond, Angle, Bezier, and Mesh gradients. Mesh is a single 2x2 Coons Patch with editable corner colors and Bezier handles.
- **Layered effects** - Diffuse, Noise, Slit, Stretch, Distort, Mirror, Kaleidoscope, Voronoi, Glass, and other effect-stack stages.
- **Images and motion** - Use an image as a gradient source or overlay/mask, preview Static / Auto / Keys animation, and export stills or PNG sequences.
- **Advanced surfaces** - Explore the SANDBOX modules Cloth, Cone, Normal Map, Prism, Particles, Flow Gradient, and Seamless for 3D or experimental looks.

Combine gradients, image sources, masks, effect stacks, animation, and presets to create still images and motion-ready assets.

## Feature status

The labels below describe the current product surface. They are not a promise that every module has the same runtime or platform coverage.

| Positioning | Current scope |
| --- | --- |
| Core workflow | Gradient editing, Image Gradient Source, image overlay/mask, the main Effect Stack, animation preview, preset management, image export, and PNG-sequence ZIP export. |
| Experimental / Beta | **Cloth** and **Normal Map** are marked Beta in SANDBOX. **After Effects Connect** is also Beta. |
| SANDBOX / Advanced | SANDBOX is a separate advanced surface. Its modules are not the same as the reorderable main Effect Stack; 3D, GPU, and Bridge behavior can depend on the runtime environment. |
| Windows desktop release | The published desktop release is Windows x64. MOV/MP4 export is available when external FFmpeg is detected. |

## Windows desktop quick start

1. Download the [latest Windows x64 release](https://github.com/k5mp4/K-GG/releases/latest) and run the installer.
2. Start with a preset or build a gradient from the editor, then use **Export**.
3. PNG and image-sequence exports do not require FFmpeg. For MOV/MP4, install or provide an external `ffmpeg.exe` as described in the [user guide](docs/index.md).
4. The published installer is not Authenticode-signed, so Windows SmartScreen may warn on first install. Verify that the installer came from the official [GitHub Release](https://github.com/k5mp4/K-GG/releases/latest) before continuing.

For detailed operation, see the [user guide](docs/index.md). Distribution, updates, and FFmpeg Release Gate checks are documented in the [release guide](docs/development/releasing.md).

## Requirements

### Using the Windows desktop release

- Windows x64 for the published installer.
- External FFmpeg is required only for MOV/MP4 export.
- GPU and driver support can affect WebGL2 and SANDBOX/3D results.

### Developing K-GG

- Node.js `22.12.0` and npm `>=10.9.0`.
- Rust and the Tauri prerequisites when building the desktop app.
- FFmpeg is needed for native video testing, not for the browser development server.

Make the `ffmpeg` command available on your PATH when testing native video export. On Windows, install it with:

```sh
winget install Gyan.FFmpeg
```

Verify the installation with:

```sh
ffmpeg -version
```

## Developer quick start

Install dependencies:

```sh
npm ci
```

Run one app at a time. These commands are long-running:

```sh
npm run dev:local       # Browser app
```

```sh
npm run tauri:dev       # Tauri desktop app
```

After stopping the development server, run validation:

```sh
npm run check:fast      # Typecheck, tests, lint, builds, and docs checks
npm run docs:check      # Validate docs references and indexes
npm run docs:build      # Build the VitePress documentation site
```

For the full development workflow, validation gates, and native checks, see the [developer guide](docs/development/index.md). The [DocsDD guide](docs/development/docdd.md) explains where current behavior, design decisions, and change history belong.

## Build and release verification

Use the following commands to build the frontend, the Tauri desktop app, or the Windows x64 NSIS installer individually:

```sh
npm run build
npm run tauri:build
npm run tauri:build:windows
```

Use `npm run verify` for the release configuration, fast checks, and Rust checks together. `npm run verify:windows` is a local Windows helper: place the updater signing key at `%USERPROFILE%\.tauri\k-gg.key`, enter its password interactively, and then build the Windows installer. For GitHub Actions releases, use the `release` Environment secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` defined by the [release workflow](.github/workflows/release.yml). Neither path is a normal pull-request command.

```sh
npm run verify
npm run verify:windows
```

## Architecture and repository map

The main path is:

```text
React UI -> application commands -> Zustand state -> scene evaluation
         -> render plan/frame bridge -> WebGL2 canvas
         -> export adapter
```

```text
src/                  React UI, state, evaluation, WebGL renderer, export adapters
src-tauri/            Windows/Tauri shell, native export, updater integration
docs/                 User guide, developer docs, current specs, ADRs, and history
tools/                Documentation and development utilities
```

The [architecture guide](docs/development/architecture.md) contains the maintained technical overview. This README intentionally stays at the orientation level rather than duplicating internal specifications.

## Documentation

Start the development documentation site with:

```sh
npm run docs:dev
```

| Need | Start here |
| --- | --- |
| User guide | [docs/index.md](docs/index.md) |
| Developer guide | [docs/development/index.md](docs/development/index.md) |
| Current behavior | [docs/specs/current/](docs/specs/current/) |
| Architecture | [docs/development/architecture.md](docs/development/architecture.md) |
| Design decisions / ADR | [docs/adr/](docs/adr/) |
| Release and native checks | [docs/development/releasing.md](docs/development/releasing.md) |
| README visual asset requirements | [docs/development/readme-visual-assets.md](docs/development/readme-visual-assets.md) |

## Contributing and issue reporting

Before opening a pull request, read [CONTRIBUTING.md](CONTRIBUTING.md) and the [development workflow](docs/development/workflow.md). For bugs, feature requests, documentation improvements, or reproduction details, use the [GitHub issue tracker](https://github.com/k5mp4/K-GG/issues) when public tracking is useful. Direct requests and pull requests are also valid entry points.

## Releases

- [Latest release](https://github.com/k5mp4/K-GG/releases/latest)
- [All releases](https://github.com/k5mp4/K-GG/releases)
- [Release guide](docs/development/releasing.md)

The published desktop distribution is a Windows x64 installer. Release notes identify the assets and native prerequisites for each version; use the release page rather than a hard-coded version link.

Production builds check the latest published release at startup and let users choose when to download and install it. Updates are never downloaded or installed automatically. The initial installer has a Tauri updater signature but does not use Windows Authenticode code signing, so Windows SmartScreen may warn on first install.

Maintainers must configure the updater signing key and GitHub Environment before creating a release. See the [release guide](docs/development/releasing.md) for the required checks.

## Public repository notes

This repository excludes local AI and tooling settings, dependency folders, build outputs, logs, and VitePress caches through `.gitignore`.

## License and publishing notes

K-GG source code is licensed under the [Apache License 2.0](LICENSE). Output generated with K-GG, including images, video, and PNG sequences, may be used for personal, non-commercial, or commercial purposes. Users are responsible for rights clearance for third-party materials they import or overlay, including images, logos, characters, trademarks, and event assets.

Third-party notices and attribution are collected in [NOTICE](NOTICE). The current npm and Cargo dependency set is primarily licensed under MIT, Apache-2.0, BSD, and ISC terms, with MPL-2.0 components in the Tauri/Rust dependency tree. MPL-2.0 applies to those third-party components and does not change K-GG's Apache-2.0 license.

K-GG does not bundle or distribute FFmpeg. For MOV/MP4 export, the desktop app invokes either an `ffmpeg.exe` placed by the user at the K-GG-specific `<app_local_data_dir>/ffmpeg/ffmpeg.exe` location or an `ffmpeg` command available on the system PATH as a separate process. FFmpeg licensing depends on the build you use. Before redistributing any FFmpeg binary with K-GG, review the [FFmpeg legal information](https://ffmpeg.org/legal.html) and the terms of the selected distribution.

GSAP is used for UI animation and is licensed under the GSAP Standard License, not MIT. Commercial use is generally allowed under that license, but if K-GG is published or sold as an animation-authoring service or as a tool competing with Webflow-style visual animation builders, review the GSAP license before publication or remove the GSAP dependency.
