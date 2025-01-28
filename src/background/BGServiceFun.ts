import $store from "../store/index";
import { debounce } from "../utils/utils";
import { registerBGFun, callBGFun } from "@/utils/BGServerRegister";
import { setStorePlus } from "@/store/lib/store";
import { type RegisterBGSType } from "@/types"; // 引入RegisterType类型
import boneCache from "@/store/lib/bone-cache";

const { requestFunKeys } = $store.BGS;

function register({
  debounceRefreshState,
  getSessionCloseHistory,
}: RegisterBGSType) {
  // -- 防抖方式删除规则-让前台调用--
  const waitRemoveRules: string[] = [];
  async function removeRulesCore() {
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
    await $store.common.saveConfig(config);
    // 重新刷新tab状态
    debounceRefreshState();
    // 删除通知更新列表-暂无需实现（仅保存时需要）
  }
  const refreshDebounceRemoveRules = debounce(removeRulesCore, 1000);
  function debounceRemoveRules(rule: string) {
    if (rule == null || rule.trim() === "") return;
    waitRemoveRules.push(rule.trim());
    refreshDebounceRemoveRules();
  }

  // 将bg-call-server:server中注册处理方法,用来接收index.html->xxx.js调用
  registerBGFun(requestFunKeys.setStorePlus, async (key, value) => {
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
  });
  registerBGFun(requestFunKeys.debounceRemoveRules, debounceRemoveRules);
  registerBGFun(requestFunKeys.getSessionCloseHistory, getSessionCloseHistory);
}

export { register };
