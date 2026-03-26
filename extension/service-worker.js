chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  void sender;

  if (msg?.type === "PING") {
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === "SET_EXTENSION_TOKEN") {
    const { token, expiresAt } = msg;

    chrome.storage.local.set(
      {
        metroExtensionToken: token,
        metroExtensionTokenExpiresAt: expiresAt || null,
      },
      () => {
        sendResponse({ ok: true });
      },
    );
    return true;
  }

  if (msg?.type === "CLEAR_EXTENSION_TOKEN") {
    chrome.storage.local.remove(
      ["metroExtensionToken", "metroExtensionTokenExpiresAt"],
      () => {
        sendResponse({ ok: true });
      },
    );
    return true;
  }

  if (msg?.type === "GET_EXTENSION_TOKEN") {
    chrome.storage.local.get(
      ["metroExtensionToken", "metroExtensionTokenExpiresAt"],
      (data) => {
        sendResponse({
          ok: true,
          token: data.metroExtensionToken || null,
          expiresAt: data.metroExtensionTokenExpiresAt || null,
        });
      },
    );
    return true;
  }

  if (msg?.type === "SYNC_METRO_ITEMS") {
    chrome.storage.local.get(["metroExtensionToken"], async (data) => {
      const token = data.metroExtensionToken;

      if (!token) {
        sendResponse({
          ok: false,
          error: "Login to MealMajor in the web app first so the extension can identify your account.",
        });
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/metro/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: Array.isArray(msg.items) ? msg.items : [],
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          sendResponse({
            ok: false,
            error: payload?.message || "Sync request failed",
          });
          return;
        }

        sendResponse(payload);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Sync request failed",
        });
      }
    });

    return true;
  }
});
