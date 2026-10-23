param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$detailPath = Join-Path $ProjectRoot 'products\catalog-details.html'
$originalContent = Get-Content -LiteralPath $detailPath -Raw
$content = $originalContent.Replace('Use the five-image gallery to review its design', 'Use the five-image gallery to inspect its design')

$categoryNames = [ordered]@{
    'cameras'     = 'Cameras'
    'lenses'      = 'Lenses'
    'tripods'     = 'Tripods'
    'lighting'    = 'Lighting'
    'audio-video' = 'Audio &amp; Video'
    'bags'        = 'Bags &amp; Cases'
    'accessories' = 'Accessories'
    'drones'      = 'Drones'
}

$categoryFeatures = @{
    'cameras'     = @('Photo and video ready', 'Five product views', 'Condition clearly listed', 'In-store setup guidance')
    'lenses'      = @('Creative focal options', 'Mount check in store', 'Five product views', 'Condition clearly listed')
    'tripods'     = @('Stable creator support', 'Portable working setup', 'Five product views', 'Condition clearly listed')
    'lighting'    = @('Creator-focused lighting', 'Flexible studio setup', 'Five product views', 'Condition clearly listed')
    'audio-video' = @('Production-ready tools', 'Creator workflow support', 'Five product views', 'Condition clearly listed')
    'bags'        = @('Organized gear storage', 'Everyday protection', 'Five product views', 'Condition clearly listed')
    'accessories' = @('Practical kit support', 'Easy setup expansion', 'Five product views', 'Condition clearly listed')
    'drones'      = @('Aerial creator setup', 'Portable flight kit', 'Five product views', 'Condition clearly listed')
}

$articlePattern = '<article class="product-detail" id="(?<id>[^"]+)">.*?</article>'
$updatedCount = 0

$updated = [regex]::Replace($content, $articlePattern, {
    param($match)

    $article = $match.Value
    if ($article.Contains('product-detail__information')) {
        return $article
    }

    $id = $match.Groups['id'].Value
    $categoryKey = $categoryNames.Keys | Where-Object { $id -match "^$([regex]::Escape($_))-\d+$" } | Select-Object -First 1
    if (-not $categoryKey) {
        throw "Could not determine the category for product id '$id'."
    }

    $brandMatch = [regex]::Match($article, '<p class="product-detail__brand">(?<value>.*?)</p>')
    $nameMatch = [regex]::Match($article, '<h1>(?<value>.*?)</h1>')
    $priceMatch = [regex]::Match($article, '<div class="product-detail__price"><span>Indicative price</span><strong>(?<value>.*?)</strong></div>')
    $conditionMatch = [regex]::Match($article, '<span class="product-detail__condition">Condition: (?<value>.*?)</span>')

    if (-not ($brandMatch.Success -and $nameMatch.Success -and $priceMatch.Success -and $conditionMatch.Success)) {
        throw "Missing product data in detail entry '$id'."
    }

    $brand = $brandMatch.Groups['value'].Value
    $name = $nameMatch.Groups['value'].Value
    $price = $priceMatch.Groups['value'].Value
    $condition = $conditionMatch.Groups['value'].Value
    $categoryName = $categoryNames[$categoryKey]
    $features = $categoryFeatures[$categoryKey]

    $featureItems = ($features | ForEach-Object { "<li>$_</li>" }) -join ''
    $information = '<section class="product-detail__information" aria-label="' + $name + ' product details">' +
        '<div class="product-detail__tabs" aria-label="Product information sections"><span class="is-current">Product Details</span></div>' +
        '<div class="product-detail__information-grid">' +
            '<section class="product-detail__description-block"><h2>Product Description</h2><p>' + $name + ' is a demo product selected for a practical camera or creator setup. Use the five-image gallery to review its design, then contact Pteas Camera to confirm current stock, included accessories and final condition before visiting.</p><h2>Key Features</h2><ul>' + $featureItems + '</ul></section>' +
            '<section class="product-detail__specifications"><h2>Product Specification</h2><dl>' +
                '<div><dt>Product</dt><dd>' + $name + '</dd></div>' +
                '<div><dt>Brand</dt><dd>' + $brand + '</dd></div>' +
                '<div><dt>Category</dt><dd>' + $categoryName + '</dd></div>' +
                '<div><dt>Condition</dt><dd>' + $condition + '</dd></div>' +
                '<div><dt>Indicative price</dt><dd>' + $price + '</dd></div>' +
                '<div><dt>Availability</dt><dd>Confirm in store</dd></div>' +
            '</dl></section>' +
        '</div>' +
        '<p class="product-detail__store-note"><strong>Information-only listing.</strong> Prices and availability may change. Contact the store before travelling.</p>' +
    '</section>'

    $closingPattern = '</section></div></div></article>$'
    if (-not [regex]::IsMatch($article, $closingPattern)) {
        throw "Unexpected closing markup in detail entry '$id'."
    }

    $script:updatedCount++
    return [regex]::Replace($article, $closingPattern, '</section></div>' + $information + '</div></article>')
}, [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($updated -ne $originalContent) {
    [System.IO.File]::WriteAllText($detailPath, $updated, [System.Text.UTF8Encoding]::new($false))
}

Write-Output "Updated detail entries: $updatedCount"
