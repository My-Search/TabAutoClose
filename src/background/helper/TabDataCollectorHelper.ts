console.log("this is TabDataCollectorHelper.ts");

interface TabInfo {
    type: string;
    isOnCloseTis: boolean;
    focusInputCount: number,
    inputFocusCount: number,
    maxScrollPage: number;
}

// 存储每个 tab 的信息
const tabInfoMap = new Map<number, TabInfo>();

// 监听 content.js 发来的消息
chrome.runtime.onMessage.addListener((message: TabInfo, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    if (tabId === undefined || message.type !== "TAB_INDICATOR") return false;

    console.log("bg.js收到来自content.js的消息，message=", message, "tabId=", tabId);
    tabInfoMap.set(tabId, message);

    return true;
});

/**
 * 监听标签关闭事件，清理 tabInfoMap
 */
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabInfoMap.has(tabId)) {
        console.log(`TabDataCollectorHelper: 标签 ${tabId} 被关闭，清理其信息`);
        tabInfoMap.delete(tabId);
    }
});

/**
 * 判断标签是否可以关闭
 * @param tabId
 * @returns true 表示标签不能关闭
 */
export function isCannotClose(tabId: number): boolean {
    const info = tabInfoMap.get(tabId);
    if (!info) return false;
    return info.isOnCloseTis || ( info.focusInputCount > 1 || info.inputFocusCount > 2 ) || info.maxScrollPage > 10;
}
