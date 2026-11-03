# IBM Plex Sans KR 1.1.0 (자체 호스팅, #342)

- 원본: npm `@ibm/plex-sans-kr@1.1.0` (integrity sha512 확인), GitHub `IBM/plex` 태그 `@ibm/plex-sans-kr@1.1.0`
- 파일: `fonts/split/woff2/hinted/` 중 Regular·Medium·SemiBold·Bold(400·500·600·700) — **무변형 복사**. 해시는 `SHA256SUMS`
- CSS `ibm-plex-sans-kr.css`: 공식 `css/ibm-plex-sans-kr-all.css`의 split 글꼴 선언에서 위 4개 굵기만, url을 이 폴더로 바꾸고 `font-display: swap`을 더함
- 라이선스: `LICENSE.txt` (SIL OFL 1.1, Reserved Font Name "Plex"). 글꼴만 따로 팔지 않음. 고치거나 잘라 쓰면 'Plex' 이름을 못 씀 → 무변형만
- 버전을 올리면 새 폴더(`…/<새 버전>/`)를 만들고 layout의 주소를 바꾼다 (캐시가 immutable이라)
