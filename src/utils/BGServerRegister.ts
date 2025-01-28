/**
 * 须知：registerBGFun注册使用的bgFun是在注册端可用的，而调用端引入当前这个js是无法读取到这个bgFun的。
 * 只是发送给注册端，注册端从bgFun中找到对应的函数执行，然后返回结果给调用端。
 */

type Request = {
  funName: string | null;
  args: any[];
};

type BgFunMap = {
  [key: string]: (...args: any[]) => any;
};
// 存放的是注册的函数
const bgFun: BgFunMap = {
  // setStorePlus: ()=>{}
};

// 动态调用
chrome.runtime.onMessage.addListener(
  (
    request: Request,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: CallBGFunResponse) => void
  ) => {
    if (request.funName != null) {
      console.log(
        `bg log: call a function named ${request.funName} with parameters `,
        request.args
      );
      const targetFun = bgFun[request.funName];

      if (targetFun) {
        const args = Array.isArray(request.args) ? request.args : [];
        let result = targetFun(...args);
        if (result instanceof Promise) {
          result.then((data) => sendResponse({ data }));
        } else {
          sendResponse({ data: result });
        }
      } else {
        console.error(`Function ${request.funName} not found`);
      }
      //这是重点，没有return true，上面返回的是undefined而不是"hi!"
      return true;
    }
  }
);

// 注册远程方法
function registerBGFun(funName: string, fun: (...args: any[]) => any): void {
  bgFun[funName] = fun;
}

type CallBGFunResponse = {
  data: any;
};

// Client
function callBGFun(funName: string, args: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log("收到调用函数", funName, args);
    chrome.runtime.sendMessage(
      { funName, args },
      (response: CallBGFunResponse | undefined) => {
        resolve(response?.data);
      }
    );
  });
}
export { registerBGFun, callBGFun };
