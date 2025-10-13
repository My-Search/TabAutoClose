/**
 * 给 content script 和 注入的脚本 之间通信使用
 * 使用方：inject-script.js
 */

function injectScript(scriptPath) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(scriptPath);
    script.type="module"
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
        script.remove();
    };
}

export class ChannelListener {
    static DEFAULT_MESSAGE_KEY = "DEFAULT_MESSAGE";

    constructor(source, options) {
        this.source = source;
        this.debug = options?.debug || false;
        this.listeners = new Map();
        if(options?.isContentJs) injectScript(source);
        this.listen();
    }

    log(...args) {
        if (this.debug) console.log(`[ChannelListener:${this.source}]`, ...args);
    }

    on(type, handler) {
        this.listeners.set(type, handler);
    }

    onDefaultMessage(handler) {
        this.listeners.set(ChannelListener.DEFAULT_MESSAGE_KEY, handler);
    }

    send(type, data) {
        const msg = {
            source: this.source,
            type,
            data
        };
        window.postMessage(msg, "*");
        this.log("发送消息 =>", msg);
    }

    sendDefaultMessage(data) {
        this.send(ChannelListener.DEFAULT_MESSAGE_KEY, data);
    }

    listen() {
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;
            const msg = event.data;
            if (!msg || msg.source !== this.source) return;

            const handler = this.listeners.get(msg.type);
            if (handler) handler(msg.data);
            this.log("收到消息 <=", msg);
        });
    }
}