console.log("[Metro->Fridge] content script running on", location.href);

const TAG = "[Metro->Fridge]";
const BTN_ID = "metro-fridge-sync-btn";

function isMyCartPage() {
  return location.pathname.toLowerCase().includes("/my-cart");
}

function injectButton() {
  if (document.getElementById(BTN_ID)) return;

  const button = document.createElement("button");
  button.id = BTN_ID;
  button.type = "button";
  button.textContent = "SYNC TO FRIDGE";

  Object.assign(button.style, {
    position: "fixed",
    top: "18px",
    right: "18px",
    zIndex: "2147483647",
    padding: "16px 22px",
    borderRadius: "14px",
    border: "3px solid #000",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "16px",
    letterSpacing: "0.5px",
    background: "#00FF7F",
    color: "#000",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  });

  button.addEventListener("click", handleSyncClick);
  document.body.appendChild(button);
  console.log(`${TAG} Button injected`);
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        const rawMessage = chrome.runtime.lastError.message || "Extension request failed";
        const isInvalidated = /context invalidated/i.test(rawMessage);
        reject(
          new Error(
            isInvalidated
              ? "The extension was reloaded. Refresh the Metro cart page, then click Sync again."
              : rawMessage,
          ),
        );
        return;
      }

      resolve(response);
    });
  });
}

async function handleSyncClick(event) {
  const button = event.currentTarget;

  try {
    button.disabled = true;
    button.textContent = "SYNCING...";

    const items = scrapeCart();
    window.__metroFridgeLastScrape = items;

    console.log(`${TAG} Scraped ${items.length} items`);
    console.table(items);

    const result = await sendRuntimeMessage({ type: "SYNC_METRO_ITEMS", items });

    if (!result?.ok) {
      throw new Error(result?.error || "Sync failed");
    }

    alert(`Synced ${result.count} items to your MealMajor fridge.`);
  } catch (error) {
    console.error(`${TAG} Error during sync:`, error);
    alert(`Error syncing cart: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "SYNC TO FRIDGE";
  }
}

function scrapeCart() {
  const basketContainer = document.querySelector(".basket-product-tiles");

  if (!basketContainer) {
    throw new Error("Cart container (.basket-product-tiles) not found");
  }

  const productElements = basketContainer.querySelectorAll("[data-product-name]");

  if (productElements.length === 0) {
    console.warn(`${TAG} No products found in cart`);
    return [];
  }

  console.log(`${TAG} Found ${productElements.length} product elements`);

  const itemsByKey = new Map();

  for (const element of productElements) {
    try {
      const item = extractProductData(element);

      if (!item) continue;

      const key = [
        item.name.toLowerCase(),
        item.sizeLabel || "",
      ].join("::");
      const existing = itemsByKey.get(key);

      if (existing) {
        existing.quantity += item.quantity;

        if (!existing.unit && item.unit) existing.unit = item.unit;
        if (!existing.unitFactor && item.unitFactor) existing.unitFactor = item.unitFactor;
        if (!existing.sizeLabel && item.sizeLabel) existing.sizeLabel = item.sizeLabel;
        if (!existing.imageUrl && item.imageUrl) existing.imageUrl = item.imageUrl;

        console.log(`${TAG} Merged duplicate: ${item.name} (qty: ${existing.quantity})`, existing);
        continue;
      }

      itemsByKey.set(key, item);
      console.log(`${TAG} Added ${item.name} (qty: ${item.quantity})`, item);
    } catch (error) {
      console.error(`${TAG} Error extracting product:`, error);
    }
  }

  return [...itemsByKey.values()];
}

function extractProductData(element) {
  const productRoot = resolveProductRoot(element);
  const name = extractProductName(element, productRoot);
  if (!name) {
    console.warn(`${TAG} Product element missing name`, element);
    return null;
  }

  const quantity = extractQuantity(element, productRoot);
  const unitDetails = extractUnitDetails(productRoot);
  const imageUrl = extractImageUrl(productRoot);

  return {
    name,
    quantity,
    ...unitDetails,
    ...(imageUrl ? { imageUrl } : {}),
  };
}

function resolveProductRoot(element) {
  return (
    element.closest(".product-line-cart-first-group") ||
    element.closest(".product-line-cart") ||
    element.closest("[class*='product-line-cart']") ||
    element.closest(".basket-product-tile") ||
    element
  );
}

function extractProductName(element, productRoot) {
  const candidates = [
    element.getAttribute("data-product-name"),
    productRoot.getAttribute("data-product-name"),
    productRoot.querySelector("[data-product-name]")?.getAttribute("data-product-name"),
    productRoot.querySelector("img[alt]")?.getAttribute("alt"),
    productRoot.querySelector(".product-details-link[title]")?.getAttribute("title"),
    productRoot.querySelector(".product-details-link")?.textContent,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length >= 2) {
      return candidate.trim();
    }
  }

  return null;
}

function extractQuantity(element, productRoot) {
  const quantityAttribute =
    element.getAttribute("data-qty") ||
    productRoot.getAttribute("data-qty") ||
    productRoot.querySelector("[data-qty]")?.getAttribute("data-qty");

  if (!quantityAttribute) {
    console.warn(`${TAG} Missing data-qty attribute, defaulting to 1`);
    return 1;
  }

  const quantity = parseInt(quantityAttribute, 10);

  if (!Number.isFinite(quantity) || quantity < 1) {
    console.warn(`${TAG} Invalid quantity value: ${quantityAttribute}, defaulting to 1`);
    return 1;
  }

  return quantity;
}

function extractUnitDetails(element) {
  const detailsElement =
    element.querySelector(".head__unit-details") ||
    element.querySelector("[class*='unit-details']");

  if (!detailsElement) {
    return {};
  }

  const text = detailsElement.textContent.replace(/\s+/g, " ").trim();

  if (!text) {
    return {};
  }

  const unitFactor = extractUnitFactor(detailsElement, text);
  const unit = extractUnit(text);
  const sizeLabel = extractSizeLabel(text);
  const result = {};

  if (unitFactor) result.unitFactor = unitFactor;
  if (unit) result.unit = unit;
  if (sizeLabel) result.sizeLabel = sizeLabel;

  return result;
}

function extractUnitFactor(detailsElement, text) {
  const unitFactorElement = detailsElement.querySelector(".unit-factor");

  if (unitFactorElement) {
    const value = parseInt(unitFactorElement.textContent.trim(), 10);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  const match = text.match(/(\d+)\s*(?:g|kg|ml|l|lb|oz)/i);

  if (match) {
    const value = parseInt(match[1], 10);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function extractUnit(text) {
  const match = text.match(/\b(g|kg|ml|l|lb|oz)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function extractSizeLabel(text) {
  const compactText = text.replace(/\s+/g, " ").trim();
  const match = compactText.match(
    /\b\d+\s*[xX]\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz)\b|\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz|ea|each|un)\b/i,
  );

  if (!match) {
    return null;
  }

  return match[0]
    .replace(/\s*[xX]\s*/g, " x ")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImageUrl(element) {
  const imageElement = element.querySelector(
    "a.product-details-link.pc-thumbnail img, .pc-first-column a.product-details-link img, .pc-thumbnail img, .pc-first-column img, img.defaultable-picture, img",
  );

  if (!imageElement) {
    return null;
  }

  const candidates = [
    imageElement.currentSrc,
    imageElement.getAttribute("src"),
    imageElement.getAttribute("data-src"),
    imageElement.getAttribute("data-lazy"),
    imageElement.getAttribute("data-original"),
    imageElement.getAttribute("data-default"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeImageUrl(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || /icon-no-picture|placeholder/i.test(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return new URL(trimmed, location.origin).toString();
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

if (isMyCartPage()) {
  injectButton();

  const observer = new MutationObserver(() => injectButton());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  console.log(`${TAG} Initialized on cart page`);
} else {
  console.log(`${TAG} Not on cart page, skipping initialization`);
}
