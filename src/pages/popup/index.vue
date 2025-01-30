<script setup lang="ts">
import { ref,onMounted } from 'vue';
import { defineAsyncComponent } from 'vue';
import Button from '@/components/button/index.vue';
import {callBGFun} from '@/utils/BGServerRegister'
import $store from '@/store'

const modules = [
  { name: 'rule', label: '规则管理' , icon: 'set',  isQuickly: true, default: true },
  { name: 'history', label: '清理记录', icon: 'history', isQuickly: true },
];

function findDefaultModule() {
  // 使用for循环
  for(let module of modules) {
    if(module.default) {
      return module
    }
  }
  // 没有找到就让第一个作为默认项
  return modules[0] || {}
}

const currentMode = ref<string | null>(findDefaultModule()?.name);

// 动态加载组件
const getModeComponent = (modeName: string) => {
  return defineAsyncComponent(() => import(`./mode-page/${modeName}/index.vue`));
};

const selectMode = (modeName: string) => {
  currentMode.value = modeName;
};
function moduleOf(name: string) {
  return modules.find(item => item.name === name)
}
onMounted(async () => {
  const sessionCloseHistory = await callBGFun($store.BGS.requestFunKeys.getSessionCloseHistory);
  console.log("sessionCloseHistory=",sessionCloseHistory);
  if(sessionCloseHistory.length > 0) {
    selectMode('history')
  }
})


</script>

<template>
  <div id="popup-page">
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
        <div class="menus">
          <template v-for="quickly of modules.filter(e => e.isQuickly)">
            <SvgIcon :name="quickly.icon" color="#666666" @click="selectMode(quickly.name)" v-if="currentMode !== quickly.name"></SvgIcon>
          </template>
          <!-- <SvgIcon name="home"  @click="currentMode = null" width="20px"></SvgIcon> -->
        </div>
      </view>
      <!-- 动态加载组件 -->
      <component :is="getModeComponent(currentMode)" />
    </div>
  </div>
</template>

<style scoped lang="scss">
#popup-page::before {
    background: url('@/assets/images/leaf-end.webp') no-repeat;
    background-size: cover;
    background-repeat: repeat-x;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    filter: blur(3px);
    content: "";
    z-index: -100;
    opacity: 0.4;
}

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
    align-items: center;
    justify-content: space-between;
    .title {
      font-weight: bold;
      margin: 20px 0;
      color: #4f4f4f;
      text-shadow: 3px 3px #cfcfcf;
      font-size: 15px;
    }
    .menus {
      display: flex;
      flex-wrap: nowrap;
      > * {
        cursor: pointer;
        margin-left: 10px;
        color: #666666;
      }
    }
 
  }

}
</style>
