# OW Hub AI 개발 가이드

마지막 갱신: 2026-06-04

이 문서는 OW Hub 저장소에서 AI 또는 개발자가 코드를 작성·수정할 때 반드시 따라야 하는 기준입니다. 목표는 **서비스가 깨지지 않고, 유지보수하기 쉽고, 디자인 일관성이 유지되는 코드베이스**를 만드는 것입니다.

현재 세부 상태는 반드시 `docs/CURRENT_STATUS.md`를 함께 확인하세요.

---

## 0. 현재 프로젝트 상태 요약

OW Hub는 기존 단일 HTML 중심 구조에서 **정적 HTML + 분리된 CSS/JS 모듈 구조**로 전환 중입니다.

현재 메인 페이지는 다음 구조를 사용합니다.

```txt
index.html       → 메인 파티찾기 화면 구조 + 최소 fallback 마크업
css/index.css    → 메인 CSS 진입점
js/index.js      → 메인 통합 컨트롤러
```

Vercel Git 자동배포는 다시 켜진 상태입니다. `vercel.json`에는 더 이상 `git.deploymentEnabled: false`가 없습니다.

---

## 1. 현재 반드시 알아야 할 구조

### 1.1 HTML

`index.html`은 완전히 빈 shell이 아닙니다. 현재는 JS가 실패해도 최소 UI가 보이도록 아래 fallback 마크업을 포함합니다.

- 사이드바 로그인 영역
- 파티 모집 폼
- 포지션/티어 필터 버튼
- 파티 신청 모달
- footer/legal link

주의:

- fallback 마크업을 함부로 제거하지 마세요.
- 제거하려면 먼저 `index.js` 또는 분리된 UI 모듈만으로 모바일 smoke test를 통과해야 합니다.

### 1.2 CSS

현재 메인 CSS import 순서:

```css
@import url('./variables.css');
@import url('./common.css');
@import url('./layout.css');
@import url('./party.css');
@import url('./enhancements.css');
@import url('./polish.css');
```

파일별 역할:

| 파일 | 역할 |
|---|---|
| `variables.css` | 색상, 간격, 폰트, z-index 등 디자인 토큰 |
| `common.css` | 버튼, 입력창, 카드, 모달, 토스트 등 공통 UI |
| `layout.css` | 상단바, 사이드바, 페이지 전환, 공통 레이아웃 |
| `party.css` | 파티찾기 화면 전용 스타일 |
| `enhancements.css` | 리팩토링 후 보강 UI |
| `polish.css` | 마지막 override 레이어, 상용 UI polish |

현재 테마는 **화이트/크림 기반 + 오렌지 포인트 + 상용 커뮤니티 카드형 UI**입니다.

중요:

- `polish.css`가 마지막에 로드되므로 같은 selector가 있으면 `polish.css`가 이깁니다.
- UI 실험은 우선 `polish.css`에서 진행하고, 안정화 후 원래 파일로 병합합니다.
- 장기적으로는 `polish.css` 내용을 `common.css`, `layout.css`, `party.css`에 흡수해 중복 selector를 줄여야 합니다.

### 1.3 JavaScript

핵심 모듈:

```txt
js/firebase.js        Firebase 초기화
js/config.js          공개 설정, 티어/포지션/아이콘/제한값
js/auth.js            로그인/회원가입/로그아웃/비밀번호 초기화
js/party.js           파티 생성/신청/수락/종료
js/profile.js         프로필/평점/중복 평가 방지
js/notification.js    매칭 신청 알림
js/presence.js        접속 상태/활동 지수
js/ui.js              공통 DOM/UI helper
js/sanitize.js        입력값 정규화/XSS 방어
js/index.js           메인 페이지 통합 컨트롤러
```

현재 서비스 안정화를 위해 아래 fallback 모듈도 로드됩니다.

```txt
js/sidebar-fallback.js
js/auth-fallback.js
js/party-compose-fallback.js
js/party-list-fallback.js
```

fallback 역할:

| 파일 | 역할 |
|---|---|
| `sidebar-fallback.js` | 햄버거 메뉴 열기/닫기 보장 |
| `auth-fallback.js` | 로그인/회원가입/비번찾기/로그아웃 보장 |
| `party-compose-fallback.js` | 모집글 등록 보장 |
| `party-list-fallback.js` | 파티 목록 실시간 표시 보장 |

주의:

- 현재 fallback 모듈은 서비스 가용성을 위한 안전장치입니다.
- `index.js`가 정상화되기 전까지 삭제하지 마세요.
- 다만 장기적으로는 중복 이벤트/중복 렌더 가능성이 있으므로, 기능별 UI 모듈로 통합해야 합니다.

---

## 2. 핵심 개발 원칙

### 2.1 한 파일에 너무 많은 책임을 넣지 않는다

`index.js`는 이미 큽니다. 새 기능을 계속 붙이지 말고 아래처럼 분리하는 것을 우선 검토합니다.

```txt
js/auth-ui.js
js/sidebar-ui.js
js/party-form-ui.js
js/party-list-ui.js
js/filter-ui.js
js/match-ui.js
js/profile-ui.js
```

목표:

- `index.js`는 초기화와 모듈 연결만 담당
- 각 UI 모듈은 자기 DOM 렌더링과 이벤트만 담당
- 데이터 쓰기/읽기는 `auth.js`, `party.js`, `profile.js`, `notification.js` 같은 기능 모듈에 유지

### 2.2 fallback 제거는 테스트 후 진행한다

fallback 제거 전 필수 확인:

- 모바일 햄버거 메뉴 열림/닫힘
- 로그인/회원가입/비밀번호 찾기/로그아웃
- 로그인 후 모집글 등록
- 등록 후 목록 즉시 표시
- 본인 글 모집 종료
- 비로그인 신청 시 로그인 안내
- 파티 신청 모달 열림/닫힘
- 신청 수락/거절

### 2.3 사용자 입력은 절대 그대로 HTML에 넣지 않는다

사용자 입력값:

- 배틀태그
- 파티 모집 설명
- 신청 메시지
- 커뮤니티 제목/본문/댓글
- 닉네임/프로필 값

금지:

```js
list.innerHTML += `<p>${userInput}</p>`;
```

권장:

```js
const p = document.createElement('p');
p.textContent = userInput;
container.appendChild(p);
```

`innerHTML`은 정적 마크업에만 제한적으로 사용합니다.

### 2.4 전역 함수 남발 금지

전역 노출이 필요한 경우 `window.OWHub` 네임스페이스를 사용합니다.

```js
window.OWHub = window.OWHub || {};
window.OWHub.main = {
  openRequestModal,
  closeRequestModal,
};
```

### 2.5 사용자 메시지와 개발자 로그를 분리한다

```js
try {
  await createParty(data);
  showToast('파티 모집글을 등록했습니다.', 'success');
} catch (error) {
  console.error('[party:create]', error);
  showToast('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
}
```

사용자에게 내부 에러 전체를 그대로 보여주지 않습니다. 단, 검증 실패용 사용자 안내 문구는 예외입니다.

---

## 3. 데이터 모델 기준

### 3.1 파티

컬렉션:

```txt
parties
```

문서 예시:

```js
{
  uid: string,
  btag: string,
  ownerRate: string,
  pos: '탱커' | '딜러' | '지원',
  tier: string,
  tierNum: string,
  maxp: number,
  desc: string,
  members: [],
  deleted: false,
  createdAt: number,
  updatedAt: number,
  expiresAt: number
}
```

규칙:

- 한 유저가 동시에 여러 활성 파티를 만들지 못하게 제한
- `expiresAt` 기반 만료 처리
- 파티 수락은 transaction으로 처리
- 정원 초과는 클라이언트 UI만이 아니라 transaction/Rules에서 막기

### 3.2 신청/매칭

컬렉션:

```txt
matches
```

문서 ID:

```js
const matchId = `${fromUid}_${postId}`;
```

문서 예시:

```js
{
  fromUid: string,
  toUid: string,
  postId: string,
  fromBtag: string,
  toBtag: string,
  reqPos: string,
  reqTier: string,
  reqTierNum: string,
  message: string,
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled',
  createdAt: number,
  updatedAt: number
}
```

규칙:

- 자기 파티 신청 방지
- 같은 파티 중복 신청 방지
- 종료/만료/마감 파티 신청 방지
- 수락 시 transaction으로 party members 갱신

### 3.3 평점

컬렉션:

```txt
ratings
```

문서 ID:

```js
const ratingId = `${fromUid}_${toUid}_${matchId}`;
```

문서 예시:

```js
{
  fromUid: string,
  toUid: string,
  matchId: string,
  score: number,
  createdAt: number
}
```

규칙:

- 같은 평가자가 같은 대상/매칭에 한 번만 평가
- 본인 평가는 불가
- 점수는 1~5만 허용
- 평균 평점은 `users/{uid}.rateTotal`, `users/{uid}.rateCount`를 transaction으로 갱신

---

## 4. 디자인 시스템 규칙

### 4.1 현재 방향

현재 OW Hub 메인 화면은 다음 톤을 기준으로 합니다.

- 화이트/크림 배경
- 오렌지 포인트
- 카드형 커뮤니티 UI
- 모바일 우선
- 필터는 컴팩트한 칩 UI
- 파티 카드는 상용 서비스의 리스트 카드처럼 정보 위계를 명확히 표시

### 4.2 CSS 수정 규칙

- 공통 색상/간격은 `variables.css`
- 공통 컴포넌트는 `common.css`
- 상단/사이드바는 `layout.css`
- 파티 화면은 `party.css`
- 최종 polish/실험은 `polish.css`

주의:

- `polish.css`가 마지막 override입니다.
- `!important`는 기존 충돌을 제어하기 위해 일부 사용 중이나, 장기적으로 줄여야 합니다.
- 같은 selector를 여러 파일에 중복 추가하지 말고, 기존 위치를 먼저 확인합니다.

### 4.3 공통 컴포넌트 클래스

| 컴포넌트 | 클래스명 |
|---|---|
| 기본 버튼 | `.btn` |
| 주요 버튼 | `.btn-primary` |
| 보조 버튼 | `.btn-secondary` |
| 위험 버튼 | `.btn-danger` |
| 카드 | `.card` |
| 입력창 | `.form-input` |
| 셀렉트 | `.form-select` |
| 텍스트 영역 | `.form-textarea` |
| 모달 배경 | `.modal-overlay` |
| 모달 패널 | `.modal-panel` |
| 뱃지 | `.badge` |
| 빈 상태 | `.empty-state` |
| 토스트 | `.toast` |

---

## 5. Firebase / Firestore 보안 원칙

클라이언트 코드는 조작될 수 있다는 전제로 작성합니다. 진짜 권한 검사는 Firestore Rules에서 해야 합니다.

클라이언트에서만 막으면 안 되는 것:

- 본인 글만 종료/삭제 가능
- 관리자만 삭제 가능
- 파티 정원 초과 방지
- 같은 유저 중복 신청 방지
- 같은 대상 중복 평가 방지
- 평점 점수 범위 제한
- 이메일 인증 유저만 글쓰기
- 신고 중복 방지

Rules 방향:

- 로그인한 유저만 글쓰기 가능
- `request.auth.uid == resource.data.uid` 검증
- 생성 가능한 필드 제한
- 수정 가능한 필드 제한
- `createdAt`, `uid` 같은 핵심 필드 변조 방지
- `ratings`는 문서 ID와 내부 필드 일치 확인

---

## 6. 렌더링/모바일 규칙

### 6.1 반복 렌더링

금지:

```js
items.forEach(item => {
  list.innerHTML += renderItem(item);
});
```

권장:

```js
const fragment = document.createDocumentFragment();
items.forEach(item => fragment.appendChild(createItemElement(item)));
list.replaceChildren(fragment);
```

### 6.2 모바일 기준

- 버튼 최소 높이 40px 이상
- 터치 영역 최소 40px 이상
- 모달은 작은 화면에서 스크롤 가능
- 사이드바/모달은 바깥 클릭 닫기 지원
- 가로 스크롤은 원인을 수정하고 `overflow-x: hidden`으로 덮지 말 것

---

## 7. 운영 환경 규칙

- 디버그 UI는 기본 숨김
- 테스트 버튼/관리자 이메일을 불필요하게 노출하지 않음
- SEO 문구는 실제 서비스 상태와 맞게 유지
- Vercel 자동배포 상태를 수정할 때 문서도 갱신
- Firestore Rules 적용 전 운영 규칙 백업

---

## 8. AI 작업 절차

AI가 이 저장소에서 작업할 때는 아래 순서를 따릅니다.

1. `docs/CURRENT_STATUS.md`를 먼저 확인한다.
2. 관련 파일을 읽는다.
3. fallback 모듈과 충돌 가능성을 확인한다.
4. CSS 작업이면 `polish.css` override 여부를 확인한다.
5. 새 기능은 가능한 한 별도 파일/함수로 분리한다.
6. 사용자 입력값은 안전하게 렌더링한다.
7. Firestore 쓰기는 transaction/Rules 관점에서 검토한다.
8. 모바일 화면에서 깨질 가능성을 확인한다.
9. 수정 후 변경 파일과 이유를 요약한다.
10. 큰 구조/디자인/데이터 변경이 있으면 문서도 갱신한다.

---

## 9. 다음 리팩토링 우선순위

1. 실제 사이트 smoke test
2. `index.js`를 UI 모듈들로 분리
3. fallback 모듈을 공식 UI 모듈로 흡수
4. `polish.css`를 원래 CSS 파일들로 병합
5. Firestore Rules 검증 및 적용
6. 신고 기능 추가
7. 디스코드 CTA 실제 링크 연결

---

## 10. 커밋 전 체크리스트

### 구조

- [ ] 한 파일이 지나치게 커지지 않았는가?
- [ ] fallback과 중복 이벤트가 생기지 않는가?
- [ ] 공통 스타일과 화면별 스타일이 분리되어 있는가?
- [ ] `polish.css` override가 의도된 것인가?

### 보안

- [ ] 사용자 입력을 그대로 `innerHTML`에 넣지 않았는가?
- [ ] 중요 액션이 클라이언트 조작에 취약하지 않은가?
- [ ] 중복 신청/중복 평가 방지 구조가 유지되는가?

### UX

- [ ] 모바일에서 메뉴/로그인/모집/필터/목록이 정상인가?
- [ ] 에러 메시지가 사용자 친화적인가?
- [ ] 빈 상태 UI가 있는가?

### 운영

- [ ] 디버그 UI가 노출되지 않는가?
- [ ] SEO 문구가 실제 서비스 상태와 맞는가?
- [ ] 자동배포 상태를 의도대로 유지했는가?

이 문서는 단순 참고용이 아니라 **OW Hub 코드 작성 기준서**입니다.
