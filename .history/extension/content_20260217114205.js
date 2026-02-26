console.log("[Metro→Fridge] content script running on", location.href);

const TAG = "[Metro→Fridge]";
const BTN_ID = "metro-fridge-sync-btn";

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

function isMyCartPage() {
  return location.pathname.toLowerCase().includes("/my-cart");
}

function injectButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.textContent = "SYNC TO FRIDGE";

  // Styling
  Object.assign(btn.style, {
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
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  });

  btn.addEventListener("click", handleSyncClick);
  document.body.appendChild(btn);
  console.log(`${TAG} Button injected`);
}

function handleSyncClick() {
  try {
    const items = scrapeCart();
    window.__metroFridgeLastScrape = items;

    console.log(`${TAG} Scraped ${items.length} items`);
    console.table(items);
    
    alert(`✅ Scraped ${items.length} items\nCheck console for details`);
  } catch (error) {
    console.error(`${TAG} Error during scraping:`, error);
    alert(`❌ Error scraping cart: ${error.message}`);
  }
}

// ============================================================================
// CART SCRAPER
// ============================================================================

function scrapeCart() {
  const basketContainer = document.querySelector('.basket-product-tiles');
  
  if (!basketContainer) {
    throw new Error("Cart container (.basket-product-tiles) not found");
  }

  const productElements = basketContainer.querySelectorAll('[data-product-name]');
  
  if (productElements.length === 0) {
    console.warn(`${TAG} No products found in cart`);
    return [];
  }

  console.log(`${TAG} Found ${productElements.length} product elements`);

  const items = [];
  const seen = new Set();

  for (const el of productElements) {
    try {
      const item = extractProductData(el);
      
      if (!item) continue;

      // Skip duplicates
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        console.log(`${TAG} Skipping duplicate: ${item.name}`);
        continue;
      }
      seen.add(key);

      items.push(item);
      console.log(`${TAG} ✓ ${item.name} (qty: ${item.quantity})`, item);
      
    } catch (error) {
      console.error(`${TAG} Error extracting product:`, error);
      // Continue processing other products
    }
  }

  return items;
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

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
    ...unitDetails
  };
}

function extractProductName(element) {
  const name = element.getAttribute('data-product-name');
  return name && name.length >= 2 ? name.trim() : null;
}

function extractQuantity(element) {
  const qtyAttr = element.getAttribute('data-qty');
  
  if (!qtyAttr) {
    console.warn(`${TAG} Missing data-qty attribute, defaulting to 1`);
    return 1;
  }

  const quantity = parseInt(qtyAttr, 10);
  
  if (!Number.isFinite(quantity) || quantity < 1) {
    console.warn(`${TAG} Invalid quantity value: ${qtyAttr}, defaulting to 1`);
    return 1;
  }

  return quantity;
}

function extractUnitDetails(element) {
  const detailsEl = element.querySelector(".head__unit-details");
  
  if (!detailsEl) {
    return {};
  }

  const text = detailsEl.textContent.replace(/\s+/g, " ").trim();
  
  if (!text) {
    return {};
  }

  const unitFactor = extractUnitFactor(detailsEl, text);
  const unit = extractUnit(text);

  const result = {};
  if (unitFactor) result.unitFactor = unitFactor;
  if (unit) result.unit = unit;

  return result;
}

function extractUnitFactor(detailsElement, text) {
  // Try to find .unit-factor child element first
  const unitFactorEl = detailsElement.querySelector(".unit-factor");
  
  if (unitFactorEl) {
    const value = parseInt(unitFactorEl.textContent.trim(), 10);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  // Fallback: parse directly from text (e.g., "400 g")
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

// ============================================================================
// INITIALIZATION
// ============================================================================

if (isMyCartPage()) {
  injectButton();
  
  // Keep button alive in SPA
  const observer = new MutationObserver(() => injectButton());
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true 
  });
  
  console.log(`${TAG} Initialized on cart page`);
} else {
  console.log(`${TAG} Not on cart page, skipping initialization`);
}
fetch("http://localhost:3000/metro/sync", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ items })
})
  .then(r => r.json())
  .then(data => console.log("[SYNC RESULT]", data))
  .catch(err => console.error("[SYNC ERROR]", err));
