import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolsDirectory, "..");
const dataPath = path.join(projectRoot, "js", "product-data.js");
const manifestPath = path.join(projectRoot, "product-image-sources.json");
const sandbox = { window: {} };

vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });

const products = sandbox.window.PTEAS_PRODUCTS || [];
const pageOverrides = {
    "godox-ad200pro-ii": "https://godox.com/product-b/Flash/AD200ProII.html",
    "godox-knowled-m300r": "https://cn.godox.com/product-b/KNOWLED/M300R.html",
    "sennheiser-profile-wireless": "https://www.sennheiser.com/en-dk/catalog/products/sistema-sem-fio/profile-wireless-2-channel-set/profile-wireless-2-channel-set-700266",
    "zoom-h6essential": "https://zoomcorp.com/en/ca/handheld-recorders/handheld-recorders/h6essential/",
    "pelican-1510-protector-case": "https://www.pelican.com/us/en/product/cases/carry-on-case/protector/1510/"
};
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36 PteasCameraCatalogResearch/1.0";

function decodeEntities(value) {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", "\"")
        .replaceAll("&#39;", "'")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replaceAll("\\/", "/");
}

function absoluteUrl(value, pageUrl) {
    try {
        return new URL(decodeEntities(value.trim()), pageUrl).href;
    } catch {
        return "";
    }
}

function metaCandidates(html, pageUrl) {
    const candidates = [];
    const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of metaTags) {
        const key = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
        const value = tag.match(/content=["']([^"']+)["']/i)?.[1];
        if (value && ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes(key)) {
            candidates.push(absoluteUrl(value, pageUrl));
        }
    }
    const linkTags = html.match(/<link\b[^>]*>/gi) || [];
    for (const tag of linkTags) {
        if (/rel=["']image_src["']/i.test(tag)) {
            const value = tag.match(/href=["']([^"']+)["']/i)?.[1];
            if (value) { candidates.push(absoluteUrl(value, pageUrl)); }
        }
    }
    for (const match of html.matchAll(/"(?:image|imageUrl|primaryImageOfPage)"\s*:\s*(?:\[\s*)?"([^"\\]*(?:\\.[^"\\]*)*)"/gi)) {
        candidates.push(absoluteUrl(match[1], pageUrl));
    }
    return [...new Set(candidates.filter(Boolean))];
}

function imageTagCandidates(html, pageUrl, product) {
    const terms = [product.brand, product.name, product.id]
        .join(" ")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 2 && !["the", "and", "pro", "mark", "camera", "lens"].includes(term));
    return (html.match(/<img\b[^>]*>/gi) || []).map((tag, index) => {
        const source = tag.match(/(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/i)?.[1] || "";
        const alternate = tag.match(/alt=["']([^"']*)["']/i)?.[1] || "";
        const url = absoluteUrl(source, pageUrl);
        const haystack = `${url} ${alternate}`.toLowerCase();
        const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 4 : 0), 0)
            + (/product|hero|main|primary|front/.test(haystack) ? 2 : 0)
            - (/logo|icon|avatar|spacer|sprite|payment/.test(haystack) ? 20 : 0)
            - index / 1000;
        return { url, score };
    }).filter((candidate) => candidate.url).sort((a, b) => b.score - a.score).map((candidate) => candidate.url);
}

async function fetchWithTimeout(url, accept = "text/html") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
        return await fetch(url, {
            redirect: "follow",
            signal: controller.signal,
            headers: {
                "User-Agent": userAgent,
                "Accept": accept,
                "Accept-Language": "en-US,en;q=0.8"
            }
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function downloadCandidate(url) {
    const response = await fetchWithTimeout(url, "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");
    if (!response.ok) {
        throw new Error(`image HTTP ${response.status}`);
    }
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const bytes = Buffer.from(await response.arrayBuffer());
    const looksLikeImage = contentType.startsWith("image/")
        || bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        || bytes.subarray(1, 4).toString() === "PNG"
        || bytes.subarray(0, 4).toString() === "RIFF";
    if (!looksLikeImage || bytes.length < 5000) {
        throw new Error(`not a usable image (${contentType || "unknown"}, ${bytes.length} bytes)`);
    }
    return { bytes, contentType };
}

async function processProduct(product) {
    const pageUrl = pageOverrides[product.id] || product.imagePageUrl || product.officialUrl;
    const outputPath = path.join(projectRoot, product.image);
    const result = {
        id: product.id,
        product: product.name,
        pageUrl,
        directImageUrl: "",
        localPath: product.image,
        status: "failed",
        contentType: "",
        bytes: 0,
        sha256: "",
        error: ""
    };
    try {
        const pageResponse = await fetchWithTimeout(pageUrl);
        if (!pageResponse.ok) {
            throw new Error(`page HTTP ${pageResponse.status}`);
        }
        const contentType = pageResponse.headers.get("content-type") || "";
        if (!contentType.includes("html")) {
            throw new Error(`page is not HTML (${contentType})`);
        }
        const html = await pageResponse.text();
        const candidates = [...metaCandidates(html, pageResponse.url), ...imageTagCandidates(html, pageResponse.url, product)];
        let lastError = "no image candidates";
        for (const candidate of [...new Set(candidates)].slice(0, 18)) {
            try {
                const image = await downloadCandidate(candidate);
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                fs.writeFileSync(outputPath, image.bytes);
                result.directImageUrl = candidate;
                result.status = "downloaded";
                result.contentType = image.contentType;
                result.bytes = image.bytes.length;
                result.sha256 = crypto.createHash("sha256").update(image.bytes).digest("hex");
                result.error = "";
                return result;
            } catch (error) {
                lastError = error.message;
            }
        }
        throw new Error(lastError);
    } catch (error) {
        result.error = error.name === "AbortError" ? "request timed out" : error.message;
        return result;
    }
}

const results = [];
let nextIndex = 0;
const workerCount = 8;

async function worker() {
    while (nextIndex < products.length) {
        const product = products[nextIndex++];
        const result = await processProduct(product);
        results.push(result);
        console.log(`${result.status === "downloaded" ? "OK" : "FAIL"}\t${product.id}\t${result.error || result.bytes}`);
    }
}

await Promise.all(Array.from({ length: workerCount }, () => worker()));
results.sort((a, b) => products.findIndex((product) => product.id === a.id) - products.findIndex((product) => product.id === b.id));
fs.writeFileSync(manifestPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`, "utf8");

const downloaded = results.filter((result) => result.status === "downloaded");
const duplicateHashes = [...new Set(downloaded.map((result) => result.sha256).filter((hash, index, hashes) => hashes.indexOf(hash) !== index))];
console.log(`Downloaded ${downloaded.length}/${products.length}; duplicate hashes: ${duplicateHashes.length}; manifest: ${path.relative(projectRoot, manifestPath)}`);
process.exitCode = downloaded.length === products.length && !duplicateHashes.length ? 0 : 1;
