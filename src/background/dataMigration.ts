import {
  getStore,
  setStore,
  getStorePlus,
  setStorePlus,
  removeStorePlus,
  removeStore,
  getLocalStore,
  setLocalStore,
} from "@/store/lib/store";
import { exportAsFile } from "@/utils/import-export";
import $store from "@/store";
import { type Config } from "@/types";
import boneCache from "@/store/lib/bone-cache";

// 旧数据删除
async function removeOldConfig() {
  await setStore("MigrationStatus_v1", 0);
  // 删除旧配置
  await Promise.all([
    removeStore("secureCount"),
    removeStore("delayed"),
    removeStorePlus("tc_config"),
  ]);
  await setStore("MigrationStatus_v1", 1);
}
async function oldConfigAdapterHandler() {
  // 检测是否已经迁移完成
  const migrationStatus = await getLocalStore("MigrationStatus_v1");
  if (migrationStatus === 1) {
    console.log("旧数据已迁移！");
    // 说明本浏览器已经完成了迁移
    return;
  }
  console.log("旧配置迁移开始");
  // 需要进行数据迁移检测（如果有旧数据）
  const config: Config = $store.common.defaultConfig;
  // 导出规则为文件
  const [secureCount, delayed, tcConfig] = await Promise.all([
    getStore("secureCount"),
    getStore("delayed"),
    getStorePlus("tc_config"),
  ]);
  // 只看主要的数据-规则
  if (tcConfig == null) {
    // 无旧数据，退出数据迁移程序
    await setLocalStore("MigrationStatus_v1", 1);
    // removeOldConfig(); 后期版本等用户迁移完成打开
    console.log("无旧配置，退出数据迁移程序");
    return;
  }
  console.log("存在旧配置，开始数据迁移");

  // 存在旧数据 & 未迁移 （准备需要进行数据迁移）
  // 进行双重备份
  // - local方式
  await setLocalStore("oldConfig", tcConfig);
  // - file方式
  //   try {
  //     await exportAsFile(
  //       JSON.stringify(tcConfig.retentionRules),
  //       "TabAutoCloseRule-版本升级数据备份，防止数据丢失.json"
  //     );
  //   } catch (e) {
  //     console.log("导出失败", e);
  //   }
  console.log("迁移前");
  // 将旧配置组装为新配置
  config.TC_CONFIG.retentionRules = tcConfig.retentionRules || [];
  config.TC_CONFIG.secureCount = secureCount;
  config.TC_CONFIG.delayed = delayed;
  console.log("迁移后");
  // 保存为新配置
  const result = await setStorePlus($store.common.cacheKeys.CONFIG_KEY, config);
  if (!result) {
    console.log("数据迁移新数据结构失败！");
    return;
  }
  console.log(
    "数据迁移新数据结构成功！需要通知前端刷新列表，现在让缓存配置失败！"
  );
  setLocalStore("MigrationStatus_v1", 1);
  console.log("数据迁移完成！");
  boneCache.invalid($store.common.cacheKeys.CONFIG_KEY);
  // removeOldConfig(); 后期版本等用户迁移完成打开
}

oldConfigAdapterHandler();
