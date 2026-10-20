
/* =========================================
   Q-MART — FRONTEND INTERACTIONS
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeCartCounter();
    initializeWishlist();
    initializeSearch();
});

/* Safely read saved data from browser storage */

function readStorage(key, fallback = []) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.warn("Could not read saved shopping data:", error);
        return fallback;
    }
}

/* Safely save data to browser storage */

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn("Could not save shopping data:", error);
        return false;
    }
}

/* Update the shopping cart number */

function initializeCartCounter() {
    const cartCount = document.getElementById("cart-count");

    if (!cartCount) return;

    function updateCartCount() {
        const cart = readStorage("qmart_cart", []);

        const total = cart.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            return sum + quantity;
        }, 0);

        cartCount.textContent = String(total);
        cartCount.setAttribute(
            "aria-label",
            `${total} items in cart`
        );
    }

    updateCartCount();

    // Other scripts can request a cart refresh with this event.
    window.addEventListener("qmart:cart-updated", updateCartCount);
}

/* Basic wishlist storage */

function initializeWishlist() {
    const wishlist = readStorage("qmart_wishlist", []);

    // Keep the saved list available to other frontend code.
    window.QMart = window.QMart || {};

    window.QMart.getWishlist = function () {
        return readStorage("qmart_wishlist", []);
    };

    window.QMart.addToWishlist = function (product) {
        if (!product || product.id == null) {
            return false;
        }

        const current = readStorage("qmart_wishlist", []);

        const exists = current.some(
            item => String(item.id) === String(product.id)
        );

        if (exists) return true;

        current.push({
            id: product.id,
            name: product.name || "Product"
        });

        const saved = writeStorage("qmart_wishlist", current);

        if (saved) {
            window.dispatchEvent(
                new CustomEvent("qmart:wishlist-updated")
            );
        }

        return saved;
    };

    window.QMart.removeFromWishlist = function (productId) {
        const current = readStorage("qmart_wishlist", []);

        const updated = current.filter(
            item => String(item.id) !== String(productId)
        );

        const saved = writeStorage("qmart_wishlist", updated);

        if (saved) {
            window.dispatchEvent(
                new CustomEvent("qmart:wishlist-updated")
            );
        }

        return saved;
    };
}

/* Search feedback until the real search backend is connected */

function initializeSearch() {
    const searchForm = document.querySelector(".search-form");
    const searchInput = document.getElementById("site-search");

    if (!searchForm || !searchInput) return;

    searchForm.addEventListener("submit", event => {
        const query = searchInput.value.trim();

        if (!query) {
            event.preventDefault();
            searchInput.focus();
            return;
        }

        /*
         * The form currently submits to /search.
         * Flask will implement this route in a later step.
         */
    });
}

/* Add a product to the browser's demo cart */

window.QMart = window.QMart || {};

window.QMart.addToCart = function (product, quantity = 1) {
    if (!product || product.id == null) {
        return false;
    }

    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount < 1) {
        return false;
    }

    const cart = readStorage("qmart_cart", []);

    const existing = cart.find(
        item => String(item.id) === String(product.id)
    );

    if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + amount;
    } else {
        cart.push({
            id: product.id,
            name: product.name || "Product",
            quantity: amount
        });
    }

    const saved = writeStorage("qmart_cart", cart);

    if (saved) {
        window.dispatchEvent(new CustomEvent("qmart:cart-updated"));
    }

    return saved;
};
