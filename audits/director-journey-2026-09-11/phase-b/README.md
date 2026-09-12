# 원본 전달 영수증 — 2026-09-12

`/Users/sang/caravan`의 개선된 HTML, AIT 3개와 실제 4175 실행 화면을 검증했다. 원본 Git HEAD는 `5d578f63848f1f888539e2175320312d27da5624`로 유지했고, 기존 사용자 변경 26개의 출발 기준과 백업을 보존했다. 배포나 원격 게시를 하지 않았다.

## 최종 파일

| 파일 | 바이트 | SHA-256 |
|---|---:|---|
| `서울까지400km.html` | 77,667,306 | `b6e9220728359658721ad8c4a52cb5069e94ace0d42a2b67bf4d4f5cb5bfdb56` |
| `caravan.ait`, `caravanproject.ait`, `seoul400km.ait` 각각 | 62,162,909 | `5c7fcdd4e7c0eb2bf35127bdf327630ce749559448ba4187554ad77c84e5ca8b` |
| AIT 안의 `web/index.html` | 77,666,433 | `73b7cd214d7e0a08bc8a7a1a2de513094dec9be0de28b014d438c2ef1c0ea8df` |

GAME_BUILD는 `2026-09-11-director-journey`, 저장 schema는 8이다. [빌드 영수증](build-receipt.json), [릴리스 검사](check-release.log), [AIT 내부 대조](ait-web-payload.json)를 보존했다. 세 AIT 모두 `AITBUNDL` 헤더를 가지며, 13개 index entry의 해시·바이트와 5개 web entry가 새 `dist/web` 파일과 일치한다. 실제 게임 본문과 빌드 문자열은 `web/index.html` 안에 있다. 작은 파일명 기반 JS만 검사한 결과가 아니다.

## 보존과 두 차례 통합

- 첫 승인 구현은 `c667fbf9ec292cdcf7ba3bb99ce8e92427fadf37`, 전달 후보는 문서 승인을 포함한 `a68e0cfaf5a943c9e43e6155cbc12337c3e15d88`이었다. 즉시 검사한 원본 기준 파일 967개가 모두 일치했고 새 경로 충돌은 0개였다. 승인 변경 156개를 복사했다. [첫 검사](preflight.json), [첫 복사 영수증](copy-receipt.json), [컨트롤러 보존 확인](controller-preservation-check.json).
- 최초 생성물과 기존 대상 소스를 `/Users/sang/_workspace/caravan-task9-backup-20260912-121439`에 백업했다. HTML·AIT·자산 보고서의 백업이 watched 소스 복사보다 먼저 끝났음을 타임스탬프와 해시로 기록했다.
- 실제 320px 첫 출발에서 정차 콘솔이 접히는 문제를 발견했다. [원인·RED/GREEN](stopped-stage-fix/README.md)과 [독립 승인](stopped-stage-fix/review.md)을 거친 `0d54de3946df531694023ad8787950f9879bf585`는 기존 UI 높이 조정 함수에 6줄 guard를 추가한다. 스크롤이 필요한 콘솔의 공간을 풍경에 계속 내주지 않도록 했다. 엔진·이야기·자산은 바꾸지 않았다.
- 두 번째 통합 직전 기존 전달본과 나머지 기준 파일 1,098개를 다시 비교했다. 변경·새 충돌은 0개였다. 중간 HTML·AIT·보고서와 변경 소스를 `/Users/sang/_workspace/caravan-task9-fitter-backup-20260912-123142`에 먼저 백업한 다음 승인된 22개 경로를 반영했다. [두 번째 복사](fitter-copy-receipt.json), [컨트롤러 보존 확인](controller-fitter-preservation-check.json).
- 최종 감사와 CURRENT의 날짜·완료 상태·새 실행 증거는 별도의 기계적 문서 갱신으로 복사했다. 검토된 서로 다른 경로는 177개이며, 최종 문서 갱신과 전체 파일 대조는 [최종 동기화](final-sync.json)에 구분해 기록한다. `.git`, `node_modules`, 개인 브라우저 저장·프로필, 대량 Task8 원시 증거는 복사하지 않았다.

## 현재 원본의 실제 UI 증거

[요약](ui-summary.json)과 [전체 캡처 색인](ui/index.json)은 320×578, 390×844, 1440×900의 새 출발·획득 저장본 결말을 각각 기록한다. **6개 시나리오, 실제 입력 828개, 캡처 27장, 결과 새로고침 3회**가 통과했다.

새 게임은 부산 선택 5개와 실제 결과, 메인 임무 수락, 정상 자원의 부산→양산 출발을 거쳤다. 획득 저장본은 시나리오마다 정확한 동일 파일을 한 번만 넣었다. 집행권 인계 선택 뒤 게임이 저장한 결과를 새 문서에서 복구하고, 다음 장면과 `story_done`·archive 1개로 끝났다. 결과 복구 전후 자원·선택 수·사건 수·메모 수·동료가 같다. 수동 진도 지급, 강제 클릭, 이벤트 재개 호출, UI 스타일 덮어쓰기를 하지 않았다.

대표 화면:

- [320px 정차 콘솔](ui/320x578-fresh/03-opening-complete.png), [320px 실제 주행](ui/320x578-fresh/04-actual-departure.png)
- [390px 결과 복구](ui/390x844-earned/03-result-restored.png), [390px 다음 장면](ui/390x844-earned/04-next-authored-scene.png)
- [데스크톱 정차 콘솔](ui/1440x900-fresh/03-opening-complete.png), [데스크톱 결말](ui/1440x900-earned/05-ending.png)

모든 최초 main response는 원본 서버에서 받은 정확한 77,667,306 bytes를 해시한 뒤 그대로 브라우저에 전달했다. 결과 새로고침 3회는 각 시나리오에서 검증한 같은 response를 살아 있는 컨텍스트 안에서 재사용했다(`sourceNavigation: 1`); 새 HTTP fetch로 세지 않는다. 실행 검사기와 공용 helper는 시작·끝 SHA가 같았다. 모든 JavaScript 페이지 오류는 0개다. 별도 HTTP 경고는 선택적 `/assets/app-icon.png`의 404 요청 9개다.

## 이전 기능 캠페인과 현재 런타임을 구분한다

Task8의 15개 기능 캠페인은 이전 HTML 77,666,839 bytes / `1c560199…9d07`에서 검증됐다. 두 노선, 여섯 동료 영입, 준비된 세 결말의 기존 증거와 원시 해시를 그대로 보존한다. 이후 변경은 정차 UI 높이 조정 guard이므로, 현재 런타임의 영향을 받는 첫 출발·모드 전환·기존 golden route와 원본 대표 UI 6개를 다시 검사했다. 이전 캠페인을 새 해시에서 다시 돌렸다고 주장하지 않는다. 최초 원본 빌드 영수증은 [중간 전달](intermediate-1c560199/build-receipt.json), 최초 원본의 획득 저장본 실행은 `ui-intermediate-1c560199/`에 있다.

HTML은 80,000,000 bytes 상한 안이고 32,000,000 bytes 권고선을 넘는다. [기존 시각 경고 58개](visual-warnings.json)는 문자열 추가·삭제가 0개다. 콘텐츠 1,019개·장면 393종을 확인했다. 참가자의 재미·이해·애착이나 실제 휴대폰 성능은 이번 자동화 결과가 증명하지 않는다. 대량 Task8 기록과 이미지 원본은 작업트리에 보존했고, 새로운 전체 캠페인 반복은 하지 않았다.
