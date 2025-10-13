/// <reference types="chrome" />
/// <reference types="node" />

import $store from "@/store/index";
import { debounce } from "@/utils/utils";
import { matchUrl } from '@/background/helper/RuleHelper'

/**
 * 定时关闭 tab 操作集
 */
const closeTimerOperator = {
    timers: {} as { [key: number]: NodeJS.Timeout },
    sessionCloseNumber: 0,

    async plusOneSessionCloseNumber() {
        return (this.sessionCloseNumber = (await this.getSessionCloseNumber()) + 1);
    },

    async getSessionCloseNumber(): Promise<number> {
        if (this.sessionCloseNumber === 0) {
            this.sessionCloseNumber = await new Promise<number>((resolve) => {
                chrome.action.getBadgeText({}, (text) => {
                    resolve(text.length > 0 ? parseInt(text) : 0);
                });
            });
        }
        return this.sessionCloseNumber;
    },

    onTabClose(tabId: number): Promise<boolean> {
        const that = this;
        return new Promise((resolve) => {
            chrome.tabs.get(tabId, async function (tab) {
                if (chrome.runtime.lastError) {
                    console.error("Error getting tab:", chrome.runtime.lastError);
                    return resolve(false);
                }
                try {
                    await $store.common.addHistory({
                        url: tab.url,
                        title: that.clearTitleTime(tab.title!),
                        favIconUrl: tab.favIconUrl,
                    } as chrome.tabs.Tab);

                    chrome.action.setBadgeText({
                        text: `${await that.plusOneSessionCloseNumber()}`,
                    });
                    chrome.action.setBadgeBackgroundColor({ color: "#A0A0A0" });
                    chrome.action.setBadgeTextColor({ color: "#F0F0F0" });
                } catch (error) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    },

    async getCloseDelayed() {
        return await $store.common.getDelayed();
    },

    async upsertTimer(tabId: number) {
        if (this.timers[tabId] != null) return;
        let waitTime = await this.getCloseDelayed();
        let that = this;

        function setRemainder(time: number) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (arg1: number) => {
                    document.title = `${arg1} | ${document.title.replace(/^\d+ \| /, "")}`;
                },
                args: [time],
            });
        }

        setRemainder(waitTime);
        this.timers[tabId] = setInterval(async () => {
            setRemainder(--waitTime!);
            if (waitTime <= 0) {
                clearInterval(that.timers[tabId]);
                delete that.timers[tabId];
                await that.onTabClose(tabId);
                chrome.tabs.remove(tabId);
            }
        }, 1000);
    },

    clearTitleTime(pollutedTitle: string) {
        return pollutedTitle.replace(/^\d+ \| /, "");
    },

    cancelTimer(tabId: number) {
        let timer = this.timers[tabId];
        if (timer == null) return;
        clearInterval(timer);
        delete this.timers[tabId];
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                document.title = document.title.replace(/^\d+ \| /, "");
            },
        });
    },
};

/**
 * tab 操作集
 */
const tabOperator = {
    tabs: {} as { [key: number]: chrome.tabs.Tab },
    activeTab: [] as chrome.tabs.Tab[],
    safeRangeArray: [] as chrome.tabs.Tab[],

    getSafeRange(): Promise<number> {
        return new Promise(async (resolve) => {
            resolve(await $store.common.getSafeRange());
        });
    },

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
        let noCloseTab = [...this.safeRangeArray, ...this.activeTab];
        let waitCloseTab = Object.values(this.tabs).filter(
            (tab) => !noCloseTab.includes(tab)
        );
        waitCloseTab = await matchUrl(waitCloseTab, (tab) => noCloseTab.push(tab));

        noCloseTab.forEach((secureTab) => {
            closeTimerOperator.cancelTimer(secureTab.id!);
        });
        waitCloseTab.forEach((waitTab) => {
            closeTimerOperator.upsertTimer(waitTab.id!);
        });
    },

    async refreshState() {
        console.log("刷新tab关闭状态");
        let that = this;
        let globalActiveTab: chrome.tabs.Tab[] = [];
        let globalTab: chrome.tabs.Tab[] = [];
        let globalSafeRangeArray: chrome.tabs.Tab[] = [];

        chrome.windows.getAll({ populate: true }, async function (windows) {
            let safeRange = await tabOperator.getSafeRange();
            windows.forEach(function (window) {
                let safeRangeArray: chrome.tabs.Tab[] = [];
                let activeTab: chrome.tabs.Tab | null = null;
                window.tabs?.forEach(function (tab) {
                    let active = tab.active;
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
            that.refreshTabHandle();
        });
    },
    
};
// 防抖刷新状态
const debounceRefreshState =  debounce(() => tabOperator.refreshState(),200)

export {
    closeTimerOperator,
    tabOperator,
    debounceRefreshState
};
