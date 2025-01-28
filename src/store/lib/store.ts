// 全局常量
const MAX_ITEM_STORE_SIZE = 8000; // 8KB
const MAX_EXTEND_PROJECT_STORE_SIZE = 100000; // 100kb

// 【store】store操作工具
// 切分
function splitStringIntoChunks(str: string, chunkSize: number): string[] {
  let chunks: string[] = [];
  let currChunk = "";
  let currChunkSize = 0;
  for (let i = 0; i < str.length; i++) {
    let char = str.charAt(i);
    let charSize = new Blob([char]).size;
    if (currChunkSize + charSize > chunkSize) {
      chunks.push(currChunk);
      currChunk = char;
      currChunkSize = charSize;
    } else {
      currChunk += char;
      currChunkSize += charSize;
    }
  }
  if (currChunk !== "") chunks.push(currChunk);
  return chunks;
}

// 为key设置还原点
function createRestorePoint(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [`${key}_for_local`]: value }, () => {
      if (chrome.runtime.lastError) {
        console.log("创建还原点时发生错误:", chrome.runtime.lastError);
        reject(new Error("创建还原点失败"));
      } else {
        console.log("创建还原点成功!");
        resolve();
      }
    });
  });
}

// 恢复到最近的还原点
function tryRestoreToRestorePoint(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const lastOkLocalKey = `${key}_for_local`;
    chrome.storage.local.get(lastOkLocalKey, (result) => {
      const localStoreValue = (result ?? {})[lastOkLocalKey];
      if (localStoreValue != null) {
        setStorePlus(key, localStoreValue);
        resolve(localStoreValue);
        console.log("恢复成功");
      } else {
        console.log("恢复失败");
        reject(new Error("恢复失败"));
      }
    });
  });
}

async function setStorePlus(key: string, value: any): Promise<boolean> {
  const jsonValue = JSON.stringify(value);
  // 上次使用的桶长度
  const lastUsed = (await getStore(`${key}_used`)) ?? 1;
  const CHUNK_SIZE = MAX_ITEM_STORE_SIZE - 3000; // 8000 - 3000 = 5kb(/桶)
  const resultArr = splitStringIntoChunks(jsonValue, CHUNK_SIZE);
  const currUsed = resultArr.length;
  console.log("上次使用的桶数：" + lastUsed + "这次会使用的桶数：" + currUsed);

  if (CHUNK_SIZE * currUsed > MAX_EXTEND_PROJECT_STORE_SIZE) {
    alert("存储超CHROME API限制,请减少规则！");
    return false;
  }

  try {
    for (let [index, item] of resultArr.entries()) {
      if (!(await setStore(`${key}${index == 0 ? "" : "_" + index}`, item))) {
        throw new Error("向桶设置失败！");
      }
    }
    if (!(await setStore(`${key}_used`, resultArr.length))) {
      throw new Error("桶数保存失败！");
    }
  } catch (e) {
    // 恢复
    await tryRestoreToRestorePoint(key);
    return false;
  }

  if (currUsed < lastUsed) {
    const removeKeys: string[] = [];
    for (let i = currUsed; i < lastUsed; i++) {
      removeKeys.push(`${key}${i == 0 ? "" : "_" + i}`);
    }
    // 清理逻辑上被删除的后置桶
    chrome.storage.sync.remove(removeKeys, () => {});
  }
  // 向本地保存一份（好的数据-用于异常恢复）
  createRestorePoint(key, value);
  return true;
}

function getStorePlus(key: string): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // 已经使用的桶数量
    const used = (await getStore(`${key}_used`)) ?? 1;
    let keys: string[] = [];
    for (let i = 0; i < used; i++) {
      keys.push(`${key}${i == 0 ? "" : "_" + i}`);
    }
    chrome.storage.sync.get(keys, (valuesObj) => {
      const values = Object.values(valuesObj);
      if (values == null || values.length == 0) resolve(null);
      const completeJson = values.reduce((_sum, _curr) => (_sum += _curr), "");
      if (completeJson.trim() === "") return completeJson;
      try {
        resolve(JSON.parse(completeJson));
      } catch (e) {
        // 如果解析失败，那可能是数据丢失导致数据损坏了，恢复到最近好的数据
        // 返回的data是存储本地那份好的
        tryRestoreToRestorePoint(key)
          .then((data) => resolve(data))
          .catch(() => {
            // 如果恢复失败，那就清理掉
            removeStorePlus(key);
            resolve(undefined);
          });
      }
    });
  });
}

function removeStorePlus(key: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Get the number of used buckets
    const used = (await getStore(`${key}_used`)) ?? 1;
    let keys: string[] = [`${key}_used`];

    for (let i = 0; i < used; i++) {
      keys.unshift(`${key}${i === 0 ? "" : "_" + i}`);
    }
    // Remove values from the storage
    chrome.storage.sync.remove(keys, () => {
      if (chrome.runtime.lastError) {
        // Handle error if any
        console.error(chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        // Operation completed successfully
        resolve();
      }
    });
  });
}

function getStore(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (res) => {
      resolve(res[key]);
    });
  });
}

function setStore(key: string, value: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const obj: { [key: string]: any } = {};
    obj[key] = value;
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) {
        console.error("store 设置失败！" + chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
function removeStore(key: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(key, () => {
      if (chrome.runtime.lastError) {
        console.error("store 删除失败！" + chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function getLocalStore(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (res) => {
      resolve(res[key]);
    });
  });
}

function setLocalStore(key: string, value: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const obj: { [key: string]: any } = {};
    obj[key] = value;
    chrome.storage.local.set(obj, () => {
      if (chrome.runtime.lastError) {
        console.error("store 设置失败！" + chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
function removeLocalStore(key: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) {
        console.error("store 删除失败！" + chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// 导出
export {
  setStore,
  getStore,
  removeStore,
  getStorePlus,
  setStorePlus,
  removeStorePlus,
  getLocalStore,
  setLocalStore,
  removeLocalStore,
};
