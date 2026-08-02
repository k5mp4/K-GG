param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (-not ('KggFrameMetrics' -as [type])) {
    Add-Type -TypeDefinition @'
public static class KggFrameMetrics
{
    public static double MeanAbsolute(byte[] first, byte[] second)
    {
        if (first.Length != second.Length) throw new System.ArgumentException("Frame lengths differ");
        double sum = 0;
        for (int i = 0; i < first.Length; i++) sum += System.Math.Abs(first[i] - second[i]);
        return sum / first.Length;
    }

    public static double MeanFromNeighborAverage(byte[] previous, byte[] current, byte[] next)
    {
        if (previous.Length != current.Length || current.Length != next.Length)
            throw new System.ArgumentException("Frame lengths differ");
        double sum = 0;
        for (int i = 0; i < current.Length; i++)
            sum += System.Math.Abs(current[i] - (previous[i] + next[i]) * 0.5);
        return sum / current.Length;
    }
}
'@
}

function Get-Median {
    param([double[]]$Values)
    if ($Values.Count -eq 0) { return 0.0 }
    $sorted = @($Values | Sort-Object)
    $middle = [Math]::Floor($sorted.Count / 2)
    if ($sorted.Count % 2 -eq 1) { return [double]$sorted[$middle] }
    return ([double]$sorted[$middle - 1] + [double]$sorted[$middle]) / 2
}

$resolvedPath = (Resolve-Path -LiteralPath $ZipPath).Path
$archive = [System.IO.Compression.ZipFile]::OpenRead($resolvedPath)
try {
    $frames = @()
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
                        [System.Runtime.InteropServices.Marshal]::Copy($source, $pixels, $row * $rowBytes, $rowBytes)
                    }
                }
                finally {
                    $bitmap.UnlockBits($data)
                }
                $frames += [pscustomobject]@{
                    Name = $entry.FullName
                    Width = $bitmap.Width
                    Height = $bitmap.Height
                    Pixels = $pixels
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
}
finally {
    $archive.Dispose()
}

$metrics = @()
for ($index = 0; $index -lt $frames.Count; $index++) {
    $previousDiff = if ($index -gt 0) {
        [KggFrameMetrics]::MeanAbsolute($frames[$index - 1].Pixels, $frames[$index].Pixels)
    } else { $null }
    $nextDiff = if ($index + 1 -lt $frames.Count) {
        [KggFrameMetrics]::MeanAbsolute($frames[$index].Pixels, $frames[$index + 1].Pixels)
    } else { $null }
    $neighborAverageDiff = if ($index -gt 0 -and $index + 1 -lt $frames.Count) {
        [KggFrameMetrics]::MeanFromNeighborAverage(
            $frames[$index - 1].Pixels,
            $frames[$index].Pixels,
            $frames[$index + 1].Pixels
        )
    } else { $null }
    $metrics += [pscustomobject]@{
        Frame = $frames[$index].Name
        PreviousDiff = $previousDiff
        NextDiff = $nextDiff
        NeighborAverageDiff = $neighborAverageDiff
    }
}

$neighborValues = [double[]]@($metrics |
    Where-Object { $null -ne $_.NeighborAverageDiff } |
    ForEach-Object { $_.NeighborAverageDiff })
$median = Get-Median -Values $neighborValues
$deviations = [double[]]@($neighborValues | ForEach-Object { [Math]::Abs($_ - $median) })
$mad = Get-Median -Values $deviations
$threshold = $median + 6 * [Math]::Max($mad, 0.000001)
$outliers = @($metrics | Where-Object {
    $null -ne $_.NeighborAverageDiff -and $_.NeighborAverageDiff -gt $threshold
})

[pscustomobject]@{
    ZipPath = $resolvedPath
    FrameCount = $frames.Count
    Dimensions = @($frames | ForEach-Object { "$($_.Width)x$($_.Height)" } | Sort-Object -Unique)
    NeighborAverageMedian = $median
    NeighborAverageMad = $mad
    OutlierThreshold = $threshold
    IsolatedOutlierCount = $outliers.Count
    IsolatedOutliers = @($outliers | Select-Object Frame, PreviousDiff, NextDiff, NeighborAverageDiff)
    HighestNeighborAverageDiff = @($metrics |
        Where-Object { $null -ne $_.NeighborAverageDiff } |
        Sort-Object NeighborAverageDiff -Descending |
        Select-Object -First 10 Frame, PreviousDiff, NextDiff, NeighborAverageDiff)
} | ConvertTo-Json -Depth 5
