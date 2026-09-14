# Caravan Director Payoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첫 동료의 발견, 중반 노선의 후속 선택, 기본 엔딩의 회수를 연결한다.

**Architecture:** 기존 정착지 허브와 영입 진입점을 재사용한다. 노선 후속은 작은 데이터 파일과 현재 도착/사건 처리기에 연결하며 기존 flags와 저장된 결과만 쓴다. 엔딩은 새 정보를 기존 마지막 회상 턴에 합쳐 길이를 유지한다.

**Tech Stack:** 기존 vanilla JavaScript, HTML/CSS, 단일 HTML 빌드, Python Playwright/pytest, Node content checks.

**Spec:** `docs/superpowers/specs/2026-09-14-director-payoff.md`

## Global Constraints

- 작업 위치는 `/Users/sang/caravan/.worktrees/director-payoff`다. 원본 게임 소스·개인 저장·기존 전달본을 이번 작업에서 덮어쓰지 않는다.
- 새 도시·동료·화폐·유대 점수 체계·세이브 스키마·의무 영입을 추가하지 않는다.
- 아버지의 사망, 수원에 남은 어머니, 6,412명 이송 중단, TIANYAN 후속의 정사는 유지한다.
- 출발 다섯 선택·노선 거리/제약·전투 확률·기존 영입 비용과 결과는 유지한다.
- 읽는 화면은 기존 저장된 사건/결과 기록을 쓴다. 새로고침이 비용·보상을 재적용하지 않는다.
- 선택 전에는 비용과 지금 하는 행동만 보여 준다. 결과를 미리 약속하지 않는다.
- 화면은 320px 일반 글씨·390px 큰 글씨·데스크톱에서 실제 조작과 캡처로 확인한다.
- 새 래스터는 만들지 않는다. 검토한 기존 `road-supply-shelter`와 `jeonju-market`을 문경/전주 후속에 재사용한다.
- 자동 검증과 사람이 느끼는 재미·읽기 시간·애착은 구분해서 보고한다.

---

### Task 1: 첫 동료를 만날 계기

**Files:** Modify `src/04a-engine-core.js`, `src/07-ui.js`. Test `tests/test_director_first_meeting.py`.

**Interfaces:** Add pure `G.firstCompanionInvitation(stlId)` returning `{id,title,line}` or null. It consumes existing `D.stls[stlId].recruit`, `D.recruitQuests`, party, recruitQ and used; only the UI consumes it. It must require the player's actual stopped node to own that settlement. Use `recruitStl(id)` for the click, not a new recruitment mechanism.

- [ ] Write tests against the actual built game (isolated pages, following `test_director_cohesion.py` fixture): all six recruitment settlements return their local unencountered candidate; wrong settlement/driving/party/recruitQ/used return null; inspecting does not change S; real hub click opens its meet event but does not recruit or spend; decline keeps ordinary re-entry possible. Example assertion contract:

```python
result = page.evaluate("""()=>{S.at='miryang';S.party=[];S.recruitQ=null;
  const before=JSON.stringify(S);const row=G.firstCompanionInvitation?.('miryang');
  return {id:row?.id, same:before===JSON.stringify(S), party:S.party};}""")
assert result == {'id': 'minji', 'same': True, 'party': []}
```

- [ ] Run `python3 -m pytest tests/test_director_first_meeting.py -q --tb=short`, observe missing-invitation assertion fail before implementation.
- [ ] Add the pure helper next to `G.openRecruitMeet`. Reuse existing event titles/settlement recruit labels for title; use an authored physical cue instead of a perk ad. The helper guard core:

```js
if(!S||S.driving||S.ended||S.party.length||S.recruitQ||D.nodes[S.at]?.stl!==stlId) return null;
const id=D.stls[stlId]?.recruit, def=D.recruitQuests[id];
if(!def||S.used.includes(def.meet)) return null;
const ev=D.events.find(e=>e.id===def.meet);
if(!ev) return null;
```

Use these lines: minji `부품 천막에서 용접하던 사람이 시동 소리에 고개를 든다.`; parkss `진료 버스 앞에서 누군가 냉장 상자를 내려놓지 못하고 있다.`; leo `모닥불 곁의 기타 소리 사이로 개 짖는 소리가 들린다.`; jaeyi `리어카 주인이 달구지 아래를 보다가 말을 걸려 한다.`; eunsu `옥상의 안테나 옆에서 누군가 남쪽 번호판을 보고 손을 든다.`; kangwoo `돔 입구의 경비가 지도와 달구지를 번갈아 본다.` Append `말을 걸어 볼까?` No rewards or guaranteed joining.
- [ ] In `renderSettlementHub`, replace (not add above) the existing `.stl-local-concern` copy when the helper returns a row; change its CTA to `말 걸기 →` and use `data-first-companion=id`. In its existing click handler branch to `recruitStl(invitation.id)`, otherwise retain local-concern behavior. Ordinary concern returns after encounter/decline. Do not change canvas recruit or people re-entry. No CSS unless actual clipping is demonstrated; if needed edit the existing concern owner.
- [ ] Build HTML, run the focused file; capture/click 320/390 large and desktop hub. Ordinary concern still opens alley after declining, and leaving the settlement still works. Read source diff, commit only task files. Report exact RED/GREEN commands/results and capture paths.

### Task 2: 두 노선의 다음 정차에서 고르는 일

**Files:** Create `src/03n-route-aftermath.js`; modify `src/04c-engine-travel.js`, `src/04d-engine-director.js`, `src/07-ui.js`, `tools/content-registry.cjs`; test `tests/test_director_route_aftermath.py`. Register the new data file in any explicit content-loader list actually used by build/lint/tests; do not refactor loaders.

**Interfaces:** Produce pure `D.routeAftermathState(S, route)` -> `'success'|'partial'|'failure'|null`, pure `G.routeAftermathEvent()` -> current eligible event or null, and `G.openRouteAftermath()` -> boolean. Existing flags are `route_ridge_saved`, `route_ridge_saved_partial`, `route_ridge_failed`, `route_market_escorted`, `route_market_escorted_partial`, `route_market_failed`. Existing S.routePlan.id must match. Event IDs are `route_ridge_aftermath` at mungyeong and `route_market_aftermath` at jeonju. Final outcome choices use IDs `supplies`, `work`, `handoff`, setting flag `route_${route}_after_${choiceId}` and flag2 `route_${route}_after_done`; these six flags are Task 3's only earned-action input.

- [ ] Write parametric tests for all six outcome fixtures and no-outcome/wrong-route/wrong-place/already-used/driving guards. Test actual arrival opens the correct event; direct local entry uses the same resolver; zero-resource handoff remains enabled. Choice selection and receipt reload must preserve exact costs and not pay twice. Example independent outcome expectations:

```python
@pytest.mark.parametrize('route,flag,want', [
 ('ridge','route_ridge_saved','success'),('ridge','route_ridge_saved_partial','partial'),
 ('ridge','route_ridge_failed','failure'),('market','route_market_escorted','success'),
 ('market','route_market_escorted_partial','partial'),('market','route_market_failed','failure')])
def test_earned_outcome(page, route, flag, want):
    assert page.evaluate("""({route,flag})=>D.routeAftermathState?.({flags:{[flag]:true}},route)??null""", {'route':route,'flag':flag}) == want
```

- [ ] Run focused tests to see expected missing-state/event failures before code.
- [ ] Implement the state helper from explicit lookup, conservative failure > partial > success for conflicting legacy outcome flags. Add two permanent `once:true,noPool:1,w:0,type:'스토리'` events. They do not belong in random pools or journey beats. Each intro is 3–5 authored narration turns using actual outcome, and never names an unintroduced speaker. Ridge: four people survived; full medicine / half medicine / lost medicine with injuries must differ accurately. Present place is 문경 성문 아래 보급 선반. New request is sorting/packing the next medicine delivery, not magically undoing lost medicine. Market: all crossed without records / cargo damaged / seeds lost and people recorded must differ. Present place is 전주 장터 수레 수선터. New request is preparing the next carts; repairing carts never erases tracking records or restores seeds.
- [ ] Use this exact mechanical choice table. All outcomes have p:1, the chosen flag/flag2, a short authored 2–3 turn result, and one `note:{type:'사건',title,body,links:['달구지']}` describing only what was done. Do not add bond/pillar/supply rewards:

| Route / choice | Label | req | fx excluding flags/note |
| --- | --- | --- | --- |
| ridge/supplies | 의약품을 한 봉지 보태고 출발한다 | `{item:'의약품'}` | `{item:{'의약품':-1},time:15}` |
| ridge/work | 남아서 다음 배달 꾸러미를 싼다 | none | `{time:90,fatigue:4}` |
| ridge/handoff | 북쪽으로 가야 한다고 말하고 떠난다 | none | `{time:10}` |
| market/supplies | 수레를 고칠 고철을 보탠다 | `{scrap:2}` | `{scrap:-2,time:20}` |
| market/work | 남아서 수레 수선을 거든다 | none | `{time:90,fatigue:4}` |
| market/handoff | 북쪽으로 가야 한다고 말하고 떠난다 | none | `{time:10}` |

Ridge supplies result: medicine put on shelf, owner records quantity. Work: wrap packages and label destinations, clock advances. Handoff: explain trip north, owner acknowledges and continues packing; no guilt judgement or future promise. Market supplies: parts put beside wheel. Work: hold axle while local owner fits wheel. Handoff: people make room for departure and continue work. Follow `docs/DIALOGUE.md` (narration for actions, short speech only if needed), not a concluding maxim.
- [ ] Implement pure runtime eligibility using actual stopped node, matched route, earned outcome and not-used ID. At `G.finishArrival`, after existing emergency/north checks, select `G.routeAftermathEvent() || existingLocFind`. Do not put location-bound aftermath in `_storyQueue`. Add optional local stop action using existing `stopActionHtml` and `G.openRouteAftermath()` for old saves already at that node; keep camp/explore/settlement controls available. Its click must recheck eligibility. Existing saved pending event/outcome is resumed by normal receipt machinery, not eligibility replay.
- [ ] Build and run focused tests plus route corridor/saved-chain and Task 1 checks. Inspect both branch introductions and choice/results at 320 and 390 large. Keep original combat, corridor and resource rules intact. Commit task files after self-review; report evidence and loader changes.

### Task 3: 선택한 행동만 엔딩에 남기기

**Files:** Modify `src/03n-route-aftermath.js`, `src/03m-finale-reading.js`; test `tests/test_director_route_recall.py`.

**Interfaces:** Consume Task 2 flags and IDs. Add pure `D.routeAftermathRecall(S)` returning a string or empty string. Require matching valid route, its valid prior combat outcome, its aftermath ID in S.used, its done flag, and exactly one of its three choice flags. Unknown/incomplete/conflicting actions return empty. No writes/migration.

- [ ] Write parametrized tests for six earned choices and both night outcomes, three operating methods, absent party, no-action and conflicting/malformed saves. Verify default output contains only the chosen authored action, does not mutate S, remains <=12 turns at max legitimate flags/party/camp recalls, and surviving opening/camp recall still appears. Test real resolved-event save/reload before rendering the finale. Guard-break example:

```python
assert page.evaluate("""()=>D.routeAftermathRecall?.({flags:{route_ridge_saved:true},routePlan:{id:'ridge'},used:[]})||''""") == ''
```

- [ ] Run focused tests to see missing earned recall fail.
- [ ] Add the exact recall strings for supplies/work/handoff. Ridge: `문경 선반에 놓고 온 약 한 봉지가 떠올랐다. 그 뒤 배달이 어땠는지는 돌아가는 길에 물어봐야겠다.` / `문경에서 약 꾸러미를 싸던 손이 떠올랐다. 종이에 적었던 목적지 이름 하나가 아직 기억났다.` / `문경에서는 북쪽으로 가야 한다고 말하고 떠났다. 남은 꾸러미를 맡던 사람이 차를 빼라며 손을 들어 주었다.` Market: `전주 수레 옆에 내려놓은 고철이 떠올랐다. 그 바퀴가 얼마나 갔는지는 아직 모른다.` / `전주에서 수레 축을 받치던 자세 때문인지 어깨를 한 번 돌렸다. 그때 바퀴를 끼우던 사람도 이제 쉬고 있을까.` / `전주에서는 수레 수선을 맡지 않고 북행을 이어 갔다. 장터 사람들이 비켜 준 좁은 길로 달구지가 빠져나왔었다.`
- [ ] In both `seoul_night` outcome turn builders, combine the chosen string with the existing `새벽, 남쪽에서 첫 차량들이…` narration in ONE turn. Preserve the optional original record, all other turns/costs/effects and the final TIANYAN lead. Core integration:

```js
const routeRecall=D.routeAftermathRecall?.(S)||'';
turns.push(narration((routeRecall?routeRecall+'\n\n':'')+'새벽, 남쪽에서 첫 차량들이 한강을 건넜다. 돌아올지 다시 내려갈지는 각자가 정했다.'));
```

- [ ] Build and run focused tests + `tests/test_director_cohesion.py` + `node tests/test_finale_reading.cjs`. Capture the default ending with record closed at 320 and 390 large, reload/Continue and confirm identical recall. Commit after self-review.

## Controller verification and delivery

- [ ] Baseline is isolated commit `60a47b8`; original files remain intact. Record per-task commits/tests in this plan's SDD ledger; review each task and once across the whole new feature diff.
- [ ] Run combined focused tests, existing saved-presentation/route/companion checks relevant to touched owners, content build, AIT web verification and canonical portrait verification. Record nonzero counts and retained 58 asset warnings separately.
- [ ] Use live server on a free port for this worktree, not original 4177 or unrelated 4173. Browser plugin was unavailable; use temporary Playwright Chrome profiles. Actual snapshots must leave `qa-exact-replay` and wait for reveal.
- [ ] Exercise earned route sequences using actual choices rather than claiming a seeded diagnostic save is a campaign. At minimum: choose each route, complete its opening combat, travel to followup, choose, save/reload, inspect conditional ending. Track fixtures vs earned paths honestly.
- [ ] Full build only in worktree. Store final audit plus hashes there, update its CURRENT/history, and hand off its HTML/AIT and preview URL. Do not merge, push, overwrite original or remove this worktree without a later user choice.

## Plan self-review

All three spec items map to Tasks 1–3. Task 1 changes only discovery; Task 2 owns new action flags; Task 3 is a pure reader with no new schema. Shared UI/data files are changed sequentially, not concurrently. The two followups add bounded content to existing flows, not a new subsystem. Physical-phone performance and human attachment remain unverified.
