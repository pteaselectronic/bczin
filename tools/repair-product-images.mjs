import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolsDirectory, "..");
const manifestPath = path.join(projectRoot, "product-image-sources.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const replacements = {
    "panasonic-lumix-s5ii": {
        pageUrl: "https://shop.panasonic.com/products/s5m2-full-frame-mirrorless-camera-20-60mm-f3-5-5-6-lens",
        directImageUrl: "https://shop.panasonic.com/cdn/shop/files/aj9esjdogvh7f12vftre.png?v=1786695131&width=2048"
    },
    "canon-eos-r6-mark-ii": {
        pageUrl: "https://www.usa.canon.com/shop/p/eos-r6-mark-ii?type=New",
        directImageUrl: "https://s7d1.scene7.com/is/image/canon/5666C002_eos_r6_mark_ii_body_primary?fmt=webp-alpha"
    },
    "fujifilm-x-t5": {
        pageUrl: "https://www.fujifilm-x.com/en-us/products/cameras/x-t5/",
        directImageUrl: "https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_kv_bg_01_pc.png"
    },
    "canon-eos-r50": {
        pageUrl: "https://www.usa.canon.com/shop/p/eos-r50?color=Black&type=New",
        directImageUrl: "https://s7d1.scene7.com/is/image/canon/5811C002_eos-r50-body-black_primary?fmt=webp-alpha"
    },
    "gopro-hero13-black": {
        pageUrl: "https://gopro.com/en/us/shop/cameras/buy/hero13black/CHDHX-131-master.html",
        directImageUrl: "https://static.gopro.com/assets/blta2b8522e5372af40/blt8c2249b5302e98e3/66ac8ab0a4a65755391e0cf8/01-pdp-h13-gallery-1920.png?auto=webp&disable=upscale&quality=80&width=8192"
    },
    "canon-rf50mm-f1-8-stm": {
        pageUrl: "https://www.usa.canon.com/shop/p/rf50mm-f1-8-stm",
        directImageUrl: "https://s7d1.scene7.com/is/image/canon/4515C002_rf50mm-f18-stm_primary-v2?fmt=webp-alpha"
    },
    "sigma-14-24mm-f2-8-dg-dn-art": {
        pageUrl: "https://www.sigma-global.com/en/lenses/a019_14_24_28/",
        directImageUrl: "https://www.sigma-global.com/lenses/a019_14_24_28_product_img01.png"
    },
    "fujifilm-xf23mm-f1-4-r-lm-wr": {
        pageUrl: "https://shopusa.fujifilm-x.com/xf23mmf1-4-r-lm-wr-xf23mmf1-4-r-lm-wr/",
        directImageUrl: "https://shopusa.fujifilm-x.com/media/catalog/product/cache/4481eb16d53ff38bf2a4679ea03f8c69/1/6/16746539_MAIN00_Image_XF23mmF1.4_front_slant_2.jpg"
    },
    "panasonic-lumix-s-100mm-f2-8-macro": {
        pageUrl: "https://www.panasonic.com/ca/consumer/cameras-camcorders/interchangeable-lenses/full-frame/s-e100.html",
        directImageUrl: "https://panasonic.scene7.com/is/image/Panasonic/ast-2261236-367?fmt=png-alpha&hei=1200&wid=1200"
    },
    "fujifilm-xf70-300mm-f4-5-6-r-lm-ois-wr": {
        pageUrl: "https://eshop.fujifilm-x.com/uk/fujinon-xf70-300mmf4-5-6-r-lm-ois-wr.html",
        directImageUrl: "https://eshop.fujifilm-x.com/media/catalog/product/1/_/1_xf70-300mm.jpg"
    },
    "canon-rf100-500mm-f4-5-7-1-l-is-usm": {
        pageUrl: "https://www.usa.canon.com/shop/p/rf100-500mm-f4-5-7-1-l-is-usm?type=New",
        directImageUrl: "https://s7d1.scene7.com/is/image/canon/4112C002_rf100-500mm-f45-71-l-is-usm_primary?fmt=webp-alpha"
    },
    "sigma-35mm-f1-4-dg-dn-art": {
        pageUrl: "https://www.sigma-global.com/en/lenses/a021_35_14/",
        directImageUrl: "https://www.sigma-global.com/lenses/a021_35_14_product_img01.png"
    },
    "peak-design-travel-tripod-carbon": {
        pageUrl: "https://www.peakdesign.com/global/products/travel-tripod?Tripod+Type=Carbon+Fiber",
        directImageUrl: "https://cdn.shopify.com/s/files/1/2986/1172/files/TTC-6-1.jpg?crop=center&height=1024&v=1762276007&width=1024"
    },
    "peak-design-travel-tripod-aluminum": {
        pageUrl: "https://www.peakdesign.com/global/products/travel-tripod?Tripod+Type=Aluminum",
        directImageUrl: "https://cdn.shopify.com/s/files/1/2986/1172/files/TTA-6-1.jpg?crop=center&height=1024&v=1762276006&width=1024"
    },
    "manfrotto-befree-advanced-aluminum": {
        pageUrl: "https://www.manfrotto.com/global-en/befree-advanced-aluminum-travel-tripod-twist-ball-head-mkbfrta4bk-bhus/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/p/r/professional-photo-tripod-befree-2.0-mkbfrta4bk-bh.jpg"
    },
    "manfrotto-befree-gt-xpro-carbon": {
        pageUrl: "https://www.manfrotto.com/global-en/befree-gt-xpro-carbon-tripod-mkbfrc4gtxp-bus/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/m/a/manfrotto-befree-gt-xpro-mkbfrc4gtxp-bh.jpg"
    },
    "manfrotto-mt055cxpro3": {
        pageUrl: "https://www.manfrotto.com/global-en/camera-video-supports/055-carbon-fiber-3-section-tripod-with-horizontal-column-mt055cxpro3/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/m/t/mt055cxpro3.jpg"
    },
    "manfrotto-mt190xpro4": {
        pageUrl: "https://www.manfrotto.com/global-en/190xpro-aluminium-4-section-camera-tripod-mt190xpro4/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/m/t/mt190xpro4.jpg"
    },
    "manfrotto-element-mii-monopod": {
        pageUrl: "https://www.manfrotto.com/global-en/element-mii-monopod-black-mmelmiia5bk/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/p/h/photo-monopod-manfrotto-element-mii-black-mmelmiia5bk.jpg"
    },
    "godox-knowled-m300r": {
        pageUrl: "https://www.godox.com.cn/product-e/KNOWLED/M300R.html",
        directImageUrl: "https://www.godox.com.cn/static/upload/image/20250630/1751262975969864.jpg"
    },
    "godox-sl60iibi": {
        pageUrl: "https://www.godox.com/product-a/SL60II.html",
        directImageUrl: "https://www.godox.com/static/upload/image/20230215/1676433558409811.jpg"
    },
    "godox-ml60bi": {
        pageUrl: "https://godox.com/product-d/ML60Bi.html",
        directImageUrl: "https://godox.com/static/upload/image/20220118/1642490362814974.jpg"
    },
    "godox-litemons-la200bi": {
        pageUrl: "https://godox.com/product-d/LA.html",
        directImageUrl: "https://godox.com/static/upload/image/20230629/1688031451179457.jpg"
    },
    "sennheiser-profile-wireless": {
        pageUrl: "https://www.sennheiser.com/en-us/catalog/products/wireless-systems/profile-wireless-2-channel-set/profile-wireless-2-channel-set-700266",
        directImageUrl: "https://assets.sennheiser.com/assets/Profile_Wireless_Complete_1-award.png/Zz03ZWFiMGMwYWU3ZGIxMWYwYTBkMmJlYjQzYzY2MTIyYQ==?format=webp&quality=80&width=1920"
    },
    "sennheiser-mke-400": {
        pageUrl: "https://www.sennheiser.com/en-us/catalog/products/microphones/mke-400/mke-400-508898",
        directImageUrl: "https://assets.sennheiser.com/assets/MKE_400_product_shot_cutout_left_side.png/Zz0wMTBhNjI0NGU3YmYxMWYwYWZkMWVhNTViNWQyZmI4Ng==?format=webp&quality=80&width=1920"
    },
    "dji-mic-2": {
        pageUrl: "https://store.dji.com/product/dji-mic-2-wireless-microphone?vid=236991",
        directImageUrl: "https://se-cdn.djiits.com/tpc/uploads/carousel/image/4ee00df5a8d0e8e217c0736998f09e28%40ultra.jpg?format=webp"
    },
    "atomos-ninja": {
        pageUrl: "https://www.atomos.com/explore/ninja-series/",
        directImageUrl: "https://www.atomos.com/wp-content/uploads/2025/07/NINJA-TX_GRID_NINJA_MOBILE.png"
    },
    "atomos-shinobi-ii": {
        pageUrl: "https://www.atomos.com/explore/shinobi-series/",
        directImageUrl: "https://www.atomos.com/wp-content/uploads/2025/09/TABLE-SHINOBI-II.png"
    },
    "peak-design-camera-cube-v2-medium": {
        pageUrl: "https://www.peakdesign.com/products/camera-cube-v2-medium-black",
        directImageUrl: "https://cdn.shopify.com/s/files/1/2986/1172/files/MEDIUMCOVERIMAGE_c19e01c9-cf5c-4fe3-bac5-6b97a56efbb8.jpg?crop=center&height=2048&v=1762275791&width=2048"
    },
    "manfrotto-pro-light-flexloader-l": {
        pageUrl: "https://www.manfrotto.com/global-en/pro-light-flexloader-backpack-l-mb-pl2-bp-fx-l/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/c/a/camera-backpack-manfrotto--pro-light-mb-pl2-bp-fx-l-0-.jpg"
    },
    "manfrotto-advanced-gear-backpack-m-iii": {
        pageUrl: "https://www.manfrotto.com/global-en/camera-bags-backpacks/camera-backpacks/advanced-gear-backpack-iii-mb-ma3-bp-gm/",
        directImageUrl: "https://www.manfrotto.com/media/catalog/product/c/a/camera-backpack-manfrotto--advanced-3-mb-ma3-bp-gm-gear01.jpg"
    },
    "lowepro-photosport-pro-iii-55l": {
        pageUrl: "https://www.lowepro.com/us-en/photosport-backpack-pro-55l-aw-iii-m-l-lp37342-pww/",
        directImageUrl: "https://www.lowepro.com/media/catalog/product/c/a/camera-backpack-lowepro-photosport-pro-lp37342-pww-1.jpg"
    },
    "pelican-1510-protector-case": {
        pageUrl: "https://business.pelican.com/us/en/product/cases/protector/1510",
        directImageUrl: "https://business.pelican.com/storage/products/cases/1510/pelican-products-1514-carry-on-case-dividers-t.jpg"
    },
    "canon-lp-e6p": {
        pageUrl: "https://www.usa.canon.com/shop/p/battery-pack-lp-e6p",
        directImageUrl: "https://s7d1.scene7.com/is/image/canon/6537C001_Battery-Pack-LP-E6P_primary2?fmt=webp-alpha"
    },
    "canon-lc-e6": {
        pageUrl: "https://www.usa.canon.com/shop/p/battery-charger-lc-e6",
        directImageUrl: "https://s7d1.scene7.com/is/image/canon/Canon_3348B001_LC_E6_Battery_Charger_590433-primary2?fmt=webp-alpha"
    },
    "sandisk-extreme-pro-cfexpress-type-b-256gb": {
        pageUrl: "https://www.sandisk.com/products/memory-cards/cfast-cfexpress-compactflash/sandisk-extreme-pro-cfexpress-type-b?sku=SDCFE-256G-GN4NN",
        directImageUrl: "https://www.sandisk.com/content/dam/store/en-us/assets/products/memory-cards/extreme-pro-cfexpress-type-b/gallery/extreme-pro-cfexpress-type-b-256gb-front.png"
    },
    "lexar-professional-2000x-sdxc-128gb": {
        pageUrl: "https://americas.lexar.com/product/lexar-professional-2000x-sdhc-sdxc-uhs-ii-card-gold-series/",
        directImageUrl: "https://americas.lexar.com/wp-content/uploads/2023/12/2000x_SDHC_SDXC_128GB_Photo1.png"
    },
    "lexar-professional-cfexpress-type-a-gold-160gb": {
        pageUrl: "https://americas.lexar.com/product/lexar-professional-cfexpress-type-a-card-gold-series/",
        directImageUrl: "https://americas.lexar.com/wp-content/uploads/2023/11/CFe_TypeA_GOLD_160GB_Photo1.png"
    },
    "dji-avata-2": {
        pageUrl: "https://store.dji.com/product/dji-avata-2-sb",
        directImageUrl: "https://se-cdn.djiits.com/tpc/uploads/in_the_box/cover/168a8a7d61bddb9951b123b705aaa0e1%40retina_small.png"
    },
    "dji-inspire-3": {
        pageUrl: "https://store.dji.com/product/dji-inspire-3?from=store-nav&position=1&set_region=US",
        directImageUrl: "https://se-cdn.djiits.com/tpc/uploads/spu/cover/1b2b5172cd089c0623ddb29fb2ac8f3f%40small.png"
    }
};

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36 PteasCameraCatalogResearch/1.0";

async function download(url) {
    const response = await fetch(url, {
        redirect: "follow",
        headers: {
            "User-Agent": userAgent,
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    if (bytes.length < 3000) {
        throw new Error(`image too small (${bytes.length} bytes)`);
    }
    return { bytes, contentType };
}

const selectedIds = new Set(process.argv.slice(2));
const replacementEntries = Object.entries(replacements).filter(([id]) => selectedIds.size === 0 || selectedIds.has(id));

for (const [id, replacement] of replacementEntries) {
    const result = manifest.results.find((item) => item.id === id);
    if (!result) {
        throw new Error(`Unknown product id: ${id}`);
    }
    try {
        const image = await download(replacement.directImageUrl);
        const outputPath = path.join(projectRoot, result.localPath);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, image.bytes);
        Object.assign(result, replacement, {
            status: "downloaded",
            contentType: image.contentType,
            bytes: image.bytes.length,
            sha256: crypto.createHash("sha256").update(image.bytes).digest("hex"),
            error: ""
        });
        console.log(`OK\t${id}\t${image.bytes.length}`);
    } catch (error) {
        result.status = "failed";
        result.error = error.message;
        console.error(`FAIL\t${id}\t${error.message}`);
    }
}

manifest.generatedAt = new Date().toISOString();
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const downloaded = manifest.results.filter((item) => item.status === "downloaded");
const hashes = new Map();
for (const item of downloaded) {
    const group = hashes.get(item.sha256) || [];
    group.push(item.id);
    hashes.set(item.sha256, group);
}
const duplicateGroups = [...hashes.values()].filter((group) => group.length > 1);
console.log(`Downloaded ${downloaded.length}/${manifest.results.length}; duplicate groups: ${duplicateGroups.length}`);
for (const group of duplicateGroups) {
    console.log(`DUPLICATE\t${group.join(" | ")}`);
}

process.exitCode = downloaded.length === manifest.results.length && duplicateGroups.length === 0 ? 0 : 1;
