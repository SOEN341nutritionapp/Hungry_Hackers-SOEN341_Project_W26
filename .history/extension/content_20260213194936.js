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

/**
 * Scrape strategy:
 * 1) Try aria-label buttons (common in accessible steppers)
 * 2) If not found, find "stepper groups" by pattern: 2 buttons + a number element between
 */
function scrapeCart() {
  const stepperGroups = findStepperGroups();

  console.log(`${TAG} stepper groups found:`, stepperGroups.length);

  const items = [];
  for (const group of stepperGroups) {
    const { row, quantity } = group;

    const name = extractName(row);
    if (!name) continue;

    items.push({ name, quantity });
  }

  // Dedup
  const map = new Map();
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (!map.has(key)) map.set(key, it);
    else map.set(key, { ...it, quantity: Math.max(map.get(key).quantity, it.quantity) });
  }

  return Array.from(map.values());
}

function findStepperGroups() {
  // --- Path A: aria-label based ---
  const decBtns = Array.from(document.querySelectorAll("button,[role='button']"))
    .filter((el) => {
      const al = (el.getAttribute("aria-label") || "").toLowerCase();
      return al.includes("decrease") || al.includes("minus") || al.includes("diminuer");
    });

  if (decBtns.length > 0) {
    return decBtns
      .map((dec) => {
        const container = dec.parentElement;
        if (!container) return null;

        const inc = Array.from(container.querySelectorAll("button,[role='button']")).find((el) => {
          const al = (el.getAttribute("aria-label") || "").toLowerCase();
          return al.includes("increase") || al.includes("plus") || al.includes("augmenter");
        });

        if (!inc) return null;

        const qty = extractQuantityFromContainer(container);
        if (!qty) return null;

        const row = climbToRow(container);
        return { row, quantity: qty };
      })
      .filter(Boolean);
  }

  // --- Path B: structure based (2 clickable icons + a number somewhere between) ---
  // Look for small clusters that contain 2 clickable elements and a number text node
  const candidates = Array.from(document.querySelectorAll("div,span"))
    .filter((el) => {
      const t = cleanText(el.textContent);
      // Must contain a number, but not a price
      if (!t.match(/\b\d+\b/)) return false;
      if (t.match(/\$\s*\d/)) return false;

      // Must have at least 2 "clickable" children (buttons or role=button)
      const clickables = el.querySelectorAll("button,[role='button']");
      if (clickables.length < 2) return false;

      return true;
    });

  // Convert to groups
  const groups = [];
  for (const c of candidates) {
    const qty = extractQuantityFromContainer(c);
    if (!qty) continue;

    const row = climbToRow(c);
    groups.push({ row, quantity: qty });
  }

  // Remove obvious duplicates (same row)
  const seen = new Set();
  return groups.filter((g) => {
    const key = g.row;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractQuantityFromContainer(container) {
  // Find the most "standalone" number inside container
  // Prefer exact text nodes that are just digits
  const all = Array.from(container.querySelectorAll("*"))
    .map((el) => cleanText(el.textContent))
    .filter(Boolean);

  // Also include container's own text split
  const text = cleanText(container.textContent);
  const tokens = text.split(" ");

  const numbers = [];

  for (const t of tokens) {
    if (/^\d+$/.test(t)) numbers.push(Number(t));
  }
  if (numbers.length === 0) return null;

  // Quantity is usually small (1..99). Pick smallest plausible >0
  const plausible = numbers.filter((n) => Number.isFinite(n) && n > 0 && n < 100);
  if (plausible.length === 0) return null;

  return plausible[0];
}

function climbToRow(startEl) {
  let row = startEl;
  for (let i = 0; i < 8; i++) {
    if (!row.parentElement) break;
    row = row.parentElement;

    // Stop when it looks like a product line: has an image and a price somewhere
    const hasImg = !!row.querySelector("img");
    const hasPrice = /\$\s*\d/.test(cleanText(row.textContent));
    if (hasImg && hasPrice) break;
  }
  return row;
}

function extractName(row) {
  if (!row) return null;

  // Prefer h3/h2 first
  const h = row.querySelector("h3,h2,h4");
  const candidates = [];

  if (h) candidates.push(cleanText(h.textContent));

  // Collect text elements
  for (const el of Array.from(row.querySelectorAll("a,span,p,div"))) {
    const t = cleanText(el.textContent);
    if (t) candidates.push(t);
  }

  // Filter noise + pick best
  const good = candidates
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(isLikelyProductName);

  good.sort((a, b) => b.length - a.length);

  return good[0] || null;
}

function cleanText(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function isLikelyProductName(s) {
  if (!s) return false;
  const t = s.toLowerCase();

  // kill junk
  const bad = [
    "metro",
    "newsletter",
    "important",
    "delivery pass",
    "take our survey",
    "substitution",
    "close"
  ];
  if (bad.some((x) => t.includes(x))) return false;

  // avoid prices / totals
  if (/\$\s*\d/.test(s)) return false;

  // must contain letters
  if (!/[a-zA-Z]/.test(s)) return false;

  // reasonable length
  if (s.length < 3 || s.length > 90) return false;

  // avoid section headers like "Dairy & Eggs (2)"
  if (/\(\d+\)/.test(s) && s.includes("&")) return false;

  return true;
}

// Boot
if (isMyCartPage()) {
  injectButton();
  const obs = new MutationObserver(() => injectButton());
  obs.observe(document.documentElement, { childList: true, subtree: true });
} else {
  console.log(`${TAG} Not /my-cart, doing nothing.`);
}
