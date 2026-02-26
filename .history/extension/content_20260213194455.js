console.log("[Metro→Fridge] content script running on", location.href);

const TAG = "[Metro→Fridge]";
const BTN_ID = "metro-fridge-sync-btn";

// 1) Only run on Metro cart URL you confirmed
function isMyCartPage() {
  return location.pathname.toLowerCase().includes("/my-cart");
}

// 2) Inject button immediately (no timeout logic)
function injectButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.textContent = "SYNC TO FRIDGE";

  // Very visible styling
  btn.style.position = "fixed";
  btn.style.top = "18px";
  btn.style.right = "18px";
  btn.style.zIndex = "2147483647";
  btn.style.padding = "16px 20px";
  btn.style.borderRadius = "14px";
  btn.style.border = "3px solid #000";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "900";
  btn.style.fontSize = "16px";
  btn.style.letterSpacing = "0.5px";
  btn.style.background = "#00FF7F"; // neon green
  btn.style.color = "#000";
  btn.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  btn.style.textTransform = "uppercase";

  // Hover feedback
  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.03)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)";
  });

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

// 3) Minimal scraper using the qty control: "− 2 +"
function scrapeCart() {
  // Find all buttons, locate "-" and then read sibling number and "+" in same parent
  const buttons = Array.from(document.querySelectorAll("button"));

  const minusButtons = buttons.filter((b) => {
    const t = (b.textContent || "").trim();
    return t === "−" || t === "-";
  });

  const items = [];

  for (const minus of minusButtons) {
    const control = minus.parentElement;
    if (!control) continue;

    // must have a "+" button nearby
    const plus = Array.from(control.querySelectorAll("button")).find((b) => {
      const t = (b.textContent || "").trim();
      return t === "+" || t === "＋";
    });
    if (!plus) continue;

    // extract quantity from the control text
    const qtyMatch = (control.textContent || "").match(/\b(\d+)\b/);
    if (!qtyMatch) continue;
    const quantity = Number(qtyMatch[1]);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    // climb up a few levels to get the product row container
    let row = control;
    for (let i = 0; i < 6; i++) {
      if (!row.parentElement) break;
      row = row.parentElement;

      // stop early if we hit something that likely contains the item
      // (a row usually has an image + text)
      if (row.querySelector("img")) break;
    }

    // pick best name: choose the longest "clean" line of text inside row (h3/h2 first)
    const name = extractName(row);
    if (!name) continue;

    items.push({ name, quantity });
  }

  // Deduplicate by name
  const map = new Map();
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (!map.has(key)) map.set(key, it);
    else map.set(key, { ...it, quantity: Math.max(map.get(key).quantity, it.quantity) });
  }

  return Array.from(map.values());
}

// 4) Name extraction: minimal + practical
function extractName(row) {
  if (!row) return null;

  // Prefer headings first
  const heading =
    row.querySelector("h3") ||
    row.querySelector("h2") ||
    row.querySelector("h4");

  const candidates = [];
  if (heading) candidates.push(cleanText(heading.textContent));

  // Add other text blocks
  const textEls = Array.from(row.querySelectorAll("a, span, p, div"));
  for (const el of textEls) {
    const t = cleanText(el.textContent);
    if (t) candidates.push(t);
  }

  // Filter noise
  const filtered = candidates.filter(isLikelyProductName);

  // Choose the “best” candidate: longest reasonable string
  filtered.sort((a, b) => b.length - a.length);

  return filtered[0] || null;
}

function cleanText(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function isLikelyProductName(s) {
  if (!s) return false;
  const t = s.toLowerCase();

  // Exclude obvious junk
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

  // Exclude prices and very short strings
  if (/\$\s*\d/.test(s)) return false;
  if (s.length < 3) return false;
  if (s.length > 90) return false;

  // must contain letters
  if (!/[a-zA-Z]/.test(s)) return false;

  return true;
}

// 5) Boot
if (isMyCartPage()) {
  injectButton();

  // Also re-inject if Metro re-renders the body (SPA)
  const obs = new MutationObserver(() => injectButton());
  obs.observe(document.documentElement, { childList: true, subtree: true });
} else {
  console.log(`${TAG} Not /my-cart, doing nothing.`);
}
