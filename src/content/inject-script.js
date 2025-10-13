import { ChannelListener } from "./_common/ChannelListener.js";

const channelListener = new ChannelListener('src/content/inject-script.js');
// 需要累计的数据
const cumulativeData = {
    focusInputCount: 0,
    inputFocusCount: 0,
    maxScrollPage: 0
}
// 收集消息发给插件分析（用于判断当前标签是否可被关闭）
function sendTabIndicatorToContentJs() {
    const indicator = {
        isOnCloseTis: window.onbeforeunload != null && window.onbeforeunload() != null,
        ...cumulativeData
    }
    // send to backgrounds
    channelListener.sendDefaultMessage(indicator);
}

// ##################### 触发发送指标 #####################
// 鼠标离开整个页面时触发
document.addEventListener('mouseout', function(event) {
    if (!event.relatedTarget && !event.toElement) sendTabIndicatorToContentJs();
});
// 当页面不可见时
document.addEventListener('visibilitychange', sendTabIndicatorToContentJs);


// ##################### 指标参数收集 #####################
// 当输入框获得焦点时
document.querySelectorAll('input, textarea').forEach(el => {
    const inputs = []
    el.addEventListener('focus', (e) => {
        const input = e.target;
        cumulativeData.inputFocusCount++;
        if(! inputs.find(e => e === input)) inputs.push(input);
        cumulativeData.focusInputCount = inputs.length;
    });
});
// 计算滚动的最大页数（每个视口高度算一页）
(function () {
  let maxPage = 0;

  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const pageHeight = window.innerHeight;
    const currentPage = Math.floor(scrollTop / pageHeight);

    if (currentPage > maxPage) {
      cumulativeData.maxScrollPage = maxPage = currentPage;
    }
  }
  window.addEventListener('scroll', onScroll);
})();


