import "./globals.css";
import ReduxApp from "@utils/store/ReduxApp";
import ThemeProvider from "@components/theme/ThemeProvider";
import NoticeCenter from "@components/notice/NoticeCenter";
import ServerStatusCheck from "@components/notice/ServerStatusCheck";
import AppDataLoader from "@components/app/AppDataLoader";

export const metadata = {
  title: "J's Planner",
  description: "MBTI J를 위한 플래너",
};

/**
 * 글꼴: 화면기획서(캔버스)와 같은 IBM Plex Sans KR.
 * next/font/google은 빌드할 때 글꼴을 내려받아서 네트워크가 막힌 곳에서는 빌드가 실패한다.
 * 그래서 브라우저가 불러오게 두고, 못 불러오면 시스템 글꼴로 보인다 (globals.css).
 */
const FONT_STYLESHEET_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONT_STYLESHEET_URL} />
      </head>
      <body>
        <ReduxApp>
          <ThemeProvider>
            {children}
            <NoticeCenter />
            <ServerStatusCheck />
            <AppDataLoader />
          </ThemeProvider>
        </ReduxApp>
      </body>
    </html>
  );
}
