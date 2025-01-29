/// <reference types="chrome" />
/// <reference types="node" />

import { debounce } from "@/utils/utils";
import $store from "@/store/index";
import { register } from "./BGServiceFun";
import "./dataMigration";

// chrome.runtime.onInstalled.addListener(async (details) => {
//   if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
//     // fiset install open welcome(当扩展首次安装打开欢迎页面)
//     chrome.tabs.create({
//       url: "src/pages/welcome/index.html",
//     });
//   } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
//     // chrome version  update
//   }
//   // uninstall open page
//   chrome.runtime.setUninstallURL("https://google.com/");
// });

// 传入tab通过ruleList过滤返回过滤后的ruleList
function matchUrlPromise(
  tabList: chrome.tabs.Tab[],
  onTabMismatchedSuccessfully: (tab: chrome.tabs.Tab) => void
): Promise<chrome.tabs.Tab[]> {
  return new Promise(async (resolve, reject) => {
    const config = await $store.common.rules();
    // 使用规则匹配
    tabList = tabList.filter((tab) => {
      for (let rule of config) {
        if (tab.url && RegExp(rule).test(tab.url)) return true;
      }
      if (onTabMismatchedSuccessfully != null) onTabMismatchedSuccessfully(tab);
      return false;
    });
    resolve(tabList);
  });
}

let closeTimerOperator = {
  timers: {} as { [key: number]: NodeJS.Timeout },
  sessionCloseHistory: [] as chrome.tabs.Tab[],
  addSessionCloseHistory(tab: chrome.tabs.Tab) {
    this.sessionCloseHistory.push(tab);
    chrome.action.setBadgeText({
      text: `${this.sessionCloseHistory.length}`,
    });
    chrome.action.setBadgeBackgroundColor({ color: "#259646" });
    chrome.action.setBadgeTextColor({ color: "#F0F0F0" });
  },
  getSessionCloseHistory() {
    return this.sessionCloseHistory;
  },
  async getCloseDelayed() {
    return await $store.common.getDelayed();
  },
  // 添加定时器
  async upsertTimer(tabId: number) {
    // alert("添加定时器id="+tabId)
    if (this.timers[tabId] != null) return; // 如果已经存在定时器，忽略
    let waitTime = await this.getCloseDelayed();
    let that = this;
    // 向tab title设置剩余时间
    function setRemainder(time: number) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (arg1: number) => {
          document.title = `${arg1} | ${document.title.replace(
            /^\d+ \| /,
            ""
          )}`;
        },
        args: [time],
      });
    }
    // 初始设置剩余时间
    setRemainder(waitTime);
    this.timers[tabId] = setInterval(async () => {
      // 剩余时间改变动态显示
      setRemainder(--waitTime!);
      // 关闭标签的定时器
      if (waitTime! <= 0) {
        clearInterval(that.timers[tabId]);
        delete that.timers[tabId];
        chrome.tabs.get(tabId, async function (tab) {
          if (chrome.runtime.lastError) {
            console.error("Error getting tab:", chrome.runtime.lastError);
            return;
          }
          console.log("添加到历史 ", that.clearTitleTime(tab.title!));
          await $store.common.addHistory({
            url: tab.url,
            title: that.clearTitleTime(tab.title!),
            favIconUrl: tab.favIconUrl,
          } as chrome.tabs.Tab);
          that.addSessionCloseHistory(tab);
          chrome.tabs.remove(tabId);
        });
      }
    }, 1000);
  },
  // 恢复标题
  clearTitleTime(pollutedTitle: string) {
    return pollutedTitle.replace(/^\d+ \| /, "");
  },
  // 取消定时器，将定时器关闭且从timers中移除
  cancelTimer(tabId: number) {
    let timer = this.timers[tabId];
    if (timer == null) return;
    clearInterval(timer);
    delete this.timers[tabId];
    // 恢复标题
    const that = this;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        document.title = document.title.replace(/^\d+ \| /, "");
      },
    });
  },
};
// tab操作集
let tabOperator = {
  tabs: {} as { [key: number]: chrome.tabs.Tab },
  activeTab: [] as chrome.tabs.Tab[], // 放tab
  getSafeRange(): Promise<number> {
    // 在安全范围内不能被清理
    return new Promise(async (resolve, reject) => {
      resolve(await $store.common.getSafeRange());
    });
  },
  safeRangeArray: [] as chrome.tabs.Tab[], // 在安全的tab
  addTab(tab: chrome.tabs.Tab) {
    this.tabs[tab.id!] = tab;
  },
  removeTab(tabIdOrTab: number | chrome.tabs.Tab) {
    let tabId = typeof tabIdOrTab === "object" ? tabIdOrTab.id : tabIdOrTab;
    if (tabId != null) delete this.tabs[tabId];
  },
  findTab(tabId: number): chrome.tabs.Tab | undefined {
    return this.tabs[tabId];
  },
  async refreshTabHandle() {
    // alert("refreshTabHandle")
    // tab有两种状态, 活跃状态 1 与不活跃状态 0
    let noCloseTab = [...this.safeRangeArray, ...this.activeTab];
    let waitCloseTab = Object.values(this.tabs).filter(
      (tab) => !noCloseTab.includes(tab)
    );
    // 等待关闭的需要满足,不是活跃的不在安全范围,还需要再"满足配置的规则"
    // 如果规则未匹配上，那就向noCloseTab中添加（当存在定时器时，取消定时咕咕）
    waitCloseTab = await matchUrlPromise(waitCloseTab, (tab) =>
      noCloseTab.push(tab)
    );
    // alert("需要进入等待关闭的："+JSON.stringify(waitCloseTab))
    noCloseTab.forEach((secureTab) => {
      // 清理定时器
      closeTimerOperator.cancelTimer(secureTab.id!);
    });
    waitCloseTab.forEach((waitTab) => {
      // 保证有定时器
      closeTimerOperator.upsertTimer(waitTab.id!);
    });
  },
  // 刷新各tab状态-对应的handle也会调整（通过调用refreshTabHandle）
  async refreshState(isRefreshConfig = false) {
    console.log("刷新tab关闭状态");
    let that = this;
    let globalActiveTab: chrome.tabs.Tab[] = [];
    let globalTab: chrome.tabs.Tab[] = []; // 重置
    let globalSafeRangeArray: chrome.tabs.Tab[] = []; // 重置
    chrome.windows.getAll({ populate: true }, async function (windows) {
      let safeRange = await tabOperator.getSafeRange();
      windows.forEach(function (window) {
        // let windowIsActive = window.focused;
        let safeRangeArray: chrome.tabs.Tab[] = []; // push - shift
        let activeTab: chrome.tabs.Tab | null = null;
        window.tabs?.forEach(function (tab) {
          let active = tab.active; // 是否活跃
          globalTab.push(tab);
          if (activeTab == null && active) {
            activeTab = tab;
          } else if (activeTab == null) {
            safeRangeArray.push(tab);
            if (safeRangeArray.length > safeRange) safeRangeArray.shift();
          }
        });
        if (activeTab != null) globalActiveTab.push(activeTab);
        globalSafeRangeArray.push(...safeRangeArray);
      });
      that.tabs = globalTab.reduce((acc, tab) => {
        acc[tab.id!] = tab;
        return acc;
      }, {} as { [key: number]: chrome.tabs.Tab });
      that.safeRangeArray = globalSafeRangeArray;
      that.activeTab = globalActiveTab;
      // alert("所有的tab："+JSON.stringify(globalTab))
      // alert("安全范围的tab："+JSON.stringify(globalSafeRangeArray))
      // alert("活跃的"+JSON.stringify(globalActiveTab))
      that.refreshTabHandle();
    });
  },
};
// 防抖调用tabOperator.refreshState
const debounceRefreshState = debounce(
  (isRefreshConfig) => tabOperator.refreshState(isRefreshConfig),
  200
);

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

// 注册渲染程序需要调用的服务
register({
  debounceRefreshState: () => debounceRefreshState(true),
  getSessionCloseHistory: () => closeTimerOperator.getSessionCloseHistory(),
});
