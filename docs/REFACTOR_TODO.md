# OW Hub 리팩토링 TODO

마지막 갱신: 2026-06-04

이 문서는 OW Hub 리팩토링의 현재 상태와 다음 작업을 추적하기 위한 체크리스트입니다. 작업 전에는 `docs/CURRENT_STATUS.md`와 `docs/AI_CODING_GUIDE.md`를 함께 확인합니다.

---

## 1. 현재 완료된 작업

### 1.1 구조 분리

- [x] `docs/AI_CODING_GUIDE.md` 작성 및 최신화
- [x] `docs/CURRENT_STATUS.md` 작성
- [x] `css/variables.css` 추가
- [x] `css/common.css` 추가
- [x] `css/layout.css` 추가
- [x] `css/party.css` 추가
- [x] `css/community.css` 추가
- [x] `css/tiermaker.css` 추가
- [x] `css/enhancements.css` 추가
- [x] `css/polish.css` 추가
- [x] `js/firebase.js` 추가
- [x] `js/config.js` 추가
- [x] `js/sanitize.js` 추가
- [x] `js/ui.js` 추가
- [x] `js/auth.js` 추가
- [x] `js/party.js` 추가
- [x] `js/profile.js` 추가
- [x] `js/notification.js` 추가
- [x] `js/community.js` 추가
- [x] `js/presence.js` 추가
- [x] `js/tiermaker.js` 추가
- [x] `js/index.js` 추가/확장
- [x] `js/commu.js` 추가/확장
- [x] `js/main-enhancements.js` 추가

### 1.2 페이지 분리

- [x] `index.html` 구조 중심으로 단순화
- [x] `commu.html` 구조 중심으로 단순화
- [x] `tiermaker.html` 구조 중심으로 단순화
- [x] `index.html`에서 기존 디버그 콘솔 제거
- [x] `index.html`에 최소 fallback 마크업 복원
- [x] 파티 신청 모달 구조 복원
- [x] footer/legal link 구조 복원

### 1.3 기능 복원

- [x] 로그인/회원가입/비밀번호 찾기
- [x] 로그아웃
- [x] 프로필 저장/조회
- [x] 파티 모집글 등록
- [x] 기존 활성 파티 자동 종료 후 새 모집글 생성
- [x] 파티 목록 실시간 표시
- [x] 포지션/티어 필터
- [x] 티어/포지션 아이콘 복원
- [x] 파티 신청 모달
- [x] 파티 신청
- [x] 신청 수락/거절
- [x] 매칭 성공 카드
- [x] 배틀태그 복사
- [x] 평점 평가 UI
- [x] 커뮤니티 게시글 등록/조회
- [x] 커뮤니티 댓글 등록/조회
- [x] 커뮤니티 추천
- [x] 티어메이커 탭/드래그/이미지 저장
- [x] 접속 상태 heartbeat
- [x] 실시간 활동 지수
- [x] 디스코드 CTA 자리
- [x] 파티 만료 안내

### 1.4 임시 안정화/fallback 구조

아래 fallback 모듈은 현재 서비스가 깨지는 것을 막는 안전장치입니다.

- [x] `js/sidebar-fallback.js` 추가
- [x] `js/auth-fallback.js` 추가
- [x] `js/party-compose-fallback.js` 추가
- [x] `js/party-list-fallback.js` 추가

주의:

- 이 파일들은 최종 구조가 아니라 안정화 단계의 안전장치입니다.
- 삭제 전 모바일 smoke test가 필요합니다.
- 추후 공식 UI 모듈로 흡수해야 합니다.

### 1.5 UI/디자인

- [x] 다크 테마에서 화이트/크림 테마로 전환
- [x] 오렌지 포인트 컬러 유지
- [x] 배경 그리드 제거
- [x] 글자 대비 보정
- [x] 상용 커뮤니티 서비스 느낌의 카드 UI 적용
- [x] 검색/필터 패널을 컴팩트 칩 UI로 개선
- [x] `css/polish.css` 최종 override 레이어 추가
- [x] 모바일 필터/버튼 밀도 개선

---

## 2. 높은 우선순위 TODO

### 2.1 실제 사이트 smoke test

현재 자동배포가 켜져 있으므로, 배포 반영 후 실제 사이트에서 아래를 우선 확인합니다.

- [ ] 메인 페이지 진입
- [ ] 모바일 햄버거 메뉴 열림/닫힘
- [ ] 사이드바 로그인 UI 표시
- [ ] 로그인
- [ ] 회원가입
- [ ] 비밀번호 찾기
- [ ] 로그아웃
- [ ] 프로필 저장
- [ ] 파티 모집글 등록
- [ ] 등록 직후 파티 목록 표시
- [ ] 본인 글 모집 종료
- [ ] 포지션/티어 필터 선택/초기화
- [ ] 비로그인 상태 파티 신청 시 로그인 안내
- [ ] 로그인 상태 파티 신청 모달 열림
- [ ] 신청 전송
- [ ] 알림 표시
- [ ] 신청 수락
- [ ] 신청 거절
- [ ] 매칭 성공 카드 표시
- [ ] 배틀태그 복사
- [ ] 평점 평가
- [ ] 중복 평가 방지
- [ ] 활동 지수 표시
- [ ] 커뮤니티 페이지 진입
- [ ] 티어메이커 페이지 진입

---

### 2.2 `index.js` 추가 분리

현재 `js/index.js`가 크고 fallback 모듈과 일부 역할이 겹칩니다.
다음 구조로 분리합니다.

- [ ] `js/sidebar-ui.js` 추가
- [ ] `js/auth-ui.js` 추가
- [ ] `js/party-form-ui.js` 추가
- [ ] `js/party-list-ui.js` 추가
- [ ] `js/filter-ui.js` 추가
- [ ] `js/match-ui.js` 추가
- [ ] `js/profile-ui.js` 추가
- [ ] `index.js`는 초기화와 모듈 연결만 담당하도록 축소

분리 목표:

```txt
index.js
├─ initSidebar()
├─ initAuthPanel()
├─ initPartyForm()
├─ initPartyList()
├─ initFilters()
├─ initMatchModal()
├─ initProfilePage()
└─ initNotifications()
```

---

### 2.3 fallback 모듈 공식화/흡수

현재 fallback 모듈을 아래 공식 모듈로 흡수합니다.

| 현재 fallback | 목표 모듈 |
|---|---|
| `sidebar-fallback.js` | `sidebar-ui.js` |
| `auth-fallback.js` | `auth-ui.js` |
| `party-compose-fallback.js` | `party-form-ui.js` |
| `party-list-fallback.js` | `party-list-ui.js` |

- [ ] 중복 이벤트 제거
- [ ] capture 단계 `stopImmediatePropagation()` 제거 가능 여부 확인
- [ ] 목록 렌더러 단일화
- [ ] 파티 생성 후 목록 갱신 흐름 단일화
- [ ] fallback 제거 후 smoke test

---

### 2.4 CSS 구조 정리

현재 `polish.css`가 마지막 override로 UI를 안정화하고 있습니다.
장기적으로 아래처럼 병합합니다.

- [ ] `polish.css`의 버튼/입력창 스타일을 `common.css`로 이동
- [ ] `polish.css`의 상단바/사이드바 스타일을 `layout.css`로 이동
- [ ] `polish.css`의 파티 카드/필터 스타일을 `party.css`로 이동
- [ ] 중복 selector 제거
- [ ] 불필요한 `!important` 제거
- [ ] 모바일 media query 중복 제거
- [ ] 최종적으로 `polish.css` 유지 여부 결정

---

### 2.5 Firestore Rules 실제 적용 전 검토

현재 `firebase/firestore.rules`는 저장소에만 존재할 수 있습니다.
실제 Firebase 프로젝트에 적용하기 전 아래 검토가 필요합니다.

- [ ] 현재 운영 중인 Firestore Rules 백업
- [ ] rules syntax 검증
- [ ] users update 권한 세분화
- [ ] parties members update 권한 강화
- [ ] matches status 변경 권한 세분화
- [ ] community likes update만 허용되도록 검증
- [ ] comments soft delete 구조 검토
- [ ] presences guest write 허용 범위 재검토
- [ ] ratings create + users rateTotal/rateCount 트랜잭션 동시 허용 방식 검토
- [ ] reports create 필드 제한 추가

중요:

현재 클라이언트에서 `ratings` 생성과 `users` 평점 합산을 한 트랜잭션에서 같이 수행합니다. Rules에서 `users/{uid}` update를 너무 강하게 막으면 평점 저장이 실패할 수 있습니다.

---

## 3. 중간 우선순위 TODO

### 3.1 신고 기능 추가

목표: 악성 파티글, 커뮤니티 글, 댓글, 유저를 신고할 수 있게 한다.

- [ ] `js/report.js` 추가
- [ ] `reports/{reportId}` 생성 helper 작성
- [ ] `reportId = reporterUid_targetType_targetId` 구조 적용
- [ ] 파티 카드에 신고 버튼 추가
- [ ] 커뮤니티 게시글 신고 버튼 추가
- [ ] 댓글 신고 버튼 추가
- [ ] 신고 사유 선택 UI 추가
- [ ] 중복 신고 방지
- [ ] 관리자용 신고 목록 UI 설계
- [ ] Firestore Rules에서 reports create 필드 제한 강화

권장 문서 구조:

```js
{
  uid: string,
  targetType: 'party' | 'post' | 'comment' | 'user',
  targetId: string,
  reason: string,
  status: 'open' | 'reviewed' | 'dismissed' | 'resolved',
  createdAt: number,
  updatedAt: number
}
```

---

### 3.2 평점 UI 검증 및 보강

현재 데이터 레이어는 `ratings/{fromUid_toUid_matchId}` 중복 방지 구조를 지원합니다.
화면 쪽에서 `matchId` 전달이 항상 정확한지 계속 검증해야 합니다.

- [x] `createRatingRow(targetUid, label, matchId)` 형태로 UI 함수 정리
- [x] 매칭 성공 카드에서 `match.id` 전달
- [x] 이미 평가한 매칭은 평가 버튼 대신 `평가 완료` 표시
- [x] `hasRatedUser(targetUid, { matchId })` 적용
- [ ] 평점 저장 성공 후 `users/{uid}` 평균 즉시 갱신 확인
- [ ] fallback/공식 모듈 분리 후에도 평점 UI 정상 확인

---

### 3.3 디스코드 CTA 실제 링크 연결

- [ ] 디스코드 서버 초대 링크 준비
- [ ] `js/config.js`의 `APP_CONFIG.discordInviteUrl`에 링크 입력
- [ ] CTA 문구 확정
- [ ] 파티 신청 완료 후 디스코드 유도 토스트 또는 카드 추가
- [ ] 매칭 성공 카드에도 디스코드 유도 추가 검토

현재 상태:

```js
discordInviteUrl: ''
```

---

### 3.4 파티 만료 UX 개선

현재 파티는 `expiresAt` 기준으로 필터링되고, 카드에는 기본 만료 안내가 붙습니다.

- [ ] 카드별 실제 남은 시간 표시
- [ ] 만료 10분 전 강조 표시
- [ ] 내 파티 연장 버튼 추가
- [ ] 만료된 파티 자동 종료 처리 검토
- [ ] `main-enhancements.js`의 `formatRemaining()` 실제 카드 표시와 연결

---

### 3.5 관리자 기능 정리

- [ ] 관리자 판단을 이메일 배열에서 UID/custom claims로 이전 검토
- [ ] 관리자 전용 신고 목록 페이지 추가
- [ ] 관리자 전용 글/댓글 삭제 UI 정리
- [ ] 관리자용 활동 상태/신고 수 표시
- [ ] 관리자 기능은 일반 사용자 UI에 노출되지 않도록 처리

---

## 4. 낮은 우선순위 TODO

### 4.1 인라인 스타일 제거

- [ ] `index.html` 인라인 스타일 제거
- [ ] `commu.html` 인라인 스타일 제거
- [ ] `tiermaker.html` 인라인 스타일 제거
- [ ] `js/index.js`에서 직접 `element.style.*` 쓰는 부분 클래스화
- [ ] `js/commu.js`에서 직접 `element.style.*` 쓰는 부분 클래스화

---

### 4.2 SEO/메타 정리

- [ ] 실제 서비스 상태와 맞지 않는 과장 문구 제거
- [ ] 구조화 데이터 추가 여부 검토
- [ ] OG 이미지 실제 존재 확인
- [ ] `og.png` 없으면 추가 또는 메타 제거
- [ ] 커뮤니티/티어메이커 페이지 별도 title/description 정리

---

### 4.3 접근성 개선

- [ ] 주요 버튼 aria-label 확인
- [ ] 사이드바 열림 상태 aria-expanded 적용 확인
- [ ] 탭/페이지 전환 키보드 접근성 검토
- [ ] 티어메이커 드래그 대체 조작 검토
- [ ] 색상 대비 확인

---

### 4.4 코드 품질

- [ ] JS 모듈별 JSDoc 추가
- [ ] 중복 helper 제거
- [ ] 오류 메시지 상수화
- [ ] 폼 검증 함수 공통화
- [ ] Firebase import 중복 최소화

---

## 5. 배포/운영 체크리스트

### 5.1 자동배포 상태

- [x] `vercel.json`에서 `git.deploymentEnabled: false` 제거
- [x] 배포 트리거 커밋 추가
- [ ] Vercel 대시보드에서 Git 배포가 실제 활성화되어 있는지 확인
- [ ] 배포 후 smoke test 실행

### 5.2 모바일 확인

- [ ] 360px 폭에서 메인 페이지 깨짐 없음
- [ ] 사이드바 열기/닫기
- [ ] 로그인 폼 터치 가능
- [ ] 파티 등록 폼 터치 가능
- [ ] 필터 버튼 터치 가능
- [ ] 파티 카드 버튼 터치 가능
- [ ] 알림 카드 버튼 터치 가능
- [ ] 커뮤니티 입력창/댓글창 사용 가능
- [ ] 티어메이커 터치 드래그 가능

### 5.3 보안 확인

- [ ] 사용자 입력 XSS 테스트
- [ ] 본인 글만 종료/삭제 가능 확인
- [ ] 파티 정원 초과 방지 확인
- [ ] 중복 신청 방지 확인
- [ ] 중복 평가 방지 확인
- [ ] Firestore Rules 적용 여부 확인
- [ ] 관리자 기능 노출 여부 확인

---

## 6. 다음 작업 추천 순서

1. 실제 사이트 smoke test
2. `index.js`를 UI 모듈들로 분리
3. fallback 모듈을 공식 UI 모듈로 흡수
4. `polish.css`를 원래 CSS 파일들로 병합
5. Firestore Rules 검증 및 적용
6. 신고 기능 추가
7. 디스코드 CTA 실제 링크 연결
8. SEO/OG 이미지 정리

---

## 7. 작업 메모

- 현재 Vercel 자동배포 차단 설정은 제거되어 있습니다.
- `firebase/firestore.rules`는 저장소에 있으나 실제 Firebase 프로젝트 적용 여부는 별도 확인 필요합니다.
- `js/index.js`가 다시 커지고 있으므로 다음 기능 추가 전 분리 권장입니다.
- fallback 모듈은 현재 안정화 안전장치이므로, 공식 UI 모듈로 흡수하기 전 삭제하지 않습니다.
- `css/polish.css`는 최종 override 레이어입니다. UI가 확정되면 원래 CSS 파일들로 병합해야 합니다.
- 신고 기능은 운영 서비스 안정성 측면에서 다음 우선 작업으로 권장됩니다.
