param(
    [Parameter(Mandatory = $true)]
    [string]$FirstZip,

    [Parameter(Mandatory = $true)]
    [string]$SecondZip
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DecodedFrameHashes {
    param([string]$ZipPath)

    $resolvedPath = (Resolve-Path -LiteralPath $ZipPath).Path
    $archive = [System.IO.Compression.ZipFile]::OpenRead($resolvedPath)
    try {
        $results = @()
        $entries = $archive.Entries |
            Where-Object { $_.FullName -match '\.png$' } |
            Sort-Object FullName

        foreach ($entry in $entries) {
            $stream = $entry.Open()
            try {
                $bitmap = [System.Drawing.Bitmap]::new($stream)
                try {
                    $rect = [System.Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
                    $data = $bitmap.LockBits(
                        $rect,
                        [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
                    )
                    try {
                        $rowBytes = $bitmap.Width * 4
                        $pixels = [byte[]]::new($rowBytes * $bitmap.Height)
                        for ($row = 0; $row -lt $bitmap.Height; $row++) {
                            $sourceRow = if ($data.Stride -ge 0) { $row } else { $bitmap.Height - 1 - $row }
                            $source = [IntPtr]::Add($data.Scan0, $sourceRow * [Math]::Abs($data.Stride))
                            [System.Runtime.InteropServices.Marshal]::Copy(
                                $source,
                                $pixels,
                                $row * $rowBytes,
                                $rowBytes
                            )
                        }
                    }
                    finally {
                        $bitmap.UnlockBits($data)
                    }

                    $hash = [Convert]::ToHexString(
                        [System.Security.Cryptography.SHA256]::HashData($pixels)
                    ).ToLowerInvariant()
                    $results += [pscustomobject]@{
                        Name = $entry.FullName
                        Width = $bitmap.Width
                        Height = $bitmap.Height
                        RgbaHash = $hash
                    }
                }
                finally {
                    $bitmap.Dispose()
                }
            }
            finally {
                $stream.Dispose()
            }
        }
        return $results
    }
    finally {
        $archive.Dispose()
    }
}

$first = @(Get-DecodedFrameHashes -ZipPath $FirstZip)
$second = @(Get-DecodedFrameHashes -ZipPath $SecondZip)
$secondByName = @{}
foreach ($frame in $second) { $secondByName[$frame.Name] = $frame }

$mismatches = @()
foreach ($frame in $first) {
    $other = $secondByName[$frame.Name]
    if (
        $null -eq $other -or
        $frame.Width -ne $other.Width -or
        $frame.Height -ne $other.Height -or
        $frame.RgbaHash -ne $other.RgbaHash
    ) {
        $mismatches += $frame.Name
    }
}

[pscustomobject]@{
    FirstZip = (Resolve-Path -LiteralPath $FirstZip).Path
    SecondZip = (Resolve-Path -LiteralPath $SecondZip).Path
    FirstFrameCount = $first.Count
    SecondFrameCount = $second.Count
    Dimensions = @($first | ForEach-Object { "$($_.Width)x$($_.Height)" } | Sort-Object -Unique)
    DecodedRgbaMatch = $first.Count -eq $second.Count -and $mismatches.Count -eq 0
    MismatchCount = $mismatches.Count
    MismatchedFrames = $mismatches
} | ConvertTo-Json -Depth 4
