const state = new Map();

async function enable(tabId) {
    await chrome.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ["dark.css"]
    });
    state.set(tabId, true);
}

async function disable(tabId) {
    await chrome.scripting.removeCSS({
        target: { tabId, allFrames: true },
        files: ["dark.css"]
    });
    state.set(tabId, false);
}

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    const isOn = state.get(tab.id) === true;
    if (isOn) await disable(tab.id);
    else await enable(tab.id);
});

chrome.tabs.onRemoved.addListener((tabId) => state.delete(tabId));