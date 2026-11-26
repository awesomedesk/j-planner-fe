import { NextResponse, type NextRequest } from 'next/server';

import { apiOriginOf, buildContentSecurityPolicy, createNonce } from '@utils/security/csp';

const REPORT_ONLY = 'Content-Security-Policy-Report-Only';

/**
 * 화면 요청마다 CSP nonce를 만든다 (#417 US-44 A02, PO 결정 1 — nonce + Report-Only로 시작).
 * 같은 nonce를 요청 머리(x-nonce·CSP)로 넘기면 Next가 자기 스크립트에 nonce를 붙인다.
 * 지금은 위반을 막지 않고 브라우저 콘솔에 알리기만 한다. 실제 막기 전환은 배포 준비 때 정한다(🚧).
 * 고정 보안 헤더(nosniff·Referrer-Policy·X-Frame-Options·frame-ancestors)는 next.config.mjs headers().
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const policy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    apiOrigin: apiOriginOf(process.env.NEXT_PUBLIC_API_BASE_URL),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(REPORT_ONLY, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REPORT_ONLY, policy);
  return response;
}

export const config = {
  // API(BE가 헤더를 맡음)·Next 정적 파일·이미지·글꼴·아이콘은 빼고 화면 요청만
  matcher: [{ source: '/((?!api|_next/static|_next/image|fonts|favicon.ico).*)' }],
};
