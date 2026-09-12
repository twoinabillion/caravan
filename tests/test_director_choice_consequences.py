#!/usr/bin/env python3
"""Task 4: methods disclose intent, affect play, persist, and return later."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()


def open_game(browser, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    page.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
    page.goto(GAME)
    return page


def test_scanner_methods_and_rush_actions_change_the_next_phase():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_game(browser)
        result = page.evaluate(
            """() => {
              G.newGame('onroad','전술','full');
              const rows=[
                ['combat_walker_read','combat_walker_strike','근접'],
                ['combat_swarm_read','combat_swarm_break','운전'],
                ['combat_toll_read','combat_toll_breach','근접']
              ].map(([readId,nextId,nextTactic])=>{
                const read=D.events.find(event=>event.id===readId);
                const next=D.events.find(event=>event.id===nextId);
                const rush=read.choices.find(choice=>choice.tactic==='돌입');
                const follow=next.choices.find(choice=>choice.tactic===nextTactic);
                const reset=()=>{ S.combat={id:readId,edge:0,pressure:1,history:[],
                  threat:read.combat.threat,terrain:read.combat.terrain,
                  objective:read.combat.objective,stakes:read.combat.stakes}; };
                reset();
                const neutral=G.combatOdds(follow,next);
                G.applyFx(rush.out[0].fx);
                const success={edge:S.combat.edge,pressure:S.combat.pressure,
                  read:S.combat.read,odds:G.combatOdds(follow,next)};
                reset();
                G.applyFx(rush.out[1].fx);
                const failure={edge:S.combat.edge,pressure:S.combat.pressure,
                  read:S.combat.read,odds:G.combatOdds(follow,next)};
                return {readId,neutral,success,failure,chain:rush.out.map(out=>out.fx.chain)};
              });
              const walker=D.events.find(event=>event.id==='combat_walker_read');
              const strike=D.events.find(event=>event.id==='combat_walker_strike');
              const scanner=walker.choices.filter(choice=>choice.tactic!=='돌입').map(choice=>{
                S.combat={id:'walker',edge:0,pressure:1,history:[],threat:walker.combat.threat};
                G.applyFx(choice.out[1].fx);
                const nextUses=strike.choices.map(nextChoice=>({
                  tactic:nextChoice.tactic,
                  bonus:G.combatReadDelta(nextChoice),
                  note:G.combatReadNote(nextChoice)
                }));
                return {tactic:choice.tactic,edge:S.combat.edge,pressure:S.combat.pressure,
                  successRead:choice.out[0].fx.combatRead&&choice.out[0].fx.combatRead.tactics,
                  failureRead:choice.out[1].fx.combatRead&&choice.out[1].fx.combatRead.tactics,
                  nextUses};
              });
              return {rows,scanner};
            }"""
        )
        assert [row["tactic"] for row in result["scanner"]] == ["관찰", "정비", "사격"]
        assert [row["successRead"] for row in result["scanner"]] == [
            ["교란"], ["근접"], ["사격"]
        ]
        assert [row["failureRead"] for row in result["scanner"]] == [[], [], []]
        for row in result["scanner"]:
            assert row["edge"] == -2 and row["pressure"] == 3
            assert all(use["bonus"] == 0 for use in row["nextUses"])
            assert all(use["note"] != "읽어낸 틈 활용" for use in row["nextUses"])
        for row in result["rows"]:
            assert len(set(row["chain"])) == 1 and row["chain"][0]
            assert row["success"]["edge"] > 0
            assert row["success"]["pressure"] > 1
            assert row["success"]["read"]
            assert row["success"]["odds"] > row["neutral"]
            assert row["success"]["odds"] > row["failure"]["odds"]
        browser.close()


def test_foreseeable_costs_are_separate_and_results_stay_hidden_on_mobile():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_game(browser, {"width": 360, "height": 700})
        result = page.evaluate(
            """() => {
              G.newGame('onroad','미리보기','interactive','keeper');
              const inspect=event=>{
                UI.showEvent(event); UI.finishStory();
                return [...document.querySelectorAll('#ev-sheet .choice')].map(node=>({
                  text:node.innerText, aria:node.getAttribute('aria-label')||'',
                  clipped:node.scrollHeight>node.clientHeight+1,
                  overlap:(()=>{
                    const head=node.querySelector('.choice-head');
                    const forecast=node.querySelector('.choice-forecast');
                    if(!head||!forecast) return false;
                    const hr=head.getBoundingClientRect(), fr=forecast.getBoundingClientRect();
                    return hr.bottom>fr.top+.5;
                  })(),
                  disabled:node.disabled
                }));
              };
              const opening=inspect(D.openingDeparture[0]);
              S.combat=null;
              const walker=inspect(D.events.find(event=>event.id==='combat_walker_read'));
              S.combat={id:'walker',edge:0,pressure:1,history:[]};
              S.items['석궁']=0; S.items['볼트']=0; S.items['화염병']=0;
              const strike=inspect(D.events.find(event=>event.id==='combat_walker_strike'));
              return {opening,walker,strike};
            }"""
        )
        opening_copy = " ".join(row["text"] for row in result["opening"])
        walker_copy = " ".join(row["text"] for row in result["walker"])
        all_copy = " ".join(
            row["text"] + " " + row["aria"]
            for group in result.values() for row in group
        )
        assert "즉시 · 시간 5분" in opening_copy
        assert "즉시 · 시간 15분" in opening_copy
        assert "위험 · 각도가 나쁘다" in walker_copy
        assert "노출 · 몸을 먼저 드러낸다" in walker_copy
        assert "이후 · 다음 교전" in walker_copy
        assert "성공률" not in all_copy and "판정 전망" not in all_copy
        assert "획득" not in all_copy and "보상" not in all_copy
        assert not any(row["clipped"] for group in result.values() for row in group)
        assert not any(row["overlap"] for group in result.values() for row in group)
        locked = [row for row in result["strike"] if row["disabled"]]
        assert locked and all("필요" in row["text"] for row in locked)
        browser.close()


def test_combat_outcomes_opening_callbacks_and_save_reload_are_stable():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_game(browser)
        result = page.evaluate(
            """() => {
              const resolveFinal=(choiceIndex,roll)=>{
                G.newGame('onroad','결과','full');
                S.items['석궁']=1; S.items['볼트']=3;
                const event=D.events.find(item=>item.id==='combat_walker_strike');
                const choice=event.choices[choiceIndex];
                S.combat={id:'walker',kind:'교전',edge:0,pressure:1,history:[],
                  threat:event.combat.threat,terrain:event.combat.terrain,
                  objective:event.combat.objective,stakes:event.combat.stakes,
                  start:{van:S.van,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,
                    fatigue:S.fatigue,pursuit:S.pursuit,items:{...S.items},injuries:[]}};
                const original=rng; rng=()=>roll;
                const out=G.pickOutcome(event,choice); rng=original;
                G.rememberCombatChoice(event,choice,out.combatMeta);
                G.applyFx(out.fx);
                return {code:S.lastCombatReport.resultCode,combat:S.combat,text:out.text,
                  report:JSON.parse(JSON.stringify(S.lastCombatReport))};
              };
              const success=resolveFinal(0,0);
              const failure=resolveFinal(0,.999);
              const retreat=resolveFinal(4,.5);
              const fire=resolveFinal(2,0);

              G.newGame('onroad','연계','full');
              const readEvent=D.events.find(item=>item.id==='combat_walker_read');
              const strikeEvent=D.events.find(item=>item.id==='combat_walker_strike');
              const rush=readEvent.choices.find(choice=>choice.tactic==='돌입');
              const follow=strikeEvent.choices.find(choice=>choice.tactic==='근접');
              S.items['쇠파이프']=1;
              S.combat={id:'walker',kind:'교전',edge:0,pressure:1,history:[],
                threat:readEvent.combat.threat,terrain:readEvent.combat.terrain,
                objective:readEvent.combat.objective,stakes:readEvent.combat.stakes,
                start:{van:S.van,fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,
                  fatigue:S.fatigue,pursuit:S.pursuit,items:{...S.items},injuries:[]}};
              G.applyFx(rush.out[0].fx);
              G.rememberCombatChoice(readEvent,rush);
              const original=rng; rng=()=>0;
              const linkedOut=G.pickOutcome(strikeEvent,follow); rng=original;
              G.rememberCombatChoice(strikeEvent,follow,linkedOut.combatMeta);
              G.applyFx(linkedOut.fx);
              const linked={report:JSON.parse(JSON.stringify(S.lastCombatReport)),
                note:(S.notes||[]).find(note=>note.title.includes(readEvent.combat.threat))};

              G.newGame('onroad','콜백','interactive','keeper');
              const missingCallbacks=D.openingDeparture.flatMap(step=>step.choices
                .filter(choice=>!(D.openingDecisionCallbacks[step.id]||{})[choice.id])
                .map(choice=>`${step.id}:${choice.id}`));
              G.resolveOpeningChoice('opening_workshop','pack_workshop');
              G.continueOpening('opening_workshop');
              const savedChoice=S.opening.decisions.opening_workshop.choiceId;
              S.driving={from:'busan',to:'yangsan',gone:1,dist:30};
              const premature=G.takeChoiceEcho();
              S.stats.km=40; S.stats.events=4; S.driving={from:'busan',to:'yangsan',gone:1,dist:30};
              const pending=G.pendingChoiceMemory();
              G.save(); S=null; G.load();
              const restored=G.pendingChoiceMemory();
              const echo=G.takeChoiceEcho();
              G.save(); S=null; G.load();
              const consumed=G.pendingChoiceMemory();
              return {success,failure,retreat,fire,linked,missingCallbacks,
                savedChoice,premature,pending,restored,echo,consumed,
                decision:G.openingDecision('opening_workshop')};
            }"""
        )
        assert result["success"]["code"] == "success"
        assert result["failure"]["code"] == "failure"
        assert result["retreat"]["code"] == "partial"
        assert "마지막 사람" not in result["retreat"]["text"] and "서로의" not in result["retreat"]["text"]
        assert all(row["combat"] is None for row in (
            result["success"], result["failure"], result["retreat"], result["fire"]
        ))
        assert result["fire"]["code"] == "success"
        assert result["fire"]["report"]["keyMoment"].startswith("교란 ·")
        assert not any("부품" in gain or "고철" in gain for gain in result["fire"]["report"]["gains"])
        assert [row["tactic"] for row in result["linked"]["report"]["history"]] == ["돌입", "근접"]
        assert result["linked"]["report"]["readUsed"] is True
        assert "대응 — 돌입" in result["linked"]["note"]["body"]
        assert result["missingCallbacks"] == []
        assert result["savedChoice"] == "pack_workshop"
        assert result["premature"] is None
        assert result["pending"]["id"] == result["restored"]["id"] == "opening_workshop:pack_workshop"
        assert result["echo"]["lines"] and result["echo"]["memory"]["choiceId"] == "pack_workshop"
        assert result["decision"]["choiceId"] == "pack_workshop"
        assert result["decision"]["callbackEchoed"] is True
        assert not result["consumed"] or result["consumed"]["id"] != "opening_workshop:pack_workshop"
        browser.close()


def test_core_clue_choices_keep_a_terminal_progression_effect():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_game(browser)
        failures = page.evaluate(
            """() => {
              G.newGame('onroad','단서','full');
              const completion=new Set(Object.values(D.mainEvidenceCompletion||{}));
              const walk=(eventId,seen=[])=>{
                if(seen.includes(eventId)) return false;
                const event=D.events.find(item=>item.id===eventId);
                if(!event||!(event.choices||[]).length) return false;
                return event.choices.every(choice=>(choice.out||[]).every(out=>{
                  const fx=out.fx||{};
                  if(fx.flag&&completion.has(fx.flag)) return true;
                  if(fx.flag2&&completion.has(fx.flag2)) return true;
                  return fx.chain ? walk(fx.chain,[...seen,eventId]) : false;
                }));
              };
              return [...new Set(G.mainEvidenceRows().map(row=>row.event))]
                .filter(eventId=>D.mainRecoveryEvents&&D.mainRecoveryEvents[eventId])
                .filter(eventId=>!walk(eventId));
            }"""
        )
        assert failures == []
        browser.close()


def test_local_change_reaches_the_saved_road_callback_once():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_game(browser)
        result = page.evaluate(
            """() => {
              G.newGame('onroad','현장','full');
              S.at='miryang'; S.driving=null; S.routePlan=null;
              const action=G.doStlFieldAction('miryang','pump');
              const changed=G.stlImpact('miryang');
              G.save(); S=null; G.load();
              const drive={wx:'rain',dist:34,slots:[]};
              const scheduled=G.prepareSettlementRoadEcho(drive,'miryang','yangsan');
              G.save(); S=null; G.load();
              const first=G.resolveImpactEcho('relay');
              const second=G.resolveImpactEcho('relay');
              return {action,changed,scheduled,slots:drive.slots,first,second,
                persisted:S._stlField.roadEchoed['miryang:pump'],
                note:S.notes.find(row=>row.title.includes('밀양'))};
            }"""
        )
        assert result["action"]["ok"] is True and result["action"]["firstImpact"] is True
        assert result["changed"]["count"] == 1 and result["changed"]["stage"] == 1
        assert result["scheduled"]["key"] == "miryang:pump"
        assert any(slot.get("special") == "impact" for slot in result["slots"])
        assert result["first"]["fx"]["time"] == 15
        assert result["persisted"]["mode"] == "relay"
        assert result["note"] and "다음 구간" in result["note"]["body"]
        assert result["second"]["fx"] == {}
        browser.close()


def test_seeded_method_results_repeat_and_parkss_has_no_false_history():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = open_game(browser)
        result = page.evaluate(
            """() => {
              const run=seed=>{
                G.seedOverride=seed; G.newGame('onroad','시드','full'); G.seedOverride=undefined;
                const event=D.events.find(item=>item.id==='combat_walker_read');
                const choice=event.choices.find(item=>item.tactic==='돌입');
                S.combat={id:'walker',edge:0,pressure:1,history:[],threat:event.combat.threat};
                return Array.from({length:12},()=>{
                  const out=G.pickOutcome(event,choice);
                  return choice.out.findIndex(row=>row.text===out.text);
                });
              };
              const parkss=D.recruitQuests.parkss.approaches.battery.drive.desc;
              G.newGame('onroad','박 선생','full');
              S.party=['parkss']; S.comps.parkss.approach='battery';
              S.van=50; delete S.flags.parkss_approach_drive;
              const firstDrive={slots:[{at:1}]};
              const firstMemory=G.prepareRecruitMemory(firstDrive);
              const firstVan=S.van;
              G.save(); S=null; G.load();
              const secondDrive={slots:[{at:1}]};
              const secondMemory=G.prepareRecruitMemory(secondDrive);
              return {a:run(42004),b:run(42004),c:run(73119),parkss,
                parkssCallback:{firstMemory,firstVan,secondMemory}};
            }"""
        )
        assert result["a"] == result["b"]
        assert result["a"] != result["c"]
        assert "민지" not in result["parkss"]
        assert result["parkssCallback"]["firstMemory"]["choice"] == "battery"
        assert result["parkssCallback"]["firstVan"] == 53
        assert result["parkssCallback"]["secondMemory"] is None
        browser.close()
