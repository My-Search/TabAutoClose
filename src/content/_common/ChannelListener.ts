/**
 * 给 content script 和 注入的脚本 之间通信使用
 * 使用方：content.js
 */

export interface PageMessage<T = any> {
    source: string;
    type: string;
    data: T;
}

type MessageHandler<T = any> = (data: T) => void;
function injectScript(scriptPath: string) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(scriptPath);
    script.type="module";
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
        script.remove();
    };

}
export class ChannelListener {
    private source: string;
    private debug: boolean;
    private listeners: Map<string, MessageHandler>;
    
    private static DEFAULT_MESSAGE_KEY = "DEFAULT_MESSAGE";

    constructor(source: string, options: {debug?: boolean, isContentJs?: boolean}) {
        this.source = source;
        this.debug = options?.debug || false;
        this.listeners = new Map();
        if(options?.isContentJs) injectScript(source);
        this.listen();
    }

    private log(...args: any[]) {
        if (this.debug) console.log(`[ChannelListener:${this.source}]`, ...args);
    }

    public on<T = any>(type: string, handler: MessageHandler<T>): void {
        this.listeners.set(type, handler as MessageHandler);
    }
    public onDefaultMessage<T = any>(handler: MessageHandler<T>): void {
        this.listeners.set(ChannelListener.DEFAULT_MESSAGE_KEY, handler as MessageHandler);
    }

    public send<T = any>(type: string, data: T): void {
        const msg: PageMessage<T> = {
            source: this.source,
            type,
            data
        };
        window.postMessage(msg, "*");
        this.log("发送消息 =>", msg);
    }
    public sendDefaultMessage<T = any>(data: T): void {
        this.send(ChannelListener.DEFAULT_MESSAGE_KEY, data);
    }

    private listen(): void {
        window.addEventListener("message", (event: MessageEvent<PageMessage>) => {
            if (event.source !== window) return;
            const msg = event.data;
            if (!msg || msg.source !== this.source) return;

            const handler = this.listeners.get(msg.type);
            if (handler) handler(msg.data);
            this.log("收到消息 <=", msg);
        });
    }
}

