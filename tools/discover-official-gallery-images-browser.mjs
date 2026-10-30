import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/ROG/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolsDirectory, "..");
const productDataPath = path.join(projectRoot, "js", "product-data.js");
const galleryManifestPath = path.join(projectRoot, "product-gallery-image-sources.json");
const primaryManifestPath = path.join(projectRoot, "product-image-sources.json");
const outputPath = path.join(projectRoot, "product-gallery-browser-candidates.json");
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sandbox = { window: {} };

vm.runInNewContext(fs.readFileSync(productDataPath, "utf8"), sandbox, { filename: productDataPath });
const products = sandbox.window.PTEAS_PRODUCTS || [];
const galleryManifest = fs.existsSync(galleryManifestPath) ? JSON.parse(fs.readFileSync(galleryManifestPath, "utf8")) : { results: [] };
const primaryManifest = JSON.parse(fs.readFileSync(primaryManifestPath, "utf8"));
const galleryStatus = new Map(galleryManifest.results.map((result) => [result.id, result]));
const primarySources = new Map(primaryManifest.results.map((result) => [result.id, result]));
const args = process.argv.slice(2);
const onlyArgument = args.find((argument) => argument.startsWith("--only="));
const onlyIds = onlyArgument ? new Set(onlyArgument.slice(7).split(",").filter(Boolean)) : null;
const previous = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, "utf8")) : { results: [] };
const previousResults = new Map(previous.results.map((result) => [result.id, result]));

const pageOverrides = {
    "fujifilm-instax-mini-evo": "https://www.instax.com/mini_evo/en/",
    "dji-osmo-action-5-pro": "https://www.dji.com/osmo-action-5-pro",
    "fujifilm-xf23mm-f1-4-r-lm-wr": "https://www.fujifilm-x.com/en-us/products/lenses/xf23mmf14-r-lm-wr/",
    "manfrotto-befree-gt-xpro-carbon": "https://www.manfrotto.com/global-it/treppiede-da-viaggio-befree-gt-xpro-carbonio-mkbfrc4gtxp-bus/",
    "manfrotto-mt055cxpro3": "https://www.manfrotto.com/global-it/treppiede-055-a-3-sezioni-carbonio-mt055cxpro3/",
    "manfrotto-mt190xpro4": "https://www.manfrotto.com/global-it/treppiede-serie-190-alluminio-4-sezioni-mt190xpro4/",
    "gitzo-gt2542": "https://www.gitzo.com/de-de/mountaineer-stativ-serie-2-4-beinsegmente-gt2542/",
    "dji-mic-mini": "https://store.dji.com/product/dji-mic-mini",
    "atomos-shinobi-ii": "https://support.atomos.com/hc/en-us/articles/10342351276687-Physical-Features-Connectors",
    "sennheiser-profile-wireless": "https://newsroom.sennheiser.com/sennheiser-launches-the-creators-audio-multitool-4roenl",
    "sennheiser-mke-400": "https://newsroom.sennheiser.com/create-powerful-content",
    "lowepro-photosport-pro-iii-55l": "https://www.lowepro.com/global/collection/photo-sport/",
    "pelican-1510-protector-case": "https://business.pelican.com/us/en/product/cases/protector/1510"
};

function selectedProducts() {
    return products.filter((product) => {
        if (onlyIds) return onlyIds.has(product.id);
        const status = galleryStatus.get(product.id);
        return !status || status.status !== "complete";
    });
}

async function discover(page, product) {
    const primary = primarySources.get(product.id) || {};
    const requestedUrl = pageOverrides[product.id] || primary.pageUrl || product.imagePageUrl || product.officialUrl;
    const result = { id: product.id, product: product.name, requestedUrl, pageUrl: requestedUrl, status: "failed", candidates: [], error: "" };
    try {
        const response = await page.goto(requestedUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
        await page.waitForTimeout(2500);
        result.pageUrl = page.url();
        const candidates = await page.evaluate(({ productName, productId }) => {
            const values = [];
            const add = (value, context = "") => {
                if (!value) return;
                String(value).split(/,\s*(?=https?:|\/)/).forEach((part) => {
                    const source = part.trim().split(/\s+/)[0];
                    try {
                        const url = new URL(source, document.baseURI).href;
                        if (/^https?:/i.test(url) && (/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(url) || /\/is\/image\//i.test(url))) {
                            values.push({ url, context });
                        }
                    } catch {
                        // Ignore invalid values.
                    }
                });
            };
            document.querySelectorAll("img, source").forEach((element) => {
                const context = `${element.getAttribute("alt") || ""} ${element.getAttribute("title") || ""} ${element.outerHTML.slice(0, 500)}`;
                ["src", "srcset", "data-src", "data-srcset", "data-original", "data-lazy-src", "data-zoom-image", "data-image", "data-large-image"]
                    .forEach((attribute) => add(element.getAttribute(attribute), context));
                if ("currentSrc" in element) add(element.currentSrc, context);
            });
            document.querySelectorAll("*").forEach((element) => {
                const background = getComputedStyle(element).backgroundImage;
                for (const match of background.matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(match[1], `${productName} background image`);
            });
            performance.getEntriesByType("resource").forEach((entry) => add(entry.name, `${productName} browser resource`));
            const html = document.documentElement.innerHTML.replace(/\\u002f/gi, "/").replace(/\\\//g, "/").replaceAll("&amp;", "&");
            for (const match of html.matchAll(/(?:https?:)?\/\/[^"'<>\s\\]+?(?:\.(?:jpe?g|png|webp|avif)(?:\?[^"'<>\s\\]*)?|\/is\/image\/[^"'<>\s\\]+)/gi)) {
                add(match[0], html.slice(Math.max(0, match.index - 120), Math.min(html.length, match.index + match[0].length + 120)));
            }
            const unique = new Map();
            values.forEach((candidate) => {
                const key = candidate.url.toLowerCase();
                if (!unique.has(key)) unique.set(key, candidate);
            });
            const terms = `${productName} ${productId}`.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
            return [...unique.values()].map((candidate) => ({
                ...candidate,
                score: terms.reduce((total, term) => total + (`${candidate.url} ${candidate.context}`.toLowerCase().includes(term) ? 1 : 0), 0)
            })).sort((a, b) => b.score - a.score).slice(0, 300);
        }, { productName: product.name, productId: product.id });
        result.status = candidates.length ? "discovered" : "empty";
        result.candidates = candidates;
        if (!response?.ok()) result.error = `page HTTP ${response?.status() || 0}`;
    } catch (error) {
        result.error = error.message;
    }
    return result;
}

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const queue = selectedProducts();
const activeResults = [];
let nextIndex = 0;

async function worker() {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    while (nextIndex < queue.length) {
        const product = queue[nextIndex++];
        const page = await context.newPage();
        const result = await discover(page, product);
        await page.close().catch(() => {});
        activeResults.push(result);
        console.log(`${result.status.toUpperCase()}\t${product.id}\t${result.candidates.length}\t${result.error}`);
    }
    await context.close();
}

await Promise.all(Array.from({ length: Math.min(3, queue.length || 1) }, () => worker()));
await browser.close();

const combined = [
    ...previous.results.filter((result) => !activeResults.some((active) => active.id === result.id)),
    ...activeResults
].sort((a, b) => products.findIndex((product) => product.id === a.id) - products.findIndex((product) => product.id === b.id));
fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), results: combined }, null, 2)}\n`, "utf8");
console.log(`Browser candidates written for ${activeResults.length} products: ${path.relative(projectRoot, outputPath)}`);
