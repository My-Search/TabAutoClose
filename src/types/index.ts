type Config = {
  TC_CONFIG: {
    retentionRules: string[];
    secureCount: number;
    delayed: number;
  };
  SECURE_COUNT?: number; // 已迁移配置
  DELAYED?: number; // 已迁移配置
  HISTORY_CONFIG: {
    maxCount: number;
  };
};

type RegisterBGSType = {
  debounceRefreshState: () => void;
  getSessionCloseNumber: () => Promise<number>;
};

export type { Config, RegisterBGSType };
