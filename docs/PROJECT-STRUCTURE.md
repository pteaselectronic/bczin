# Project folder structure

The HTML pages stay at the project root so their existing links keep working. CSS, images, documentation, and document tools each have their own folder. The website uses HTML and native CSS; JavaScript files have been removed from the project source.

This tree lists every website and guide file, all image folders, and the maintenance scripts. Image filenames are expanded in [FILE-TREE.txt](FILE-TREE.txt). Git internals, editor settings, local recovery archives, and temporary Office lock files are excluded from that list.

```text
Pteas Electronic/
|-- .gitignore
|-- README.md
|-- index.html
|-- about.html
|-- products.html
|-- services.html
|-- contact.html
|-- privacy-policy.html
|-- terms-of-use.html
|-- products/
|   `-- catalog-details.html
|-- css/
|   |-- style.css
|   `-- static-catalog.css
|-- images/
|   |-- README.md
|   |-- about/
|   |-- brand/
|   |-- brands/
|   |-- contact/
|   |-- hero/
|   |-- home/
|   |-- home-categories/
|   |-- products/
|   |   |-- README.md
|   |   |-- accessories/
|   |   |-- audio-video/
|   |   |-- bags/
|   |   |-- cameras/
|   |   |-- drones/
|   |   |-- lenses/
|   |   |-- lighting/
|   |   `-- tripods/
|   |-- reviews/
|   |   `-- README.md
|   `-- services/
|-- docs/
|   |-- PROJECT-STRUCTURE.md
|   |-- STATIC-SITE.md
|   |-- FILE-TREE.txt
|   `-- sources/
|       |-- catalog-data.json
|       |-- about-image-sources.md
|       |-- brand-logo-sources.md
|       |-- product-sources.md
|       |-- services-image-sources.md
|       |-- product-image-sources.json
|       |-- product-gallery-image-sources.json
|       `-- product-gallery-browser-candidates.json
|-- documents/
|   `-- Pteas Camera Privacy Policy and Terms of Use.docx
|-- examples/
|   `-- starter/
|       |-- index.html
|       `-- css/
|           `-- style.css
`-- tools/
    |-- generate-legal-document.ps1
    |-- generate-legal-documents.ps1
    |-- legal-document-source.html
    `-- render-docx-pages.ps1
```

## Why use these folders?

- **HTML describes content.** Keeping the main pages together makes page links easy to follow. The homepage is named `index.html`, the conventional starting page for a static site.
- **CSS controls appearance.** A shared stylesheet keeps typography, colors, spacing, and responsive rules in one place.
- **Native HTML provides interactions.** Menus use `<details>`, search suggestions use `<datalist>`, and product views use URL fragments with CSS `:target`.
- **Images are assets.** Grouping them by page or category makes a growing image collection easier to maintain.
- **Documentation explains the project.** `docs/sources/` stores credits and manifests rather than mixing them with the pages visitors open.
- **Tools support documents.** Optional PowerShell scripts prepare and render Word documents. Website content is edited directly in HTML; JSON files retain reference data.
- **Examples support learning.** The starter has its own stylesheet, so you can experiment with it independently of the full website.

## How relative paths work

Paths start from the folder containing the HTML file:

```html
<!-- index.html is at the project root. -->
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/static-catalog.css">

<!-- products/catalog-details.html is one folder deeper. -->
<link rel="stylesheet" href="../css/style.css">
```

`../` means "go up one folder." Local asset paths written inside the source manifests and credit documents are measured from the project root.

The starter's `index.html` loads `examples/starter/css/style.css` with `href="css/style.css"`, because its CSS folder sits next to that starter page.

## When to add another file

Add an HTML file when you need a new page. Add another CSS file when a distinct feature has enough styling to benefit from its own file; you do not need a new file for every small change. Keep website interactions within native HTML and CSS.

New pages should include a descriptive title, a viewport meta tag, one main heading, semantic page regions, meaningful link text, and suitable image alt text. Use section comments to make longer files easier to navigate.
