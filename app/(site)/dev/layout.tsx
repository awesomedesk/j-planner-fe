import { notFound } from 'next/navigation';

import { devPagesEnabled } from '@env/devPages';

/** 개발용 화면 묶음 — 운영 빌드에서는 404 (#417 US-44 A02, PO 결정 4) */
export default function DevLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!devPagesEnabled()) notFound();
  return children;
}
