(function () {
    "use strict";

    var heroVideo = document.querySelector(".home-hero__video");

    if (heroVideo && window.matchMedia) {
        var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        var syncHeroVideo = function () {
            if (reducedMotion.matches) {
                heroVideo.pause();
            } else {
                heroVideo.play().catch(function () {
                    /* The poster remains visible when a browser blocks autoplay. */
                });
            }
        };

        syncHeroVideo();
        reducedMotion.addEventListener("change", syncHeroVideo);
    }

    var searchForm = document.querySelector("[data-product-search]");

    if (!searchForm) {
        return;
    }

    var searchInput = searchForm.querySelector("input[type='search']");
    var resultsPanel = searchForm.querySelector(".home-search__results");
    var status = searchForm.querySelector("[data-search-status]");

    if (!searchInput || !resultsPanel || !status) {
        return;
    }

    /* These eight products have dedicated detail pages in the current project. */
    var detailedProducts = [
        { title: "Vanta Capture X4", brand: "Vanta", category: "Cameras", href: "products/vanta-capture-x4.html" },
        { title: "Orbis 24-70mm F2.8 Pro", brand: "Orbis Optics", category: "Lenses", href: "products/orbis-24-70-pro.html" },
        { title: "SteadyLine V8 Fluid Tripod", brand: "SteadyLine", category: "Tripods", href: "products/steadyline-v8-tripod.html" },
        { title: "StudioBox 100 LED Kit", brand: "LumaPro", category: "Lighting", href: "products/lumapro-studiobox-100.html" },
        { title: "ClearCast Production Kit", brand: "ClearCast", category: "Audio & Video", href: "products/clearcast-production-kit.html" },
        { title: "TrekSafe Pro Camera Backpack 28L", brand: "TrekSafe", category: "Bags", href: "products/treksafe-pro-backpack.html" },
        { title: "Creator Essentials Accessory Kit", brand: "Pteas Select", category: "Accessories", href: "products/pteas-creator-essentials.html" },
        { title: "AeroView 4K Foldable Drone", brand: "AeroView", category: "Drones", href: "products/aeroview-4k-drone.html" }
    ];

    /* The generated catalogue contains 24 entries in each of these eight groups. */
    var catalogueGroups = [
        { brand: "Vanta", model: "Vanta Capture", category: "Cameras", anchor: "cameras" },
        { brand: "Orbis Optics", model: "Orbis Optics Creator Lens", category: "Lenses", anchor: "lenses" },
        { brand: "SteadyLine", model: "SteadyLine Support", category: "Tripods", anchor: "tripods" },
        { brand: "LumaPro", model: "LumaPro Studio Light", category: "Lighting", anchor: "lighting" },
        { brand: "ClearCast", model: "ClearCast Production Kit", category: "Audio & Video", anchor: "audio-video" },
        { brand: "TrekSafe", model: "TrekSafe Creator Bag", category: "Bags", anchor: "bags" },
        { brand: "Pteas Select", model: "Pteas Select Creator Essential", category: "Accessories", anchor: "accessories" },
        { brand: "AeroView", model: "AeroView Aerial Kit", category: "Drones", anchor: "drones" }
    ];

    var products = detailedProducts.slice();

    catalogueGroups.forEach(function (group) {
        for (var index = 1; index <= 24; index += 1) {
            var itemNumber = String(index).padStart(2, "0");
            products.push({
                title: group.model + " " + itemNumber,
                brand: group.brand,
                category: group.category,
                href: "products/catalog-details.html#" + group.anchor + "-" + itemNumber
            });
        }
    });

    function normalize(value) {
        return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
    }

    function findMatches(query) {
        var normalizedQuery = normalize(query);

        return products
            .filter(function (product) {
                return normalize(product.title).includes(normalizedQuery) ||
                    normalize(product.brand).includes(normalizedQuery);
            })
            .sort(function (first, second) {
                function rank(product) {
                    var title = normalize(product.title);
                    var brand = normalize(product.brand);

                    if (title === normalizedQuery) { return 0; }
                    if (title.startsWith(normalizedQuery)) { return 1; }
                    if (brand === normalizedQuery) { return 2; }
                    if (brand.startsWith(normalizedQuery)) { return 3; }
                    return 4;
                }

                return rank(first) - rank(second) || first.title.localeCompare(second.title);
            });
    }

    function closeResults() {
        resultsPanel.hidden = true;
        searchInput.setAttribute("aria-expanded", "false");
    }

    function showResults(matches, query) {
        resultsPanel.replaceChildren();

        if (!matches.length) {
            var emptyMessage = document.createElement("p");
            emptyMessage.className = "home-search__empty";
            emptyMessage.textContent = "No matching product or brand. Try Vanta, LumaPro, camera, lens or drone.";
            resultsPanel.appendChild(emptyMessage);
            status.textContent = "No products found for " + query + ".";
        } else {
            matches.slice(0, 8).forEach(function (product, index) {
                var result = document.createElement("a");
                var title = document.createElement("strong");
                var brand = document.createElement("span");
                var category = document.createElement("small");

                result.className = "home-search__result";
                result.href = product.href;
                result.id = "home-search-result-" + index;
                result.setAttribute("role", "option");

                title.textContent = product.title;
                brand.textContent = product.brand;
                category.textContent = product.category;

                result.append(title, brand, category);
                resultsPanel.appendChild(result);
            });

            status.textContent = matches.length + " products found for " + query + ". Showing the first " + Math.min(matches.length, 8) + ".";
        }

        resultsPanel.hidden = false;
        searchInput.setAttribute("aria-expanded", "true");
    }

    function updateResults() {
        var query = searchInput.value.trim();

        if (query.length < 2) {
            closeResults();
            status.textContent = query.length ? "Enter at least two characters to search." : "";
            return [];
        }

        var matches = findMatches(query);
        showResults(matches, query);
        return matches;
    }

    searchInput.addEventListener("input", updateResults);
    searchInput.addEventListener("search", updateResults);
    searchInput.addEventListener("focus", function () {
        if (searchInput.value.trim().length >= 2) {
            updateResults();
        }
    });

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeResults();
            return;
        }

        if (event.key === "ArrowDown" && !resultsPanel.hidden) {
            var firstResult = resultsPanel.querySelector("a");
            if (firstResult) {
                event.preventDefault();
                firstResult.focus();
            }
        }
    });

    resultsPanel.addEventListener("keydown", function (event) {
        var links = Array.from(resultsPanel.querySelectorAll("a"));
        var activeIndex = links.indexOf(document.activeElement);

        if (event.key === "Escape") {
            event.preventDefault();
            searchInput.focus();
            closeResults();
        } else if (event.key === "ArrowDown" && activeIndex > -1) {
            event.preventDefault();
            links[(activeIndex + 1) % links.length].focus();
        } else if (event.key === "ArrowUp" && activeIndex > -1) {
            event.preventDefault();
            if (activeIndex === 0) {
                searchInput.focus();
            } else {
                links[activeIndex - 1].focus();
            }
        }
    });

    searchForm.addEventListener("submit", function (event) {
        var query = searchInput.value.trim();

        if (!query) {
            return;
        }

        var matches = findMatches(query);
        event.preventDefault();

        if (matches.length) {
            window.location.assign(matches[0].href);
        } else {
            showResults(matches, query);
            searchInput.focus();
        }
    });

    document.addEventListener("click", function (event) {
        if (!searchForm.contains(event.target)) {
            closeResults();
        }
    });
}());
