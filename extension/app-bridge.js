// /extension/app-bridge.js
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173"
  //"https://app.exampledomain.com"
]);

window.addEventListener("message", (event) => {
  
  if (!ALLOWED_ORIGINS.has(event.origin)) return;

  // 2) Basic shape check
  const data = event.data;
  if (!data || data.type !== "METRO_EXTENSION_SET_TOKEN") return;

  const token = data.token;
  const expiresAt = data.expiresAt; 

  if (typeof token !== "string" || token.length < 20) return;


  chrome.runtime.sendMessage(
    { type: "SET_EXTENSION_TOKEN", token, expiresAt },
    (resp) => {
      // optional: you can console.log success/failure
    }
  );
});
