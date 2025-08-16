# 환경변수 관리 가이드

이 폴더는 프로젝트의 환경별 설정 파일들을 관리합니다.

## 📋 환경별 파일 구조

```
env/
├── README.md         # 이 파일 - 환경변수 관리 가이드
├── .env.example      # 환경변수 템플릿 (Git 추적)
├── .env.local        # 로컬 개발 환경 (Git 추적)
├── .env.test         # 테스트 환경 (Git 추적)
└── .env.production   # 프로덕션 환경 (Git 추적)

루트 디렉토리:
└── .env              # 실행시 활성 환경파일 (Git 무시)
```

## 🚀 사용법

### 1. 초기 설정
```bash
# 템플릿에서 로컬 환경파일 생성
npm run env:setup

# 불필요한 .env 파일 정리
npm run env:clean
```

### 2. 환경별 실행
```bash
# 기본 개발서버 (test 환경)
npm run dev

# 로컬 환경으로 개발서버 실행
npm run dev:local

# 프로덕션 환경으로 개발서버 실행
npm run dev:prod

# 프로덕션 환경으로 빌드
npm run build:prod
```

### 3. 환경설정 검증
```bash
# 현재 환경설정 유효성 검사
npm run env:validate
```

## 🔧 사용 가능한 스크립트

### 개발 서버
- `npm run dev` - 기본 개발서버 (test 환경)
- `npm run dev:local` - 로컬 환경으로 개발서버 실행
- `npm run dev:test` - 테스트 환경으로 개발서버 실행
- `npm run dev:prod` - 프로덕션 환경으로 개발서버 실행

### 빌드
- `npm run build` - 기본 빌드 (test 환경)
- `npm run build:local` - 로컬 환경으로 빌드
- `npm run build:test` - 테스트 환경으로 빌드  
- `npm run build:prod` - 프로덕션 환경으로 빌드

### 서버 시작
- `npm run start` - 기본 서버 시작 (test 환경)
- `npm run start:local` - 로컬 환경으로 서버 시작
- `npm run start:test` - 테스트 환경으로 서버 시작
- `npm run start:prod` - 프로덕션 환경으로 서버 시작

### 유틸리티
- `npm run env:setup` - env/.env.example에서 env/.env.local 생성
- `npm run env:validate` - 환경설정 검증
- `npm run env:clean` - 루트의 .env 파일 삭제

## 📝 코드에서 환경변수 사용

### 기본 사용법
```typescript
import { envConfig } from '@env/config';

// API URL 사용
console.log(envConfig.apiBaseUrl);

// 환경별 분기
if (envConfig.appEnv === 'production') {
  // 프로덕션 로직
}
```

### 유틸리티 함수 사용
```typescript
import { isProduction, isLocal, getApiUrl, logger } from '@env/config';

// 환경 체크
if (isProduction()) {
  // 프로덕션 전용 코드
}

// API URL 생성
const userApiUrl = getApiUrl('/users');

// 환경별 로깅
logger.debug('디버그 메시지');
logger.info('정보 메시지');
logger.error('에러 메시지');
```

## 📝 파일별 설명

- **`.env.example`**: 새로운 개발자가 참고할 수 있는 템플릿
- **`.env.local`**: 로컬 개발 환경 설정
- **`.env.test`**: 테스트 서버 환경 설정
- **`.env.production`**: 프로덕션 환경 설정

## ⚠️ 주의사항

### 보안
- 프론트엔드는 백엔드 API를 통해 데이터에 접근하므로 DB 연결 정보는 불필요합니다
- 프로덕션 배포시에는 CI/CD에서 환경변수를 주입하세요
- API 키나 민감한 정보는 반드시 안전하게 관리하세요

### Git 추적
- `.env` 파일은 Git에서 무시됩니다 (런타임에 생성됨)
- `env/` 폴더의 모든 파일은 Git에 추적됩니다 (템플릿으로 사용)
- 실제 시크릿 값은 로컬에서만 수정하여 사용하고 커밋하지 마세요
- 프로덕션 배포시에는 CI/CD에서 실제 값을 주입하세요

### 환경변수 우선순위
Next.js의 환경변수 로딩 우선순위:
1. `.env.local` (항상, .env*.local은 .gitignore에 추가되어야 함)
2. `.env.production`, `.env.test`, `.env.development` (NODE_ENV에 따라)
3. `.env`

## 🔍 환경별 설정 예시

### 로컬 개발 환경
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_AUTH_DOMAIN=localhost:3000
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 테스트 환경  
```env
NEXT_PUBLIC_API_BASE_URL=https://test-api.j-planner.com/api
NEXT_PUBLIC_AUTH_DOMAIN=test.j-planner.com
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 프로덕션 환경
```env
NEXT_PUBLIC_API_BASE_URL=https://api.j-planner.com/api
NEXT_PUBLIC_AUTH_DOMAIN=j-planner.com
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```
