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

// ---------- Scrape ----------
function scrapeCart() {
  const steppers = findStepperContainers();
  console.log(`${TAG} steppers found:`, steppers.length);

  const items = [];

  for (const stepper of steppers) {
    const quantity = extractQtyFromStepper(stepper);
    if (!quantity) continue;

    const row = climbToItemRow(stepper);
    const name = extractNameFromRow(row, stepper);
    if (!name) continue;

    items.push({ name, quantity });
  }

  // dedup by name
  const map = new Map();
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (!map.has(key)) map.set(key, it);
    else map.set(key, { ...it, quantity: Math.max(map.get(key).quantity, it.quantity) });
  }
  return Array.from(map.values());
}

/**
 * Find the quantity stepper container by structure:
 * A container with 2 clickable controls (buttons/role=button) and a single number between.
 */
function findStepperContainers() {
  const clickables = Array.from(document.querySelectorAll("button,[role='button']"));

  // Candidate container = parent of a clickable, where parent has at least 2 clickables and some number
  const candidates = new Set();

  for (const el of clickables) {
    const p = el.parentElement;
    if (!p) continue;

    const btns = p.querySelectorAll("button,[role='button']");
    if (btns.length < 2) continue;

    const qty = extractQtyFromStepper(p);
    if (!qty) continue;

    candidates.add(p);
  }

  return Array.from(candidates);
}

function extractQtyFromStepper(stepper) {
  // ONLY parse digits from stepper text, not row text
  const t = clean(stepper.textContent);
  const m = t.match(/\b(\d{1,2})\b/); // 1..2 digits is enough for cart qty
  if (!m) return null;
  const q = Number(m[1]);
  if (!Number.isFinite(q) || q <= 0 || q > 99) return null;
  return q;
}

function climbToItemRow(stepper) {
  // Go up until we find a container that likely represents an item:
  // contains an image + some price somewhere nearby
  let node = stepper;
  for (let i = 0; i < 10; i++) {
    if (!node.parentElement) break;
    node = node.parentElement;

    const hasImg = !!node.querySelector("img");
    const hasPrice = /\$\s*\d/.test(clean(node.textContent));
    if (hasImg && hasPrice) return node;
  }
  return node;
}

// Name extraction: local, not global
function extractNameFromRow(row, stepper) {
  if (!row) return null;

  // Search in a smaller region: the row itself is ok, but we prioritize headings
  const heading = row.querySelector("h3,h2,h4");
  if (heading) {
    const h = clean(heading.textContent);
    if (isGoodName(h)) return h;
  }

  // Next best: find the closest text block to the stepper (same row)
  const textEls = Array.from(row.querySelectorAll("a,span,p,div"))
    .map((el) => ({ el, t: clean(el.textContent) }))
    .filter((x) => x.t && x.t.length >= 3 && x.t.length <= 80)
    .filter((x) => isGoodName(x.t));

  if (textEls.length === 0) return null;

  // Pick candidate with smallest distance to stepper in DOM tree
  // Heuristic: prefer elements that are near the stepper in the DOM
  const stepperPath = domPath(stepper);
  let best = null;

  for (const c of textEls) {
    const score = commonPrefixLen(stepperPath, domPath(c.el));
    // higher score = closer ancestry = more local
    if (!best || score > best.score) best = { ...c, score };
  }

  // If still weird, fallback to the longest good name
  if (best?.t) return best.t;

  textEls.sort((a, b) => b.t.length - a.t.length);
  return textEls[0].t || null;
}

// ---------- Filters ----------
const BAD_PHRASES = [
  "for a better browsing experience",
  "an error occurred",
  "specify an option",
  "the tip amount remains",
  "remove product from cart",
  "newsletter",
  "important",
  "delivery pass",
  "substitution",
  "close",
  "metro"
];

function isGoodName(s) {
  if (!s) return false;
  const t = s.toLowerCase();

  if (!/[a-zA-Z]/.test(s)) return false;
  if (/\$\s*\d/.test(s)) return false;
  if (s.length < 3 || s.length > 90) return false;

  if (BAD_PHRASES.some((p) => t.includes(p))) return false;

  // Avoid section headers like "Dairy & Eggs (2)"
  if (t.includes("&") && /\(\d+\)/.test(t)) return false;

  return true;
}

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

// ---------- DOM “closeness” heuristic ----------
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
  // Compare ancestry signature; more shared ancestry = closer in same region
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
  // SPA-safe: re-inject if DOM re-renders
  const obs = new MutationObserver(() => injectButton());
  obs.observe(document.documentElement, { childList: true, subtree: true });
} else {
  console.log(`${TAG} Not /my-cart, doing nothing.`);
}
