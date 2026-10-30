(function () {
    "use strict";

    var productsRoot = document.querySelector("[data-catalog-products]");
    var filtersRoot = document.querySelector("[data-catalog-filters]");
    var products = window.PTEAS_PRODUCTS || [];
    var categories = window.PTEAS_CATEGORIES || [];

    if (!productsRoot || !filtersRoot || !products.length || !categories.length) {
        return;
    }

    var searchParams = new URLSearchParams(window.location.search);
    var initialQuery = searchParams.get("q") || "";
    var initialBrand = searchParams.get("brand") || "";
    var normalizedQuery = normalize(initialQuery);
    var normalizedBrand = normalize(initialBrand);

    function normalize(value) {
        return String(value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: Number.isInteger(value) ? 0 : 2
        }).format(value);
    }

    function matchesQuery(item) {
        if (normalizedBrand) {
            return normalize(item.brand) === normalizedBrand;
        }

        if (!normalizedQuery) {
            return true;
        }

        return normalize([item.brand, item.name, item.type, item.description, item.category].join(" ")).includes(normalizedQuery);
    }

    function createFilter(category) {
        var link = document.createElement("a");
        link.className = "catalog-category-link";
        link.href = "#" + category.id;
        link.textContent = category.label;
        return link;
    }

    function createCard(item) {
        var card = document.createElement("a");
        var imageWrap = document.createElement("span");
        var image = document.createElement("img");
        var body = document.createElement("span");
        var brand = document.createElement("span");
        var title = document.createElement("strong");
        var description = document.createElement("span");
        var footer = document.createElement("span");
        var price = document.createElement("b");
        var condition = document.createElement("span");
        var action = document.createElement("span");

        card.className = "catalog-product-card";
        card.href = item.detailUrl;
        card.setAttribute("aria-label", "View details for " + item.name);
        imageWrap.className = "catalog-product-card__image";
        image.src = item.image;
        image.width = 1200;
        image.height = 900;
        image.loading = "lazy";
        image.alt = item.name;
        imageWrap.appendChild(image);
        body.className = "catalog-product-card__body";
        brand.className = "catalog-product-card__brand";
        brand.textContent = item.brand;
        title.textContent = item.name;
        description.className = "catalog-product-card__details";
        description.textContent = item.description;
        footer.className = "catalog-product-card__footer";
        price.textContent = formatPrice(item.price);
        condition.textContent = item.condition;
        footer.append(price, condition);
        action.className = "catalog-product-card__action";
        action.textContent = "View Details";
        body.append(brand, title, description, footer, action);
        card.append(imageWrap, body);
        return card;
    }

    function createPanel(category, items) {
        var panel = document.createElement("section");
        var heading = document.createElement("div");
        var headingCopy = document.createElement("div");
        var eyebrow = document.createElement("span");
        var title = document.createElement("h2");
        var grid = document.createElement("div");

        panel.className = "catalog-product-panel";
        panel.id = category.id;
        panel.setAttribute("aria-labelledby", category.id + "-title");
        heading.className = "catalog-product-panel__heading";
        eyebrow.textContent = category.number + " / " + category.label;
        title.id = category.id + "-title";
        title.textContent = category.label;
        headingCopy.append(eyebrow, title);
        heading.appendChild(headingCopy);
        grid.className = "product-card-grid";
        items.forEach(function (item) { grid.appendChild(createCard(item)); });
        panel.append(heading, grid);
        return panel;
    }

    categories.forEach(function (category) {
        filtersRoot.appendChild(createFilter(category));
    });

    productsRoot.replaceChildren();
    var totalMatches = 0;

    categories.forEach(function (category) {
        var items = products.filter(function (item) {
            return item.category === category.id && matchesQuery(item);
        });

        if (items.length) {
            totalMatches += items.length;
            productsRoot.appendChild(createPanel(category, items));
        }
    });

    if (!totalMatches) {
        var emptyState = document.createElement("p");
        emptyState.className = "catalog-empty-state";
        emptyState.textContent = normalizedBrand
            ? "No catalogue products are currently listed for “" + initialBrand.trim() + "”."
            : "No products match “" + initialQuery.trim() + "”. Try another product name or brand.";
        productsRoot.appendChild(emptyState);
    }
}());
