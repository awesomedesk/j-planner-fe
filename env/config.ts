// 환경변수 설정 및 유틸리티
// Next.js는 빌드 타임에 환경변수를 로드하므로 클라이언트에서는 dotenv를 사용하지 않음

interface EnvConfig {
  // API Configuration
  apiBaseUrl: string;
  
  // Auth Settings
  authDomain: string;
  
  // App Settings
  appVersion: string;
  appEnv: 'local' | 'test' | 'production';
  
  // Debug Settings
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Feature Flags
  enableAnalytics: boolean;
  enableNotifications: boolean;
  
  // External Services
  googleCalendarApiKey?: string;
  firebaseApiKey?: string;
  
  // Optional Settings
  mockApi?: boolean;
  testUserEmail?: string;
  enableServiceWorker?: boolean;
  cacheTimeout?: number;
}

// 환경별 설정 로드
// Next.js는 process.env.KEY 형태의 정적 접근만 빌드 타임에 치환함 (동적 접근 불가)
// 따라서 각 환경변수를 직접 접근해야 함
export const envConfig: EnvConfig = {
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',

  // Auth Settings
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || '',

  // App Settings
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '',
  appEnv: (process.env.NEXT_PUBLIC_APP_ENV || 'test') as EnvConfig['appEnv'],

  // Debug Settings
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as EnvConfig['logLevel'],

  // Feature Flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',

  // External Services
  googleCalendarApiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY,
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

  // Optional Settings
  mockApi: process.env.NEXT_PUBLIC_MOCK_API === 'true',
  testUserEmail: process.env.NEXT_PUBLIC_TEST_USER_EMAIL,
  enableServiceWorker: process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === 'true',
  cacheTimeout: process.env.NEXT_PUBLIC_CACHE_TIMEOUT ? parseInt(process.env.NEXT_PUBLIC_CACHE_TIMEOUT, 10) : undefined,
};

// 환경별 유틸리티 함수들
export const isLocal = () => envConfig.appEnv === 'local';
export const isTest = () => envConfig.appEnv === 'test';
export const isProduction = () => envConfig.appEnv === 'production';
export const isDevelopment = () => isLocal() || isTest();

// API URL 헬퍼
export const getApiUrl = (endpoint: string) => {
  const baseUrl = envConfig.apiBaseUrl.endsWith('/') 
    ? envConfig.apiBaseUrl.slice(0, -1) 
    : envConfig.apiBaseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// 로깅 헬퍼
export const logger = {
  debug: (...args: any[]) => {
    if (envConfig.debugMode && ['debug'].includes(envConfig.logLevel)) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (['debug', 'info'].includes(envConfig.logLevel)) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (['debug', 'info', 'warn'].includes(envConfig.logLevel)) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

// 환경 설정 검증
export const validateEnvConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!envConfig.apiBaseUrl) {
    errors.push('API Base URL is required');
  }
  
  if (!envConfig.authDomain) {
    errors.push('Auth domain is required');
  }
  
  if (isProduction() && envConfig.debugMode) {
    errors.push('Debug mode should be disabled in production');
  }
  
  if (isProduction() && !envConfig.enableAnalytics) {
    console.warn('Analytics is disabled in production');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 환경 정보 출력 (개발시에만, 서버 사이드에서만)
if (typeof window === 'undefined' && isDevelopment()) {
  logger.info('Environment Config:', {
    appEnv: envConfig.appEnv,
    apiBaseUrl: envConfig.apiBaseUrl,
    debugMode: envConfig.debugMode,
    logLevel: envConfig.logLevel,
  });

  const validation = validateEnvConfig();
  if (!validation.isValid) {
    logger.error('Environment validation errors:', validation.errors);
  }
}

export default envConfig;
