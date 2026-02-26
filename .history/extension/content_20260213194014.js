console.log("[Metro→Fridge] content script running on", location.href);

const EXT_TAG = "[Metro→Fridge]";
const BTN_ID = "metro-fridge-sync-btn";

// ---------- URL / DOM detection ----------
function isCartUrl(url) {
  // Your confirmed cart URL:
  // https://www.metro.ca/en/my-cart
  const u = new URL(url);
  return u.pathname.toLowerCase().includes("my-cart");
}

function waitForCartDom(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const hasQtyControls = () => {
      // Look for at least 1 item-like qty control: "- 2 +"
      return findCartItemContainers().length >= 1;
    };

    if (hasQtyControls()) return resolve(true);

    const obs = new MutationObserver(() => {
      if (hasQtyControls()) {
        obs.disconnect();
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        obs.disconnect();
        reject(new Error("Timed out waiting for cart DOM"));
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      try {
        obs.disconnect();
      } catch {}
      if (hasQtyControls()) resolve(true);
      else reject(new Error("Timed out waiting for cart DOM (timer)"));
    }, timeoutMs);
  });
}

// ---------- Button injection ----------
function injectSyncButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.textContent = "Sync to Fridge";

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

    window.__metroFridgeLastScrape = items;

    console.log(`${EXT_TAG} scraped items:`, items);
    console.log(`${EXT_TAG} scraped count:`, items.length);
    try {
      console.table(items);
    } catch {}

    alert(`Scraped ${items.length} items. Check console.table + window.__metroFridgeLastScrape`);
  });

  document.body.appendChild(btn);
  console.log(`${EXT_TAG} Injected Sync button`);
}

// ---------- Scraping (improved) ----------
function norm(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function hasLetters(s) {
  return /[A-Za-z]/.test(s);
}

function isPriceLike(s) {
  return /\$\s*\d/.test(s);
}

// Things Metro page contains that are NOT products
const BAD_PHRASES = [
  "take our survey",
  "newsletter",
  "important",
  "delivery pass",
  "close",
  "metro",
  "substitution"
];

function isBadCandidateName(s) {
  const t = s.toLowerCase();
  if (!s) return true;
  if (!hasLetters(s)) return true;
  if (s.length < 3) return true;
  if (s.length > 80) return true;
  if (isPriceLike(s)) return true;
  if (BAD_PHRASES.some((p) => t.includes(p))) return true;

  // Avoid generic section headers like "Dairy & Eggs (2)"
  if (/&/.test(s) && /\(\d+\)/.test(s)) return true;

  return false;
}

/**
 * Find containers that look like a cart item by locating the "− qty +" control
 * and returning the closest reasonable parent that represents the item row.
 */
function findCartItemContainers() {
  // Heuristic: find all "-" buttons and pair with a nearby "+" button
  const minusButtons = Array.from(document.querySelectorAll("button"))
    .filter((b) => norm(b.textContent) === "−" || norm(b.textContent) === "-");

  const itemContainers = [];

  for (const minus of minusButtons) {
    // Look within the same parent for a plus button
    const parent = minus.parentElement;
    if (!parent) continue;

    const plus = Array.from(parent.querySelectorAll("button")).find((b) => {
      const t = norm(b.textContent);
      return t === "+" || t === "＋";
    });

    if (!plus) continue;

    // The quantity is often a text node/span between minus and plus
    const qtyText = norm(parent.textContent);
    const qtyMatch = qtyText.match(/\b(\d+)\b/);
    if (!qtyMatch) continue;

    // Now climb up to find the card/row container
    let row = parent;
    for (let i = 0; i < 6; i++) {
      if (!row?.parentElement) break;
      row = row.parentElement;

      // Stop when row looks like a product block:
      // must contain an image OR a price
      const rowText = norm(row.textContent);
      const hasImg = !!row.querySelector("img");
      const hasPrice = isPriceLike(rowText);
      if (hasImg && hasPrice) break;
    }

    if (row) itemContainers.push(row);
  }

  // De-dup by DOM reference
  return Array.from(new Set(itemContainers));
}

/**
 * Extract quantity from the "− qty +" control inside a row.
 */
function extractQuantity(row) {
  // Find a parent that contains minus and plus and a number
  const candidates = Array.from(row.querySelectorAll("button"))
    .filter((b) => {
      const t = norm(b.textContent);
      return t === "−" || t === "-" || t === "+" || t === "＋";
    })
    .map((b) => b.parentElement)
    .filter(Boolean);

  for (const c of candidates) {
    const t = norm(c.textContent);
    const m = t.match(/\b(\d+)\b/);
    if (m) {
      const q = Number(m[1]);
      if (Number.isFinite(q) && q > 0) return q;
    }
  }

  return 1;
}

/**
 * Extract best product name by scoring text candidates inside the row.
 */
function extractBestName(row) {
  // Candidate elements: headings + links + strong-ish blocks
  const els = Array.from(
    row.querySelectorAll("h1,h2,h3,h4,a,span,div,p")
  );

  const texts = els
    .map((el) => norm(el.textContent))
    .filter((t) => t && t.length >= 3 && t.length <= 80);

  // Remove obvious noise early
  const cleaned = texts.filter((t) => !isBadCandidateName(t));

  if (cleaned.length === 0) return null;

  // Score candidates:
  // Prefer names with:
  // - more words (but not huge)
  // - not ALL CAPS (brand lines often all caps)
  // - contains lowercase letters OR mixed case
  // - not containing numbers only
  const scored = cleaned.map((t) => {
    const words = t.split(" ").length;
    const hasLower = /[a-z]/.test(t);
    const allCaps = t === t.toUpperCase() && /[A-Z]/.test(t);
    const hasAmpOrParen = /[&()]/.test(t);

    let score = 0;
    score += Math.min(words, 6) * 3;      // more descriptive names win
    score += hasLower ? 6 : 0;            // mixed case tends to be actual product name
    score += allCaps ? -6 : 0;            // penalize brand
    score += hasAmpOrParen ? -2 : 0;      // section headers often have these

    // mild preference for mid-length strings
    if (t.length >= 8 && t.length <= 55) score += 3;

    return { t, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top candidate
  return scored[0].t;
}

function scrapeCartItems() {
  const rows = findCartItemContainers();
  const items = [];

  for (const row of rows) {
    const name = extractBestName(row);
    if (!name) continue;

    const quantity = extractQuantity(row);

    // Final guard: avoid the stray "Metro" etc
    if (isBadCandidateName(name)) continue;

    items.push({ name, quantity });
  }

  // Dedup by name (case-insensitive), keep highest quantity
  const map = new Map();
  for (const it of items) {
    const key = it.name.toLowerCase();
    const prev = map.get(key);
    if (!prev) map.set(key, it);
    else map.set(key, { ...it, quantity: Math.max(prev.quantity, it.quantity) });
  }

  return Array.from(map.values());
}

// ---------- Main ----------
async function boot() {
  chrome.runtime.sendMessage({ type: "PING" }, (res) => {
    console.log(`${EXT_TAG} background response:`, res);
  });

  if (!isCartUrl(location.href)) {
    console.log(`${EXT_TAG} Not /my-cart, skipping injection.`);
    return;
  }

  console.log(`${EXT_TAG} Cart-like URL detected. Waiting for cart DOM...`);

  try {
    await waitForCartDom(15000);
  } catch (e) {
    console.warn(`${EXT_TAG} Could not confirm cart DOM:`, e);
  }

  injectSyncButton();
}

boot();
