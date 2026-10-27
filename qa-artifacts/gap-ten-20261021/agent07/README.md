# agent07 — 치료와 날짜 경계 집중 감사

확정한 수정 후보는1건이다. **박 선생의 운전자 치료가 더 오래 다친 동료를 치료한다.** 운전자2일·강우3일 부상에서 치료를 고르면 의약품1개와35분이 소모되고 강우만 회복한다. 운전자 부상은 그대로이며 이 결과는 새 VM의 저장 재개 후에도 유지된다. 결과를 마치고 양산행 출발은 가능해 진행 불능으로 분류하지 않았다.

이것은 자연 플레이가 아닌 **실제 엔진의 명시적 fixture 검사**다. 재사용한 `../../ten-persona-repairs-20261020/setup.cjs`는 `opening.completed=true`를 설정한다. 동료·유대·부상·시각·유한 보급을 구성하고, 퍼크의 확률 분기에서는 RNG를 통제했다. 사건 적격성은 실제 owner로 확인한 뒤 `G.openEvent → G.resolvePresentedChoice → save/load/resume → G.queuePresentation → G.startTravel`을 실행했다. UI는 대역이며 브라우저 버튼 클릭이나 화면/소리 검수를 했다는 뜻이 아니다.

최종19개 검사 모두 실행·검증됐다. 정상 통제는 단일 운전자 치료, 진입 제외4종, 약품없음과 휴식 대안, 저장 후 약품 요구 재검사, `pss_thrift` 성공/실패/비활성 예외, 정오와 자정의 회복 차이, 치료 중 날짜 경계, 실제 야영 후 회복이다. `passed`는 관측을 검증했다는 뜻이며 주 재현에서는 버그가 있다는 assertion을 통과한 것이다.

`raw-attempt01.json`은18/19였고 미지급 receipt에 loader가 `view:null`, `reading:null`을 추가하는 정상 정규화를 strict 비교한 harness 실패를 그대로 남겼다. 예상 receipt를 실제 validator로 정규화한 `raw-attempt02.json`은19/19다. 1차 운전자2일/강우4일 재현을2차에서는 소스에 실제 존재하는 운전자2일/강우3일로 낮췄고, 같은 오대상 결과였다. 두 결과 파일 모두 보존한다.

재현 명령:

```sh
node qa-artifacts/gap-ten-20261021/agent07/treatment-audit.cjs
```

`report.json`에 소스 위치, raw case index, 재현 순서, 기각한 의심, 미검증 범위를 기록했다. `raw-attempt02.json`의 `sourceHashes`는 검사에 사용한 엔진/데이터/UI/fixture의 SHA-256이다. 관련 스킬 `save-systems`, `survival-crafting`의 비용 정산·상태 권위·재개 검증 원칙을 사용했다.

최소 수정 후보는 해당 선택의 효과를 `healInjury:'driver'`로 명시하는 것이다. 범용 `latest`나 이미 지급한 결과를 재정산할 필요는 없다. 이번 업무는 수집만이므로 게임, 생성 HTML, 기존 QA, 실제 Studio 저장·현재 제목·화면·서버는 변경하지 않았다. 자연 플레이/정상 획득 저장 재개는0회, 실제 시각·음성·모바일 검수도0회다.
