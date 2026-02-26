console.log("[Metro→Fridge] content script running on", location.href);

// Basic smoke test: ping background
chrome.runtime.sendMessage({ type: "PING" }, (res) => {
  console.log("[Metro→Fridge] background response:", res);
});

// (Later) We'll inject "injected.js" to access page context if needed.
// For now, just verify content script loads.
