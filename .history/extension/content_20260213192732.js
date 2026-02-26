console.log("[Metro→Fridge] content script running on", location.href);

// ---------- Helpers ----------
const EXT_TAG = "[Metro→Fridge]";
const BTN_ID = "metro-fridge-sync-btn";

function isProbablyCartUrl(url) {
  const u = new URL(url);
  // Heuristics: adjust later once you confirm Metro's exact cart URL
  return (
    u.pathname.toLowerCase().includes("cart") ||
    u.pathname.toLowerCase().includes("panier") ||
    u.pathname.toLowerCase().includes("checkout") ||
    u.href.toLowerCase().includes("shopping-cart")
  );
}

function waitForCartDom(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const hasCartRows = () => {
      // Try a few common patterns. We'll tighten selectors once we inspect Metro’s DOM.
      const possibleRows = document.querySelectorAll(
        [
          // generic "cart item" patterns
          "[data-testid*='cart'] [data-testid*='item']",
          "[data-testid*='basket'] [data-testid*='item']",
          "[class*='cart'] [class*='item']",
          "[class*='basket'] [class*='item']",

          // fallback: any repeated product title elements
          "[data-testid*='product']",
          "[class*='product'] [class*='title']",
          "[class*='product'] h3",
          "h3"
        ].join(",")
      );

      return possibleRows && possibleRows.length >= 2; // avoid matching random single h3
    };

    if (hasCartRows()) return resolve(true);

    const obs = new MutationObserver(() => {
      if (hasCartRows()) {
        obs.disconnect();
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        obs.disconnect();
        reject(new Error("Timed out waiting for cart DOM"));
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    // Also timeout even if no mutations happen
    setTimeout(() => {
      try {
        obs.disconnect();
      } catch {}
      if (hasCartRows()) resolve(true);
      else reject(new Error("Timed out waiting for cart DOM (timer)"));
    }, timeoutMs);
  });
}

function injectSyncButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.textContent = "Sync to Fridge";

  // Minimal styling so you can see it clearly
  btn.style.position = "fixed";
  btn.style.bottom = "24px";
  btn.style.right = "24px";
  btn.style.zIndex = "999999";
  btn.style.padding = "12px 16px";
  btn.style.borderRadius = "12px";
  btn.style.border = "0";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "700";
  btn.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
  btn.style.background = "#111";
  btn.style.color = "#fff";

  btn.addEventListener("click", () => {
    console.log(`${EXT_TAG} Sync clicked. Scraping cart...`);
    const items = scrapeCartItems();
    console.log(`${EXT_TAG} scraped items:`, items);
    // Later: send to backend + trigger RAG normalization
  });

  document.body.appendChild(btn);
  console.log(`${EXT_TAG} Injected Sync button`);
}

// ---------- Scraper (v0: best-effort, selector-fallback) ----------
function text(el) {
  return (el?.textContent || "").trim();
}

function parseQuantityFromText(s) {
  // Examples this tries to handle: "Qty 2", "Quantity: 1", "2", "x2"
  const m =
    s.match(/qty\s*[:]?(\s*\d+)/i) ||
    s.match(/quantity\s*[:]?(\s*\d+)/i) ||
    s.match(/x\s*(\d+)/i) ||
    s.match(/\b(\d+)\b/);
  if (!m) return null;
  const n = Number(String(m[1] ?? m[0]).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function scrapeCartItems() {
  // Strategy:
  // 1) Find candidate "rows" that repeat (cart items)
  // 2) For each row, try to find name + quantity using fallbacks

  const rowSelectors = [
    "[data-testid*='cart'] [data-testid*='item']",
    "[data-testid*='basket'] [data-testid*='item']",
    "[class*='cart'] [class*='item']",
    "[class*='basket'] [class*='item']"
  ];

  let rows = [];
  for (const sel of rowSelectors) {
    const found = Array.from(document.querySelectorAll(sel));
    if (found.length >= 2) {
      rows = found;
      break;
    }
  }

  // Fallback: if we can't find rows, attempt to interpret product cards
  if (rows.length < 2) {
    rows = Array.from(document.querySelectorAll("[class*='product'], [data-testid*='product']"));
  }

  const items = [];
  for (const row of rows) {
    // Name candidates
    const nameEl =
      row.querySelector("[data-testid*='name']") ||
      row.querySelector("[class*='name']") ||
      row.querySelector("[class*='title']") ||
      row.querySelector("h3") ||
      row.querySelector("h2");

    const name = text(nameEl);

    // Quantity candidates (often buttons / inputs / labels)
    const qtyEl =
      row.querySelector("input[type='number']") ||
      row.querySelector("input[aria-label*='qty' i]") ||
      row.querySelector("input[aria-label*='quantity' i]") ||
      row.querySelector("[data-testid*='qty']") ||
      row.querySelector("[class*='qty']") ||
      row.querySelector("[class*='quantity']");

    let qty = null;
    if (qtyEl) {
      const v = qtyEl.value ?? qtyEl.getAttribute("value") ?? text(qtyEl);
      qty = parseQuantityFromText(String(v));
    }

    // If qty still null, try to find nearby “qty” text
    if (qty == null) {
      const possibleText = text(row);
      // This is noisy, but works for early debugging
      qty = parseQuantityFromText(possibleText);
    }

    // Only include if it looks like a real product name (avoid empty/short junk)
    if (name && name.length >= 3) {
      items.push({
        name,
        quantity: qty ?? 1
      });
    }
  }

  // De-dup by name (early roughness)
  const dedup = [];
  const seen = new Set();
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(it);
  }

  return dedup;
}

// ---------- Main ----------
async function boot() {
  // Quick ping to background (still useful)
  chrome.runtime.sendMessage({ type: "PING" }, (res) => {
    console.log(`${EXT_TAG} background response:`, res);
  });

  const url = location.href;

  if (!isProbablyCartUrl(url)) {
    console.log(`${EXT_TAG} Not a cart-like URL, skipping injection.`);
    return;
  }

  console.log(`${EXT_TAG} Cart-like URL detected. Waiting for cart DOM...`);

  try {
    await waitForCartDom(15000);
    injectSyncButton();
  } catch (e) {
    console.warn(`${EXT_TAG} Could not confirm cart DOM:`, e);
    // Still inject button so you can click and debug selectors manually
    injectSyncButton();
  }
}

boot();
