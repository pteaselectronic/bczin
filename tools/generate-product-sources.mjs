import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolsDirectory, "..");
const dataPath = path.join(projectRoot, "js", "product-data.js");
const outputPath = path.join(projectRoot, "product-sources.md");
const imageManifestPath = path.join(projectRoot, "product-image-sources.json");
const galleryManifestPath = path.join(projectRoot, "product-gallery-image-sources.json");
const sandbox = { window: {} };

vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });

const products = sandbox.window.PTEAS_PRODUCTS || [];
const categories = sandbox.window.PTEAS_CATEGORIES || [];
const imageManifest = fs.existsSync(imageManifestPath) ? JSON.parse(fs.readFileSync(imageManifestPath, "utf8")) : { results: [] };
const imageSources = new Map(imageManifest.results.map((result) => [result.id, result]));
const galleryManifest = fs.existsSync(galleryManifestPath) ? JSON.parse(fs.readFileSync(galleryManifestPath, "utf8")) : { results: [] };
const gallerySources = new Map(galleryManifest.results.map((result) => [result.id, result]));
const incompleteGalleries = products.filter((product) => (gallerySources.get(product.id)?.images || []).length < 2);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const rows = [
    "# Pteas Camera product and image sources",
    "",
    "Generated from `js/product-data.js`, `product-image-sources.json`, and `product-gallery-image-sources.json`. Sources were checked against official manufacturer product, specification, support, or press pages. Prices are reference USD figures and may change.",
    "",
    "> Image approval: the local images were downloaded from official manufacturer pages or official media assets. Those pages do not universally grant commercial retailer reuse rights. Obtain written manufacturer or licensed-supplier approval before publishing.",
    ""
];

for (const category of categories) {
    const items = products.filter((product) => product.category === category.id);
    rows.push(`## ${category.number}. ${category.label}`, "", "| Product | Price | Official specification source | Image sources | Local images | Publishing note |", "|---|---:|---|---|---|---|");
    for (const item of items) {
        const productName = item.name.replaceAll("|", "\\|");
        const price = money.format(item.price);
        const specSource = `[Manufacturer page](${item.officialUrl})`;
        const imageResult = imageSources.get(item.id);
        const galleryResult = gallerySources.get(item.id);
        const imageSourceParts = [];
        const localImageParts = [];
        if (imageResult?.directImageUrl) {
            imageSourceParts.push(`[1: official front asset](${imageResult.directImageUrl}) ([page](${imageResult.pageUrl}))`);
            localImageParts.push(`\`${item.image}\``);
        } else {
            imageSourceParts.push(`[1: official front asset page](${item.imagePageUrl})`);
            localImageParts.push(`\`${item.image}\``);
        }
        (galleryResult?.images || []).filter((image) => image.status === "downloaded").forEach((image, index) => {
            imageSourceParts.push(`[${index + 2}: official alternate asset](${image.directImageUrl}) ([page](${image.sourcePageUrl || galleryResult.pageUrl}))`);
            localImageParts.push(`\`${image.localPath}\``);
        });
        const imageSource = imageSourceParts.join("<br>");
        const localImages = localImageParts.join("<br>");
        const note = `${item.priceNote} ${item.imageUsageNote}`.replaceAll("|", "\\|");
        rows.push(`| ${productName} | ${price} | ${specSource} | ${imageSource} | ${localImages} | ${note} |`);
    }
    rows.push("");
}

rows.push(
    "## Review before publishing",
    "",
    "- Confirm local Cambodian stock and selling prices; this site does not claim live inventory.",
    "- Obtain written permission or licensed supplier assets for all 96 manufacturer images before commercial publication.",
    `- Gallery coverage needing approval: ${incompleteGalleries.map((product) => {
        const alternateCount = (gallerySources.get(product.id)?.images || []).length;
        return `${product.name} (${alternateCount + 1} verified local image${alternateCount ? "s" : ""})`;
    }).join(", ")}. Approve these smaller galleries or supply licensed exact-product alternates.`,
    "- Recheck the entries explicitly marked as representative dealer pricing: Godox KNOWLED M300R, SanDisk media cards, SmallRig 3667B cage, DJI Matrice 4T, and DJI Goggles 3.",
    "- Drone buyers must follow current local aviation, registration, operating-zone, and radio rules.",
    ""
);

fs.writeFileSync(outputPath, rows.join("\n"), "utf8");
console.log(`Wrote ${path.relative(projectRoot, outputPath)} with ${products.length} product rows.`);
