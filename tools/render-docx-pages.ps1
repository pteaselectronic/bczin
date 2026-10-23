# Renders a DOCX through Microsoft Word to XPS, then converts every XPS page
# to a PNG for visual QA. Generated PNGs are temporary verification artifacts.

param(
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
$xpsPath = Join-Path $resolvedOutput 'rendered-document.xps'

$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($resolvedInput, $false, $true)
    $document.ExportAsFixedFormat($xpsPath, 1)
    $document.Close($false)
    $document = $null
} finally {
    if ($document) { $document.Close($false) }
    if ($word) {
        $word.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Add-Type -AssemblyName ReachFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$xpsDocument = New-Object System.Windows.Xps.Packaging.XpsDocument($xpsPath, [System.IO.FileAccess]::Read)
try {
    $paginator = $xpsDocument.GetFixedDocumentSequence().DocumentPaginator
    $paginator.ComputePageCount()
    $pageCount = $paginator.PageCount
    $dpi = 144
    $scale = $dpi / 96

    for ($index = 0; $index -lt $pageCount; $index++) {
        $page = $paginator.GetPage($index)
        $pixelWidth = [int][Math]::Ceiling($page.Size.Width * $scale)
        $pixelHeight = [int][Math]::Ceiling($page.Size.Height * $scale)
        $bitmap = New-Object System.Windows.Media.Imaging.RenderTargetBitmap(
            $pixelWidth,
            $pixelHeight,
            $dpi,
            $dpi,
            [System.Windows.Media.PixelFormats]::Pbgra32
        )
        $bitmap.Render($page.Visual)

        $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
        $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
        $pagePath = Join-Path $resolvedOutput ('page-{0}.png' -f ($index + 1))
        $stream = [System.IO.File]::Open($pagePath, [System.IO.FileMode]::Create)
        try {
            $encoder.Save($stream)
        } finally {
            $stream.Dispose()
        }
        Write-Output $pagePath
    }
} finally {
    $xpsDocument.Close()
}
