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

  // ONLY look inside the basket-product-tiles container
  const basketContainer = document.querySelector('.basket-product-tiles');
  
  if (!basketContainer) {
    console.error(`${TAG} Could not find .basket-product-tiles container`);
    return items;
  }

  // Find all elements with data-product-name inside the basket only
  const productElements = basketContainer.querySelectorAll('[data-product-name]');
  
  console.log(`${TAG} Found ${productElements.length} product elements in basket`);
  
  for (const el of productElements) {
    const name = el.getAttribute('data-product-name');
    if (!name || name.length < 2) continue;

    // Skip duplicates
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Get quantity from data-qty attribute
    let quantity = 1;
    const qtyAttr = el.getAttribute('data-qty');
    
    if (qtyAttr) {
      const val = parseInt(qtyAttr, 10);
      if (val > 0) {
        quantity = val;
      }
    }

    console.log(`${TAG} Product: "${name}" - Quantity: ${quantity}`);
    items.push({ name, quantity });
  }

  console.log(`${TAG} Found ${items.length} unique products in cart`);
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