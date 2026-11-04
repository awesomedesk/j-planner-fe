# Google Sans Medium 14.000 (구글 로그인 버튼 글꼴, 자체 호스팅, #341)

- 원본: GitHub `googlefonts/googlesans` 릴리스 **v14.000** `GoogleSans-v14.000.zip`
  (zip SHA-256 `d338f0e74f5eabead86a85b87edf4cc50cd6561196dbe173d1db4139e95b3ca7`, Google Fonts `ofl/googlesans/METADATA.pb`의 소스 커밋 `5c8f512`·archive_url과 같음)
- 파일: zip 속 `build/GoogleSans/static/GoogleSans-Medium.ttf` — **무변형 복사** (이름표: Google Sans Medium · Version 14.000 · usWeightClass 500). 해시는 `SHA256SUMS`
  - 웹용 woff2 배포본이 공식 릴리스에 없어서 TTF 그대로 둔다 (변환·잘라내기 안 함)
- CSS `google-sans.css`: `@font-face` 하나, `unicode-range` = 이 파일 cmap에 있는 글자에서 **공백 문자만 뺀 것**(한글은 원래 없음) →
  '구글로 계속하기'처럼 한글·공백만 있는 문구는 이 파일을 받지 않음. 'Google로 계속하기'처럼 라틴 글자가 있으면 받음(gzip 약 0.95MB, 한 번 받으면 immutable 캐시)
- 쓰는 곳: 구글 로그인 버튼(`components/auth/common/GoogleButton.tsx`, tailwind `font-google-button`)만. 한글은 IBM Plex Sans KR로 그린다
- 라이선스: `OFL.txt` (SIL OFL 1.1, 예약 글꼴 이름 없음 — 소스 커밋 `5c8f512`의 OFL.txt 그대로, Google Fonts 사본과 본문 같음.
  첫 줄 저작권 문구는 원본 그대로 'Google Sans Flex Project Authors 2022'이고, 글꼴 파일 이름표의 저작권은 'Copyright 2025 The Google Sans Project Authors')
- 상표: `TRADEMARKS.txt` — 'Google'·'Google Sans'는 Google LLC 상표. 서비스·회사·도메인 이름에 쓰지 않는다
- 버전을 올리면 새 폴더(`…/<새 버전>/`)를 만들고 layout의 주소를 바꾼다 (캐시가 immutable이라)
