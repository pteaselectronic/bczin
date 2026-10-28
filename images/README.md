# Image Folder Guide

Keep images grouped by the page or purpose that uses them:

- `brand/` — logos and other brand graphics
- `home/` — homepage hero and homepage-only images
- `products/` — product photos
- `services/` — service and repair images

Use lowercase file names with hyphens, for example:

```text
camera-body.jpg
wide-angle-lens.jpg
tripod-kit.jpg
```

When adding an image to HTML, include its folder in the path:

```html
<img src="images/products/camera-body.jpg" alt="Mirrorless camera body">
```

