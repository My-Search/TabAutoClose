const defaultConfig = {
  TC_CONFIG: {
    retentionRules: [
      "www.baidu.com",
      "www.google.com",
      "/search(\\?.*)?$",
      "/history(\\?.*)?$",
    ],
  },
  SECURE_COUNT: 3,
  DELAYED: 60,
};

// 使用的storeKeys
const ConfigKeys = {
  TC_CONFIG: "tc_config",
  SECURE_COUNT: "secureCount",
  DELAYED: "delayed",
} as const;

export { defaultConfig, ConfigKeys };
