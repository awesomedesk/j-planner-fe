/**
 * 메일 링크가 아닌 화면 묶음 (달력·로그인·가입·비밀번호 찾기·dev) — US-33·35, D-079
 * 주소에 영향은 없고(괄호 폴더), 글꼴만 여기서 불러온다. 메일 링크 화면은 이 묶음 밖이라 바깥 리소스를 부르지 않는다.
 *
 * 글꼴: 화면기획서(캔버스)와 같은 IBM Plex Sans KR.
 * next/font/google은 빌드할 때 글꼴을 내려받아서 네트워크가 막힌 곳에서는 빌드가 실패한다.
 * 그래서 브라우저가 불러오게 두고, 못 불러오면 시스템 글꼴로 보인다 (globals.css).
 * React 19가 아래 <link>를 문서 <head>로 옮겨 준다.
 */
const FONT_STYLESHEET_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONT_STYLESHEET_URL} precedence="default" />
      {children}
    </>
  );
}
