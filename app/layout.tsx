import "./globals.css";
import ReduxApp from "@utils/store/ReduxApp";
import ThemeProvider from "@components/theme/ThemeProvider";
import NoticeCenter from "@components/notice/NoticeCenter";
import ServerStatusCheck from "@components/notice/ServerStatusCheck";

export const metadata = {
  title: "J's Planner",
  description: "MBTI J를 위한 플래너",
};

/**
 * 맨 바깥 레이아웃 — 모든 화면 공통. 바깥 리소스(글꼴 등)를 부르지 않는다.
 * 메일 링크 화면(/signup/verify, /password/reset)은 주소에 토큰이 있어서 바깥으로 아무것도 부르지 않게 한다 (US-33·35, D-079).
 * 글꼴은 그 밖의 화면 묶음 `app/(site)/layout.tsx`에서 불러온다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ReduxApp>
          <ThemeProvider>
            {children}
            <NoticeCenter />
            <ServerStatusCheck />
          </ThemeProvider>
        </ReduxApp>
      </body>
    </html>
  );
}
