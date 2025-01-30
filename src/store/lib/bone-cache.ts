// 主进程与渲染进程缓存同步器

// 常量
const consts = {
  MESSAGE_TYPE: "bone",
  MY_ROLE: typeof window === "undefined" ? "main" : "renderer",
  INVALID_FLAG: "_invalid_",
};

function printLog(...args: any) {
  console.log.apply(console, [`[bone-cache/${consts.MY_ROLE}]`, ...args]);
}
printLog("正在初始化bone-cache !");

const localCache: { [key: string]: any } = {};
// 将改变应用到本地缓存
function pushLocalCache(changeCollection: { [key: string]: any }) {
  for (const key in changeCollection) {
    if (changeCollection.hasOwnProperty(key)) {
      if (changeCollection[key] === consts.INVALID_FLAG) {
        delete localCache[key];
      } else {
        localCache[key] = changeCollection[key];
      }
    }
  }
  // 通知所有监听者
  notifyChangeListener(changeCollection);
}

const listener: { [key: string]: any } = {};
function listenerChange(key: string, fun: (value: any) => void) {
  let fellowTraveler = listener[key] || (listener[key] = []);
  fellowTraveler.push(fun);
}
function notifyChangeListener(change: { [key: string]: any }) {
  for (const key in change) {
    if (change.hasOwnProperty(key)) {
      const fellowTraveler = listener[key];
      if (fellowTraveler) {
        printLog("正在通知监听者", key, change[key]);
        fellowTraveler.forEach((fun: (value: any) => void) => {
          printLog("调用-监听者函数", key, change[key]);
          fun(change[key]);
        });
      }
    }
  }
}
function notifyChange(change: { [key: string]: any }) {
  // 如果value值为null设置为无效值
  for (const key in change) {
    if (change.hasOwnProperty(key)) {
      if (change[key] == null) {
        change[key] = consts.INVALID_FLAG;
      }
    }
  }
  printLog("发送缓存数据改变通知", change);
  // 本地立即可见
  pushLocalCache(change);
  // 发送消息给其它成员
  chrome.runtime.sendMessage({ type: consts.MESSAGE_TYPE, change });
}
// 监听改变
type CallBGFunResponse = {
  data: any;
};
function onChange() {
  chrome.runtime.onMessage.addListener(
    (
      { type, change }: { [key: string]: any },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: CallBGFunResponse) => void
    ) => {
      if (type === consts.MESSAGE_TYPE && change) {
        // 向常量localCache中添加或修改数据 change对象中的属性
        printLog("收到缓存数据改变通知", change);
        pushLocalCache(change);
      }
    }
  );
  printLog("开始监听改变!");
}
onChange();
function setCache(key: string, value: any) {
  if (key == null || value == null) {
    return;
  }
  localCache[key] = value;
  notifyChange({ [key]: value });
}
function getCache(key: string): any {
  return localCache[key];
}
function invalid(key: string) {
  printLog("正在使缓存失效", key);
  notifyChange({ [key]: consts.INVALID_FLAG });
}

export default {
  setCache,
  getCache,
  invalid,
  listenerChange,
};
