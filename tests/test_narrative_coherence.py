#!/usr/bin/env python3
"""Named story events must keep their cast, place, prerequisites, and dialogue attribution aligned."""

from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent.parent
URL = (ROOT / "서울까지400km.html").as_uri()


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL)
        page.evaluate("G.newGame('onroad','다온','full')")

        result = page.evaluate(
            """async () => {
              const byId=id=>D.events.find(event=>event.id===id);
              const storyTurns=(event,value,turnSpeakers,knownSpeaker=false)=>
                UI.storyTurns(typeof value==='function'?value(S):value,event,{turnSpeakers,knownSpeaker});
              const dialogueAudit=event=>{
                const opening=storyTurns(event,event.text,event.turnSpeakers);
                const outcomes=[];
                for(const [choiceIndex,choice] of (event.choices||[]).entries()){
                  for(const [outcomeIndex,outcome] of (choice.out||[]).entries()){
                    outcomes.push({choiceIndex,outcomeIndex,turns:storyTurns(
                      event,outcome.text,outcome.turnSpeakers,!!opening.knownSpeaker)});
                  }
                }
                const turns=[...opening,...outcomes.flatMap(item=>item.turns)];
                return {
                  unknown:turns.filter(turn=>turn.kind==='dialogue'&&turn.name==='???')
                    .map(turn=>turn.text),
                  speakers:[...new Set(turns.filter(turn=>turn.kind==='dialogue')
                    .map(turn=>turn.name))],
                  speakerIds:[...new Set(turns.filter(turn=>turn.kind==='dialogue')
                    .map(turn=>turn.who))]
                };
              };

              const contact=byId('resist_reveal');
              const original={at:S.at,driving:S.driving,used:[...S.used],flags:{...S.flags}};
              S.at='daegu';
              S.driving={from:'daegu',to:'gumi',dist:1,gone:0,road:'normal',slots:[],si:0,eventCount:0};
              S.used=S.used.filter(id=>id!=='resist_reveal');
              S.flags={...S.flags,library_met:0,postman_met:0,mapmaker_met:0};
              const contactBefore=G.eventAvailable(contact,{mode:'road'});
              S.flags.library_met=1; S.flags.postman_met=1; S.flags.mapmaker_met=1;
              const contactAfter=G.eventAvailable(contact,{mode:'road'});

              const scenes={};
              for(const id of ['resist_reveal','cell_sea_meet','gw_gangneung']){
                const event=byId(id);
                UI.showEvent(event);
                const frame=document.querySelector('#ev-sheet .event-scene-frame');
                const image=frame&&frame.querySelector('.event-scene');
                if(image&&!image.complete) await image.decode();
                scenes[id]={key:frame&&frame.dataset.sceneKey,width:image&&image.naturalWidth,
                  height:image&&image.naturalHeight,src:image&&image.src};
                document.querySelector('#ev-wrap').classList.remove('on');
              }

              S.at='daegu';
              UI.showEvent(byId('cell_dome_meet'));
              const fallback=document.querySelector('#ev-sheet .event-scene-frame')?.dataset.sceneKey||'';
              document.querySelector('#ev-wrap').classList.remove('on');

              S.at=original.at; S.driving=original.driving; S.used=original.used; S.flags=original.flags;
              return {
                contactBefore,contactAfter,scenes,fallback,
                contactDialogue:dialogueAudit(contact),
                seaDialogue:dialogueAudit(byId('cell_sea_meet')),
                gangneungDialogue:dialogueAudit(byId('gw_gangneung'))
              };
            }"""
        )
        browser.close()

    assert not errors, errors
    assert result["contactBefore"] is False, result
    assert result["contactAfter"] is True, result
    expected_scenes = {
        "resist_reveal": "resistance-contact",
        "cell_sea_meet": "sea-captain-contact",
        "gw_gangneung": "gangneung-hospital-build",
    }
    for event_id, scene_key in expected_scenes.items():
        scene = result["scenes"][event_id]
        assert scene["key"] == scene_key, result
        assert scene["width"] == 768 and scene["height"] == 432, result
        assert scene["src"].startswith("data:image/jpeg;base64,"), result
    assert result["fallback"] == "daegu-dome", result

    assert not result["contactDialogue"]["unknown"], result
    assert {"한별", "자전거 우편부", "지도장이"}.issubset(
        set(result["contactDialogue"]["speakers"])
    ), result
    assert not result["seaDialogue"]["unknown"], result
    assert "김 선장" in result["seaDialogue"]["speakers"], result
    assert not result["gangneungDialogue"]["unknown"], result
    assert {"강릉 병원 일꾼", "십장"}.issubset(
        set(result["gangneungDialogue"]["speakers"])
    ), result
    print("✅ 핵심 사건의 사진·선행 만남·화자·장소 대체 규칙 일치")


if __name__ == "__main__":
    main()
