import {
  getStore,
  setStore,
  getStorePlus,
  removeStorePlus,
  removeStore,
} from "@/store/lib/store";
import { type Config } from "@/types";
import { callBGFun } from "@/utils/BGServerRegister";
// 导入子模块store-注册
import BGS from "@/store/module/BGS";
import event from "@/store/module/event";
import boneCache from "./lib/bone-cache";

const common = {
  // 常量keys
  cacheKeys: {
    CONFIG_KEY: "CONFIG",
    HISTORY_KEY: "HISTORY",
  } as const,

  // 默认配置值
  defaultConfig: {
    TC_CONFIG: {
      retentionRules: [
        "www.baidu.com",
        "www.google.com",
        "/search(\\?.*)?$",
        "/history(\\?.*)?$",
      ],
      secureCount: 3,
      delayed: 60,
    },
    HISTORY_CONFIG: {
      maxCount: 100,
    },
  } as Config,

  // 保存配置
  async saveConfig(config: Config) {
    // 保存(保存都使用委托主进程来保存)
    return await callBGFun(BGS.requestFunKeys.setStorePlus, [
      this.cacheKeys.CONFIG_KEY,
      config,
    ]);
  },
  // 获取配置
  async getConfig(isReadCache = true): Promise<Config> {
    let cacheValue = boneCache.getCache(this.cacheKeys.CONFIG_KEY);
    if (cacheValue && isReadCache) {
      return cacheValue;
    }
    boneCache.setCache(
      this.cacheKeys.CONFIG_KEY,
      (cacheValue = await getStorePlus(this.cacheKeys.CONFIG_KEY))
    );
    return cacheValue ?? this.defaultConfig;
  },
  // 获取自动关闭配置的规则
  async rules(): Promise<string[]> {
    const config: Config = await this.getConfig();
    return config.TC_CONFIG.retentionRules || [];
  },
  // 保存自动关闭配置的规则
  async saveRules(rules: string[]) {
    const config = await this.getConfig();
    config.TC_CONFIG.retentionRules = rules;
    return this.saveConfig(config);
  },
  // 获取安全范围
  async getSafeRange(): Promise<number> {
    const config = await this.getConfig();
    return config.TC_CONFIG.secureCount;
  },
  // 获取延迟时间
  async getDelayed(): Promise<number> {
    const config = await this.getConfig();
    return config.TC_CONFIG.delayed;
  },
  // 获取历史记录
  async getHistory(): Promise<chrome.tabs.Tab[]> {
    return (await getStore(this.cacheKeys.HISTORY_KEY)) || [];
  },
  // 添加历史记录
  async addHistory(tab: chrome.tabs.Tab) {
    let history = await this.getHistory();
    // 过滤重复记录再添加
    const config = await this.getConfig();
    history = history.filter((item) => item.url !== tab.url);
    if (history.length >= config.HISTORY_CONFIG.maxCount) {
      history.pop();
    }
    // 只保存部分tab属性
    history.unshift(tab);
    return await setStore(this.cacheKeys.HISTORY_KEY, history);
  },
};

export default { common, BGS, event };
