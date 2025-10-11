"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { defaultTheme } from '@components/theme/theme_color';

const inter = Inter({ subsets: ["latin"] });

// Redux 앱을 완전히 클라이언트 전용으로 처리
const ReduxApp = dynamic(() => import('@utils/store/ReduxApp'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen" style={{ backgroundColor: defaultTheme.themeColor.Light }}>
      <div className="w-full">
        <div style={{ height: '60px', backgroundColor: defaultTheme.themeColor.Dark }}></div>
        <main className="w-full p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading application...</div>
          </div>
        </main>
      </div>
    </div>
  )
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="ko">
      <head>
        <title>J&apos;s Planner</title>
        <meta name="description" content="Describe your specific world" />
      </head>
      <body className={inter.className}>
        {mounted ? (
          <ReduxApp>{children}</ReduxApp>
        ) : (
          <div className="flex min-h-screen" style={{ backgroundColor: defaultTheme.themeColor.Light }}>
            <div className="w-full">
              <div style={{ height: '60px', backgroundColor: defaultTheme.themeColor.Dark }}></div>
              <main className="w-full p-4">
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading application...</div>
                </div>
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
};
  
