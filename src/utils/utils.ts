// 延时函数，防止频繁触发
function debounce(
  func: (...args: any[]) => void,
  wait: number
): (...args: any[]) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]): void {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// 当给定的元素滚动触底时
function scrollBottom(
  element: HTMLElement,
  callback: () => void,
  { triggerHeight = 3 }: { triggerHeight?: number } = {}
): void {
  element.addEventListener(
    "scroll",
    debounce(function () {
      if (
        element.scrollTop + element.clientHeight + triggerHeight >=
        element.scrollHeight
      ) {
        callback();
      }
    }, 100)
  );
}

// 同步等待指定毫秒数
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 不要太快函数
async function notTooFast(
  func: () => Promise<void>,
  wait: number
): Promise<void> {
  const beginTime = Date.now();
  await func();
  const endTime = Date.now();
  if (endTime - beginTime < wait) {
    await sleep(wait - (endTime - beginTime));
  }
}

// 导出
export { debounce, scrollBottom, sleep, notTooFast };
