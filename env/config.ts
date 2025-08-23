// 환경변수 설정 및 유틸리티
import dotenv from 'dotenv';

// 환경에 따라 적절한 .env 파일 로드
const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'test';
const envFile = `./env/.env.${appEnv}`;

// dotenv 설정
dotenv.config({ path: envFile });

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

// 환경변수를 안전하게 가져오는 헬퍼 함수
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value || defaultValue || '';
}

function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getNumberEnvVar(key: string, defaultValue?: number): number | undefined {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// 환경별 설정 로드
export const envConfig: EnvConfig = {
  // API Configuration
  apiBaseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080/api'),
  
  // Auth Settings
  authDomain: getEnvVar('NEXT_PUBLIC_AUTH_DOMAIN', 'localhost:3000'),
  
  // App Settings
  appVersion: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  appEnv: (getEnvVar('NEXT_PUBLIC_APP_ENV', 'test') as EnvConfig['appEnv']),
  
  // Debug Settings
  debugMode: getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', false),
  logLevel: (getEnvVar('NEXT_PUBLIC_LOG_LEVEL', 'info') as EnvConfig['logLevel']),
  
  // Feature Flags
  enableAnalytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
  enableNotifications: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_NOTIFICATIONS', true),
  
  // External Services
  googleCalendarApiKey: getEnvVar('NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY'),
  firebaseApiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  
  // Optional Settings
  mockApi: getBooleanEnvVar('NEXT_PUBLIC_MOCK_API'),
  testUserEmail: getEnvVar('NEXT_PUBLIC_TEST_USER_EMAIL'),
  enableServiceWorker: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_SERVICE_WORKER'),
  cacheTimeout: getNumberEnvVar('NEXT_PUBLIC_CACHE_TIMEOUT'),
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

// 환경 정보 출력 (개발시에만)
if (isDevelopment()) {
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
