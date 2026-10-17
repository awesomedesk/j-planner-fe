/**
 * 개발 서버가 `/api/**`를 BE로 넘긴다 (US-34, 08 13-1).
 * 브라우저는 FE 주소(localhost:3000)로만 부르므로 세션·CSRF 쿠키가 같은 주소에 붙고 CORS가 필요 없다.
 * BE 주소는 서버 쪽 환경 변수 `API_PROXY_TARGET` (예: http://localhost:8080). 없으면 넘기지 않는다
 * (운영은 앞단 서버가 FE와 API를 같은 주소로 묶는다).
 */
const apiProxyTarget = () => (process.env.API_PROXY_TARGET || '').replace(/\/+$/, '');

/**
 * 메일 링크 화면 — 주소에 토큰이 있으므로 Referer로 새지 않게 (US-33·35, D-079 · 11 문서)
 */
const MAIL_LINK_PAGES = ['/signup/verify', '/password/reset'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const target = apiProxyTarget();
    return target ? [{ source: '/api/:path*', destination: `${target}/api/:path*` }] : [];
  },
  async headers() {
    return MAIL_LINK_PAGES.map((source) => ({ source, headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] }));
  },
};

export default nextConfig;
