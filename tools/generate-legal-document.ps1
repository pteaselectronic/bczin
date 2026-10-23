# Builds a Word document with the Open XML SDK that is installed with Office.
# The reviewed XHTML file is the single source for the document's visible text.

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceReference = 'C:\Users\ROG\OneDrive\Documents\Privacy KEH construction.docx'
$htmlSource = Join-Path $PSScriptRoot 'legal-document-source.html'
$outputDirectory = Join-Path $projectRoot 'documents'
$outputPath = Join-Path $outputDirectory 'Pteas Camera Privacy Policy and Terms of Use.docx'
$openXmlAssembly = 'C:\Program Files\Microsoft Office\root\vfs\ProgramFilesCommonX64\Microsoft Shared\Filters\Documentformat.OpenXml.dll'

foreach ($requiredFile in @($sourceReference, $htmlSource, $openXmlAssembly)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required file not found: $requiredFile"
    }
}
if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

Add-Type -Path $openXmlAssembly
[xml]$source = Get-Content -Raw -LiteralPath $htmlSource

function New-Run {
    param(
        [string]$Text,
        [string]$Color = '424040',
        [int]$Size = 22,
        [switch]$Bold,
        [switch]$Italic,
        [string]$Font = 'Arial'
    )

    $run = New-Object DocumentFormat.OpenXml.Wordprocessing.Run
    $properties = New-Object DocumentFormat.OpenXml.Wordprocessing.RunProperties
    $fonts = New-Object DocumentFormat.OpenXml.Wordprocessing.RunFonts
    $fonts.Ascii = $Font
    $fonts.HighAnsi = $Font
    [void]$properties.Append($fonts)
    if ($Bold) { [void]$properties.Append((New-Object DocumentFormat.OpenXml.Wordprocessing.Bold)) }
    if ($Italic) { [void]$properties.Append((New-Object DocumentFormat.OpenXml.Wordprocessing.Italic)) }
    $fontColor = New-Object DocumentFormat.OpenXml.Wordprocessing.Color
    $fontColor.Val = $Color
    [void]$properties.Append($fontColor)
    $fontSize = New-Object DocumentFormat.OpenXml.Wordprocessing.FontSize
    $fontSize.Val = [string]$Size
    [void]$properties.Append($fontSize)
    [void]$run.Append($properties)

    $textElement = New-Object DocumentFormat.OpenXml.Wordprocessing.Text
    $textElement.Text = $Text
    $textElement.Space = [DocumentFormat.OpenXml.SpaceProcessingModeValues]::Preserve
    [void]$run.Append($textElement)
    return ,$run
}

function New-ParagraphProperties {
    param(
        [int]$Before = 0,
        [int]$After = 150,
        [int]$Line = 340,
        [int]$Left = 0,
        [int]$Hanging = 0,
        [switch]$KeepNext,
        [switch]$PageBreakBefore,
        [string]$Fill = ''
    )

    $properties = New-Object DocumentFormat.OpenXml.Wordprocessing.ParagraphProperties
    if ($KeepNext) { [void]$properties.Append((New-Object DocumentFormat.OpenXml.Wordprocessing.KeepNext)) }
    if ($PageBreakBefore) { [void]$properties.Append((New-Object DocumentFormat.OpenXml.Wordprocessing.PageBreakBefore)) }
    if ($Fill) {
        $shading = New-Object DocumentFormat.OpenXml.Wordprocessing.Shading
        $shading.Val = [DocumentFormat.OpenXml.Wordprocessing.ShadingPatternValues]::Clear
        $shading.Color = 'auto'
        $shading.Fill = $Fill
        [void]$properties.Append($shading)
    }
    $spacing = New-Object DocumentFormat.OpenXml.Wordprocessing.SpacingBetweenLines
    $spacing.Before = [string]$Before
    $spacing.After = [string]$After
    $spacing.Line = [string]$Line
    $spacing.LineRule = [DocumentFormat.OpenXml.Wordprocessing.LineSpacingRuleValues]::Auto
    [void]$properties.Append($spacing)
    if ($Left -gt 0) {
        $indent = New-Object DocumentFormat.OpenXml.Wordprocessing.Indentation
        $indent.Left = [string]$Left
        if ($Hanging -gt 0) { $indent.Hanging = [string]$Hanging }
        [void]$properties.Append($indent)
    }
    return ,$properties
}

function Add-TextParagraph {
    param(
        $Body,
        [string]$Text,
        [ValidateSet('body','brand','title','subtitle','updated','h2','h3','notice','bullet')]
        [string]$Kind = 'body',
        [switch]$PageBreakBefore,
        [string]$Lead = ''
    )

    $paragraph = New-Object DocumentFormat.OpenXml.Wordprocessing.Paragraph
    switch ($Kind) {
        'brand' {
            [void]$paragraph.Append((New-ParagraphProperties -After 210 -PageBreakBefore:$PageBreakBefore))
            [void]$paragraph.Append((New-Run -Text $Text -Color 'D9232E' -Size 18 -Bold))
        }
        'title' {
            [void]$paragraph.Append((New-ParagraphProperties -After 180 -KeepNext -PageBreakBefore:$PageBreakBefore))
            [void]$paragraph.Append((New-Run -Text $Text -Color '111827' -Size 54 -Bold))
        }
        'subtitle' {
            [void]$paragraph.Append((New-ParagraphProperties -After 120 -KeepNext))
            [void]$paragraph.Append((New-Run -Text $Text -Size 26))
        }
        'updated' {
            [void]$paragraph.Append((New-ParagraphProperties -After 280 -KeepNext))
            [void]$paragraph.Append((New-Run -Text $Text -Color '808995' -Size 18 -Bold))
        }
        'h2' {
            [void]$paragraph.Append((New-ParagraphProperties -Before 310 -After 125 -KeepNext -PageBreakBefore:$PageBreakBefore))
            [void]$paragraph.Append((New-Run -Text $Text -Color '111827' -Size 36 -Bold))
        }
        'h3' {
            [void]$paragraph.Append((New-ParagraphProperties -Before 210 -After 85 -KeepNext))
            [void]$paragraph.Append((New-Run -Text $Text -Color '111827' -Size 25 -Bold))
        }
        'notice' {
            [void]$paragraph.Append((New-ParagraphProperties -Before 120 -After 260 -Fill 'F4F5F7'))
            if ($Lead) {
                [void]$paragraph.Append((New-Run -Text $Lead -Color '111827' -Bold))
                $remaining = $Text.Substring($Lead.Length)
                [void]$paragraph.Append((New-Run -Text $remaining))
            } else {
                [void]$paragraph.Append((New-Run -Text $Text))
            }
        }
        'bullet' {
            [void]$paragraph.Append((New-ParagraphProperties -After 70 -Left 430 -Hanging 240))
            [void]$paragraph.Append((New-Run -Text ([char]0x2022 + "`t") -Color 'D9232E' -Bold))
            [void]$paragraph.Append((New-Run -Text $Text))
        }
        default {
            [void]$paragraph.Append((New-ParagraphProperties -After 150))
            [void]$paragraph.Append((New-Run -Text $Text))
        }
    }
    [void]$Body.Append($paragraph)
}

function Add-ContentsRow {
    param($Body, [string]$Number, [string]$Label)
    $paragraph = New-Object DocumentFormat.OpenXml.Wordprocessing.Paragraph
    [void]$paragraph.Append((New-ParagraphProperties -After 80 -Left 70))
    [void]$paragraph.Append((New-Run -Text ($Number + '    ') -Color 'D9232E' -Bold))
    [void]$paragraph.Append((New-Run -Text $Label))
    [void]$Body.Append($paragraph)
}

$document = [DocumentFormat.OpenXml.Packaging.WordprocessingDocument]::Create(
    $outputPath,
    [DocumentFormat.OpenXml.WordprocessingDocumentType]::Document
)
try {
    $mainPart = $document.AddMainDocumentPart()
    $body = New-Object DocumentFormat.OpenXml.Wordprocessing.Body
    $mainPart.Document = New-Object DocumentFormat.OpenXml.Wordprocessing.Document
    [void]$mainPart.Document.Append($body)

    foreach ($node in $source.html.body.ChildNodes) {
        if ($node.NodeType -ne [System.Xml.XmlNodeType]::Element) { continue }
        $className = [string]$node.class
        switch ($node.Name.ToLowerInvariant()) {
            'div' {
                if ($className -match 'brand') {
                    Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind brand -PageBreakBefore:($className -match 'policy-break')
                }
            }
            'h1' { Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind title }
            'h2' { Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind h2 -PageBreakBefore:($className -match 'new-page') }
            'h3' { Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind h3 }
            'p' {
                if ($className -match 'subtitle') {
                    Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind subtitle
                } elseif ($className -match 'updated') {
                    Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind updated
                } elseif ($className -match 'notice') {
                    $lead = if ($node.strong) { [string]$node.strong.InnerText } else { '' }
                    Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind notice -Lead $lead
                } else {
                    Add-TextParagraph -Body $body -Text $node.InnerText.Trim() -Kind body
                }
            }
            'ul' {
                foreach ($item in $node.SelectNodes('./li')) {
                    Add-TextParagraph -Body $body -Text $item.InnerText.Trim() -Kind bullet
                }
            }
            'table' {
                foreach ($row in $node.SelectNodes('./tr')) {
                    $cells = $row.SelectNodes('./td')
                    Add-ContentsRow -Body $body -Number $cells[0].InnerText.Trim() -Label $cells[1].InnerText.Trim()
                }
            }
        }
    }

    $sectionProperties = New-Object DocumentFormat.OpenXml.Wordprocessing.SectionProperties
    $pageSize = New-Object DocumentFormat.OpenXml.Wordprocessing.PageSize
    $pageSize.Width = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]12240)
    $pageSize.Height = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]15840)
    [void]$sectionProperties.Append($pageSize)
    $pageMargin = New-Object DocumentFormat.OpenXml.Wordprocessing.PageMargin
    $pageMargin.Top = New-Object DocumentFormat.OpenXml.Int32Value([int]1181)
    $pageMargin.Bottom = New-Object DocumentFormat.OpenXml.Int32Value([int]1123)
    $pageMargin.Left = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]1296)
    $pageMargin.Right = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]1296)
    $pageMargin.Header = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]432)
    $pageMargin.Footer = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]432)
    $pageMargin.Gutter = New-Object DocumentFormat.OpenXml.UInt32Value([uint32]0)
    [void]$sectionProperties.Append($pageMargin)
    [void]$body.Append($sectionProperties)
    $mainPart.Document.Save()
} finally {
    $document.Dispose()
}

Write-Output $outputPath
