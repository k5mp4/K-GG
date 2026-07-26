param(
  [Parameter(Mandatory = $true)]
  [string]$SourceRoot
)

$ErrorActionPreference = 'Stop'
$expectedCommit = '75542380032f3429b737cea3840d719cdbc5f7f8'
$expectedExports = @(
  'InputButton',
  'InputButtonToggle',
  'InputCheckbox',
  'InputDropdown',
  'InputDrum',
  'InputAngle',
  'InputColor',
  'InputCubicBezier',
  'InputCubicBezierPicker',
  'InputNumber',
  'InputPosition',
  'InputRadio',
  'InputSize',
  'InputShuffle',
  'InputString',
  'InputSwitch',
  'InputTime',
  'InputTranslate',
  'InputVec',
  'Viewport',
  'fromEnum',
  'fromNumber',
  'fromString'
)
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source = (Resolve-Path $SourceRoot).Path
$safeSource = $source.Replace('\', '/')
$actualCommit = (& git -c "safe.directory=$safeSource" -C $source rev-parse HEAD).Trim()

if ($actualCommit -ne $expectedCommit) {
  throw "Tweeq checkout mismatch. Expected $expectedCommit, got $actualCommit."
}

& git -c "safe.directory=$safeSource" -C $source diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'Tweeq checkout has tracked working-tree changes.' }
& git -c "safe.directory=$safeSource" -C $source diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Tweeq checkout has staged changes.' }

$temporaryRoot = [System.IO.Path]::GetTempPath()
$temporaryId = [guid]::NewGuid().ToString('N').Substring(0, 8)
$worktree = Join-Path $temporaryRoot ("tq-build-" + $temporaryId)
$stage = Join-Path $temporaryRoot ("tq-stage-" + $temporaryId)
$vendorTarget = Join-Path $repositoryRoot 'vendor/tweeq'
$patchFile = Join-Path $PSScriptRoot 'tweeq-vendor/kgg-safety.patch'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

try {
  & git -c "safe.directory=$safeSource" -C $source worktree add --detach $worktree $expectedCommit
  if ($LASTEXITCODE -ne 0) { throw 'Unable to create a clean Tweeq worktree.' }

  $safeWorktree = $worktree.Replace('\', '/')
  & git -c "safe.directory=$safeWorktree" -C $worktree apply --check $patchFile
  if ($LASTEXITCODE -ne 0) { throw 'K-GG Tweeq safety patch no longer applies.' }
  & git -c "safe.directory=$safeWorktree" -C $worktree apply $patchFile
  if ($LASTEXITCODE -ne 0) { throw 'Unable to apply the K-GG Tweeq safety patch.' }

  $reactPackage = Join-Path $worktree 'packages/react'
  Copy-Item (Join-Path $PSScriptRoot 'tweeq-vendor/kgg-entry.ts') (Join-Path $reactPackage 'src/kgg-entry.ts')
  Copy-Item (Join-Path $PSScriptRoot 'tweeq-vendor/vite.kgg.config.ts') (Join-Path $reactPackage 'vite.kgg.config.ts')
  Copy-Item (Join-Path $PSScriptRoot 'tweeq-vendor/Icon.tsx') (Join-Path $reactPackage 'src/components/Icon/Icon.tsx') -Force

  Push-Location $worktree
  try {
    & corepack pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'Tweeq dependency installation failed.' }
    & corepack pnpm --filter '@tweeq/core' exec tsc -p tsconfig.build.json
    if ($LASTEXITCODE -ne 0) { throw 'Tweeq core build failed.' }
    & corepack pnpm --filter '@tweeq/dom' exec tsc -p tsconfig.build.json
    if ($LASTEXITCODE -ne 0) { throw 'Tweeq DOM build failed.' }
    $stylesDist = Join-Path $worktree 'packages/styles/dist'
    New-Item -ItemType Directory -Path $stylesDist | Out-Null
    & corepack pnpm --filter '@tweeq/styles' exec stylus --compress --out dist src/style.styl
    if ($LASTEXITCODE -ne 0) { throw 'Tweeq styles compilation failed.' }
    & corepack pnpm --filter '@tweeq/react' exec vite build --config vite.kgg.config.ts
    if ($LASTEXITCODE -ne 0) { throw 'Tweeq React K-GG build failed.' }
  } finally {
    Pop-Location
  }

  New-Item -ItemType Directory -Path $stage | Out-Null
  Copy-Item (Join-Path $reactPackage 'dist-kgg/index.es.js') (Join-Path $stage 'index.es.js')
  Copy-Item (Join-Path $reactPackage 'dist-kgg/index.cjs') (Join-Path $stage 'index.cjs')
  Copy-Item (Join-Path $PSScriptRoot 'tweeq-vendor/index.d.ts') (Join-Path $stage 'index.d.ts')
  Copy-Item (Join-Path $worktree 'packages/styles/dist/style.css') (Join-Path $stage 'style.css')
  Copy-Item (Join-Path $worktree 'LICENSE') (Join-Path $stage 'LICENSE')

  foreach ($artifactName in @('index.es.js', 'index.cjs', 'style.css')) {
    $artifact = Join-Path $stage $artifactName
    $contents = [System.IO.File]::ReadAllText($artifact)
    $contents = [System.Text.RegularExpressions.Regex]::Replace($contents, '[ \t]+(?=\r?\n)', '')
    [System.IO.File]::WriteAllText($artifact, $contents, $utf8NoBom)
  }

  foreach ($artifactName in @('index.es.js', 'index.cjs')) {
    $contents = [System.IO.File]::ReadAllText((Join-Path $stage $artifactName))
    foreach ($forbidden in @('new Function', 'api.iconify.design', 'dangerouslySetInnerHTML')) {
      if ($contents.Contains($forbidden)) {
        throw "Generated $artifactName contains forbidden runtime code: $forbidden"
      }
    }
  }

  $esm = [System.IO.File]::ReadAllText((Join-Path $stage 'index.es.js'))
  $esmImports = [regex]::Matches($esm, '(?m)^import .*? from ["'']([^"'']+)["''];?$')
  foreach ($match in $esmImports) {
    if ($match.Groups[1].Value -notin @('react', 'react-dom', 'react/jsx-runtime')) {
      throw "Unexpected ESM runtime dependency: $($match.Groups[1].Value)"
    }
  }
  $cjs = [System.IO.File]::ReadAllText((Join-Path $stage 'index.cjs'))
  # The bundle contains defensive CommonJS probes inside bundled libraries.
  # Only the generated module prelude represents actual external dependencies.
  $cjsPrelude = $cjs.Substring(0, [Math]::Min(4096, $cjs.Length))
  $cjsRequires = [regex]::Matches($cjsPrelude, 'require\(["'']([^"'']+)["'']\)')
  foreach ($match in $cjsRequires) {
    if ($match.Groups[1].Value -notin @('react', 'react-dom', 'react/jsx-runtime')) {
      throw "Unexpected CommonJS runtime dependency: $($match.Groups[1].Value)"
    }
  }
  $declaredExports = [regex]::Matches($esm, '(?ms)^export \{([^}]+)\};?$') | ForEach-Object {
    $_.Groups[1].Value.Split(',') | ForEach-Object { (($_.Trim()) -replace '^.*\s+as\s+', '').Trim() }
  } | Where-Object { $_ } | Sort-Object -Unique
  if (Compare-Object $expectedExports $declaredExports) {
    throw "Generated runtime exports differ from the K-GG allow-list: $($declaredExports -join ', ')"
  }
  if ((Get-FileHash (Join-Path $worktree 'LICENSE')).Hash -ne (Get-FileHash (Join-Path $stage 'LICENSE')).Hash) {
    throw 'Generated Tweeq license differs from the fixed upstream commit.'
  }

  foreach ($artifactName in @('index.es.js', 'index.cjs', 'index.d.ts', 'style.css', 'LICENSE')) {
    $incoming = Join-Path $vendorTarget (".$artifactName.incoming")
    Copy-Item (Join-Path $stage $artifactName) $incoming -Force
    Move-Item $incoming (Join-Path $vendorTarget $artifactName) -Force
  }

  Write-Host "Updated vendor/tweeq from $actualCommit using a clean, validated worktree"
} finally {
  if (Test-Path -LiteralPath $worktree) {
    & git -c "safe.directory=$safeSource" -C $source worktree remove --force $worktree
  }
  if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
}
