import $store from "@/store";
import { debounce } from "@/utils/utils";
import { setStorePlus } from "@/store/lib/store";
import boneCache from "@/store/lib/bone-cache";
import { debounceRefreshState, closeTimerOperator } from "@/background/helper/TabHelper";


// -- 防抖方式删除规则-让前台调用--
const waitRemoveRules: string[] = [];
async function removeRulesCore() {
    console.log("删除规则核心方法");
    const config = await $store.common.getConfig();
    // 倒数据
    const _waitRemoveRules: string[] = [];
    while (waitRemoveRules.length !== 0)
        _waitRemoveRules.push(waitRemoveRules.pop()!);
    // 过滤掉删除的
    config.TC_CONFIG.retentionRules = config.TC_CONFIG.retentionRules.filter(
        (item) => !_waitRemoveRules.includes(item)
    );
    // 保存修改扣的config配置
    console.log("开始保存配置！！！");
    // 这里不能直接调用saveConfig,只能是渲染层来调用
    await $store.common.notCommissionedSaveConfig(config);
    // 重新刷新tab状态
    debounceRefreshState();
    // 删除通知更新列表-暂无需实现（仅保存时需要）
}
const refreshDebounceRemoveRules = debounce(removeRulesCore, 1000);
function debounceRemoveRules(rule: string) {
    console.log("接收到防止删除规则");
    if (rule == null || rule.trim() === "") return;
    waitRemoveRules.push(rule.trim());
    refreshDebounceRemoveRules();
}

// 将bg-call-server:server中注册处理方法,用来接收index.html->xxx.js调用
async function setStorePlusProxy(key: string, value: any) {
    console.log("接收到，现在处理请求" + key);
    const result = await setStorePlus(key, value);
    // 如果是规则改变了那刷新tab状态
    if (key === $store.common.cacheKeys.CONFIG_KEY) {
        // 让bg store的配置失效
        // $store.common.config = null;
        console.log("是改变了配置，准备去触发刷新状态");
        debounceRefreshState();
    }
    // 修改后，让boneCache失效（为什么在这里设置，因为等bg保存完成，渲染进程可能已经关了，就无法发送失效通知了）
    boneCache.invalid(key);
    return result;
}

export {setStorePlusProxy, debounceRemoveRules};
