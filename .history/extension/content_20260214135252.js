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

    // Get quantity - look for the number displayed in the stepper between - and + buttons
    let quantity = 1;
    
    // Find the stepper container and get the displayed number
    const stepperButtons = el.querySelectorAll('button');
    if (stepperButtons.length >= 2) {
      // The quantity is usually displayed between the - and + buttons
      for (let i = 0; i < stepperButtons.length - 1; i++) {
        const btnText = stepperButtons[i].textContent.trim();
        const nextBtnText = stepperButtons[i + 1].textContent.trim();
        
        // Look for text between buttons that contains a number
        let current = stepperButtons[i].nextSibling;
        while (current && current !== stepperButtons[i + 1]) {
          if (current.nodeType === Node.TEXT_NODE || current.nodeType === Node.ELEMENT_NODE) {
            const text = current.textContent?.trim();
            if (text && /^\d+$/.test(text)) {
              const val = parseInt(text, 10);
              if (val > 0) {
                quantity = val;
                break;
              }
            }
          }
          current = current.nextSibling;
        }
        if (quantity > 1) break;
      }
    }

    // Fallback: try data-cart-entry
    if (quantity === 1) {
      const cartEntry = el.getAttribute('data-cart-entry');
      if (cartEntry) {
        try {
          const parsed = JSON.parse(cartEntry);
          if (parsed && typeof parsed.quantity === 'number' && parsed.quantity > 0) {
            quantity = parsed.quantity;
          }
        } catch (e) {
          // Silent fail
        }
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