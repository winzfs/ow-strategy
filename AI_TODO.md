# AI 작업 문서 / TODO

이 문서는 AI가 저장소를 다시 볼 때 바로 이어서 작업할 수 있도록 현재 구조와 남은 점검 항목을 정리한다.

## 작업 배경

이 저장소는 원래 `index owhub.html` 단일 파일에 화면, 스타일, Firebase 연동, 파티찾기 로직이 모두 들어가 있었다.
현재 진행 중인 작업은 기존 HTML을 유지보수 가능한 구조로 리팩토링하는 것이다.

목표 구조:

- `index.html`: 화면 뼈대만 담당
- `css/*`: 스타일 분리
- `js/index.js`: 메인 페이지 컨트롤러
- `js/party.js`: 파티 생성/신청/수락/종료
- `js/profile.js`: 프로필/별점
- `js/notification.js`: 알림/신청 상태
- `js/sanitize.js`: 사용자 입력 정규화/보안 처리
- `js/ui.js`: 공통 DOM/UI 헬퍼

중요: `index owhub.html`은 구버전 원본 또는 레거시 참고 파일로 보고, 최신 작업 기준은 `index.html + css/* + js/*` 구조다.
단, 리팩토링 누락 기능이 있을 수 있으므로 구버전 파일을 바로 삭제하지 말고 기능 대조 후 정리한다.

## 현재 확인한 최신 구조

- `index.html`: OWHub 메인 화면. 파티찾기, 내 정보, 알림, 디스코드 CTA 진입점.
- `css/index.css`: 메인 스타일 진입 파일. `variables.css`, `common.css`, `layout.css`, `party.css`, `enhancements.css`를 import.
- `js/index.js`: 메인 페이지 컨트롤러. 인증, 프로필, 파티 목록, 파티 생성, 신청/알림 UI를 연결.
- `js/party.js`: 파티 생성, 신청, 수락, 종료 로직.
- `js/profile.js`: 프로필 저장, 별점 평가 로직.
- `js/notification.js`: 신청/알림 상태 관리.
- `js/sanitize.js`: 사용자 입력 정규화 및 HTML escape 유틸.
- `js/ui.js`: 공통 UI/DOM 유틸.
- `index owhub.html`: 구버전 단일 파일. 리팩토링 대조용으로만 참고.

## 이미 개선되어 있는 부분

- 구버전 단일 HTML과 달리 최신 구조는 HTML/CSS/JS가 분리되어 있음.
- `sanitize.js`에 `escapeHTML`, `normalizeText`, `normalizeBattleTag`, `isValidBattleTag`가 있음.
- `party.js`의 `acceptMatch()`는 `runTransaction()`으로 파티 수락 동시성 처리를 하고 있음.
- `profile.js`의 `rateUser()`는 `ratings` 컬렉션과 transaction으로 중복 평가 방지를 하고 있음.
- `createMatchRequest()`는 `user.uid + postId` 기반 고정 match id를 사용해 무한 중복 문서 생성을 어느 정도 막고 있음.

## 리팩토링 대조 TODO

### A. 구버전 기능 → 최신 구조 이식 여부 확인

`index owhub.html`에 있던 기능이 최신 구조로 모두 옮겨졌는지 하나씩 대조한다.

- [ ] 파티 모집 폼: 배틀태그, 포지션, 티어, 세부 티어, 최대 인원, 설명.
- [ ] 파티 목록 렌더링: 파티장명, 별점, 생성 시간, 포지션, 티어, 인원, 설명, 신청/마감/종료 버튼.
- [ ] 포지션/티어 다중 필터.
- [ ] 파티 카드 안의 포지션/티어 클릭 시 필터 적용.
- [ ] 내 정보: 배틀태그, 탱커/딜러/지원 티어 저장.
- [ ] 알림: 받은 신청, 보낸 신청, 수락/거절/취소 흐름.
- [ ] 파티 수락 후 members 추가.
- [ ] 팀원 평가 UI와 평가 완료 상태.
- [ ] 실시간 활동 지수/모집 중 파티 수 표시.
- [ ] 디스코드 CTA 링크/상태 문구.
- [ ] 모바일 사이드바/햄버거 메뉴.
- [ ] SEO 메타 태그/OG 이미지/사이트 인증 태그.
- [ ] footer 이용약관/개인정보 처리방침 링크.

### B. 구버전에서 버려도 되는 기능/로직 표시

- [ ] 실제 접속자 수처럼 보일 수 있는 부스트 로직은 제거하거나 `활동 지수` 표현으로만 유지.
- [ ] 구버전 inline style 중 최신 CSS로 이미 대체된 것은 이식하지 않음.
- [ ] 구버전 전역 `window.*` 함수는 최신 모듈 구조에서는 되도록 사용하지 않음.
- [ ] 구버전 `innerHTML` 렌더링 패턴은 그대로 옮기지 말고 DOM 생성/textContent 방식으로 교체.

## TODO: 우선순위 높음

### 1. 신청 중복/재신청 정책 확정

현재 `createMatchRequest()`는 `matchId = user.uid + '_' + postId`를 사용하고 `setDoc(..., { merge: false })`로 저장한다. 이 방식은 같은 유저가 같은 파티에 여러 개의 문서를 만들지는 않지만, 기존 신청 문서를 덮어쓸 수 있다.

- [ ] pending 상태인 기존 신청이 있으면 새 신청을 막기.
- [ ] accepted 상태인 기존 신청이 있으면 새 신청을 막기.
- [ ] rejected/removed 상태는 재신청 허용 여부 결정.
- [ ] 가능하면 `runTransaction()`으로 기존 match 상태 확인 후 생성.
- [ ] UI에서도 "이미 신청됨", "이미 참여 중" 메시지를 명확히 표시.

### 2. Firestore 보안 규칙 점검

클라이언트 코드가 개선되어도 Firestore rules가 약하면 콘솔에서 임의 조작이 가능하다.

- [ ] `parties` 생성은 로그인 사용자만 허용.
- [ ] `parties.uid`는 `request.auth.uid`와 같아야 함.
- [ ] 파티 종료는 파티장 또는 관리자만 허용.
- [ ] `matches.fromUid`는 `request.auth.uid`와 같아야 함.
- [ ] 신청 수락은 해당 파티장만 허용.
- [ ] `ratings`는 본인이 본인을 평가하지 못하게 제한.
- [ ] 같은 `ratingId` 재생성/덮어쓰기 방지.
- [ ] description/message 길이 제한을 rules에서도 검증.

### 3. 사용자 입력 렌더링 재점검

`sanitize.js`는 존재하지만, 모든 렌더링 지점이 안전한지 확인 필요.

- [ ] `innerHTML`을 사용하는 부분 전수 검색.
- [ ] 사용자 입력값 `btag`, `desc`, `message`, 커뮤니티 글/댓글은 `textContent` 또는 `escapeHTML()`만 사용.
- [ ] `optionList()`처럼 제한된 상수 배열만 HTML 문자열로 넣는 곳과 사용자 입력을 분리.
- [ ] 구버전 `index owhub.html`은 배포/참조 대상에서 제외하거나 삭제 후보로 표시.

### 4. 파티 만료 처리

`expiresAt` 필드는 있지만 자동 정리/표시 정책 확인 필요.

- [ ] 만료된 파티는 목록에서 숨김 처리.
- [ ] 만료 파티 신청 버튼 비활성화.
- [ ] 필요하면 Cloud Function 없이 클라이언트에서 `expiresAt < Date.now()` 필터링.
- [ ] 만료된 파티를 파티장이 다시 갱신할 수 있는 UX 검토.

### 5. 접속자/활동 지수 문구 신뢰성 점검

구버전에는 실제 접속자 수에 가중치를 더하는 표시 로직이 있었다. 최신 구조에서도 활동 지수가 실제 접속자처럼 오해되지 않도록 확인한다.

- [ ] `activity-count`가 실제 수인지, 활동 지수인지 명확히 분리.
- [ ] 실제 수가 아니면 "접속자 수" 대신 "활동 지수"로만 표현.
- [ ] 개인정보/신뢰성 문제 없도록 과장 문구 제거.

## TODO: 중간 우선순위

### 6. 설정값 정리

- [ ] `APP_CONFIG.supportEmail` 입력.
- [ ] `APP_CONFIG.discordInviteUrl` 입력.
- [ ] Firebase config는 public key이지만, secret이 들어가지 않았는지 재확인.
- [ ] 관리자 이메일을 코드에 하드코딩하지 않고 config/rules와 일관되게 관리할 방법 검토.

### 7. 레거시 파일 정리

- [ ] `index owhub.html`에서 최신 구조로 아직 안 옮겨진 기능이 있는지 대조.
- [ ] 모두 이식 완료되면 `legacy/`로 이동하거나 삭제.
- [ ] 남겨야 한다면 파일 상단에 `LEGACY - DO NOT EDIT / 최신 작업은 index.html + js/* 기준` 주석 추가.

### 8. 테스트 체크리스트 추가

- [ ] 비로그인 상태에서 파티 생성/신청/프로필 저장 버튼 동작 확인.
- [ ] 같은 파티에 중복 신청 시나리오 확인.
- [ ] 파티 정원 초과 직전 동시 수락 확인.
- [ ] 이미 평가한 대상 재평가 방지 확인.
- [ ] 모바일에서 사이드바, 필터, 신청 모달 확인.
- [ ] 이미지 경로 `img/*.png`, `img/*.webp` 누락 확인.

## 다음 AI 작업 시작 지점

1. `index owhub.html`과 `index.html/js/index.js/js/party.js/js/profile.js/js/notification.js`를 기능 단위로 대조한다.
2. 누락된 기능이 있으면 최신 모듈 구조에 맞춰 이식한다.
3. `js/party.js`의 `createMatchRequest()`를 transaction 기반으로 바꾼다.
4. `js/index.js`에서 `innerHTML` 사용 지점을 확인하고 사용자 입력값은 DOM 생성/textContent 방식으로 교체한다.
5. Firestore rules 파일이 저장소에 있는지 찾고, 없으면 `firestore.rules` 초안을 만든다.
6. 이식 완료 후 `index owhub.html`을 legacy 처리한다.
