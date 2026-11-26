/**
 * 개발용 화면 `/dev/*`를 열어도 되는지 (#417 US-44 A02, PO 결정 4 — 개발(local·test)에서만).
 * `next build`로 만든 결과물(NODE_ENV=production)에서는 어느 APP_ENV든 닫는다. 운영 설정(APP_ENV=production)도 닫는다.
 */
export const devPagesEnabled = (
  nodeEnv: string | undefined = process.env.NODE_ENV,
  appEnv: string | undefined = process.env.NEXT_PUBLIC_APP_ENV,
): boolean => nodeEnv !== 'production' && (appEnv ?? 'test') !== 'production';
