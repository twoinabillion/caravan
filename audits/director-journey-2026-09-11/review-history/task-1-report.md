# Task 1 report — playable, saved departure

## Result

The default new-game action now starts a five-scene playable departure inside the existing event and result UI. The player repairs the family bus, records the failed appeal, identifies the parents' dashboard module, closes the workshop, and then reaches the ordinary 부산 road state. The long historical prologue remains available from the name screen through **먼저 전체 역사 프롤로그 읽기**. Explicit `full`, `summary`, and `skip` engine callers keep their prior already-departed behavior.

The new save-owned `S.opening` record contains the current step, an exactly-once pending result, stable choice decisions, and completion state. `G.openingPending()`, `G.resolveOpeningChoice(stepId, choiceId)`, `G.continueOpening(stepId)`, and `G.openingDecision(stepId)` are the public integration points. Travel stays locked until completion. A reload before a choice resumes the current scene; a reload after a choice restores the authored result and its effect chips without charging the effect again. The first road story is queued once only after the final departure.

The five canonical step IDs are `opening_workshop`, `opening_bus_repair`, `opening_failed_appeal`, `opening_parents_module`, and `opening_departure`. Choice IDs are stored unchanged in `S.opening.decisions` for later callbacks. Each choice also writes a journey-journal entry. The family facts remain 하진, 도윤, 유나; the dashboard module remains the mother's circuit and father's human-verification key; the missing removal instructions and 남산 evidence mission remain explicit.

## TDD evidence

RED, before implementation:

```text
$ python3 tests/test_director_opening.py
Traceback ...
TypeError: G.openingPending is not a function
exit 1
```

GREEN, final production build and focused suite:

```text
$ npm run build:html
✅ 콘텐츠 검증 통과
✅ 정본 비주얼 계약 통과
✅ 서울까지400km.html 생성 (76066437 bytes)
exit 0

$ python3 tests/test_director_opening.py
✅ playable saved departure passed
exit 0
```

The focused suite exercises the engine and the rendered UI. It covers the eight-turn maximum before the first real choice, distinct part/scrap/time outcomes, a resource-free repair for all three starting profiles, travel locking, pre-choice reload, post-choice reload, double activation, five stored decisions, canonical flags and journal notes, single road-story enqueue, ordinary-road completion, old saves without `S.opening`, and explicit `full`/`summary`/`skip` compatibility.

## Live mobile QA and captures

I ran the same focused suite against the actual `dev:live` build, not a source or DOM-only fixture:

```text
$ npm run dev:live -- --port=4176
Local: http://127.0.0.1:4176/game?caravan-live=1

$ CARAVAN_CAPTURE_URL=http://127.0.0.1:4176/game?caravan-live=1 python3 tests/test_director_opening.py
✅ playable saved departure passed
exit 0
```

The headless Chrome run entered through the visible new-game and name controls, advanced the authored event UI, clicked real choices and result buttons, reloaded through the visible continue control, and finished on the ordinary road. Automated bounds checks require every choice's content and requirement text to fit its own button, the last choice to be reachable, result/departure actions to remain fully reachable with a touch target of at least 44 px, and horizontal content to stay inside the viewport.

Actual screenshots:

- [390×844 choice](../../../qa-artifacts/director-opening-2026-09-11/choice-390x844.png)
- [390×844 result](../../../qa-artifacts/director-opening-2026-09-11/result-390x844.png)
- [390×844 departure](../../../qa-artifacts/director-opening-2026-09-11/departure-390x844.png)
- [320×578 choice](../../../qa-artifacts/director-opening-2026-09-11/choice-320x578.png)
- [320×578 result](../../../qa-artifacts/director-opening-2026-09-11/result-320x578.png)
- [320×578 departure](../../../qa-artifacts/director-opening-2026-09-11/departure-320x578.png)

Visual inspection confirmed that the existing canonical bus-repair and workshop-departure scenes remain legible at both sizes. Requirement lines such as `필요 · 부품` and `필요 · 고철 3` remain inside their own gold buttons at 390×844. Intermediate results say `다음 장면`; only the final result says `길로 나가기`. The 320×578 layout scrolls to expose the remaining choice/action rather than shrinking its text or touch target.

These are automated headless interactions and screenshots. They do not establish normal human play duration or emotional attachment.

## Regression checks

```text
$ python3 -m pytest -q tests/test_intro_replay.py
2 passed in 3.60s

$ python3 tests/test_start_profiles.py
✅ 시작 구성 3종 + HUD 배지 + 저장/복원 검증 통과

$ python3 tests/test_save_migrations.py
✅ v1.2 save migration + new game schema verified

$ python3 tests/test_source_health.py
✅ source health: active UI implementations are singular and legacy blocks are inert

$ python3 tests/test_golden_route.py
✅ golden route passed
```

`python3 tests/test_smoke.py` was also probed after updating its intro entry to use the preserved history button. The exact output is saved at `/private/tmp/caravan-director-task1-smoke.log`. It remains non-gating and red on stale pre-existing expectations for `.story-tap-hint`, event chrome/result styling and ordinary-notification placement. The terminal error is `Page.evaluate: TypeError: Cannot read properties of null (reading 'textContent')` at anonymous evaluation line `392:60`, which maps to `tests/test_smoke.py:1018`: `document.querySelector('#map-mission').textContent.includes('대전')`. In this run the missing selector is therefore `#map-mission`. That suite was not part of the recorded green baseline (`build`, save migrations, source health, and golden route), and the focused opening suite directly verifies the changed journey. `tests/test_story_event_layout.py` likewise expects the absent `.story-tap-hint` selector and was not changed as part of this task.

The build still reports 58 inherited legacy-reference warnings and the existing recommended-size warning. It remains below the enforced 80 MB maximum. No raster asset was added or rewired for Task 1.
