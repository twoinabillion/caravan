# 생산 연결 뒤 독립 재검증

2026-10-26 11:28–11:29 UTC에 실제 저장소 생산 소스로 **25사건·61결과, 284/284 통과**했다. 새 원정은 없으며 `cohortExcluded:true`인 회귀 fixture 실행이다. 생산 파일을 수정하지 않았다.

생산 `src/03g-scenes.js`는 승인된 초안과 바이트까지 같았다. SHA-256은 `31ec5fb5ad991df02429ff147d66794d1af6aed0f264dafec84fc00cf74f06ce`다. 같은 284개 assertion을 재사용했으며 기존 preview export를 덮어쓰는 동작만 생략했다. 원래 검사기·초안 결과·실패 증거는 그대로 남았다.

- [실제 생산 검사 결과](after-production-attempt01.json), [로그](check-production-attempt01.log)
- [실행 시작 해시](production-start-attempt01.json), [종료 해시와 보존 확인](production-end-attempt01.json)
- 실행 중 생산 40파일 변화 0개. 이 시간대에는 cycle24와 `03g-scenes.js` 하나만 달랐다. 예정된 story 문구 수선이 나중에 반영되면 별도 변화이며 이 검사 시점과 구분해야 한다.
- 실행 시 엔진 hash: `e477529d586ac8fbbd52183e4af3f15896d05e00699749be6bfe48abdccaab64`.
- preview fixture 25개와 기존 19개 검증 증거 80파일 모두 이전 hash 유지.

본문·화자·모든 결과의 시간/상태/chips, 신규 entry/paid reload, 옛 미지급·paid·text-only 저장, 과거 scene key와 단계별 컷 보존 범위는 [초안 검사 보고서](README.md)와 같다. 실제 게임 crop/화면 검증이라는 주장은 하지 않는다. root의 실제 갤러리 증거는 별도 `cycle24/live-gallery/review.json`에 있다.
