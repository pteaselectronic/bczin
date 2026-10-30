import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolsDirectory, "..");
const dataPath = path.join(projectRoot, "js", "product-data.js");
const primaryManifestPath = path.join(projectRoot, "product-image-sources.json");
const galleryManifestPath = path.join(projectRoot, "product-gallery-image-sources.json");
const galleryDataPath = path.join(projectRoot, "js", "product-gallery-images.js");
const browserCandidatesPath = path.join(projectRoot, "product-gallery-browser-candidates.json");
const sandbox = { window: {} };
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36 PteasCameraCatalogResearch/2.0";

vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });

const products = sandbox.window.PTEAS_PRODUCTS || [];
const primaryManifest = JSON.parse(fs.readFileSync(primaryManifestPath, "utf8"));
const primarySources = new Map(primaryManifest.results.map((result) => [result.id, result]));
const previousManifest = fs.existsSync(galleryManifestPath)
    ? JSON.parse(fs.readFileSync(galleryManifestPath, "utf8"))
    : { results: [] };
const previousResults = new Map(previousManifest.results.map((result) => [result.id, result]));
const browserCandidateManifest = fs.existsSync(browserCandidatesPath)
    ? JSON.parse(fs.readFileSync(browserCandidatesPath, "utf8"))
    : { results: [] };
const browserCandidates = new Map(browserCandidateManifest.results.map((result) => [result.id, result]));
const args = process.argv.slice(2);
const force = args.includes("--force");
const debug = args.includes("--debug");
const onlyArgument = args.find((argument) => argument.startsWith("--only="));
const categoryArgument = args.find((argument) => argument.startsWith("--category="));
const onlyIds = onlyArgument ? new Set(onlyArgument.slice(7).split(",").filter(Boolean)) : null;
const selectedCategory = categoryArgument ? categoryArgument.slice(11) : "";
const rejectedAssetUrls = new Set([
    "https://www.manfrotto.com/static/version1792150299/frontend/Hyva/manfrotto/it_IT/images/logo_official.png",
    "https://edge.rode.com/images/products/878/RODE%20Central_RODE%20Use-500x500-bdef810%20(1).png",
    "https://www.sennheiser.com/og/SennheiserDefaultOg.jpg",
    "https://cdn.shopify.com/s/files/1/2986/1172/files/1_for_the_Planet_Business_Member_Vertical_Black.png?v=1744222811",
    "https://cdn.shopify.com/s/files/1/2986/1172/files/Charging.jpg?v=1727118277",
    "https://d1ncau8tqf99kp.cloudfront.net/EmailPopUp/bravia_background.png",
    "https://d1ncau8tqf99kp.cloudfront.net/media/airpeak_serial_no.png",
    "https://americas.lexar.com/wp-content/uploads/2023/12/2000x_SDHC_SDXC_256GB_Photo1.png",
    "https://americas.lexar.com/wp-content/uploads/2023/12/2000x_SDHC_SDXC_512GB_Photo1.png",
    "https://americas.lexar.com/wp-content/uploads/2023/11/CFe_TypeA_GOLD_320GB_Photo1.png",
    "https://americas.lexar.com/wp-content/uploads/2023/11/CFe_TypeA_GOLD_320GB_Photo3.png",
    "https://americas.lexar.com/wp-content/uploads/2024/10/Pro_CFe_TypeB_GOLD_4TB_Photo1-600x600.png",
    "https://americas.lexar.com/wp-content/uploads/2024/10/Pro_CFe_TypeB_GOLD_4TB_Photo1.png",
    "https://product4.djicdn.com/uploads/images/5209/7c012cda-827c-4aab-be7e-486037ced0cc.png",
    "https://cdn.shopify.com/s/files/1/0862/5432/1947/products/1_017a23e0-8625-4088-bc3b-a9e4e2b66506.png?v=1710517498"
]);

function decodeValue(value) {
    return String(value || "")
        .replace(/\\u002f/gi, "/")
        .replace(/\\u0026/gi, "&")
        .replace(/\\u003d/gi, "=")
        .replace(/\\\//g, "/")
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", "\"")
        .replaceAll("&#39;", "'")
        .replaceAll("\\x2F", "/");
}

function absoluteUrl(value, pageUrl) {
    const decoded = decodeValue(value).trim().replace(/^['"]|['"]$/g, "");
    if (!decoded || decoded.startsWith("data:") || decoded.startsWith("blob:")) {
        return "";
    }
    try {
        return new URL(decoded.startsWith("//") ? `https:${decoded}` : decoded, pageUrl).href;
    } catch {
        return "";
    }
}

function normalizedAssetUrl(value) {
    try {
        const url = new URL(value);
        const ignored = ["width", "height", "wid", "hei", "w", "h", "quality", "q", "format", "fmt", "auto", "crop", "fit", "dpr"];
        ignored.forEach((key) => url.searchParams.delete(key));
        url.hash = "";
        return `${url.hostname.toLowerCase()}${url.pathname.toLowerCase()}?${[...url.searchParams].sort().map(([key, item]) => `${key}=${item}`).join("&")}`;
    } catch {
        return value.toLowerCase();
    }
}

function productTerms(product) {
    const ignored = new Set(["the", "and", "for", "with", "camera", "lens", "light", "kit", "pro", "mark", "series", "black", "new", "body"]);
    return [...new Set(`${product.id} ${product.brand} ${product.name}`.toLowerCase().split(/[^a-z0-9]+/)
        .filter((term) => term.length > 2 && !ignored.has(term)))];
}

function candidateScore(candidate, product, pageUrl, primaryUrl) {
    const haystack = `${candidate.url} ${candidate.context}`.toLowerCase();
    const terms = productTerms(product);
    let score = candidate.origin === "tag" ? 8 : 2;
    score += terms.reduce((total, term) => total + (haystack.includes(term) ? 5 : 0), 0);
    if (/gallery|product|pdp|media|catalog|angle|view|front|back|side|open|closed|primary|main|hero/.test(haystack)) score += 5;
    if (/(?:_|-|\b)(?:0?[2-9]|1[0-2])(?:_|-|\.|\b)/.test(haystack)) score += 3;
    if (/zoom|large|original|2048|1920|1600|1200|1024|retina|ultra/.test(haystack)) score += 3;
    if (/thumb|thumbnail/.test(haystack)) score -= 2;
    if (/sample|award|logo|icon|sprite|badge|payment|klarna|affirm|avatar|flag|favicon|placeholder|loading|spinner|youtube|facebook|instagram|tiktok|newsletter|store-locator/.test(haystack)) score -= 35;
    if (/banner|campaign|feature|lifestyle|article|blog/.test(haystack)) score -= 4;
    try {
        const candidateHost = new URL(candidate.url).hostname;
        if (candidateHost === new URL(primaryUrl).hostname) score += 4;
        if (candidateHost === new URL(pageUrl).hostname) score += 2;
    } catch {
        // Invalid URLs are removed before scoring.
    }
    return score;
}

function syntheticCandidates(primaryUrl, product) {
    const candidates = [];
    if (!primaryUrl) return candidates;
    try {
        const url = new URL(primaryUrl);
        if (product.brand === "Canon" && /scene7\.com$/i.test(url.hostname) && /\/is\/image\/canon\//i.test(url.pathname)) {
            const originalPath = url.pathname;
            for (let index = 2; index <= 10; index += 1) {
                const variantPath = originalPath.replace(/_(?:primary(?:-v\d+|\d+)?)$/i, `_${index}`);
                if (variantPath !== originalPath) {
                    const variant = new URL(url.href);
                    variant.pathname = variantPath;
                    variant.search = "";
                    variant.searchParams.set("fmt", "png-alpha");
                    variant.searchParams.set("wid", "1200");
                    variant.searchParams.set("hei", "1200");
                    candidates.push({ url: variant.href, context: `${product.name} official product gallery view ${index}`, origin: "tag" });
                }
            }
        }
    } catch {
        return candidates;
    }
    if (product.id === "atomos-ninja") {
        candidates.push(
            { url: "https://www.atomos.com/wp-content/uploads/2026/02/WEB_NINJA-BACK-2026-FEB.png", context: "Atomos Ninja official rear product view", origin: "tag" },
            { url: "https://www.atomos.com/wp-content/uploads/2025/07/WEB_NINJA-TX_SCREEN-BRIGHTNESS.jpg", context: "Atomos Ninja official display feature view", origin: "tag" }
        );
    }
    if (product.id === "atomos-shinobi-ii") {
        candidates.push(
            { url: "https://support.atomos.com/hc/article_attachments/10342351274255", context: "Atomos Shinobi II official front physical-features view", origin: "tag" },
            { url: "https://support.atomos.com/hc/article_attachments/10342351275023", context: "Atomos Shinobi II official rear ports view", origin: "tag" },
            { url: "https://support.atomos.com/hc/article_attachments/10342366230671", context: "Atomos Shinobi II official battery-mount view", origin: "tag" }
        );
    }
    if (product.id === "sennheiser-mke-400") {
        candidates.push({
            url: "https://cdn.uc.assets.prezly.com/97d8339f-dd44-4376-93a4-270b893df425/-/crop/2400x1242/0%2C125/-/preview/-/resize/992/-/format/png/-/progressive/yes/-/quality/smart/",
            context: "Sennheiser MKE 400 official newsroom product-in-use image",
            origin: "tag"
        });
    }
    if (product.id === "pelican-1510-protector-case") {
        candidates.push(
            { url: "https://business.pelican.com/storage/products/cases/1510/pelican-hard-rolling-travel-carry-on-case-t.jpg", context: "Pelican 1510 official closed rolling case view", origin: "tag" },
            { url: "https://business.pelican.com/storage/products/cases/1510/pelican-1510-cases-carry-on-cases-travel-t.jpg", context: "Pelican 1510 official open case view", origin: "tag" },
            { url: "https://business.pelican.com/storage/products/cases/1510/pelican-hard-wheeled-travel-carry-on-case-t.jpg", context: "Pelican 1510 official wheeled case view", origin: "tag" }
        );
    }
    if (product.id === "lowepro-photosport-pro-iii-55l") {
        for (let index = 2; index <= 8; index += 1) {
            candidates.push({
                url: `https://www.lowepro.com/media/catalog/product/c/a/camera-backpack-lowepro-photosport-pro-lp37342-pww-${index}.jpg`,
                context: `Lowepro PhotoSport PRO 55L official product gallery view ${index}`,
                origin: "tag"
            });
        }
    }
    return candidates;
}

function collectCandidates(html, pageUrl, product, primaryUrl) {
    const discovered = browserCandidates.get(product.id);
    const candidates = [
        ...syntheticCandidates(primaryUrl, product),
        ...(discovered?.candidates || []).map((candidate) => ({
            url: candidate.url,
            context: candidate.context || `${product.name} official product gallery`,
            origin: "tag"
        }))
    ];
    const decodedHtml = decodeValue(html);
    const add = (value, context, origin) => {
        const url = absoluteUrl(value, pageUrl);
        if (!url || !/^https?:/i.test(url)) return;
        const lower = url.toLowerCase();
        if (!(/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(lower) || /\/is\/image\//i.test(lower))) return;
        if (/\.svg(?:[?#]|$)|\.gif(?:[?#]|$)/i.test(lower)) return;
        candidates.push({ url, context: decodeValue(context), origin });
    };

    for (const tag of decodedHtml.match(/<(?:img|source)\b[^>]*>/gi) || []) {
        const alt = tag.match(/(?:alt|title)=["']([^"']*)["']/i)?.[1] || "";
        for (const match of tag.matchAll(/(?:src|srcset|data-src|data-srcset|data-original|data-lazy-src|data-zoom-image|data-image|data-large-image)=["']([^"']+)["']/gi)) {
            match[1].split(/,\s*(?=https?:|\/)/).forEach((part) => add(part.trim().split(/\s+/)[0], `${alt} ${tag}`, "tag"));
        }
    }

    for (const match of decodedHtml.matchAll(/(?:https?:)?\/\/[^"'<>\s\\]+?(?:\.(?:jpe?g|png|webp|avif)(?:\?[^"'<>\s\\]*)?|\/is\/image\/[^"'<>\s\\]+)/gi)) {
        const start = Math.max(0, match.index - 120);
        const context = decodedHtml.slice(start, Math.min(decodedHtml.length, match.index + match[0].length + 120));
        add(match[0], context, "text");
    }

    for (const match of decodedHtml.matchAll(/["']([^"']+?(?:\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?|\/is\/image\/[^"']+))["']/gi)) {
        const start = Math.max(0, match.index - 100);
        add(match[1], decodedHtml.slice(start, Math.min(decodedHtml.length, match.index + match[0].length + 100)), "text");
    }

    const primaryIdentity = normalizedAssetUrl(primaryUrl);
    const unique = new Map();
    for (const candidate of candidates) {
        const identity = normalizedAssetUrl(candidate.url);
        if (identity === primaryIdentity) continue;
        const score = candidateScore(candidate, product, pageUrl, primaryUrl);
        const existing = unique.get(identity);
        if (!existing || score > existing.score) unique.set(identity, { ...candidate, identity, score });
    }
    return [...unique.values()]
        .filter((candidate) => candidate.score > -10 && !rejectedAssetUrls.has(candidate.url))
        .sort((a, b) => b.score - a.score);
}

async function fetchWithTimeout(url, accept = "text/html", timeoutMs = 30000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
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

function imageDimensions(bytes) {
    if (bytes.length > 24 && bytes.subarray(1, 4).toString() === "PNG") {
        return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    }
    if (bytes.length > 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") {
        const type = bytes.subarray(12, 16).toString();
        if (type === "VP8X" && bytes.length > 30) {
            return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
        }
        if (type === "VP8L" && bytes.length > 25 && bytes[20] === 0x2f) {
            const bits = bytes.readUInt32LE(21);
            return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
        }
        const signature = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 16);
        if (signature !== -1 && bytes.length > signature + 7) {
            return { width: bytes.readUInt16LE(signature + 3) & 0x3fff, height: bytes.readUInt16LE(signature + 5) & 0x3fff };
        }
    }
    if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
        let offset = 2;
        while (offset + 9 < bytes.length) {
            if (bytes[offset] !== 0xff) { offset += 1; continue; }
            const marker = bytes[offset + 1];
            const length = bytes.readUInt16BE(offset + 2);
            if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
                return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
            }
            if (!length || length < 2) break;
            offset += 2 + length;
        }
    }
    return { width: 0, height: 0 };
}

async function downloadImage(url) {
    const response = await fetchWithTimeout(url, "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", 12000);
    if (!response.ok) throw new Error(`image HTTP ${response.status}`);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const bytes = Buffer.from(await response.arrayBuffer());
    const looksLikeImage = contentType.startsWith("image/")
        || bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        || bytes.subarray(1, 4).toString() === "PNG"
        || bytes.subarray(0, 4).toString() === "RIFF";
    if (!looksLikeImage || bytes.length < 5000 || bytes.length > 30000000) {
        throw new Error(`not a usable image (${contentType || "unknown"}, ${bytes.length} bytes)`);
    }
    const dimensions = imageDimensions(bytes);
    if (dimensions.width && dimensions.height && (dimensions.width < 360 || dimensions.height < 280)) {
        throw new Error(`image too small (${dimensions.width}x${dimensions.height})`);
    }
    return { bytes, contentType, ...dimensions };
}

function sha256(bytes) {
    return crypto.createHash("sha256").update(bytes).digest("hex");
}

function frontHash(product) {
    const filePath = path.join(projectRoot, product.image);
    return fs.existsSync(filePath) ? sha256(fs.readFileSync(filePath)) : "";
}

function writeOutputs(results) {
    const orderedResults = products
        .map((product) => results.find((result) => result.id === product.id) || previousResults.get(product.id))
        .filter(Boolean)
        .map((result) => {
            const images = (result.images || []).filter((image) => !rejectedAssetUrls.has(image.directImageUrl));
            return {
                ...result,
                images,
                status: images.length >= 2 ? "complete" : images.length ? "partial" : "failed"
            };
        });
    fs.writeFileSync(galleryManifestPath, `${JSON.stringify({
        generatedAt: new Date().toISOString(),
        targetImagesPerProduct: 3,
        sourcePolicy: "Official manufacturer product, specification, support, store, or press pages and the image assets embedded by those pages.",
        usageNote: "Manufacturer pages do not universally grant retailer reuse rights. Obtain written manufacturer or licensed-supplier approval before commercial publication.",
        results: orderedResults
    }, null, 2)}\n`, "utf8");

    const mapping = {};
    for (const product of products) {
        const result = orderedResults.find((item) => item.id === product.id);
        const alternates = (result?.images || []).filter((image) => image.status === "downloaded" && fs.existsSync(path.join(projectRoot, image.localPath)));
        mapping[product.id] = [product.image, ...alternates.map((image) => image.localPath)];
    }
    const output = `(function () {\n    "use strict";\n\n    window.PTEAS_PRODUCT_GALLERY = ${JSON.stringify(mapping, null, 4)};\n}());\n`;
    fs.writeFileSync(galleryDataPath, output, "utf8");
}

const existingHashes = new Set();
for (const product of products) {
    const hash = frontHash(product);
    if (hash) existingHashes.add(hash);
}
for (const result of previousManifest.results || []) {
    for (const image of result.images || []) {
        if (image.sha256) existingHashes.add(image.sha256);
    }
}

async function processProduct(product) {
    const primary = primarySources.get(product.id) || {};
    const pageUrl = primary.pageUrl || product.imagePageUrl || product.officialUrl;
    const primaryUrl = primary.directImageUrl || product.imageSourceUrl || "";
    const previous = previousResults.get(product.id);
    const retainedImages = force ? [] : (previous?.images || []).filter((image) =>
        image.status === "downloaded"
        && image.localPath
        && !rejectedAssetUrls.has(image.directImageUrl)
        && fs.existsSync(path.join(projectRoot, image.localPath))
    );
    if (!force && retainedImages.length >= 2) {
        return previous;
    }

    const result = {
        id: product.id,
        product: product.name,
        category: product.category,
        pageUrl,
        primaryImage: product.image,
        status: "failed",
        candidateCount: 0,
        images: retainedImages.slice(0, 2),
        errors: []
    };

    let candidates = collectCandidates("", pageUrl, product, primaryUrl);
    try {
        const pageResponse = await fetchWithTimeout(pageUrl);
        if (pageResponse.ok) {
            const html = await pageResponse.text();
            candidates = collectCandidates(html, pageResponse.url, product, primaryUrl);
            result.pageUrl = pageResponse.url;
        } else {
            result.errors.push(`page HTTP ${pageResponse.status}; trying official asset URL patterns`);
        }
    } catch (error) {
        result.errors.push(`${error.name === "AbortError" ? "page request timed out" : error.message}; trying official asset URL patterns`);
    }

    if (debug) {
        console.log(`DEBUG\t${product.id}\tprimary=${primaryUrl}\tsynthetic=${syntheticCandidates(primaryUrl, product).length}`);
        console.log(candidates.slice(0, 10).map((candidate) => `${candidate.score ?? "synthetic"}\t${candidate.url}`).join("\n"));
    }
    result.candidateCount = candidates.length;
    const localHashes = new Set([frontHash(product), ...retainedImages.map((image) => image.sha256)].filter(Boolean));

    const candidatePool = candidates.slice(0, 24);
    for (let offset = 0; offset < candidatePool.length && result.images.length < 2; offset += 4) {
        const batch = candidatePool.slice(offset, offset + 4);
        const downloads = await Promise.all(batch.map(async (candidate) => {
            try {
                return { candidate, downloaded: await downloadImage(candidate.url) };
            } catch (error) {
                return { candidate, error };
            }
        }));
        for (const item of downloads) {
            if (result.images.length >= 2) break;
            if (item.error) {
                result.errors.push(`${item.candidate.url} :: ${item.error.name === "AbortError" ? "request timed out" : item.error.message}`);
                continue;
            }
            const hash = sha256(item.downloaded.bytes);
            if (localHashes.has(hash) || existingHashes.has(hash)) {
                result.errors.push(`${item.candidate.url} :: duplicate image hash`);
                continue;
            }
            const viewNumber = [2, 3].find((number) =>
                !result.images.some((image) => image.localPath === `images/products/${product.category}/${product.id}-view-${number}.jpg`)
            ) || result.images.length + 2;
            const localPath = `images/products/${product.category}/${product.id}-view-${viewNumber}.jpg`;
            fs.writeFileSync(path.join(projectRoot, localPath), item.downloaded.bytes);
            localHashes.add(hash);
            existingHashes.add(hash);
            result.images.push({
                status: "downloaded",
                directImageUrl: item.candidate.url,
                localPath,
                contentType: item.downloaded.contentType,
                bytes: item.downloaded.bytes.length,
                width: item.downloaded.width,
                height: item.downloaded.height,
                sha256: hash,
                sourcePageUrl: result.pageUrl,
                usageNote: "Official manufacturer page asset; commercial reuse permission requires manufacturer or licensed-supplier approval."
            });
        }
    }
    result.status = result.images.length === 2 ? "complete" : result.images.length ? "partial" : "failed";
    return result;
}

const selectedProducts = products.filter((product) => (!onlyIds || onlyIds.has(product.id)) && (!selectedCategory || product.category === selectedCategory));
const activeResults = [];
let nextIndex = 0;
const workerCount = Math.min(4, selectedProducts.length || 1);

async function worker() {
    while (nextIndex < selectedProducts.length) {
        const product = selectedProducts[nextIndex++];
        const result = await processProduct(product);
        activeResults.push(result);
        console.log(`${result.status.toUpperCase()}\t${product.id}\t${result.images.length}/2\t${result.candidateCount} candidates`);
        writeOutputs([
            ...previousManifest.results.filter((item) => !activeResults.some((active) => active.id === item.id)),
            ...activeResults
        ]);
    }
}

await Promise.all(Array.from({ length: workerCount }, () => worker()));
const combinedResults = [...previousManifest.results.filter((item) => !activeResults.some((active) => active.id === item.id)), ...activeResults];
writeOutputs(combinedResults);

const completed = combinedResults.filter((result) => result.status === "complete").length;
const partial = combinedResults.filter((result) => result.status === "partial").length;
const failed = combinedResults.filter((result) => result.status === "failed").length;
console.log(`Gallery images: complete=${completed}, partial=${partial}, failed=${failed}; manifest=${path.relative(projectRoot, galleryManifestPath)}`);
process.exitCode = failed ? 1 : 0;
