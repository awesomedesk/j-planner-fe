/**
 * 메일 링크가 아닌 화면 묶음 (달력·로그인·가입·비밀번호 찾기·공개 화면·dev) — US-33·35, D-079
 * 주소에 영향은 없고(괄호 폴더), 글꼴만 여기서 불러온다. 메일 링크 화면은 이 묶음 밖이다.
 *
 * 글꼴: 화면기획서(캔버스)와 같은 IBM Plex Sans KR — 공식 1.1.0 split 파일을 같은 출처에서 준다 (#342, D-099).
 * 화면에 나온 글자 구간 파일만 받고(unicode-range), 못 받으면 시스템 글꼴로 먼저 보인다 (font-display: swap, globals.css).
 * 구글 로그인 버튼만 공식 Google Sans Medium 14.000(같은 출처, #341, D-097) — 라틴 글자가 있을 때만 파일을 받는다.
 * 외부(Google Fonts·GIS) 요청 없음. React 19가 아래 <link>를 문서 <head>로 옮겨 준다.
 */
const FONT_STYLESHEET_URL = "/fonts/ibm-plex-sans-kr/1.1.0/ibm-plex-sans-kr.css";
const GOOGLE_BUTTON_FONT_URL = "/fonts/google-sans/14.000/google-sans.css";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <link rel="stylesheet" href={FONT_STYLESHEET_URL} precedence="default" />
      <link rel="stylesheet" href={GOOGLE_BUTTON_FONT_URL} precedence="default" />
      {children}
    </>
  );
}
