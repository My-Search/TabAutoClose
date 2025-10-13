/// <reference types="chrome"/>
import { ChannelListener } from './_common/ChannelListener.ts';

// 扩展脚本，通常在 content_scripts 中注入
// console.log("content.js running~")

const channelListener = new ChannelListener("src/content/inject-script.js", { isContentJs: true });
channelListener.onDefaultMessage<{ [key: string]: any }>((data) => {
  // console.log("content.js接收到通道消息：", data);
  // console.log("标签参数 发往bg.js, data=", data)
  chrome.runtime.sendMessage({ type: "TAB_INDICATOR", ...data }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("页面指标 发往bg.js 异常！", chrome.runtime.lastError);
      return;
    }
  })
});



