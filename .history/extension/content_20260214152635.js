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

  const basketContainer = document.querySelector(".basket-product-tiles");
  if (!basketContainer) {
    console.error(`${TAG} Could not find .basket-product-tiles container`);
    return items;
  }

  // Each product tile seems to have "pt__content-wrap" blocks.
  // We'll iterate tiles instead of random nodes.
  const tiles = Array.from(basketContainer.querySelectorAll(".pt__content-wrap"));

  console.log(`${TAG} Found ${tiles.length} tiles in basket`);

  for (const tile of tiles) {
    // ---- NAME ----
    const nameEl = tile.querySelector(".head__title");
    const name = (nameEl?.textContent || "").trim();
    if (!name || name.length < 2) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    // ---- QTY ----
    const quantity = extractQuantityFromTile(tile) ?? 1;

    // ---- UNIT DETAILS (grams etc.) ----
    const unitDetails = extractUnitDetails(tile);

    items.push({
      name,
      quantity,
      ...unitDetails // unitFactor, unit, unitQualifier
    });

    seen.add(key);
  }

  console.log(`${TAG} Found ${items.length} unique products in cart`);
  return items;
}

// --- quantity: keep it minimal (stepper number inside this tile only) ---
function extractQuantityFromTile(tile) {
  if (!tile) return 1;

  // If Metro exposes [data-qty] somewhere inside tile, use it
  const qtyNode = tile.querySelector("[data-qty]");
  if (qtyNode) {
    const q = parseInt(qtyNode.getAttribute("data-qty"), 10);
    if (Number.isFinite(q) && q > 0 && q < 100) return q;
  }

  // Otherwise parse from the quantity stepper text in this tile
  // Find a small container with 2 buttons and one small number
  const candidates = Array.from(tile.querySelectorAll("div,span")).filter((el) => {
    const btns = el.querySelectorAll("button,[role='button']");
    if (btns.length < 2) return false;
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    return /\b\d{1,2}\b/.test(t);
  });

  for (const c of candidates) {
    const t = (c.textContent || "").replace(/\s+/g, " ").trim();
    const m = t.match(/\b(\d{1,2})\b/);
    if (m) {
      const q = Number(m[1]);
      if (Number.isFinite(q) && q > 0 && q < 100) return q;
    }
  }

  return 1;
}

// --- unit details: reads head__unit-details block like "(190 g avg.)" ---
function extractUnitDetails(tile) {
  const detailsEl = tile.querySelector(".head__unit-details");
  if (!detailsEl) return {};

  // Example structure:
  // <span class="head__unit-details">(
  //    <span class="unit-factor">190</span>
  //    &nbsp;g&nbsp;
  //    <abbr title="average">avg.</abbr>
  // )</span>

  const unitFactorEl = detailsEl.querySelector(".unit-factor");
  const unitFactor = unitFactorEl ? parseInt(unitFactorEl.textContent.trim(), 10) : null;

  // Extract remaining text around it, e.g. "g avg."
  const raw = detailsEl.textContent.replace(/\s+/g, " ").trim(); // "(190 g avg.)"
  // Pull out unit: g, kg, ml, l, etc.
  const unitMatch = raw.match(/\b(g|kg|ml|l|lb|oz)\b/i);
  const unit = unitMatch ? unitMatch[1].toLowerCase() : null;

  // Qualifier from abbr if present (avg., ea., etc.)
  const abbr = detailsEl.querySelector("abbr");
  const unitQualifier = abbr ? abbr.textContent.trim() : null;

  const out = {};
  if (Number.isFinite(unitFactor) && unitFactor > 0) out.unitFactor = unitFactor;
  if (unit) out.unit = unit;
  if (unitQualifier) out.unitQualifier = unitQualifier;

  return out;
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