import $store from "@/store/index";
import { isCannotClose } from './TabDataCollectorHelper'
/**
 * 通过 ruleList 匹配 tab，返回匹配后的 tab 列表
 */
export async function matchUrl(
    tabList: chrome.tabs.Tab[],
    onTabMismatchedSuccessfully: (tab: chrome.tabs.Tab) => void
): Promise<chrome.tabs.Tab[]> {
    const rules = await $store.common.rules();
    tabList = tabList.filter((tab) => {
        // 规范化 URL，去掉末尾的斜杠
        let url = tab.url || '';
        if(url.endsWith('/')) url = url.slice(0, -1);

        let isHitWhite = false;
        let isHitBlack = false;

        for (let rule of rules) {
            const isWhiteRule = rule.startsWith('^(') && rule.endsWith(')');
            if (isWhiteRule) {
                // 去掉外层的 ^( 和 )
                rule = rule.slice(2, -1);
            }
            const isMatch = new RegExp(rule).test(url);
            if (isMatch) {
                if (isWhiteRule) {
                    isHitWhite = true;
                    break; // 白名单命中，立即排除
                } else {
                    isHitBlack = true; // 黑名单命中，继续匹配
                }
            }
        }
        const finalHit = isHitBlack && !isHitWhite && ! isCannotClose(tab.id!);
        if( ! finalHit && onTabMismatchedSuccessfully) onTabMismatchedSuccessfully(tab);
        return finalHit;
    });
    return tabList;
}