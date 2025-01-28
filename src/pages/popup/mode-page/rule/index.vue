<script setup lang="ts">
import { onMounted, ref } from 'vue';
import $store from '@/store';
import { callBGFun, registerBGFun } from '@/utils/BGServerRegister';
import {debounce} from '@/utils/utils';
import {importRules,exportAsFile} from '@/utils/import-export';
const { setStorePlus } = $store.BGS.requestFunKeys;
const {CONFIG_KEY} = $store.common.cacheKeys
const defaultConfig = $store.common.defaultConfig
const page = ref({
    num: 1,
    size: 30,
    total: 0,
    maxPageNum: 0,
    isShowSearch: false,
    keyword: '',
    list: [] as string[],
    closeSearch(isSafeClose = true) {
        if(this.keyword.trim().length > 0 ) return;
        this.isShowSearch = false;
        this.keyword = '';
        this.resetPage();
    },
    async refreshList() {
        let rules = await $store.common.rules();
        // 应用keyword
        if (this.keyword.length > 0) {
            rules = rules.filter(_rule => _rule.includes(this.keyword));
        }
        page.value.total = rules.length;
        const maxPageNum = this.maxPageNum = Math.ceil(this.total / this.size);
        if (this.num > maxPageNum) {
            this.num = maxPageNum;
            return;
        }
        console.log(0,page.value.num * page.value.size)
        this.list = rules.slice(0, page.value.num * page.value.size);
        console.log('list=',this.list)
    },
    nextPage() {
        page.value.num++;
        page.value.refreshList();
    },
    resetPage() {
        page.value.num = 1;
        page.value.refreshList();
    }
})
const isLoaded = ref(false);
const form = ref({
    rule: '',
    secureCount: 0,
    delayed: 0,
    async saveFormData() {
        if(! isLoaded) {
            alert('页面数据未加载完成！')
        }
        // 获取配置
        const config = await $store.common.getConfig();
        const _TCConfig = config.TC_CONFIG;
        this.rule = `${this.rule}`.trim();
        const rules = _TCConfig.retentionRules = _TCConfig.retentionRules.filter(_rule => _rule !== this.rule);
        if(this.rule.length > 0) rules.unshift(this.rule);
        this.secureCount = (_TCConfig.secureCount = this.secureCount >= 0 ? this.secureCount : defaultConfig.TC_CONFIG.secureCount);
        this.delayed = (_TCConfig.delayed = this.delayed >= 0 ? this.delayed : defaultConfig.TC_CONFIG.delayed);
        // 通过调用后台方法，防止前台关闭导致添加失败
        const responseData = await $store.common.saveConfig(config);
        console.log('responseData',responseData)
        if(! responseData) alert('保存失败了')
        // 重置-刷新
        form.value.rule = '';
        page.value.resetPage();
    },
    // 回显刷新
    async feedbackRefresh() {
        const config = await $store.common.getConfig();
        this.secureCount = config.TC_CONFIG.secureCount;
        this.delayed = config.TC_CONFIG.delayed;
    }
})
const fileInputRef = ref<HTMLInputElement | null>(null);
const rules = ref({
    async del(rule:string) {
        let rules = await $store.common.rules();
        rules = rules.filter(_rule => _rule !== rule);
        $store.common.saveRules(rules);
        page.value.resetPage();
    },
    chooseFile() {
        fileInputRef.value?.click();
    },
    import: async (event: Event) => {
        // 触发选择文件，并使用importRules函数导入
        const selectedFiles = Array.from((event.target as HTMLInputElement)?.files || []);
        await importRules(selectedFiles);
        page.value.resetPage();
    },
    export: async () => {
        // 将规则导出为文件，通过调用exportRulesAsFile函数
        const rules = await $store.common.rules();
        exportAsFile(JSON.stringify(rules),`TabAutoClose插件导出的规则-${rules.length}条.json`);
    }
})

const containerRef = ref<HTMLElement | null>(null);

const debounceRefreshNextPage = debounce(() => page.value.nextPage(), 200);
// 列表滚动事件
const handleScroll = () => {
    console.log('滚动事件');
    const container = containerRef.value;
    if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 30) {
        debounceRefreshNextPage();
    }
}
function onLoadHandler() {
    // 设置已经加载
    isLoaded.value = true;
}
onMounted(async () => {
    // 列表显示
    await page.value.refreshList();
    // 其它参数回显
    await form.value.feedbackRefresh();
    // onLoad事件
    onLoadHandler();
})


</script>

<template>
    <div class="page">
        <div id="controllor">
            <div class="config-item">
                <input type="text" id="rule" placeholder="输入规则..." v-model="form.rule" @keydown.enter="form.saveFormData()" />
                <div>
                    <button id="push" class="custom-button" @click="form.saveFormData()">添加配置</button>
                </div>
            </div>
            <div class="config-item">
                <input type="number" id="secure-range" placeholder="请输入保护前tab个数" v-model="form.secureCount" @blur="form.saveFormData()" />
                <div class="input-desc">
                    保护前Tab数
                </div>
            </div>
            <div class="config-item">
                <input type="number" id="delayed" placeholder="延时关闭时间" title="保护活跃标签前面tab个数" v-model="form.delayed" @blur="form.saveFormData()" />
                <div class="input-desc">
                    延时关闭(秒)
                </div>
            </div>
        </div>
        <input type="file" id="fileInput" style="display: none;" ref="fileInputRef" @change="rules.import" />
        <div class="rule-info">
            <p id="msg">满足以下规则(<span class="ruleCount"></span>条)，将自动清理！
            </p>
            <p class="operation">
                <span id="search-rule" title="规则搜索" @click="page.isShowSearch = !page.isShowSearch">查找</span> | <span id="import" title="去重导入" @click="rules.chooseFile()">导入</span> | <span
                    id="export" title="将所有规则导出" @click="rules.export()">导出</span>
            </p>
        </div>
        <div id="search" v-if="page.isShowSearch">
            <input class="search-input" placeholder="请输入规则的查找关键字" @blur="page.closeSearch()" v-model="page.keyword" @keydown.enter="page.resetPage()" />
            <span class="search-btn" @click="page.resetPage()">搜索</span>
        </div>

        <div id="show" @scroll="handleScroll" ref="containerRef">
            <p class='item' v-for="rule in page.list">
                <span class="rule">{{ rule }}</span>
                <span @click="rules.del(rule)" class="del-btn">x</span>
            </p>
            <p class='completed'>
                {{ page.num >= Math.ceil(page.total/page.size)?'全部加载完了！':'正在努力加载中...' }} ({{ page.num }}/{{ page.maxPageNum }})
            </p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.page {
    width: 310px;
    margin: 0;
}


.config-item {
    display: flex;
    justify-content: space-between;
    height: 30px;
    align-items: center;
    margin: 10px 0px;
}

.config-item>input {
    flex-grow: 1;
    margin-right: 15px;
    display: inline-block;
}

.config-item button {
    width: 100%;
    cursor: pointer;
    height: 33px;
    line-height: 33px;
}

.config-item>*:nth-child(1) {
    width: 67%;
}

.config-item>*:nth-child(2) {
    width: 33%;
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    font-weight: 700;
    color: #a2a2a2;
}

.input-desc {
    border-bottom: 2px solid #a2a2a2;
    height: 33px;
    line-height: 33px;
    font-size: 10px;
    cursor: pointer;
}



#show {
    $item-height: 25px;

    height: 280px;
    overflow: auto;

    button {
        background-color: #ffffff00;
        padding: 0px 10px;
    }
    .item {
        border-radius: 0px;
        background-color: #e8e8e8;
        color: #a2a2a2;
        font-weight: 700;
        padding: 3px 5px;
        display: flex;
        justify-content: space-between;
        line-height: 25px;
        height: $item-height;
        padding-left: 10px;
        margin: 0 0 10px;

        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        .rule {
            display: inline-block;
            width: 90%;
            overflow: hidden;
            font-size: 14px;
        }

        .del-btn {
            float: right;
            width: $item-height;
            height: $item-height;
            line-height: $item-height;
            cursor: pointer;
            text-align: center;
        }
    }

    .loading {
        width: 100%;
        text-align: center;
        font-size: 12px;
        color: #a2a2a2;
    }

    .completed {
        width: 100%;
        text-align: center;
        font-size: 12px;
        color: #a2a2a2;
        margin: 0 0;
    }


}



#show::-webkit-scrollbar {
    width: 0px;
    background: transparent;
}





.rule-info {
    color: #3c3c3c;
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    height: 34px;
    align-items: center;
    margin-top: 20px;
}

.rule-info #import,
#export,
#search-rule {
    cursor: pointer;
}

.custom-button {
    border: unset;
    border-radius: 2px;
    color: #777777;
    z-index: 1;
    background: #e8e8e8;
    position: relative;
    font-weight: 1000;
    font-size: 17px;
    transition: all 250ms;
    overflow: hidden;
    font-size: 13px;
    padding: 0px 15px;
}

.custom-button::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0;
    border-radius: 2px;
    background-color: #212121;
    z-index: -1;
    -webkit-box-shadow: 4px 8px 19px -3px rgba(0, 0, 0, 0.27);
    box-shadow: 4px 8px 19px -3px rgba(0, 0, 0, 0.27);
    transition: all 250ms;
}

.custom-button:hover {
    color: #e8e8e8;
}

.custom-button:hover::before {
    width: 100%;
}


input {
    padding: 10px;
    font-family: 'Courier New', Courier, monospace;
    outline: none;
    background: #e8e8e8;

    border: none;
    border-radius: 5px;
    transition: all .5s;
}

input:focus {
    background: #e8e8e8;
    box-shadow: inset 5px 5px 17px #c8c8c8,
        inset -5px -5px 17px #ffffff;
}

#search {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    background-color: #e8e8e8;
    height: 30px;
    padding-left: 5px;
}

#search>input {
    display: inline-block;
    border-radius: 5px;
    height: 16px;
    padding: 5px;
    background-color: transparent;
    border: 1px solid #a2a2a2;
    transition: all .5s;
    flex-grow: 1;
    border: none;
}

#tis,
.operation {
    white-space: nowrap;
    /*文本无法选中*/
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.search-btn {
    cursor: pointer;
    font-size: 12px;
    padding: 0 15px;
    font-weight: bold;
    color: #777777;
}
</style>
