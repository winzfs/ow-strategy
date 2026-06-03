# OW Hub AI 개발 가이드

이 문서는 OW Hub 저장소에서 AI 또는 개발자가 코드를 작성·수정할 때 반드시 따라야 하는 기준입니다.
목표는 **유지보수하기 쉽고, 확장하기 쉽고, 디자인 일관성이 유지되는 코드베이스**를 만드는 것입니다.

---

## 1. 핵심 원칙

### 1.1 한 파일에 너무 많은 책임을 넣지 않는다

하나의 파일은 하나의 주요 책임만 가져야 합니다.

나쁜 예:

```txt
index.html 안에 HTML, CSS, Firebase 설정, 로그인, 파티 등록, 알림, 평점, 커뮤니티, 접속자 수 로직이 모두 들어감
```

좋은 예:

```txt
index.html        → 화면 구조
css/common.css    → 공통 디자인
css/party.css     → 파티찾기 전용 스타일
js/firebase.js    → Firebase 초기화
js/auth.js        → 로그인/회원가입
js/party.js       → 파티 모집/신청/수락
js/profile.js     → 유저 프로필
js/notification.js→ 알림
js/sanitize.js    → 사용자 입력값 정리
```

권장 기준:

- HTML 파일은 가능한 한 구조만 담당한다.
- CSS는 화면별/공통별로 분리한다.
- JavaScript는 기능 단위로 분리한다.
- 한 파일이 300~400줄을 넘기기 시작하면 분리를 검토한다.
- 한 함수가 50줄을 넘기면 역할을 나누는 것을 검토한다.

---

## 2. 권장 폴더 구조

현재 정적 HTML 기반을 유지하더라도 아래 구조를 우선 목표로 한다.

```txt
/
├─ index.html
├─ commu.html
├─ tiermaker.html
├─ docs/
│  └─ AI_CODING_GUIDE.md
├─ css/
│  ├─ variables.css
│  ├─ common.css
│  ├─ layout.css
│  ├─ party.css
│  ├─ community.css
│  └─ tiermaker.css
├─ js/
│  ├─ firebase.js
│  ├─ config.js
│  ├─ auth.js
│  ├─ party.js
│  ├─ profile.js
│  ├─ notification.js
│  ├─ community.js
│  ├─ presence.js
│  ├─ tiermaker.js
│  ├─ ui.js
│  └─ sanitize.js
├─ img/
│  ├─ logo.jpg
│  ├─ tank.png
│  ├─ dps.png
│  ├─ sup.png
│  └─ heroes/
└─ firebase/
   └─ firestore.rules
```

### 2.1 파일별 책임

| 파일 | 책임 |
|---|---|
| `css/variables.css` | 색상, 간격, 폰트, z-index 등 디자인 토큰 |
| `css/common.css` | 버튼, 입력창, 카드, 모달 등 공통 UI |
| `css/layout.css` | 네비게이션, 사이드바, 컨테이너, 반응형 레이아웃 |
| `css/party.css` | 파티찾기 화면 전용 스타일 |
| `css/community.css` | 커뮤니티 화면 전용 스타일 |
| `js/firebase.js` | Firebase app, auth, db 초기화만 담당 |
| `js/config.js` | 공개 가능한 설정값만 보관 |
| `js/auth.js` | 로그인, 회원가입, 로그아웃, 이메일 인증 |
| `js/party.js` | 파티 등록, 목록, 신청, 수락, 종료 |
| `js/profile.js` | 배틀태그, 포지션별 티어, 평점 표시 |
| `js/notification.js` | 알림 목록, 신청 상태, 새 알림 배지 |
| `js/community.js` | 게시글, 댓글, 추천, 삭제 |
| `js/presence.js` | 접속자/활동 상태 표시 |
| `js/ui.js` | 사이드바, 모달, 탭, 토스트 등 UI 동작 |
| `js/sanitize.js` | 사용자 입력 escape, 검증 유틸 |

---

## 3. 코드 작성 규칙

### 3.1 사용자 입력은 절대 그대로 HTML에 넣지 않는다

사용자가 입력하는 값은 항상 XSS 방어 처리를 해야 합니다.

대상:

- 배틀태그
- 파티 모집 설명
- 신청 메시지
- 커뮤니티 제목
- 커뮤니티 본문
- 댓글
- 닉네임/프로필 값

금지:

```js
list.innerHTML += `<p>${userInput}</p>`;
```

허용 1: `textContent` 사용

```js
const p = document.createElement('p');
p.textContent = userInput;
container.appendChild(p);
```

허용 2: escape 함수 사용

```js
export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
```

---

### 3.2 전역 함수 남발 금지

기존 코드처럼 `window.renderList`, `window.delPost`를 계속 추가하면 충돌이 생기기 쉽습니다.

가능하면 기능별 모듈 안에 함수로 분리합니다.

예외적으로 HTML `onclick`에서 필요해 전역에 노출해야 하는 경우:

```js
window.OWHub = window.OWHub || {};
window.OWHub.party = {
  openRequestModal,
  acceptMatch,
  closeParty,
};
```

이처럼 네임스페이스를 사용합니다.

---

### 3.3 매직 넘버와 색상 하드코딩 최소화

금지:

```css
background: #ff9c00;
border-radius: 12px;
z-index: 9999;
```

권장:

```css
:root {
  --color-accent: #ff9c00;
  --radius-md: 12px;
  --z-debug: 9000;
}

.button-primary {
  background: var(--color-accent);
  border-radius: var(--radius-md);
}
```

---

### 3.4 에러 처리는 사용자 메시지와 개발자 로그를 분리한다

```js
try {
  await saveParty(data);
  showToast('파티 모집을 시작했습니다.');
} catch (error) {
  console.error('[party:create]', error);
  showToast('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
}
```

사용자에게 `error.message`를 그대로 노출하지 않습니다.

---

## 4. 디자인 시스템 규칙

OW Hub는 오버워치 느낌의 어두운 배경과 오렌지 포인트를 유지합니다.
모든 화면은 같은 디자인 토큰을 공유해야 합니다.

### 4.1 기본 디자인 토큰

```css
:root {
  --color-bg: #111111;
  --color-surface: #1a1a1a;
  --color-surface-2: #252525;
  --color-border: #333333;
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-accent: #ff9c00;

  --color-tank: #00a2ff;
  --color-dps: #ff3c3c;
  --color-support: #00ff7b;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 20px;
  --space-xl: 30px;

  --font-main: 'Noto Sans KR', system-ui, sans-serif;
}
```

### 4.2 공통 컴포넌트 이름

| 컴포넌트 | 클래스명 |
|---|---|
| 기본 버튼 | `.btn` |
| 주요 버튼 | `.btn-primary` |
| 보조 버튼 | `.btn-secondary` |
| 위험 버튼 | `.btn-danger` |
| 카드/박스 | `.card` |
| 입력창 | `.form-input` |
| 모달 배경 | `.modal-overlay` |
| 모달 내용 | `.modal-panel` |
| 뱃지 | `.badge` |
| 포지션 뱃지 | `.badge-role` |
| 티어 뱃지 | `.badge-tier` |
| 빈 상태 | `.empty-state` |
| 토스트 | `.toast` |

### 4.3 인라인 스타일 최소화

금지:

```html
<div style="background:#222; padding:20px; border-radius:15px;">
```

권장:

```html
<div class="card card-highlight">
```

```css
.card-highlight {
  background: var(--color-surface-2);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
}
```

---

## 5. 기능 설계 규칙

### 5.1 파티 모집

파티 문서에는 최소한 아래 필드를 둡니다.

```js
{
  uid: string,
  btag: string,
  pos: '탱커' | '딜러' | '지원',
  tier: string,
  tierNum: string,
  maxp: number,
  desc: string,
  members: [],
  deleted: false,
  createdAt: number,
  expiresAt: number,
  updatedAt: number
}
```

권장:

- `expiresAt`을 추가해 오래된 모집글 자동 만료
- 한 유저가 동시에 여러 활성 파티를 만들지 못하게 제한
- 파티 수락은 트랜잭션으로 처리
- 정원 초과는 클라이언트가 아니라 DB 규칙/트랜잭션에서 막기

---

### 5.2 신청/알림

중복 신청 방지를 위해 문서 ID를 고정합니다.

```js
const matchId = `${fromUid}_${postId}`;
```

문서 예시:

```js
{
  fromUid: string,
  toUid: string,
  postId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled',
  message: string,
  createdAt: number,
  updatedAt: number
}
```

---

### 5.3 평점

평점은 직접 `rateTotal`, `rateCount`를 클라이언트에서 마음대로 수정하지 않도록 합니다.

권장 구조:

```txt
ratings/{fromUid_toUid_postId}
```

```js
{
  fromUid: string,
  toUid: string,
  postId: string,
  score: number,
  createdAt: number
}
```

규칙:

- 같은 파티에서 한 대상에게 한 번만 평가
- 실제 파티 참여자만 평가 가능
- 점수는 1~5만 허용
- 평균 평점은 트랜잭션 또는 서버 함수로 갱신

---

### 5.4 커뮤니티

게시글/댓글은 신고와 삭제 상태를 고려해 설계합니다.

게시글 예시:

```js
{
  uid: string,
  author: string,
  title: string,
  content: string,
  likes: [],
  commentCount: 0,
  reportCount: 0,
  deleted: false,
  createdAt: number,
  updatedAt: number
}
```

댓글 예시:

```js
{
  postId: string,
  uid: string,
  author: string,
  content: string,
  deleted: false,
  createdAt: number
}
```

---

## 6. Firebase / Firestore 보안 원칙

클라이언트 코드는 조작될 수 있다는 전제로 작성합니다.
따라서 진짜 권한 검사는 Firestore Rules에서 해야 합니다.

### 6.1 클라이언트에서만 막으면 안 되는 것

- 본인 글만 삭제 가능
- 관리자만 삭제 가능
- 파티 정원 초과 방지
- 같은 유저 중복 신청 방지
- 같은 대상 중복 평가 방지
- 평점 점수 범위 제한
- 이메일 인증 유저만 글쓰기

### 6.2 권장 Rules 방향

- 로그인한 유저만 글쓰기 가능
- `request.auth.uid == resource.data.uid` 검증
- 관리자 여부는 이메일보다 UID 또는 custom claims 권장
- 생성 가능한 필드를 제한
- 수정 가능한 필드를 제한
- `createdAt`, `uid` 같은 핵심 필드 변조 방지

---

## 7. 렌더링 규칙

### 7.1 반복 렌더링에서 `innerHTML +=` 사용 금지

금지:

```js
items.forEach(item => {
  list.innerHTML += renderItem(item);
});
```

문제:

- 느림
- 이벤트가 초기화될 수 있음
- XSS 위험 증가
- 디버깅 어려움

권장:

```js
const fragment = document.createDocumentFragment();
items.forEach(item => {
  fragment.appendChild(createItemElement(item));
});
list.replaceChildren(fragment);
```

---

### 7.2 빈 상태 UI를 통일한다

```html
<div class="empty-state">
  조건에 맞는 파티가 없습니다.
</div>
```

빈 상태 문구는 화면마다 톤을 맞춥니다.

- 파티 없음: `조건에 맞는 파티가 없습니다.`
- 알림 없음: `새 알림이 없습니다.`
- 댓글 없음: `아직 댓글이 없습니다.`
- 내 글 없음: `작성한 글이 없습니다.`

---

## 8. 반응형 / 모바일 규칙

OW Hub는 모바일 사용자가 많다는 전제로 작성합니다.

필수 기준:

- 버튼 최소 높이 40px 이상
- 터치 영역 최소 40px 이상
- 폼 입력창은 한 손 조작 가능하게 배치
- 모달은 작은 화면에서 스크롤 가능해야 함
- 사이드바/모달은 닫기 버튼과 바깥 클릭 닫기 모두 지원
- 가로 스크롤이 생기지 않게 `overflow-x: hidden` 남발보다 원인을 수정

---

## 9. 운영 환경 규칙

### 9.1 디버그 UI는 기본 숨김

운영 서비스에 디버그 콘솔이나 테스트 버튼이 노출되면 안 됩니다.

```html
<div id="debug-console" hidden></div>
```

또는:

```js
const IS_DEBUG = location.search.includes('debug=1');
```

### 9.2 사용자에게 내부 에러를 그대로 보여주지 않는다

금지:

```js
alert(error.message);
```

권장:

```js
console.error(error);
showToast('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
```

### 9.3 실제 수치와 연출 수치를 구분한다

접속자 수, 리뷰 수, 평점 등은 사용자 신뢰와 연결됩니다.
보정된 수치를 쓸 경우 `실시간 활동 지수`처럼 표현을 조정합니다.

---

## 10. AI 작업 절차

AI가 이 저장소에서 코드를 수정할 때는 아래 순서를 따릅니다.

1. 관련 파일을 먼저 읽는다.
2. 현재 구조와 영향 범위를 파악한다.
3. 기존 디자인 토큰과 클래스명을 확인한다.
4. 같은 기능이 이미 있는지 검색한다.
5. 새 코드는 가능한 한 별도 파일/함수로 분리한다.
6. 사용자 입력값은 반드시 sanitize 처리한다.
7. Firestore 쓰기는 권한/중복/동시성을 고려한다.
8. 모바일 화면에서 깨질 가능성을 확인한다.
9. 수정 후 어떤 파일을 왜 바꿨는지 요약한다.
10. 임시 코드, 디버그 코드, 중복 코드를 남기지 않는다.

---

## 11. 커밋 전 체크리스트

코드 변경 전후로 아래 항목을 확인합니다.

### 구조

- [ ] 한 파일이 지나치게 커지지 않았는가?
- [ ] 기능별로 JS 파일이 분리되어 있는가?
- [ ] 공통 스타일과 화면별 스타일이 분리되어 있는가?
- [ ] 중복 함수/중복 CSS가 늘어나지 않았는가?

### 보안

- [ ] 사용자 입력을 그대로 `innerHTML`에 넣지 않았는가?
- [ ] 본인/관리자 권한 검증이 Firestore Rules에서도 가능한 구조인가?
- [ ] 평점, 삭제, 수락 같은 중요 액션이 클라이언트 조작에 취약하지 않은가?

### UX

- [ ] 모바일에서 버튼이 너무 작지 않은가?
- [ ] 에러 메시지가 사용자 친화적인가?
- [ ] 빈 상태 UI가 있는가?
- [ ] 로딩/처리 중 상태가 필요한 곳에 있는가?

### 디자인

- [ ] 색상은 CSS 변수로 관리되는가?
- [ ] 버튼/카드/모달 스타일이 기존과 일관적인가?
- [ ] 인라인 스타일이 과도하게 늘어나지 않았는가?

### 운영

- [ ] 디버그 UI가 노출되지 않는가?
- [ ] 테스트 계정/관리자 이메일이 불필요하게 노출되지 않는가?
- [ ] SEO 문구가 실제 서비스 상태와 맞는가?

---

## 12. 우선 리팩토링 순서

현재 코드 기준으로는 아래 순서를 권장합니다.

1. 운영 화면에서 디버그 콘솔 숨기기
2. `sanitize.js` 추가 후 사용자 입력 렌더링 전부 escape 처리
3. `css/variables.css`, `css/common.css` 분리
4. `js/firebase.js`, `js/auth.js` 분리
5. 파티 관련 로직을 `js/party.js`로 분리
6. 커뮤니티 로직을 `js/community.js`로 분리
7. `onSnapshot` 구독 해제 구조 추가
8. 파티 수락/평점 로직 트랜잭션화
9. 파티 자동 만료 `expiresAt` 추가
10. Firestore Rules 문서화 및 적용

---

## 13. 문서 업데이트 규칙

구조, 디자인 시스템, 데이터 모델이 바뀌면 이 문서를 함께 업데이트합니다.
AI가 큰 기능을 추가할 때도 이 문서를 먼저 확인하고, 필요한 경우 수정해야 합니다.

이 문서는 단순 참고용이 아니라 **OW Hub 코드 작성 기준서**입니다.
