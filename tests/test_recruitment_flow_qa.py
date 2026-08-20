#!/usr/bin/env python3
"""동료 발견부터 합류까지: 장소·목적지·재시도·대사·이미지를 한 번에 검증한다."""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
ARTIFACTS = ROOT / "artifacts" / "recruitment-qa"

EXPECTED = {
    "minji": ("miryang", "ulsan", "울산"),
    "parkss": ("jeonju", "gumi", "구미"),
    "kangwoo": ("daegu", "daegu", "시장"),
    "leo": ("gwangju", "namwon", "남원"),
    "jaeyi": ("muju", "gimcheon", "김천"),
    "eunsu": ("daejeon", "cheongju", "청주"),
}


def main():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.add_init_script("localStorage.clear()")
        page.goto(GAME)

        result = page.evaluate(
            """async expected => {
              const out={routes:{},retry:{},dialogue:{},images:{}};
              const originalShow=UI.showEvent;
              const noop=()=>{};
              for(const key of ['toast','speak','renderAll','renderHud','onDepart','clearSpeech']) UI[key]=noop;
              UI.onArrive=()=>0; UI.modalOpen=()=>false; UI.showStl=noop;

              const copyOf=event=>[
                typeof event.text==='function'?event.text(S):event.text,
                ...(event.choices||[]).flatMap(choice=>(choice.out||[]).map(outcome=>
                  typeof outcome.text==='function'?outcome.text(S):outcome.text))
              ].filter(Boolean).join(' ');
              const firstFx=(event,key,id)=>{
                for(const choice of event.choices||[]){
                  for(const outcome of choice.out||[]){
                    if(outcome.fx&&outcome.fx[key]===id) return outcome.fx;
                  }
                }
                return null;
              };
              const finishJoin=(event,id)=>{
                let current=event, guard=0;
                while(current&&guard++<8){
                  const outcomes=(current.choices||[]).flatMap(choice=>choice.out||[]);
                  const outcome=outcomes.find(item=>item.fx&&
                    (item.fx.recruit===id||item.fx.offerComp===id))||outcomes[0];
                  if(!outcome) break;
                  const fx=outcome.fx||{};
                  G.applyFx(fx);
                  if(fx.offerComp===id) G.doRecruit(id);
                  current=fx.chain?D.events.find(item=>item.id===fx.chain):null;
                }
              };
              const dialogueUnknown=event=>{
                const opening=UI.storyTurns(
                  typeof event.text==='function'?event.text(S):event.text,event,
                  {turnSpeakers:event.turnSpeakers});
                const turns=[...opening];
                for(const choice of event.choices||[]){
                  for(const outcome of choice.out||[]){
                    turns.push(...UI.storyTurns(
                      typeof outcome.text==='function'?outcome.text(S):outcome.text,event,
                      {turnSpeakers:outcome.turnSpeakers,knownSpeaker:!!opening.knownSpeaker}));
                  }
                }
                return turns.filter(turn=>turn.kind==='dialogue'&&turn.name==='???')
                  .map(turn=>turn.text);
              };

              for(const [id,[meetNode,target,keyword]] of Object.entries(expected)){
                G.newGame('onroad','다온','full');
                S.at=meetNode; S.scrap=200; S.items['부품']=20;
                S.water=60; S.food=60; S.fuel=100;
                for(const upgrade of ['bench','cabin']){
                  if(G.canBuyUp(upgrade).ok) G.buyUpgrade(upgrade);
                }
                let pending=null;
                UI.showEvent=event=>{ pending=event; };
                const def=D.recruitQuests[id];
                const settlement=D.stls[meetNode];
                const opened=G.openRecruitMeet(id);
                const meet=pending;
                const startFx=meet&&firstFx(meet,'startRecruit',id);
                if(startFx) G.applyFx(startFx);
                const actualTarget=S.recruitQ&&S.recruitQ.target;
                const taskTargetOk=actualTarget===target;

                pending=null;
                if(S.recruitQ){
                  S.at=S.recruitQ.target;
                  G.openRecruitStep();
                }
                const task=pending;
                const roadFx=task&&firstFx(task,'recruitRoad',id);
                if(roadFx) G.applyFx(roadFx);
                const reachedRoad=!!(S.recruitQ&&S.recruitQ.stage==='road');

                if(S.recruitQ){
                  S.recruitQ.stage='follow';
                  S.recruitQ.target=target;
                  S.recruitQ.roadDay=S.day;
                  S.day+=1;
                  S.at=target;
                  pending=null;
                  G.openRecruitStep();
                }
                const join=pending;
                if(join) finishJoin(join,id);
                out.routes[id]={
                  opened,meet:meet&&meet.id,meetNode:def.meetNode,target:def.target,
                  settlementRecruit:settlement&&settlement.recruit,
                  copyHasTarget:copyOf(meet||{}).includes(keyword),taskTargetOk,reachedRoad,
                  join:join&&join.id,joined:G.hasComp(id)
                };

                G.newGame('onroad','다온','full');
                S.at=meetNode; S.used.push(def.meet); pending=null;
                UI.showEvent=event=>{ pending=event; };
                out.retry[id]={opened:G.openRecruitMeet(id),event:pending&&pending.id};

                for(const eventId of [def.meet,def.task,def.join]){
                  const event=D.events.find(item=>item.id===eventId);
                  out.dialogue[eventId]=event?dialogueUnknown(event):['missing event'];
                }
              }

              UI.showEvent=originalShow;
              G.newGame('onroad','다온','full');
              for(const [id] of Object.entries(expected)){
                const def=D.recruitQuests[id];
                for(const eventId of [def.meet,def.task,def.join]){
                  const event=D.events.find(item=>item.id===eventId);
                  UI.showEvent(event);
                  const frame=document.querySelector('#ev-sheet .event-scene-frame');
                  const image=frame&&frame.querySelector('.event-scene');
                  if(image&&!image.complete) await image.decode().catch(()=>{});
                  out.images[eventId]={key:frame&&frame.dataset.sceneKey,
                    width:image&&image.naturalWidth,height:image&&image.naturalHeight};
                  document.querySelector('#ev-wrap')?.classList.remove('on');
                }
              }
              return out;
            }""",
            EXPECTED,
        )

        for companion_id, (meet_node, target, _) in EXPECTED.items():
            route = result["routes"][companion_id]
            assert route["opened"] and route["meet"], route
            assert route["meetNode"] == meet_node, route
            assert route["target"] == target and route["taskTargetOk"], route
            assert route["settlementRecruit"] == companion_id, route
            assert route["copyHasTarget"], route
            assert route["reachedRoad"] and route["joined"], route
            retry = result["retry"][companion_id]
            assert retry["opened"] and retry["event"] == route["meet"], retry

        meet_events = {route["meet"] for route in result["routes"].values()}
        for event_id, unknown in result["dialogue"].items():
            # 첫 자기소개 전의 이름표는 의도적으로 숨길 수 있다. 과제와 합류
            # 장면에서는 화자가 이미 알려졌으므로 ???가 한 줄도 남으면 안 된다.
            assert not unknown or event_id in meet_events, (event_id, unknown)
        scene_keys = []
        for event_id, image in result["images"].items():
            assert image["key"], (event_id, image)
            assert image["width"] == 768 and image["height"] == 432, (event_id, image)
            scene_keys.append(image["key"])
        assert len(set(scene_keys)) == len(scene_keys), "동료 영입 장면 이미지가 서로 재사용됨"

        for index, (companion_id, (meet_node, _, _)) in enumerate(EXPECTED.items(), start=1):
            page.evaluate(
                """([id,at]) => {
                  G.newGame('onroad','다온','full'); S.at=at;
                  const def=D.recruitQuests[id];
                  UI.showEvent(D.events.find(event=>event.id===def.meet));
                }""",
                [companion_id, meet_node],
            )
            page.wait_for_timeout(240)
            page.screenshot(
                path=str(ARTIFACTS / f"{index:02d}-{companion_id}-first-meeting-mobile.png"),
                full_page=True,
            )
        page.evaluate(
            """() => {
              S.recruitQ={id:'leo',stage:'task',target:'namwon',metAt:'gwangju',escort:true};
              S.at='namwon'; UI.showEvent(D.events.find(event=>event.id==='rq_leo_task'));
            }"""
        )
        page.wait_for_timeout(240)
        page.screenshot(path=str(ARTIFACTS / "07-leo-task-namwon-mobile.png"), full_page=True)
        page.evaluate(
            """() => {
              S.recruitQ={id:'leo',stage:'ready',target:'namwon',metAt:'gwangju',escort:true};
              UI.showEvent(D.events.find(event=>event.id==='rq_leo_join'));
            }"""
        )
        page.wait_for_timeout(240)
        page.screenshot(path=str(ARTIFACTS / "08-leo-join-mobile.png"), full_page=True)

        browser.close()

    assert not errors, errors
    print("✅ 동료 6명 발견·목적지·재시도·합류·대사·전용 이미지 전수 QA")


if __name__ == "__main__":
    main()
