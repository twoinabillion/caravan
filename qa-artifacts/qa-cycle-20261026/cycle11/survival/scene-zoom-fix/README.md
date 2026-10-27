# V11-06: 확대 버튼의 클릭이 본문 넘김으로 빠짐

## 재현과 원인

Root의 실제 브라우저 QA에서 온실 entry의 ↗ 버튼을 클릭하자 그림 확대 대신 본문이 넘어가 선택지가 표시됐다. 선택지 단계에서도 확대되지 않았다. 이어 밤손님 화면에서 `button.scene-zoom`의 실제 computed `pointerEvents`가 `none`이고, 버튼 중앙 `elementFromPoint`가 `button.scene-advance[data-story-scene-next]`임을 확인했다. 브라우저 증거는 root가 별도 보존한다.

정확한 버튼 selector는 `#ev-sheet .event-scene-frame button.scene-zoom`. 이 UI는 별도 modal DOM을 만들지 않고 기존 `.event-scene-frame`에 `.zoomed`를 토글한다. 따라서 modal 부재만으로 실패를 판단하지 않는다.

`wireSceneZoom`은 span을 실제 button으로 교체하고 `preventDefault`/`stopPropagation` 및 정상 확대 토글을 이미 제공한다. 하지만 장식 span용 기본 `.scene-zoom { pointer-events:none }`가 실제 button에도 적용됐다. 승객 reader의 두 소유 규칙에는 이를 복원하는 선언이 없어서, 버튼 아래의 전체 그림 다음 대사 버튼이 실제 pointer target이 됐다. 핸들러만 직접 호출한 기존 검사는 이를 놓쳤다.

## 최소 수선

- `src/01-style.html`의 기존 `passenger-story-reader` 소유 규칙 두 개(페이지/비페이지)에 각각 `pointer-events:auto`를 추가했다. 다른 selector를 덧붙이지 않았다.
- `src/07-ui.js`와 핸들러, 이벤트/자원/저장 데이터는 수정하지 않았다. 장식 span을 사용하는 비승객 전투 경로는 유지했다.
- `tests/test_mobile_dialogue.cjs`에 전체 style의 PostCSS AST에서 관련 cascade를 확인하는 검사와 마지막 대사에서 next가 disabled여도 확대/닫기가 가능한 검사를 추가했다. 기존 실제 `wireSceneZoom` 함수로 확대·축소·Escape 및 읽기 index 보존을 확인한다. 이 제한된 AST 검사는 브라우저 hit testing을 대체하지 않는다.
- `docs/DEVELOPMENT_GUARDRAILS.md`에 장식 marker→button 전환 시 CSS hit testing도 검수할 교훈을 기록했다.

## 검증 범위와 증거

- `style-before.html`: 수선 직전 원문.
- `tests-red01.log`: 기존 실제 handler 검사는 통과하지만 새 CSS contract가 `none !== auto`로 실패.
- `tests-green01.log`: 모바일 인터랙션 14개 통과. 페이지/비페이지/materials CSS, 열기/닫기/마지막 대사·선택 경계, Escape, 전투 경로 포함.
- `related-tests01.tap`: 실제 읽기 페이지 및 written-source 관련 23개 통과.
- `verification01.json`: 현재 stylesheet가 원본에 두 pointer 선언만 추가한 것과 정확히 동일함을 확인. 전체 suite/build는 root 담당.

이 디렉터리의 검증은 소스/CSS AST/격리된 실제 핸들러 증거다. 실제 화면의 CSS live 반영, 중앙 hit target, 확대·축소 및 저장된 읽기 cursor 검증은 root가 현재 화면에서 수행한다. 새 자연 여정이나 엔딩 수에는 포함하지 않는다.

## 실제 화면 후속 확인

Root의 Chrome 현재 밤손님 result 화면에서 CSS live 반영 후 `pointerEvents:auto`, 버튼 중앙 hit target `scene-zoom`을 확인했다. 클릭 시 `aria-expanded=true`와 `그림 닫기` 레이블 및 실제 확대 사진을 확인했고, 다시 닫자 같은 result 본문/선택 단계가 보존됐다. 실제 캡처: `../../visual/thief-zoom-after.png`. 이는 root의 브라우저 증거이며 위 격리 검사와 구분한다.
