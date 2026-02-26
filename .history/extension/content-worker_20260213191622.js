// MV3 service worker (background)
console.log("[Metro→Fridge] service worker loaded");

// Useful later: listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true, from: "service-worker" });
  }
});
