# HTML and CSS frontend

The website consists of HTML, native CSS, and local media. There are no script tags, JavaScript event handlers, browser JavaScript files, or frontend framework dependencies. Existing styling is retained in `css/style.css`; `css/static-catalog.css` supplies the additional native interactions.

## Supported interactions

- **Navigation menus:** native `<details>` and `<summary>`, supported by the existing hover, focus, and open-state CSS.
- **Category navigation:** normal links to catalogue section IDs.
- **Brand navigation:** links such as `products.html#brand-sony`; CSS `:has()` selects the matching cards. Choosing a category leaves the brand view and returns to the full catalogue.
- **Product details:** the existing `products/catalog-details.html#product-id` links select one HTML article with CSS `:target`. The page title stays generic because changing it dynamically would require scripting.
- **Search:** `<datalist>` offers product-name suggestions. Submitting opens the full catalogue and explains how to browse by category or use browser Find. The text is not used to filter cards.
- **Contact form:** remains a design-only demo. It does not send or store messages.
- **Reduced motion:** native CSS displays the existing hero poster instead of the background video.

CSS `:has()` is used for the static brand and detail views, as it already was in the shared stylesheet. Use a browser that supports this selector.

## Files to serve or submit as the website

Serve the root HTML pages together with `products/`, `css/`, and `images/`. The independent learning example lives in `examples/starter/`.

`docs/`, `documents/`, and `tools/` are supporting project materials. The remaining tools are PowerShell helpers for documents. JSON files are reference data and are not loaded by the website. Local recovery ZIPs in `documents/archive/` are excluded from Git and assignment files.

## Update the catalogue

1. Edit the product card in `products.html` and the matching article in `products/catalog-details.html` directly.
2. Update any corresponding homepage cards and `<datalist>` options when a name, image, price, or link changes.
3. Keep `docs/sources/catalog-data.json` and source records consistent with the HTML.
4. When adding a brand, add its target in `products.html` and matching rules in `css/static-catalog.css`.
5. Preview the edited pages and check category links, product targets, and images.

All displayed content is stored directly in HTML. The old generated-region comments are section boundaries for navigation; there is no generator that overwrites your edits.
