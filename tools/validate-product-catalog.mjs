import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolsDirectory, "..");
const dataPath = path.join(projectRoot, "js", "product-data.js");
const manifestPath = path.join(projectRoot, "product-image-sources.json");
const sourceLedgerPath = path.join(projectRoot, "product-sources.md");
const sandbox = { window: {} };
const failures = [];

function check(condition, message) {
    if (!condition) failures.push(message);
}

function duplicates(items, key) {
    const groups = new Map();
    for (const item of items) {
        const value = item[key];
        groups.set(value, [...(groups.get(value) || []), item.id]);
    }
    return [...groups.entries()].filter(([, ids]) => ids.length > 1);
}

vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });
const categories = sandbox.window.PTEAS_CATEGORIES || [];
const products = sandbox.window.PTEAS_PRODUCTS || [];
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const manifestById = new Map(manifest.results.map((item) => [item.id, item]));

check(categories.length === 8, `Expected 8 categories; found ${categories.length}.`);
check(products.length === 96, `Expected 96 products; found ${products.length}.`);
for (const category of categories) {
    const count = products.filter((product) => product.category === category.id).length;
    check(count === 12, `${category.label} should have 12 products; found ${count}.`);
}

for (const key of ["id", "name", "description", "image", "detailUrl"]) {
    check(duplicates(products, key).length === 0, `Duplicate product ${key} values found.`);
}

const imageHashes = new Map();
for (const product of products) {
    const wordCount = product.description.trim().split(/\s+/).length;
    check(wordCount >= 15 && wordCount <= 25, `${product.id} description has ${wordCount} words.`);
    check(product.condition === "New", `${product.id} has unsupported condition ${product.condition}.`);
    check(product.specs.length >= 4 && product.specs.length <= 6, `${product.id} should have 4-6 specifications.`);
    check(product.detailUrl === `products/catalog-details.html#${product.id}`, `${product.id} has an incorrect detail link.`);
    check(/^https:\/\//.test(product.officialUrl), `${product.id} does not use an HTTPS manufacturer source.`);
    const imagePath = path.join(projectRoot, product.image);
    check(fs.existsSync(imagePath), `${product.id} is missing ${product.image}.`);
    if (fs.existsSync(imagePath)) {
        const hash = crypto.createHash("sha256").update(fs.readFileSync(imagePath)).digest("hex");
        imageHashes.set(hash, [...(imageHashes.get(hash) || []), product.id]);
    }
    const source = manifestById.get(product.id);
    check(Boolean(source), `${product.id} is missing from the image-source manifest.`);
    if (source) {
        check(source.status === "downloaded", `${product.id} image manifest status is ${source.status}.`);
        check(source.localPath === product.image, `${product.id} image manifest path does not match product data.`);
    }
}

check([...imageHashes.values()].every((ids) => ids.length === 1), "Duplicate local product image hashes found.");
check(manifest.results.length === products.length, "Image-source manifest count does not match product count.");

const sourceLedger = fs.readFileSync(sourceLedgerPath, "utf8");
for (const product of products) {
    check(sourceLedger.includes(`| ${product.name.replaceAll("|", "\\|")} |`), `${product.id} is missing from product-sources.md.`);
}

for (const relativePage of ["index.html", "products.html", "products/catalog-details.html"]) {
    const pagePath = path.join(projectRoot, relativePage);
    const html = fs.readFileSync(pagePath, "utf8");
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    for (const href of hrefs) {
        if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
        const pathname = href.split(/[?#]/, 1)[0];
        if (!pathname) continue;
        const target = path.resolve(path.dirname(pagePath), pathname);
        check(fs.existsSync(target), `${relativePage} links to missing file ${href}.`);
    }
}

if (failures.length) {
    console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
    process.exitCode = 1;
} else {
    console.log("PASS: 96 products, 8 categories, 96 unique local images, source ledger, detail links, and internal file links validated.");
}
