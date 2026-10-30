(function () {
    "use strict";

    var heroVideo = document.querySelector(".home-hero__video");
    if (heroVideo && window.matchMedia) {
        var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        var syncHeroVideo = function () {
            if (reducedMotion.matches) {
                heroVideo.pause();
            } else {
                heroVideo.play().catch(function () { /* Poster remains visible if autoplay is blocked. */ });
            }
        };
        syncHeroVideo();
        reducedMotion.addEventListener("change", syncHeroVideo);
    }

    var searchForm = document.querySelector("[data-product-search]");
    var products = window.PTEAS_PRODUCTS || [];
    var categories = window.PTEAS_CATEGORIES || [];

    if (!searchForm || !products.length) {
        return;
    }

    var searchInput = searchForm.querySelector("input[type='search']");
    var resultsPanel = searchForm.querySelector(".home-search__results");
    var status = searchForm.querySelector("[data-search-status]");

    if (!searchInput || !resultsPanel || !status) {
        return;
    }

    function normalize(value) {
        return String(value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
    }

    function categoryLabel(categoryId) {
        var category = categories.find(function (item) { return item.id === categoryId; });
        return category ? category.label : categoryId;
    }

    function findMatches(query) {
        var normalizedQuery = normalize(query);
        return products.filter(function (product) {
            return normalize([product.name, product.brand, product.type, product.category].join(" ")).includes(normalizedQuery);
        }).sort(function (first, second) {
            function rank(product) {
                var title = normalize(product.name);
                var brand = normalize(product.brand);
                if (title === normalizedQuery) { return 0; }
                if (title.startsWith(normalizedQuery)) { return 1; }
                if (brand === normalizedQuery) { return 2; }
                if (brand.startsWith(normalizedQuery)) { return 3; }
                return 4;
            }
            return rank(first) - rank(second) || first.name.localeCompare(second.name);
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
            emptyMessage.textContent = "No matching product or brand. Try Canon, Sony, DJI, lens or tripod.";
            resultsPanel.appendChild(emptyMessage);
            status.textContent = "No products found for " + query + ".";
        } else {
            matches.slice(0, 8).forEach(function (product, index) {
                var result = document.createElement("a");
                result.className = "home-search__result";
                result.href = product.detailUrl;
                result.id = "home-search-result-" + index;
                result.setAttribute("role", "option");
                result.append(
                    Object.assign(document.createElement("strong"), { textContent: product.name }),
                    Object.assign(document.createElement("span"), { textContent: product.brand }),
                    Object.assign(document.createElement("small"), { textContent: categoryLabel(product.category) })
                );
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
        if (searchInput.value.trim().length >= 2) { updateResults(); }
    });
    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeResults();
        } else if (event.key === "ArrowDown" && !resultsPanel.hidden) {
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
            if (activeIndex === 0) { searchInput.focus(); } else { links[activeIndex - 1].focus(); }
        }
    });
    searchForm.addEventListener("submit", function (event) {
        var query = searchInput.value.trim();
        if (!query) { return; }
        event.preventDefault();
        var matches = findMatches(query);
        if (matches.length) {
            window.location.assign(matches[0].detailUrl);
        } else {
            showResults(matches, query);
            searchInput.focus();
        }
    });
    document.addEventListener("click", function (event) {
        if (!searchForm.contains(event.target)) { closeResults(); }
    });
}());
