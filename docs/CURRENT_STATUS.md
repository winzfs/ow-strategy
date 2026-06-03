# OW Hub Current Status

마지막 갱신: 2026-06-04

이 문서는 `docs/AI_CODING_GUIDE.md`와 함께 확인하는 현재 작업 상태 문서입니다.

## 현재 서비스 구조

- 메인 페이지: `index.html`
- 메인 CSS 진입점: `css/index.css`
- 메인 컨트롤러: `js/index.js`
- 보강 UI: `js/main-enhancements.js`
- Firebase 초기화: `js/firebase.js`
- Firestore Rules: `firebase/firestore.rules`

## 현재 로드 방식

`index.html`은 서비스 가용성을 위해 fallback 마크업을 포함합니다.

로드되는 주요 스크립트는 다음과 같습니다.

```html
<script type="module" src="js/auth-fallback.js"></script>
<script type="module" src="js/party-compose-fallback.js"></script>
<script type="module" src="js/party-list-fallback.js"></script>
<script type="module" src="js/index.js"></script>
<script type="module" src="js/main-enhancements.js"></script>
```

## 2026-06-04 점검 결과

### 확인된 위험

1. fallback 모듈과 `index.js`가 같은 DOM을 동시에 렌더링할 수 있음
2. 파티 목록 fallback이 메인 필터 UI를 덮어쓸 수 있음
3. 파티 등록 fallback과 메인 등록 핸들러가 같은 버튼을 동시에 처리할 수 있음
4. Firestore Rules가 클라이언트 로직과 일부 맞지 않아 댓글 수/평점 집계 업데이트가 실패할 수 있음
5. 커뮤니티 댓글 수 증가가 동시성에 약한 read-modify-write 방식이었음

### 적용한 안정화 방향

- 정상 메인 컨트롤러(`window.OWHub.main`)가 준비되면 fallback 모듈은 개입하지 않도록 변경
- fallback은 메인 컨트롤러가 실패했을 때만 안전장치로 작동
- 댓글 수 증가는 Firestore `increment(1)` 방식으로 변경
- Rules는 파티 소유자 중심 업데이트, 댓글 수/추천/평점 집계 업데이트 흐름을 반영하도록 조정

## 다음 우선순위

1. 실제 배포 사이트 모바일 smoke test
2. `index.js`를 UI 모듈로 분리
3. fallback 모듈을 공식 UI 모듈로 흡수 후 제거 검토
4. `polish.css` override를 원래 CSS 파일로 병합
5. Firestore Rules를 더 세밀하게 강화
6. 신고 기능 UI와 Rules 연결
7. Discord CTA 실제 초대 링크 연결

## Smoke test 체크리스트

- [ ] 모바일 햄버거 메뉴 열림/닫힘
- [ ] 이메일 로그인
- [ ] 회원가입 후 인증 메일 발송
- [ ] 로그아웃
- [ ] 프로필 저장
- [ ] 파티 모집 등록
- [ ] 파티 목록 즉시 표시
- [ ] 포지션/티어 필터 유지
- [ ] 비로그인 신청 시 로그인 안내
- [ ] 로그인 유저 파티 신청
- [ ] 파티장 신청 수락/거절
- [ ] 매칭 성공 알림 표시
- [ ] 평점 저장
- [ ] 커뮤니티 글 등록
- [ ] 댓글 등록 후 댓글 수 증가
- [ ] 추천 토글
