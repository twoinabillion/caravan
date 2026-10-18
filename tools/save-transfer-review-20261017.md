# 저장 피드백·백업 복원 후속 검수

## 일반 불러오기·이어가기 안전성 후속 — 11:43–11:48Z

Sang의 `KEEP GOING`으로 앞선 복원 진입을 유지하고 실제 로더/타이틀의 실패 경로를 추가 점검했다. Chrome 차단 해제 답변은 없으므로 브라우저·다운로드를 재시도하거나 다른 주소/도구로 우회하지 않았다. 게임 디렉터·저장 지침으로 정상 구버전 호환과 손상 파일 거절, 현재 runtime 보존을 분리했다.

수정 전 분리된 실제 엔진/기존 title owner 검사에서4개 묶음이 실패했다: 잘못된 일반 load가 기존 S를 null로 바꿈, `v:0` 같은 손상 버전을 무버전으로 받아들임, 불러올 수 없는 위치/미래 버전인데 stats가 있으면 Continue 표시/복원 숨김, 반대로 정상 무버전 부분 저장에 stats가 없으면 Continue 숨김. 단순 소스 의심을 확정 결함으로 기록하지 않고 재현 후 수정했다. 잘못된 comp 원시값 경로의 최종 검사는 실제 생성 번들과 같은 strict mode에서 실행했다.

- `G.load`는 실패하면 기존 live S/RNG 참조를 복원한다. resetDriveTimers는 검증 성공 때만 기존 위치에서 실행하며 저장 bytes는 바꾸지 않는다. 처음부터 S=null이던 깨진 파일은 그대로 빈 상태다. import/inspect의 기존 트랜잭션 보호도 유지한다.
- 실제 writer가 사용하는 무버전(v1) 및 정수1~9는 유지한다. 존재하는 버전이 문자열·소수·null·객체·배열·0/음수/미래값이면 거절한다. 이들은 정상 구버전으로 해석하지 않는다. 저장 schema 버전 증가는 없다.
- 타이틀은 stats 유무 대신 실제 `G.inspectSave` 결과로 Continue와 백업 복원 표시를 결정한다. 적법한 부분 저장의 기본값/정상화된 km를 요약에 사용해 NaN 표기를 막는다. 손상/미래 저장은 디스크를 유지하고 기존 복원 진입을 남긴다.
- 클릭 시 슬롯을 다시 읽는 `continueSavedJourney`를 실제 버튼과 live 자동 재개가 공유한다. 실패 안내/복원 경로, title을 떠난 옛 클릭 차단, 종료된 저장의 결말 진입을 처리한다. 자동 재개는 소리를 켜지 않고 명시적 사용자 클릭만 기존 audio enable 동작을 유지한다. UI 배치/CSS·아트·밸런스는 변경하지 않았다.

신규 `tests/test_save_readability.cjs` **11/11**: ordinary load 실패의 객체/RNG/cooldown/store 보존, 손상 버전9종, title 복구 경로, 무버전 부분 저장, 지원10형식(무버전+1~9), 표시 뒤 파일 변경, storage 읽기 거부/빈 슬롯, stale title 클릭, 종료/자동 무음, 정규화 mileage 및 지급 오프닝 결과 중복 방지/다음 행동, 빈 runtime 실패를 확인했다. 관련 **40/40**, 최종 전체 `npm run test:source` **723/723**, 실패0,34.15초. title 단위 대역에는 새 shared Continue 함수를 포함했고 loader는 실제 strict 함수를 실행했다. diff/release gate 통과. DOM/저장 대역의 로직 검사이며 실제 브라우저/휴대폰 시각·focus·입력·파일 QA가 아니다.

`npm run build` 성공, RN0.84.0/0.72.6 로컬 Toss AIT. HTML106,271,828bytes/SHA256앞12 `b1da2a03495a`; AIT88,125,683bytes/`3cd6d30925a3`, 호환2개 일치. 설치/APK/IPA/외부 배포가 아니다.

실제 GET11:43:55.320Z는 동일name/packing·scroll0·game:null·360×728/DPR2, loaded/style1792236969193/pendingnull로 **앞선 복원 UI 코드 로드**를 확인했다. 시각 검수 증거는 아니다. 종료11:48:14.555Z 같은 화면/상태/viewport/loaded/style 유지, pending1792237587186/applyingfalse로 **이번 JS 안전 수정만 적용 대기**다. CSS 변경 없음. 새 게임/사용자 진행·저장/강제 적용·refresh/서버/commit·push/설치/배포는 하지 않았다. 실제 파일과 브라우저 차단 문제는 아래 기록대로 미해결·미검수이며 반복 프로브로 승인 대기를 우회하지 않았다.

## 후속 승인·게임 연결 — 11:29–11:37Z

Sang의 `고고 계획하고 고칠거 있으면 고쳐봐`를 직전 제시한 `save-transfer-v1`의 적용 승인으로 받아, 기존 디자인을 게임 소스에 연결했다. 아래 승인 대기 기록은 앞선 작업의 역사이며 이번 코드 연결로 대체된다. 파일/시각/실기 검증 완료를 승인으로 간주하지 않는다.

- 현재 메뉴 저장 영역은 `지금 저장` / `백업·복원`. 읽을 저장이 없는 타이틀에는 보조 `백업으로 이어가기`. 저장이 있으면 기존 이어가기가 우선이고 타이틀 보조 버튼은 숨긴다.
- 별도 native `save-transfer-dialog` 안에서 현재 여정 내보내기, 파일 선택/검사, 백업의 이름·날짜·장소/주행 중 경로·시각 확인, 명시적 `이 백업으로 복원` / 취소를 제공한다. 기본 확인 초점은 파괴적 복원 대신 취소다. 본문만 스크롤하고 footer는 분리한다. 기존 서체·색감·읽기 크기·safe-bottom을 사용하며 새 아트는 없다.
- `G.inspectSave`는 실제 `G.load`/migration을 저장 없이 실행한 뒤 기존 S 객체·RNG 참조를 finally에서 되돌린다. drive reset을 유예해 진행 타이머를 건드리지 않는다. 요약만 돌려주고 실제 원문은 UI 세션에만 잠시 보관한다. 확인 전 저장/진행 교체 없음. 잘못된 파일/더 새로운 버전/읽기 실패는 현재 여정을 보존하고 재선택 안내를 보여준다.
- native modal이 열리면 기존 modalOpen pause가 적용된다. 닫기/취소·다른 파일·새 여정·다른 화면은 늦은 읽기/확인을 무효화한다. Escape/바깥 클릭/뒤로와 원래 진입 버튼 초점 복귀를 연결했다. refresh/새 코드 적용에 파일 원문이나 복원 의도를 저장하지 않으며 선택만 했던 파일을 자동 복원하지 않는다.
- 실제 commit은 기존 transaction import와 이어가기/결말 소유자를 그대로 사용한다. 저장 공간 실패 때 확인/취소가 남고 재시도 가능, 이중 활성화는 완료된 세션을 다시 commit하지 않는다. 이름·파일명은 HTML escape한다.
- CSS는 기존 메뉴 소유자에 연결하고 옛 mounted `menu-save-export` 스타일도 유지한다. 새 구조가 적용되기 전에 CSS만 들어와도 기존 메뉴가 바뀌지 않는다. 기존 준비 화면/밸런스/저장 schema는 유지한다.

신규 panel 검사11개와 base-screen teardown 검사1개, 기존 title 검사에 no-save/continue 분기를 추가했다. 전체 `npm run test:source` **712/712**, 실패0,30.84초; 관련42/42와 후속27/27, diff/release gate 통과. 실제 helper+엔진+이어가기 코드에 저장/DOM/file 대역을 쓰며 file 선택과 확인을 나눠 검증했다. 현재/구버전 preview 무변경, cancel/닫기/이전 초점, malformed/future/read 실패, 빈 기기 restore/reload/다음 출발, quota/retry/이중 활성화, 늦은 읽기/새 파일/새 여정/화면 변경, 지급 오프닝 결과의 중복 비용 방지/다음 장면, 도착/결말, base-screen teardown을 포함한다. 첫 전체 검사에서 추가된 show 의존성을 VM에 빠뜨린2건과 기존 순서 정규식1건이 드러났다. VM에 새 transient 상태를 반영하고 기존 closePursuitHelp 우선 순서를 유지해 해결했으며 결과를 숨기거나 검사를 제외하지 않았다. 이 검사는 실제 touch/키보드/native focus/file picker 또는 시각 QA가 아니다.

`npm run build`는 처음 공용 node_modules의 Vite 임시 파일 EPERM으로 중단, 필요한 빌드 권한으로 재실행해 **성공**했다. RN0.84.0/0.72.6, HTML106,271,370bytes/SHA256앞12 `ff762ca00d94`; Toss `caravan.ait`88,125,448bytes/`ea2bcfc1f44b`, 호환2개 일치. 기기 설치/APK/IPA/외부 배포가 아니다.

### 시각/파일 검수는 차단됨

이번 Chrome에서 요청의 실제 preview origin4319의 격리 검수 URL을 열자 `This page has been blocked by Chrome / ERR_BLOCKED_BY_CLIENT`가 표시됐다. 브라우저 접근 지침을 확인하고 오류 화면을 관찰/기록한 뒤 **다른 주소·브라우저·제어 수단으로 우회하지 않았다**. Sang에게 해당 로컬 미리보기 허용 후 알려달라고 요청했고, 임시 오류 탭만 닫았다. 증거: `qa-artifacts/save-transfer-connected-20261017/blocked-preview.png`. 이전 Studio 초안360/320큰 글씨 캡처는 승인 방향의 근거일 뿐 새 게임 UI의 시각 검수로 재사용하지 않는다. 앞선 다운로드 권한 문제도 해결됐다는 증거가 없어 재시도/우회하지 않았다. 새 화면의 실제 크롭/스크롤/키보드/확인/복귀, 실제 OS 파일 전달/picker/import end-to-end와 휴대폰 검수는 **미완료**다.

실제 read-only context는11:29:20.939Z name/packing·빈 이름/연료통·game:null·360×728/DPR2, loaded/style1792235270691/pendingnull로 지난 저장 보강 적용을 확인했다. 종료11:37:30.178Z 같은name/packing·scroll0·game:null·viewport·loaded1792235270691 유지, style1792236848879로 **CSS live 반영**, pending1792236969193/applyingfalse로 **이번 JS/구조는 새 코드 준비됨 적용 대기**다. actual Safari 이미지/게임의 최종 visual은 확보하지 못했다. 사용자 게임/저장/새 게임/강제 apply/refresh·서버 재시작·설치/배포/commit/push는 하지 않았다. 구조 구현과 적용/시각 검증 대기를 구분해 기록한다.

다음은 로컬 preview 차단 해결 후 실제 배지 적용 및 새 UI의 동일 상태/축소 화면 검수, 실제 파일 전달/가져오기와 앱 기기 복귀 확인이다. 새 복원 디자인의 재승인 요청으로 되돌리지 않는다.

## 이전 작업 — 저장 보강 및 초안 제시

2026-10-17. Sang의 `더 해줘`로 이전 검수에서 남은 저장 백업·복구를 확인했다. 현재 사용자 화면과 저장을 유지하고, 기능 수정과 새 UI 제안을 분리했다. 게임 디렉터·저장·UI 지침에 따라 실제 파일 전달, 분리 엔진 검사, 브라우저 조작, 앱 빌드를 서로의 증거로 대체하지 않는다.

## 수정한 기존 소유자

- `src/04a-engine-core.js`: `G.save()`가 실제 저장 성공/실패를 boolean으로 반환한다. 저장 형식과 기존 실패 경고는 유지한다.
- `src/07-ui.js`: 지금 저장은 실제 commit 성공에만 `방금 저장됨`/성공 안내를 표시한다. 실패를 성공으로 덮던 경로를 수정했다.
- 백업 내보내기는 기존 메뉴와 옛 설정에서 같은 함수를 쓴다. 브라우저 저장 공간이 부족해도 현재 메모리의 진행을 파일로 구출할 수 있다. anchor를 문서에 붙여 요청하고 정리하며 예외 시 재시도 안내를 표시한다. 클릭만으로 파일 저장 완료를 보증할 수 없으므로 문구는 `백업 파일 다운로드를 요청했다`로 한정했다.
- 기존 파일 가져오기는 취소/잘못된 파일/읽기 실패/저장 실패에서 현재 runtime과 디스크를 보존한다. 새 요청·닫히거나 재구성된 패널·다른 여정/화면으로 바뀐 뒤 늦게 끝나는 읽기는 폐기하고 input을 다시 선택할 수 있게 초기화한다.
- 복원 성공은 단순 도로 재렌더 대신 기존 이어가기 진입점을 사용한다. 지급된 오프닝 결과·도로 사건·도착 대기를 재개하고, 종료된 백업은 결말을 연다. 유료 결과의 시간/물자 중복 지급 방지 계약을 유지한다.

게임 CSS/DOM 배치·밸런스·저장 schema·그림 변경은 없다. 옛 설정에만 남은 복원 진입을 임의로 되살리지 않았다.

## 새 UI는 Studio 승인 대기

현재 메뉴에는 내보내기만 있고, 가져오기 input은 더 이상 열리지 않는 옛 설정 안에 있었다. 새 복원 진입은 디자인 변경이므로 `tools/design-drafts/manifest.json`에 `save-transfer-v1`을 등록하고 실제 Studio 디자인 초안 창에 표시했다.

- 게임 메뉴 저장 영역 → `지금 저장` / `백업·복원`.
- 별도 백업 화면 → 내보내기 / 불러오기.
- 파일 확인 → 명시적 복원 / 취소. 다른 파일, 손상/미래 버전 안내 후 재선택.
- 저장 없는 첫 실행에도 `백업으로 이어가기` 진입 제안. 타이틀 전체 재설계가 아닌 위치 검토용 구성이다.
- 현재 게임 색감·서체를 재사용한다. 초안은 script/file input/storage가 없는 HTML/CSS anchor 전환이며 Studio sandbox를 완화하지 않았다. 예시 파일만 흉내 내고 실제 파일·게임·저장·설정은 읽거나 바꾸지 않는다. 선택/요청 작성은 자동 적용하지 않는다.

실제 Studio에서360폭 기본 글씨 백업/확인과320폭 큰 글씨 확인을 관찰했다. 확인/취소 버튼이 보였고 취소→파일 선택→손상 예시→다른 파일→정상 예시→복원 모형→메뉴 복귀를 실제 링크로 확인했다. 320×568 또는 실제 OS 파일 선택 검수는 아니다. 승인 전 게임 UI에 연결하지 않았다.

## 검사·실제 분리 브라우저 조작

- 신규 `tests/test_save_transfer_ui.cjs` **9/9**, 기존 import transaction 포함 **18/18**. 실제 helper/이어가기/엔진을 실행하되 저장·DOM·파일은 대역이다. commit feedback, quota 중 export, API 실패 정리, cancel/read/JSON/quota 보존, 늦은 읽기, 최신 요청만 commit, paid result/arrival/ending 재개를 포함한다. 실제 파일이나 native picker를 검수했다는 뜻은 아니다.
- 전체 `npm run test:source` **700/700**, 실패0,35.66초. `git diff --check`, release gate 통과.
- 최신 전체 번들을 opaque/private-storage 검수판에서 실제 버튼으로 준비→5장면→부산 DAY1 08:45까지 진행했다. 사용자 저장과 별개다. `tools/qa-opening-runtime.html`의 명시적 버튼으로 private localStorage의 다음 쓰기1회만 실패시켰다. 게임 함수/위치/자원/시각/receipt는 주입하지 않았다.
- 실제 메뉴 `지금 저장`에서 `저장 안 됨`과 기존 quota 경고, 성공 안내 없음 확인. 공개된 요약의 시간/자원은 동일했다. 같은 버튼 재시도는 `방금 저장됨`. 격리 번들 재접속→이어가기 후 부산 DAY1 08:45/연료42/물10/식량10/고철16/부품0과 양산 다음 출발 활성 유지.
- 별개 Chrome 확장 프로그램 오류가 남아 있으므로 콘솔 오류0으로 보고하지 않는다. 실제 사용자 화면/휴대폰 QA가 아니다.

## 파일 전달 검증은 미완료

기존 게임 export의 download 이벤트는 도착하지 않았다. 작은 고정 데이터 대조용 `tools/qa-download-control.html/json`에서도 브라우저 권한 요청이 결정 전에 닫혀 다운로드 검증이 중단됐다. 명시적 거부 또는 플랫폼 미지원으로 단정하지 않는다. 이후 다운로드를 재시도하거나 다른 경로로 우회하지 않았다. **OS 파일 생성·native 파일 선택·실제 파일 복원 end-to-end는 통과로 세지 않는다.** 권한 확인이 해결된 뒤 이 범위를 재검수해야 한다.

## 앱 빌드와 실제 적용 상태

- `npm run build` 성공: RN0.84.0/0.72.6 로컬 Toss AIT. HTML106,260,234bytes/SHA256앞12 `2dc6e5dd0d70`; `caravan.ait`88,122,071bytes/`9034ecdfed15`, 호환2개 동일. APK/IPA·기기 설치·외부 배포가 아니다.
- 시작11:02:51.228Z actual4327/4319는 name·빈 이름/연료통·game:null·360×728/DPR2, loaded/style1792232188520, pending1792234447084.
- 종료11:21:28.566Z 같은 name·packing·scroll0·game:null·viewport·loaded/style 유지, pending1792235270691/applyingfalse. **이번 JS 수정은 새 코드 준비됨 적용 대기**이며 CSS live 변경은 없다. 실제 Safari 화면 이미지 접근은 미확보다.
- 사용자 게임 진행/저장/강제 적용/refresh·서버 재시작·기기 설치·배포·commit/push 없음. 디자인 초안은 별도 창에 유지했다.

증거: `qa-artifacts/save-transfer-20261017/01-studio-backup-draft.png`, `02-studio-confirm-draft.png`, `04-studio-320-large-confirm.png`. `03-private-storage-failure.png`는 부모 페이지 스크롤로 게임 상단이 화면 밖인 저장 상태 부분 증거이며 전체 배치 승인 자료가 아니다. `private-save-summary.json`은 검수판이 공개한 요약으로 실제 사용자 저장이 아니다.

다음은 Sang의 복원 진입 초안 확인/승인, 승인 구조 연결, 브라우저 파일 권한 해결 후 파일 전달/실제 복원, 실제 배지 적용과 휴대폰 저장·복귀 확인이다.
