<script setup lang="ts">
import { ref,onMounted } from 'vue';
import { defineAsyncComponent } from 'vue';
import Button from '@/components/button/index.vue';
import {callBGFun} from '@/utils/BGServerRegister'
import $store from '@/store'


const modules = [
  { name: 'rule', label: '规则管理' },
  { name: 'history', label: '清理记录' },
];

const currentMode = ref<string | null>(null);

// 动态加载组件
const getModeComponent = (modeName: string) => {
  return defineAsyncComponent(() => import(`./mode-page/${modeName}/index.vue`));
};

const selectMode = (modeName: string) => {
  currentMode.value = modeName;
};

const resetMode = () => {
  currentMode.value = null;
};
function moduleOf(name: string) {
  return modules.find(item => item.name === name)
}
onMounted(async () => {
  const sessionCloseHistory = await callBGFun($store.BGS.requestFunKeys.getSessionCloseHistory);
  console.log("sessionCloseHistory=",sessionCloseHistory);
  if(sessionCloseHistory.length > 0) {
    currentMode.value = 'history'
  }
})
</script>

<template>
  <div>
    <!-- 模式选择界面 -->
    <div v-if="currentMode === null" class="mode-select">
      <div v-for="module in modules" :key="module.name">
        <Button @click="selectMode(module.name)">{{ module.label }}</Button>
      </div>
    </div>

    <!-- 显示对应模式的界面 -->
    <div class="mode-view" v-else>
      <view class="mode-view-header">
        <span class="title">{{ moduleOf(currentMode)?.label }}</span>
        <SvgIcon name="home" color="red" @click="resetMode" class="home" width="20px"></SvgIcon>
      </view>
      <!-- 动态加载组件 -->
      <component :is="getModeComponent(currentMode)" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mode-select {
  display: flex;
  flex-wrap: nowrap;
  gap: 1em;

  button {
    padding: 0.5em 1em;
    font-size: 1.2em;
    white-space: nowrap;
    border: 1px solid #ccc;
    // background: #f0f0f0;
    // box-shadow: 0 0 0.5em #ccc;
  }
}

.mode-view {
  padding: 5px 10px;
  .mode-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-weight: bold;
      margin: 20px 0;
      background: #fff;
      color: #777777;
      text-shadow: 3px 3px #cfcfcf;
      font-size: 15px;
    }
    .home {
      cursor: pointer;
    }
  }

}
</style>
