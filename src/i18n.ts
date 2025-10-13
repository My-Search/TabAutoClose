import { createI18n } from 'vue-i18n';
import en from './locales/en';
import zh from './locales/zh';

function getBrowserLanguage(): string {
  const lang = navigator.language || 'zh';
  if (lang.startsWith('en')) return 'en';
  return 'zh';
}

const i18n = createI18n({
  legacy: false, // Composition API 模式
  locale: getBrowserLanguage(),
  fallbackLocale: 'zh',
  messages: {
    en,
    zh,
  },
  // 添加以下配置来避免 unsafe-eval
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false,
  // 关键配置：禁用动态编译
  compileTemplate: false
});

export default i18n;