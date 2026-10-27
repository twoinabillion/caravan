# 25개 이미지 매핑 초안 독립 검증

cycle24 동결 소스에 root의 `cycle23/visual-root/03g-scenes.proposed.js`만 대입한 격리 VM에서 **25사건·61결과, 284/284 통과**했다. 생산 소스·이미지·기존 19개 검증 증거는 수정하지 않았다. 자연 원정 추가는 0회이며 모든 자료는 `cohortExcluded:true`인 fixture 검증이다.

## 입력과 격리

- 기준: `cycle24/source`의 40파일, engine `cdfeba9d024198a5d0eba3b0a017a9a8ed5bf41c264c01b52f777497eeee00d6`.
- 대상: cycle22 `new` 18개 + cycle23 `new` 6개 + cycle22 Leo `reuse` 1개.
- 초안 03g SHA-256: `31ec5fb5ad991df02429ff147d66794d1af6aed0f264dafec84fc00cf74f06ce`.
- `proposed-source/src`는 40파일만 복사했다. 동결본과 다른 파일은 `03g-scenes.js` 하나다. 자산은 복사하지 않고 저장소의 실제 배포 파일을 읽었다. 이 검증 디렉터리는 약 12.5MB다.
- `check.cjs`, `audit-proposal.cjs`는 cycle22의 검사기를 복사·확장했다. 옛 ATM 화자 projection은 제거했다. frozen24의 실제 화자가 기준이며 그림 외 변경은 허용하지 않았다.

## 검사 결과

[after-attempt01.json](after-attempt01.json)과 [check-attempt01.log](check-attempt01.log)에 전체 284개 결과가 있다. 25개 사건의 선택·확률별 결과 61개를 모두 지정해 실행했다. 이는 확률 선택을 제어한 유한 상태 fixture이며 자연 발생 증거가 아니다.

- 새 진입에서 지정된 등록 이미지·설명·메타데이터가 선택되고 저장/재개 뒤 유지된다.
- 모든 사건 본문·조건·선택·효과·화자 데이터가 frozen24와 동일하다.
- 실제 reader와 `renderStoryScene`의 컷 선택 부분으로 각 발화의 그림을 확인했다.
- 모든 새 결과의 본문·reader·시간/자원/상태·chips가 기준과 동일하며 paid reload 후 중복 지급이 없다.
- frozen24의 미지급 25개와 지급 61개는 원래 그림 목록과 각 발화의 과거 컷을 유지한다.
- 지급 61개에서 저장 view/reading/authoredView를 제거한 명시적 text-only legacy fixture도 원문·화자·효과를 보존하며 재지급하지 않는다. 이 제거는 legacy 경계를 검사하는 fixture에서만 했다. 미리보기나 자연 저장의 키를 고치지 않았다.
- 명시적 선행 그림 우선순위와 Leo의 기존 단계 정의를 보존했다. 새 Leo 진입은 광주 시장 한 장을 사용하고, 옛 저장의 남원 컷은 그대로 남는다.

[proposal-owner-audit.json](proposal-owner-audit.json)의 전체 `D` 데이터·함수 비교는 새 asset/description/meta 24개, `eventScenes` 23개, `eventTurnScenes` 2개(Leo·장터 발화) 외 변경이 없음을 확인했다. 모든 기존 단계 정의도 같다. 실제 신규 WebP 24개는 크기·16:9·format·메타데이터·필수 참조가 일치한다. 이 기계 검사는 실제 그림의 화풍·장소·모바일 crop 검수를 대신하지 않는다. root의 실제 갤러리 검수는 별도 증거다.

첫 owner audit은 새로 생긴 `story_generation_speech` 키를 되돌릴 때 `undefined` own-property를 남긴 검사기 오류로 실패했다. 없는 키는 삭제하는 정확한 projection으로 고친 뒤 통과했다. 최초 스크립트·실패 로그는 보존했고 생산/초안은 변경하지 않았다. 상세는 [harness-corrections.json](harness-corrections.json)이다. 284개 실행 검사는 첫 실행에 전부 통과했다.

## 미리보기와 실제 원정 저장의 구분

`preview-entry-<eventId>.json` 25개는 명시적 인원·물자·장소 fixture에서 실제 `G.beginPresentation`, 실제 reader/scene 선택, `G.capturePresentationView`, `G.save/G.load`, 공식 `G.exportSave`를 거쳐 만들었다. 새 키를 손으로 주입하지 않았다. 가져오기 가능한 정상 저장 형식이지만 **정상 원정에서 자연 발생한 저장은 아니다**. 새 asset을 연결한 뒤 root가 화면 검수에 사용할 수 있다.

[preview-manifest.json](preview-manifest.json)은 각 fixture 경로·해시와 함께, primary 원정에서 이미 자연 발생했던 **25/25 사건의 원본 미지급 저장 경로와 summary lineage**도 연결한다. 원본은 복사하거나 바꾸지 않았다. 원본의 saved reading은 과거 그림을 유지하므로 새 매핑 미리보기로 잘못 세면 안 된다. 정상 원정·독립 참가자·새 선택 계수는 늘리지 않는다.

## 보존 확인과 남은 작업

[verification-final.json](verification-final.json)에 종료 시 생산 40파일의 hash를 남겼다. 생산 소스는 frozen24와 모두 동일했고, 초안 03g도 최초 복사·원본 제안과 동일했다. 기존 cycle22 19개 검증 디렉터리의 원본 파일 80개는 모두 hash가 같다.

현재 결과는 **초안만** 대상으로 한다. 실제 생산 연결 뒤의 재검증과 실제 게임 화면/crop은 아직 이 보고서의 완료 범위에 없다. root의 연결 신호를 기다린다.
