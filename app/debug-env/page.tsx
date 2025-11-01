'use client';

import { envConfig } from '@env/config';

export default function DebugEnvPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>환경변수 디버그</h1>

      <h2>process.env (직접 접근)</h2>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        {JSON.stringify({
          NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
          NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
          NEXT_PUBLIC_AUTH_DOMAIN: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
        }, null, 2)}
      </pre>

      <h2>envConfig (config.ts를 통한 접근)</h2>
      <pre style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        {JSON.stringify({
          apiBaseUrl: envConfig.apiBaseUrl,
          appEnv: envConfig.appEnv,
          authDomain: envConfig.authDomain,
        }, null, 2)}
      </pre>
    </div>
  );
}
