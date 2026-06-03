# OW Hub 리팩토링 TODO

이 문서는 OW Hub 리팩토링의 현재 상태와 다음 작업을 추적하기 위한 체크리스트입니다.
작업을 진행할 때마다 완료 여부와 주의사항을 갱신합니다.

---

## 1. 현재 완료된 작업

### 1.1 구조 분리

- [x] `docs/AI_CODING_GUIDE.md` 작성
- [x] `vercel.json`으로 Vercel Git 자동배포 임시 비활성화
- [x] `css/variables.css` 추가
- [x] `css/common.css` 추가
- [x] `css/layout.css` 추가
- [x] `css/party.css` 추가
- [x] `css/community.css` 추가
- [x] `css/tiermaker.css` 추가
- [x] `css/enhancements.css` 추가
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

- [x] `commu.html` 구조 중심으로 단순화
- [x] `tiermaker.html` 구조 중심으로 단순화
- [x] `index.html` 구조 중심으로 단순화
- [x] `index.html`에서 기존 디버그 콘솔 제거

### 1.3 기능 복원

- [x] 로그인/회원가입/비밀번호 찾기
- [x] 프로필 저장/조회
- [x] 파티 모집글 등록
- [x] 기존 활성 파티 자동 종료 후 새 모집글 생성
- [x] 파티 목록 실시간 표시
- [x] 포지션/티어 필터
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

### 1.4 데이터/보안 구조

- [x] 파티 수락 트랜잭션 구조 추가
- [x] 중복 신청 방지용 matchId 구조 추가
- [x] 신청 생성 시 기존 신청/파티 상태를 트랜잭션으로 검증
- [x] pending/accepted 중복 신청 방지
- [x] 자기 파티/종료/만료/마감 파티 신청 방지
- [x] 평점 트랜잭션 추가
- [x] `ratings/{fromUid_toUid_matchId}` 구조 추가
- [x] 평점 중복 방지 로직 추가
- [x] 매칭 성공 카드에서 `match.id`를 평점 저장에 전달
- [x] 이미 평가한 매칭은 평가 버튼 대신 `평가 완료` 표시
- [x] `firebase/firestore.rules` 초안 작성
- [x] 평점 Rules 강화

---

## 2. 높은 우선순위 TODO

### 2.1 신고 기능 추가

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

### 2.2 `index.js` 추가 분리

현재 `js/index.js`가 다시 커지고 있습니다.
다음 작업 전후로 기능별 파일 분리를 진행해야 합니다.

- [ ] `js/main-state.js` 또는 간단한 상태 관리 모듈 검토
- [ ] `js/party-render.js` 추가
- [ ] `js/profile-ui.js` 추가
- [ ] `js/match-ui.js` 추가
- [ ] `js/filter-ui.js` 추가
- [ ] `js/auth-ui.js` 추가
- [ ] `index.js`는 초기화와 모듈 연결만 담당하도록 축소

우선 분리 후보:

```txt
index.js
├─ 인증 UI
├─ 프로필 폼 UI
├─ 파티 등록 폼 UI
├─ 파티 카드 렌더링
├─ 필터 렌더링
├─ 알림/매칭 성공 렌더링
└─ 사이드바/페이지 전환
```

---

### 2.3 평점 UI 검증 및 보강

현재 데이터 레이어는 `ratings/{fromUid_toUid_matchId}` 중복 방지 구조를 지원합니다.
화면 쪽에서 `matchId` 전달이 항상 정확한지 검증해야 합니다.

- [x] `createRatingRow(targetUid, label, matchId)` 형태로 UI 함수 정리
- [x] 매칭 성공 카드에서 `match.id`가 정확히 전달되는지 확인
- [x] 이미 평가한 매칭은 평가 버튼 대신 `평가 완료` 표시
- [x] `hasRatedUser(targetUid, { matchId })`를 화면 초기 렌더링에 적용
- [ ] 평점 저장 성공 후 `users/{uid}` 평균이 즉시 갱신되는지 확인
- [x] 본인 평가 방지 UI 처리: `rateUser()`의 본인 평가 차단에 의존하며, 실패 시 안내 표시

---

### 2.4 Firestore Rules 실제 적용 전 검토

현재 `firebase/firestore.rules`는 저장소에만 존재합니다.
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

현재 클라이언트에서 `ratings` 생성과 `users` 평점 합산을 한 트랜잭션에서 같이 수행합니다.
Rules에서 `users/{uid}` update를 너무 강하게 막으면 평점 저장이 실패할 수 있습니다.

---

## 3. 중간 우선순위 TODO

### 3.1 디스코드 CTA 실제 링크 연결

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

### 3.2 인라인 스타일 제거

현재 리팩토링 과정에서 빠르게 구조화하면서 일부 인라인 스타일이 남아 있습니다.

- [ ] `index.html` 인라인 스타일 제거
- [ ] `commu.html` 인라인 스타일 제거
- [ ] `tiermaker.html` 인라인 스타일 제거
- [ ] `js/index.js`에서 직접 `element.style.*` 쓰는 부분 클래스화
- [ ] `js/commu.js`에서 직접 `element.style.*` 쓰는 부분 클래스화
- [ ] 공통 스타일은 `common.css`, 페이지 스타일은 각 CSS로 이동

---

### 3.3 파티 만료 UX 개선

현재 파티는 `expiresAt`을 기준으로 필터링되고, 카드에는 기본 만료 안내가 붙습니다.

- [ ] 카드별 실제 남은 시간 표시
- [ ] 만료 10분 전 강조 표시
- [ ] 내 파티 연장 버튼 추가
- [ ] 만료된 파티 자동 종료 처리 검토
- [ ] `main-enhancements.js`의 `formatRemaining()` 실제 카드 표시와 연결

---

### 3.4 관리자 기능 정리

- [ ] 관리자 판단을 이메일 배열에서 UID/custom claims로 이전 검토
- [ ] 관리자 전용 신고 목록 페이지 추가
- [ ] 관리자 전용 글/댓글 삭제 UI 정리
- [ ] 관리자용 활동 상태/신고 수 표시
- [ ] 관리자 기능은 일반 사용자 UI에 노출되지 않도록 처리

---

### 3.5 커뮤니티 보강

- [ ] 게시글 soft delete 적용 검토
- [ ] 댓글 soft delete 적용 검토
- [ ] 댓글 수 트랜잭션 처리
- [ ] 추천 중복/본인 추천 UX 개선
- [ ] 글 작성 후 로딩/완료 상태 개선
- [ ] 커뮤니티 페이지 모바일 UI 확인

---

## 4. 낮은 우선순위 TODO

### 4.1 SEO/메타 정리

- [ ] 실제 서비스 상태와 맞지 않는 과장 문구 제거
- [ ] 구조화 데이터 추가 여부 검토
- [ ] OG 이미지 실제 존재 확인
- [ ] `og.png` 없으면 추가 또는 메타 제거
- [ ] 커뮤니티/티어메이커 페이지 별도 title/description 정리

---

### 4.2 접근성 개선

- [ ] 주요 버튼 aria-label 확인
- [ ] 사이드바 열림 상태 aria-expanded 적용
- [ ] 탭/페이지 전환 키보드 접근성 검토
- [ ] 티어메이커 드래그 대체 조작 검토
- [ ] 색상 대비 확인

---

### 4.3 코드 품질

- [ ] JS 모듈별 JSDoc 추가
- [ ] 중복 helper 제거
- [ ] 오류 메시지 상수화
- [ ] 폼 검증 함수 공통화
- [ ] Firebase import 중복 최소화

---

## 5. 배포 전 필수 체크리스트

자동배포를 다시 켜기 전 반드시 아래를 확인합니다.

### 5.1 브라우저 기능 확인

- [ ] 메인 페이지 진입
- [ ] 로그인
- [ ] 회원가입
- [ ] 비밀번호 찾기
- [ ] 프로필 저장
- [ ] 파티 모집글 등록
- [ ] 파티 목록 표시
- [ ] 포지션/티어 필터
- [ ] 파티 신청
- [ ] 알림 표시
- [ ] 신청 수락
- [ ] 신청 거절
- [ ] 매칭 성공 카드 표시
- [ ] 배틀태그 복사
- [ ] 평점 평가
- [ ] 중복 평가 방지
- [ ] 모집 종료
- [ ] 접속/활동 지수 표시
- [ ] 디스코드 CTA 상태 확인
- [ ] 커뮤니티 페이지 진입
- [ ] 커뮤니티 글 등록
- [ ] 댓글 등록
- [ ] 추천
- [ ] 티어메이커 진입
- [ ] 티어메이커 드래그
- [ ] 티어메이커 이미지 저장

### 5.2 모바일 확인

- [ ] 360px 폭에서 메인 페이지 깨짐 없음
- [ ] 사이드바 열기/닫기
- [ ] 파티 등록 폼 터치 가능
- [ ] 필터 버튼 터치 가능
- [ ] 알림 카드 버튼 터치 가능
- [ ] 커뮤니티 입력창/댓글창 사용 가능
- [ ] 티어메이커 터치 드래그 가능

### 5.3 보안 확인

- [ ] 사용자 입력 XSS 테스트
- [ ] 본인 글만 삭제 가능 확인
- [ ] 파티 정원 초과 방지 확인
- [ ] 중복 신청 방지 확인
- [ ] 중복 평가 방지 확인
- [ ] Firestore Rules 적용 여부 확인
- [ ] 관리자 기능 노출 여부 확인

### 5.4 배포 설정

- [ ] `vercel.json` 자동배포 비활성화 유지 여부 결정
- [ ] 자동배포 재활성화 시 `deploymentEnabled` 제거 또는 true 처리
- [ ] Vercel 환경/도메인 확인
- [ ] Firebase 운영 프로젝트 확인
- [ ] 배포 후 smoke test 계획 수립

---

## 6. 다음 작업 추천 순서

1. 신고 기능 추가
2. `index.js`를 UI 모듈들로 추가 분리
3. Firestore Rules를 실제 적용 가능한 수준으로 세분화
4. 인라인 스타일 제거
5. 디스코드 CTA 실제 링크 연결
6. 브라우저 테스트 후 자동배포 재활성화 판단

---

## 7. 작업 메모

- 현재 Vercel 자동배포는 꺼져 있음.
- `firebase/firestore.rules`는 저장소에만 있는 초안일 수 있음. 실제 Firebase 프로젝트에 적용 여부는 별도 확인 필요.
- `js/index.js`가 다시 커지고 있으므로 다음 기능 추가 전 분리 권장.
- 신고 기능은 운영 서비스 안정성 측면에서 다음 우선 작업으로 권장.
- 신청 생성은 트랜잭션으로 기존 신청/파티 상태를 검증하도록 보강됨.
- 평점 UI는 매칭별 `match.id`를 전달하고, 이미 평가한 매칭은 `평가 완료`로 표시함.
