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

  // Very visible
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

// ---------- SCRAPER (anchored on product images) ----------
function scrapeCart() {
  // 1) Find likely product images (cart thumbnails)
  const imgs = Array.from(document.querySelectorAll("img"))
    .filter(img => {
      const src = (img.getAttribute("src") || "").toLowerCase();
      const alt = (img.getAttribute("alt") || "").trim();
      // cart product thumbs usually have a real src and not tiny icons
      if (!src || src.startsWith("data:")) return false;
      if (img.naturalWidth && img.naturalWidth < 40) return false;
      if (img.naturalHeight && img.naturalHeight < 40) return false;
      // alt often exists for product images, but not always; keep it soft
      return true;
    });

  // 2) For each image, climb to a row that contains a price ($)
  const rows = [];
  for (const img of imgs) {
    const row = climbToPriceRow(img);
    if (row) rows.push({ row, img });
  }

  // Dedup rows
  const unique = [];
  const seen = new Set();
  for (const x of rows) {
    if (seen.has(x.row)) continue;
    // Only accept rows that look like a product line (name + qty likely exist)
    if (!/\$\s*\d/.test(clean(x.row.textContent))) continue;
    seen.add(x.row);
    unique.push(x);
  }

  // 3) Extract name + qty for each row
  const items = [];
  for (const { row, img } of unique) {
    const name = extractNameFromRow(row);
    if (!name) continue;

    const qty = extractQtyNearImage(row, img) ?? 1;
    items.push({ name, quantity: qty });
  }

  // 4) Filter junk and dedup by name
  const filtered = items.filter(it => isGoodName(it.name));

  const map = new Map();
  for (const it of filtered) {
    const key = it.name.toLowerCase();
    if (!map.has(key)) map.set(key, it);
    else map.set(key, { ...it, quantity: Math.max(map.get(key).quantity, it.quantity) });
  }

  return Array.from(map.values());
}

function climbToPriceRow(startEl) {
  let node = startEl;
  for (let i = 0; i < 10; i++) {
    if (!node || !node.parentElement) break;
    node = node.parentElement;

    const t = clean(node.textContent);
    const hasPrice = /\$\s*\d/.test(t);
    const hasAnotherImg = !!node.querySelector("img");
    if (hasPrice && hasAnotherImg) return node;
  }
  return null;
}

function extractNameFromRow(row) {
  // 1) Prefer headings
  const h = row.querySelector("h3,h2,h4");
  if (h) {
    const name = clean(h.textContent);
    if (isGoodName(name)) return name;
  }

  // 2) Look for product-specific links (common in e-commerce)
  const productLinks = Array.from(row.querySelectorAll("a[href*='/product/'], a[href*='/item/'], a[href*='/p/']"))
    .map(el => clean(el.textContent))
    .filter(s => s && s.length > 0)
    .filter(isGoodName);
  
  if (productLinks.length > 0) {
    productLinks.sort((a, b) => b.length - a.length);
    return productLinks[0];
  }

  // 3) Otherwise: choose best text chunk that is NOT price and looks like product name
  const candidates = Array.from(row.querySelectorAll("a,span,p,div"))
    .map(el => clean(el.textContent))
    .filter(Boolean)
    .filter(s => s.length >= 3 && s.length <= 90)
    .filter(s => !/\$\s*\d/.test(s))
    // EARLY FILTER: reject obvious UI text before scoring
    .filter(s => {
      const lower = s.toLowerCase();
      // Quick reject common UI patterns
      if (lower.startsWith('for a ')) return false;
      if (lower.startsWith('the ')) return false;
      if (lower.startsWith('specify ')) return false;
      if (lower.includes('experience')) return false;
      if (lower.includes('shipping')) return false;
      if (lower.includes('activated')) return false;
      if (lower.includes('could not')) return false;
      if (s.endsWith('...')) return false;
      if (s.startsWith("'") || s.startsWith('"')) return false;
      return true;
    })
    .filter(isGoodName)
    // Prioritize text with measurements or food-related keywords
    .map(s => ({
      text: s,
      score: (
        (/\d+\s*(g|ml|kg|l|oz|lb|pack|count|ct)\b/i.test(s) ? 100 : 0) +
        (/cheese|sauce|banana|orange|bread|milk|yogurt|chicken|beef|pasta|rice|blend|tacos|nachos|cheddar|shredded/i.test(s) ? 50 : 0) +
        (s.length < 50 ? 20 : 0) + // shorter is better for product names
        s.length
      )
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.text || null;
}

function extractQtyNearImage(row, img) {
  // Look for a stepper in the row by finding a parent that contains 2 clickables and a standalone number
  const clickables = Array.from(row.querySelectorAll("button,[role='button']"));
  if (clickables.length === 0) return null;

  // Prefer containers close to the image (same local area)
  const containers = new Set();
  for (const c of clickables) {
    if (c.parentElement) containers.add(c.parentElement);
  }

  let best = null;

  for (const container of containers) {
    const btnCount = container.querySelectorAll("button,[role='button']").length;
    if (btnCount < 2) continue;

    // Quantity must be a standalone small integer in THIS container text
    const t = clean(container.textContent);
    const m = t.match(/\b(\d{1,2})\b/);
    if (!m) continue;

    const q = Number(m[1]);
    if (!Number.isFinite(q) || q <= 0 || q > 99) continue;

    // Score by DOM proximity to product image (more shared ancestry = closer)
    const score = commonPrefixLen(domPath(img), domPath(container));
    if (!best || score > best.score) best = { q, score };
  }

  return best?.q ?? null;
}

// ---------- Filters / utils ----------
const BAD_PHRASES = [
  "skip to content",
  "your time slot",
  "reserved",
  "savings",
  "enroll",
  "my cart",
  "product is in the cart",
  "decrease quantity",
  "increase quantity",
  "trigger",
  "you may also be interested",
  "important",
  "newsletter",
  "delivery pass",
  "substitution",
  "metro",
  "close",
  "error occurred",
  // Additional UI messages from screenshots
  "for a better browsing",
  "specify an option",
  "free shipping",
  "activated",
  "tip amount",
  "remains unchanged",
  "could not be deleted",
  "browsing experience",
  "add the product",
  "immediately activated",
  "irrésistible",
  "the item could",
  "experience, th"
];

const BAD_PATTERNS = [
  /^the /i,                      // "The tip amount...", "The item could not..."
  /experience/i,                 // browsing experience messages
  /specify.*option/i,            // "Specify an option to add..."
  /shipping/i,                   // shipping notifications
  /deleted?/i,                   // deletion messages
  /unchanged/i,                  // status messages
  /activated?/i,                 // activation messages
  /tip\s+amount/i,              // tip-related UI
  /for\s+a\s+better/i,          // "For a better..."
  /could\s+not\s+be/i,          // error messages
  /immediately\s+activated/i,   // notification messages
  /\.\.\.\s*$/,                 // truncated text ending with ...
  /^['"]/,                      // starts with quote (likely truncated)
  /irrésistible/i,              // brand names that appear in UI
  /adobo/i,                     // specific UI text patterns
  /chipotle/i,                  // these appear to be in banners
  /^for\s+/i,                   // "For a..." messages
  /browsing/i                   // any browsing-related text
];

function isGoodName(s) {
  if (!s) return false;
  const t = s.toLowerCase();

  // Must contain letters
  if (!/[a-zA-Z]/.test(s)) return false;
  
  // Can't contain prices
  if (/\$\s*\d/.test(s)) return false;
  
  // Length check
  if (s.length < 3 || s.length > 90) return false;

  // Reject truncated text (ends with ...)
  if (s.endsWith('...')) return false;
  
  // Reject text starting with quotes (usually truncated)
  if (s.startsWith("'") || s.startsWith('"')) return false;

  // Check bad phrases
  if (BAD_PHRASES.some(p => t.includes(p))) return false;

  // Check bad patterns
  if (BAD_PATTERNS.some(pattern => pattern.test(s))) return false;

  // Avoid section headers like "Dairy & Eggs (2)"
  if (t.includes("&") && /\(\d+\)/.test(t)) return false;

  // Product names usually have numbers (weights/counts) or are shorter
  // If it's a long sentence without these, it's likely UI text
  if (s.length > 40 && !/\d+\s*(g|ml|kg|l|oz|lb|pack|count|ct|%)/i.test(s)) {
    // Long text without measurements = probably not a product
    return false;
  }

  // Reject full sentences (UI messages tend to be complete sentences)
  if (/^[A-Z][^.!?]*[.!?]\s*$/.test(s)) return false;

  // Reject text that looks like instructions or prompts
  if (/^(please|click|select|choose|add|remove|update)/i.test(s)) return false;

  return true;
}

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function domPath(el) {
  const path = [];
  let cur = el;
  for (let i = 0; i < 25 && cur; i++) {
    path.push(cur.tagName);
    cur = cur.parentElement;
  }
  return path;
}

function commonPrefixLen(a, b) {
  let n = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) break;
    n++;
  }
  return n;
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