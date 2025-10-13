
import { closeTimerOperator, debounceRefreshState } from '@/background/helper/TabHelper'
import '@/background/controller'


// 触发刷新（refreshState）的一系列方式
debounceRefreshState();
chrome.tabs.onActivated.addListener(() => debounceRefreshState()); // tab切换
chrome.windows.onFocusChanged.addListener(() => debounceRefreshState()); // window切换
chrome.tabs.onCreated.addListener(() => debounceRefreshState()); // tab创建
// 监听标签关闭-维护tabIdTabObj
chrome.tabs.onRemoved.addListener((tabId, removeInfo) =>
  closeTimerOperator.cancelTimer(tabId)
);
// 监听选项卡位置改变事件
chrome.tabs.onMoved.addListener((tabId, moveInfo) => debounceRefreshState());
// 标签加载完成
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") debounceRefreshState();
});
