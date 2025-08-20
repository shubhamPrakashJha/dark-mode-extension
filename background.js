const mem = new Map();

async function getOn(tabId) {
    if (mem.has(tabId)) return mem.get(tabId);
    const key = String(tabId);
    const data = await chrome.storage.session.get(key);
    return data[key] === true;
}

async function setOn(tabId, on) {
    mem.set(tabId, on);
    await chrome.storage.session.set({ [String(tabId)]: on });
}

async function setBadge(tabId, on) {
    await chrome.action.setBadgeText({ tabId, text: on ? "ON" : "" });
    if (on) await chrome.action.setBadgeBackgroundColor({ tabId, color: "#222" });
}

async function enable(tabId) {
    await chrome.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ["dark.css"]
    });
    await setOn(tabId, true);
    await setBadge(tabId, true);
}

async function disable(tabId) {
    try {
        await chrome.scripting.removeCSS({
            target: { tabId, allFrames: true },
            files: ["dark.css"]
        });
    } catch (e) {
        console.debug("removeCSS ignored:", e?.message || e);
    }
    await setOn(tabId, false);
    await setBadge(tabId, false);
}

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    const isOn = await getOn(tab.id);
    if (isOn) await disable(tab.id);
    else await enable(tab.id);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (info.status !== "complete") return;
    if (await getOn(tabId)) {
        await chrome.scripting.insertCSS({
            target: { tabId, allFrames: true },
            files: ["dark.css"]
        });
        await setBadge(tabId, true);
    }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    mem.delete(tabId);
    await chrome.storage.session.remove(String(tabId));
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "toggle-dark-mode") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    const isOn = await getOn(tab.id);
    if (isOn) await disable(tab.id);
    else await enable(tab.id);
});