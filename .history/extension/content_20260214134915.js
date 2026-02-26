console.log("[Metro→Fridge] content script running on", location.href);

const TAG = "[Metro→Fridge]";
const BTN_ID = "metro-fridge-sync-btn";

function isMyCartPage() {
  return location.pathname.toLowerCase().includes("/my-cart");
}

function injectButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.textContent = "SYNC TO FRIDGE";

  btn.style.position = "fixed";
  btn.style.top = "18px";
  btn.style.right = "18px";
  btn.style.zIndex = "2147483647";
  btn.style.padding = "16px 22px";
  btn.style.borderRadius = "14px";
  btn.style.border = "3px solid #000";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "900";
  btn.style.fontSize = "16px";
  btn.style.letterSpacing = "0.5px";
  btn.style.background = "#00FF7F";
  btn.style.color = "#000";
  btn.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";

  btn.addEventListener("click", () => {
    const items = scrapeCart();
    window.__metroFridgeLastScrape = items;

    console.log(`${TAG} scraped count:`, items.length);
    console.log(`${TAG} scraped items:`, items);
    try { console.table(items); } catch {}
    alert(`Scraped ${items.length} items. Check console.table + window.__metroFridgeLastScrape`);
  });

  document.body.appendChild(btn);
  console.log(`${TAG} Button injected`);
}

// ---------- SCRAPER ----------
function scrapeCart() {
  const items = [];
  const seen = new Set();

  // Find all elements with data-product-name
  const productElements = document.querySelectorAll('[data-product-name]');
  
  for (const el of productElements) {
    // Skip elements in "You May Also Be Interested In" or recommendation sections
    const section = el.closest('[class*="recommendation"], [class*="suggested"], [class*="interested"]');
    if (section) {
      console.log(`${TAG} Skipping recommendation:`, el.getAttribute('data-product-name'));
      continue;
    }

    const name = el.getAttribute('data-product-name');
    if (!name || name.length < 2) continue;

    // Skip Metro Delivery Pass and other non-food items
    if (name.toLowerCase().includes('metro.ca') || 
        name.toLowerCase().includes('delivery pass')) {
      console.log(`${TAG} Skipping service:`, name);
      continue;
    }

    // Skip duplicates
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Get quantity - try multiple approaches
    let quantity = 1;
    
    // Approach 1: data-cart-entry JSON
    const cartEntry = el.getAttribute('data-cart-entry');
    if (cartEntry) {
      try {
        const parsed = JSON.parse(cartEntry);
        if (parsed && typeof parsed.quantity === 'number' && parsed.quantity > 0) {
          quantity = parsed.quantity;
        }
      } catch (e) {
        // Silent fail, try other methods
      }
    }

    // Approach 2: Look for input with current quantity value
    if (quantity === 1) {
      const qtyInput = el.querySelector('input[name="quantity"], input[type="number"]');
      if (qtyInput && qtyInput.value) {
        const val = parseInt(qtyInput.value, 10);
        if (val > 0) quantity = val;
      }
    }

    // Approach 3: Look in data attributes for current quantity
    if (quantity === 1) {
      const dataQty = el.querySelector('[data-quantity]');
      if (dataQty) {
        const val = parseInt(dataQty.getAttribute('data-quantity'), 10);
        if (val > 0) quantity = val;
      }
    }

    items.push({ name, quantity });
  }

  console.log(`${TAG} Found ${items.length} unique products`);
  return items;
}

// Boot
if (isMyCartPage()) {
  injectButton();
  // SPA-safe: keep button alive
  const obs = new MutationObserver(() => injectButton());
  obs.observe(document.documentElement, { childList: true, subtree: true });
} else {
  console.log(`${TAG} Not /my-cart, doing nothing.`);
}