const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
]);

window.addEventListener("message", (event) => {
  if (!ALLOWED_ORIGINS.has(event.origin)) return;

  const data = event.data;
  if (!data || typeof data.type !== "string") return;

  if (data.type === "METRO_EXTENSION_CLEAR_TOKEN") {
    chrome.runtime.sendMessage({ type: "CLEAR_EXTENSION_TOKEN" });
    return;
  }

  if (data.type !== "METRO_EXTENSION_SET_TOKEN") return;

  const token = data.token;
  const expiresAt = data.expiresAt;

  if (typeof token !== "string" || token.length < 20) return;

  chrome.runtime.sendMessage(
    { type: "SET_EXTENSION_TOKEN", token, expiresAt },
    () => {},
  );
});
