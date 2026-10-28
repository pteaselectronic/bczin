(() => {
    "use strict";

    const searchInput = document.querySelector("#catalog-search");
    const conditionSelect = document.querySelector("#catalog-condition");
    const resetButton = document.querySelector(".catalog-tools__reset");
    const status = document.querySelector(".catalog-tools__status");
    const catalogue = document.querySelector(".catalog-products");
    const panels = [...document.querySelectorAll(".catalog-product-panel")];

    if (!searchInput || !conditionSelect || !resetButton || !status || !catalogue || !panels.length) {
        return;
    }

    const pageSize = 8;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pageByPanel = new Map(panels.map((panel) => [panel, 1]));
    const cardsByPanel = new Map();

    const emptyState = document.createElement("p");
    emptyState.className = "catalog-empty-state";
    emptyState.hidden = true;
    emptyState.textContent = "No demo products match these filters. Try another name, brand or condition.";
    (catalogue.querySelector(".catalog-photo-note") || catalogue.querySelector(".catalog-tools"))?.after(emptyState);

    panels.forEach((panel) => {
        const cards = [...panel.querySelectorAll(".catalog-product-card")];
        cardsByPanel.set(panel, cards);

        cards.forEach((card) => {
            const body = card.querySelector(".catalog-product-card__body");
            const brand = card.querySelector(".catalog-product-card__brand")?.textContent || "";
            const name = body?.querySelector("strong")?.textContent || "";
            const condition = card.querySelector(".catalog-product-card__footer span")?.textContent || "";

            card.dataset.search = `${brand} ${name}`.toLocaleLowerCase();
            card.dataset.condition = condition.toLocaleLowerCase();

            if (body && !body.querySelector(".catalog-product-card__action")) {
                const action = document.createElement("span");
                action.className = "catalog-product-card__action";
                action.textContent = "View Details";
                body.append(action);
            }
        });

        const pagination = document.createElement("nav");
        pagination.className = "catalog-pagination";
        pagination.setAttribute("aria-label", `Pagination for ${panel.querySelector("h3")?.textContent || "products"}`);
        panel.append(pagination);
    });

    const normalizeCondition = (value) => {
        if (value === "open-box") return "open box";
        return value;
    };

    const matchesFilters = (card, query, condition) => {
        const matchesQuery = !query || card.dataset.search.includes(query);
        const matchesCondition = condition === "all" || card.dataset.condition.includes(normalizeCondition(condition));
        return matchesQuery && matchesCondition;
    };

    const makeButton = (label, options = {}) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        if (options.label) button.setAttribute("aria-label", options.label);
        if (options.current) button.setAttribute("aria-current", "page");
        if (options.disabled) button.disabled = true;
        if (options.page) button.dataset.page = String(options.page);
        return button;
    };

    const renderPagination = (panel, matchingCards) => {
        const pagination = panel.querySelector(".catalog-pagination");
        const pageCount = Math.max(1, Math.ceil(matchingCards.length / pageSize));
        const currentPage = Math.min(pageByPanel.get(panel) || 1, pageCount);
        pageByPanel.set(panel, currentPage);
        pagination.replaceChildren();

        const previous = makeButton("←", {
            label: "Previous page",
            disabled: currentPage === 1,
            page: currentPage - 1
        });
        pagination.append(previous);

        for (let page = 1; page <= pageCount; page += 1) {
            pagination.append(makeButton(String(page), {
                label: `Page ${page}`,
                current: page === currentPage,
                page
            }));
        }

        const next = makeButton("→", {
            label: "Next page",
            disabled: currentPage === pageCount,
            page: currentPage + 1
        });
        pagination.append(next);
        pagination.hidden = pageCount <= 1;

        pagination.querySelectorAll("button[data-page]").forEach((button) => {
            button.addEventListener("click", () => {
                const page = Number(button.dataset.page);
                if (!page || page < 1 || page > pageCount) return;
                pageByPanel.set(panel, page);
                applyFilters(false);
                panel.scrollIntoView({
                    behavior: reducedMotion.matches ? "auto" : "smooth",
                    block: "start"
                });
            });
        });

        return currentPage;
    };

    function applyFilters(resetPages = true) {
        const query = searchInput.value.trim().toLocaleLowerCase();
        const condition = conditionSelect.value;
        let totalMatches = 0;
        let visibleCategories = 0;

        panels.forEach((panel) => {
            if (resetPages) pageByPanel.set(panel, 1);

            const cards = cardsByPanel.get(panel) || [];
            const matchingCards = cards.filter((card) => matchesFilters(card, query, condition));
            const currentPage = renderPagination(panel, matchingCards);
            const firstIndex = (currentPage - 1) * pageSize;
            const visibleCards = new Set(matchingCards.slice(firstIndex, firstIndex + pageSize));

            cards.forEach((card) => {
                card.hidden = !visibleCards.has(card);
            });

            panel.hidden = matchingCards.length === 0;
            totalMatches += matchingCards.length;
            if (matchingCards.length) visibleCategories += 1;
        });

        emptyState.hidden = totalMatches !== 0;

        if (totalMatches === 0) {
            status.textContent = "No demo products match the selected filters.";
        } else {
            const productWord = totalMatches === 1 ? "product" : "products";
            const categoryWord = visibleCategories === 1 ? "category" : "categories";
            status.textContent = `${totalMatches} demo ${productWord} match across ${visibleCategories} ${categoryWord}. Use the page controls within each category to browse.`;
        }
    }

    let inputTimer;
    searchInput.addEventListener("input", () => {
        window.clearTimeout(inputTimer);
        inputTimer = window.setTimeout(() => applyFilters(true), 120);
    });

    conditionSelect.addEventListener("change", () => applyFilters(true));

    resetButton.addEventListener("click", () => {
        searchInput.value = "";
        conditionSelect.value = "all";
        applyFilters(true);
        searchInput.focus();
    });

    searchInput.closest("form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        applyFilters(true);
    });

    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) searchInput.value = initialQuery;

    applyFilters(true);
})();
