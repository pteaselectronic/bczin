(function () {
    "use strict";

    var root = document.querySelector("[data-product-detail]");
    var products = window.PTEAS_PRODUCTS || [];
    var categories = window.PTEAS_CATEGORIES || [];

    if (!root || !products.length) {
        return;
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: Number.isInteger(value) ? 0 : 2
        }).format(value);
    }

    function textElement(tag, className, text) {
        var element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        element.textContent = text;
        return element;
    }

    function categoryFor(product) {
        return categories.find(function (category) { return category.id === product.category; }) || {
            id: product.category,
            label: product.category
        };
    }

    function createGallery(product) {
        var gallery = document.createElement("section");
        var images = product.images && product.images.length ? product.images : [product.image];
        gallery.className = "product-detail__gallery";
        gallery.setAttribute("aria-label", "Product images of " + product.name);

        images.forEach(function (imagePath, index) {
            var figure = document.createElement("figure");
            var image = document.createElement("img");
            var caption = document.createElement("figcaption");
            figure.className = "product-detail__image" + (index === 0 ? " product-detail__image--primary" : "");
            image.src = "../" + imagePath;
            image.width = 1200;
            image.height = 900;
            image.loading = index === 0 ? "eager" : "lazy";
            image.alt = product.name + (images.length > 1 ? " product view " + (index + 1) : "");
            caption.textContent = images.length > 1 ? "Product view " + (index + 1) : product.name;
            figure.append(image, caption);
            gallery.appendChild(figure);
        });

        return gallery;
    }

    function createSummary(product) {
        var summary = document.createElement("section");
        var meta = document.createElement("div");
        var price = document.createElement("div");
        var features = document.createElement("section");
        var featureList = document.createElement("ul");
        var actions = document.createElement("div");
        var contact = document.createElement("a");
        var visit = document.createElement("a");

        summary.className = "product-detail__summary";
        summary.append(
            textElement("p", "product-detail__brand", product.brand),
            textElement("h1", "", product.name),
            textElement("p", "product-detail__lead", product.description)
        );
        meta.className = "product-detail__meta";
        price.className = "product-detail__price";
        price.append(textElement("span", "", "Reference price"), textElement("strong", "", formatPrice(product.price)));
        meta.append(price, textElement("span", "product-detail__condition", "Condition: " + product.condition));
        features.className = "product-detail__features";
        features.appendChild(textElement("h2", "", "Key specifications"));
        featureList.className = "product-detail__feature-list";
        product.specs.slice(0, 4).forEach(function (spec) {
            var item = document.createElement("li");
            item.append(textElement("strong", "", spec.value), textElement("span", "", spec.label));
            featureList.appendChild(item);
        });
        features.appendChild(featureList);
        actions.className = "product-detail__actions";
        contact.className = "button";
        contact.href = "../contact.html?product=" + encodeURIComponent(product.name) + "#contact-form";
        contact.textContent = "Ask About This Product";
        visit.className = "button button--ghost";
        visit.href = "../contact.html#location";
        visit.textContent = "Visit the store";
        actions.append(contact, visit);
        summary.append(meta, features, actions);
        return summary;
    }

    function createInformation(product, category) {
        var information = document.createElement("section");
        var tabs = document.createElement("div");
        var grid = document.createElement("div");
        var description = document.createElement("section");
        var includedList = document.createElement("ul");
        var specifications = document.createElement("section");
        var definitionList = document.createElement("dl");
        var sourceLink = document.createElement("a");

        information.className = "product-detail__information";
        information.setAttribute("aria-label", product.name + " product details");
        tabs.className = "product-detail__tabs";
        tabs.setAttribute("aria-label", "Product information sections");
        tabs.appendChild(textElement("span", "is-current", "Product Details"));
        grid.className = "product-detail__information-grid";
        description.className = "product-detail__description-block";
        description.append(
            textElement("h2", "", "Product overview"),
            textElement("p", "", product.overview),
            textElement("h2", "", "What is included")
        );
        product.included.forEach(function (included) {
            includedList.appendChild(textElement("li", "", included));
        });
        description.append(includedList, textElement("h2", "", "Recommended use"), textElement("p", "", product.recommendedUse + "."));

        specifications.className = "product-detail__specifications";
        specifications.appendChild(textElement("h2", "", "Product specifications"));
        [
            { label: "Brand", value: product.brand },
            { label: "Category", value: category.label },
            { label: "Condition", value: product.condition }
        ].concat(product.specs).forEach(function (spec) {
            var row = document.createElement("div");
            row.append(textElement("dt", "", spec.label), textElement("dd", "", spec.value));
            definitionList.appendChild(row);
        });
        specifications.appendChild(definitionList);
        sourceLink.className = "text-link product-detail__source";
        sourceLink.href = product.officialUrl;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = "Official manufacturer source ↗";
        specifications.appendChild(sourceLink);
        grid.append(description, specifications);
        information.append(tabs, grid);
        var note = document.createElement("p");
        note.className = "product-detail__store-note";
        note.append(textElement("strong", "", "Reference listing. "), document.createTextNode("Confirm current local price, stock and package contents with the store before travelling."));
        information.appendChild(note);
        return information;
    }

    function renderProduct() {
        var requestedId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        var product = products.find(function (item) { return item.id === requestedId; });

        if (!product) {
            root.replaceChildren();
            var error = document.createElement("section");
            var back = document.createElement("a");
            error.className = "container product-detail-error";
            error.append(textElement("p", "eyebrow", "Product not found"), textElement("h1", "", "This product link is no longer available."));
            back.className = "button";
            back.href = "../products.html";
            back.textContent = "Browse all products";
            error.appendChild(back);
            root.appendChild(error);
            document.title = "Product Not Found | Pteas Camera";
            return;
        }

        var category = categoryFor(product);
        var article = document.createElement("article");
        var container = document.createElement("div");
        var breadcrumb = document.createElement("nav");
        var backLink = document.createElement("a");
        var layout = document.createElement("div");
        article.className = "product-detail";
        article.id = product.id;
        container.className = "container";
        breadcrumb.className = "product-detail__breadcrumb";
        breadcrumb.setAttribute("aria-label", "Breadcrumb");
        backLink.href = "../products.html#" + category.id;
        backLink.textContent = "Back to " + category.label;
        breadcrumb.appendChild(backLink);
        layout.className = "product-detail__layout";
        layout.append(createGallery(product), createSummary(product));
        container.append(breadcrumb, layout, createInformation(product, category));
        article.appendChild(container);
        root.replaceChildren(article);
        document.title = product.name + " | Pteas Camera";
    }

    renderProduct();
    window.addEventListener("hashchange", renderProduct);
}());
