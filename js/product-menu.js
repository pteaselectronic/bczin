(() => {
    "use strict";

    const menus = [...document.querySelectorAll(".product-menu")];
    if (!menus.length) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const closeDelay = 180;
    let keyboardMode = false;

    document.addEventListener("keydown", (event) => {
        if (["Tab", "Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
            keyboardMode = true;
        }
    });

    document.addEventListener("pointerdown", () => {
        keyboardMode = false;
    });

    menus.forEach((menu, index) => {
        const toggle = menu.querySelector(":scope > .product-menu__toggle");
        const panel = menu.querySelector(":scope > .product-menu__panel");
        if (!toggle || !panel) return;

        let closeTimer = 0;
        let pointerInside = false;
        const panelId = panel.id || `product-menu-panel-${index + 1}`;

        panel.id = panelId;
        toggle.setAttribute("aria-controls", panelId);
        toggle.setAttribute("aria-haspopup", "true");

        const syncState = () => {
            toggle.setAttribute("aria-expanded", menu.open ? "true" : "false");
        };

        const cancelClose = () => {
            window.clearTimeout(closeTimer);
            closeTimer = 0;
        };

        const openMenu = (fromHover = false) => {
            cancelClose();
            menu.open = true;
            menu.classList.toggle("is-hover-open", fromHover);
            syncState();
        };

        const closeMenu = (returnFocus = false) => {
            cancelClose();
            menu.classList.remove("is-hover-open");
            menu.open = false;
            syncState();
            if (returnFocus) toggle.focus();
        };

        const scheduleClose = () => {
            cancelClose();
            closeTimer = window.setTimeout(() => {
                if (pointerInside) return;
                if (keyboardMode && menu.matches(":focus-within")) return;
                closeMenu();
            }, closeDelay);
        };

        menu.addEventListener("pointerenter", (event) => {
            if (!finePointer.matches || event.pointerType === "touch") return;
            pointerInside = true;
            openMenu(true);
        });

        menu.addEventListener("pointerleave", (event) => {
            if (!finePointer.matches || event.pointerType === "touch") return;
            pointerInside = false;
            scheduleClose();
        });

        menu.addEventListener("focusin", () => {
            if (keyboardMode) openMenu(false);
        });

        menu.addEventListener("focusout", () => {
            window.setTimeout(() => {
                if (!menu.matches(":focus-within") && !pointerInside) scheduleClose();
            }, 0);
        });

        toggle.addEventListener("click", (event) => {
            if (finePointer.matches && event.detail > 0) {
                event.preventDefault();
                openMenu(true);
            }
        });

        toggle.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            keyboardMode = true;
            if (menu.open) closeMenu();
            else openMenu(false);
        });

        menu.addEventListener("toggle", syncState);
        syncState();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        const openMenus = menus.filter((menu) => menu.open || menu.classList.contains("is-hover-open"));
        if (!openMenus.length) return;

        event.preventDefault();
        keyboardMode = false;
        openMenus.forEach((menu, index) => {
            menu.classList.remove("is-hover-open");
            menu.open = false;
            const toggle = menu.querySelector(":scope > .product-menu__toggle");
            toggle?.setAttribute("aria-expanded", "false");
            if (index === 0) toggle?.focus();
        });
    });
})();
