<script setup lang="ts">
import $store from '@/store';
import { onMounted, ref } from 'vue';

const historyList = ref<chrome.tabs.Tab[]>([])
onMounted(async () => {
    historyList.value = await $store.common.getHistory();
    console.log('historyList', historyList.value.length)
})

function openUrl(url: string) {
    chrome.tabs.create({ url });
}
</script>

<template>
    <div class="history">
        <div v-for="(tab, index) in historyList" :key="index" class="item">
            <img :src="tab.favIconUrl" class="favicon" />
            <a :href="tab.url" @click="openUrl(tab.url!)" :alt="tab.title">{{ tab.title }}</a>
        </div>
    </div>
</template>

<style scoped lang="scss">
.history {
    width: 300px;
    max-height: 700px;
    min-height: 120px;

    .item {
        display: flex;
        padding: 1px 0;
        .favicon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
        }
        a {
            // 超出省略
            flex-grow: 1;
            display: inline-block;
            width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

    }

}
</style>
