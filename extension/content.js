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
        reject(new Error(chrome.runtime.lastError.message));
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

  const items = [];
  const seen = new Set();

  for (const element of productElements) {
    try {
      const item = extractProductData(element);

      if (!item) continue;

      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        console.log(`${TAG} Skipping duplicate: ${item.name}`);
        continue;
      }

      seen.add(key);
      items.push(item);
      console.log(`${TAG} Added ${item.name} (qty: ${item.quantity})`, item);
    } catch (error) {
      console.error(`${TAG} Error extracting product:`, error);
    }
  }

  return items;
}

function extractProductData(element) {
  const name = extractProductName(element);
  if (!name) {
    console.warn(`${TAG} Product element missing name`, element);
    return null;
  }

  const quantity = extractQuantity(element);
  const unitDetails = extractUnitDetails(element);

  return {
    name,
    quantity,
    ...unitDetails,
  };
}

function extractProductName(element) {
  const name = element.getAttribute("data-product-name");
  return name && name.length >= 2 ? name.trim() : null;
}

function extractQuantity(element) {
  const quantityAttribute = element.getAttribute("data-qty");

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
  const detailsElement = element.querySelector(".head__unit-details");

  if (!detailsElement) {
    return {};
  }

  const text = detailsElement.textContent.replace(/\s+/g, " ").trim();

  if (!text) {
    return {};
  }

  const unitFactor = extractUnitFactor(detailsElement, text);
  const unit = extractUnit(text);
  const result = {};

  if (unitFactor) result.unitFactor = unitFactor;
  if (unit) result.unit = unit;

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
