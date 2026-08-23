# 저장소 관리 원칙

이 저장소는 실행 소스와 다시 만들 수 없는 원본 자산만 Git으로 관리한다.
빌드 결과, QA 캡처, 배포 영상은 로컬 또는 CI 아티팩트로 보관한다.

## Git으로 관리하는 것

- `src/`: 게임 데이터, 엔진, 렌더러와 스타일 원본
- `assets/`: 장면, 초상, UI, 오디오의 정본
- `tools/`: 빌드와 콘텐츠 검사에 필요한 도구
- `tests/`: 자동화된 회귀 검사 코드와 작은 고정 fixture
- `docs/`: 현재 설계 원칙과 장기 설정
- `.github/`: 빌드, 검사, Pages 배포 정의

## Git으로 관리하지 않는 것

- `서울까지400km.html`: `npm run build:html`로 다시 생성한다.
- `audits/`: UI 캡처와 비교 이미지는 CI 아티팩트나 별도 보관소에 둔다.
- `exports/`, `trailer/out/`: 완성 영상은 GitHub Release 또는 외부 저장소에 둔다.
- `design-consultation-all-screens.html`: 필요할 때 상담 문서 빌더로 다시 만든다.
- `tests/shots/`: 테스트 실행 중 생성되는 화면 캡처다.

## 변경 규칙

1. 기능을 수정할 때 기존 `final`, `polish`, `override` CSS를 하나 더 붙이지 않는다.
2. 기존 선택자와 책임 파일을 찾아 원래 규칙을 고친다.
3. Base64 오디오나 이미지를 소스에 직접 넣지 않고 빌드 단계에서 자산을 주입한다.
4. 일회성 생성·이관 도구는 작업이 끝나면 `docs/history/`에 설명만 남기고 활성 도구에서 제거한다.
5. 큰 구조 변경과 Git 이력 정리는 기능 변경 커밋과 분리한다.

## 다음 모듈 분리 목표

- `03-data.js`: `intro`, `world`, `events`, `companions`, `resistance`, `finale`
- `07-ui.js`: `journey`, `event`, `settlement`, `inventory`, `ending`
- `01-style.html`: 토큰과 공통 기반을 남기고 화면별 스타일 파일로 분리

분리 전에는 현재 동작을 캡처하고, 분리 후 같은 상태와 뷰포트에서 비교한다.
