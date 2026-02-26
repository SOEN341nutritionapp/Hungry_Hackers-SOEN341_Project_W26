// /extension/service-worker.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === "SET_EXTENSION_TOKEN") {
    const { token, expiresAt } = msg;

    chrome.storage.local.set(
      {
        metroExtensionToken: token,
        metroExtensionTokenExpiresAt: expiresAt || null
      },
      () => {
        sendResponse({ ok: true });
      }
    );
    return true; // async response
  }

  if (msg?.type === "GET_EXTENSION_TOKEN") {
    chrome.storage.local.get(
      ["metroExtensionToken", "metroExtensionTokenExpiresAt"],
      (data) => {
        sendResponse({
          ok: true,
          token: data.metroExtensionToken || null,
          expiresAt: data.metroExtensionTokenExpiresAt || null
        });
      }
    );
    return true;
  }
});
