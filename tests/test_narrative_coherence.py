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
              const scriptedSpeakerMismatches=[];
              const speakerId=value=>typeof value==='string'?value:value&&value.who;
              const spokenIds=turns=>turns
                .filter(turn=>!['narration','thought','ai'].includes(turn.kind)&&turn.who)
                .map(turn=>turn.who);
              const resolveExpectedSpeaker=id=>id==='party_first'?(S.party?.[0]||'me'):id;
              const compareScript=(event,scope,value,speakers,knownSpeaker=false)=>{
                const source=typeof value==='function'?value(S):value;
                const actual=spokenIds(storyTurns(event,source,speakers,knownSpeaker));
                const expected=(speakers||[]).map(speakerId).map(resolveExpectedSpeaker);
                if(actual.join('|')!==expected.join('|'))
                  scriptedSpeakerMismatches.push({scope,expected,actual});
              };
              for(const [eventId,script] of Object.entries(D.eventTurnScripts||{})){
                const event=byId(eventId);
                if(!event) continue;
                if(script.text) compareScript(event,`${eventId}.text`,event.text,script.text);
                for(const [path,speakers] of Object.entries(script.choices||{})){
                  const [choiceIndex,outcomeIndex]=path.split('.').map(Number);
                  const outcome=event.choices?.[choiceIndex]?.out?.[outcomeIndex];
                  if(outcome) compareScript(event,`${eventId}.${path}`,outcome.text,speakers,true);
                }
              }
              /* 계기판·간판·기록·방송 문구는 따옴표가 있어도 익명 인물의
                 발화로 변하면 안 된다. 실제 storyTurns 결과를 고정해 데이터
                 표기와 자유 형식 파서 양쪽의 회귀를 함께 잡는다. */
              const nonHumanScopes=[
                ['find_lake_sign','text',[]],
                ['find_mall_kid','text',[]],
                ['exp_school','0.0',[]],
                ['crisis_collapse2','text',[]],
                ['prev_trace_story_done','text',[]],
                ['prev_trace_too_late','text',[]],
                ['prev_trace_thirst','text',[]],
                ['loc_airfield','text',[]],
                ['ev_parking_evs','text',[]],
                ['meet_piano','text',[]],
                ['meet_piano','0.0',[]],
                ['exp_noraebang','0.0',[]],
                ['exp_underground','text',[]],
                ['exp_conv','0.1',[]],
                ['loc_drivein','text',[]],
                ['meet_bike_pilgrims','text',[]],
                ['meet_doljanchi','text',[]],
                ['vg_soundwall','text',[]],
                ['vg_busstop','text',[]],
                ['exp_comicroom','1.0',[]],
                ['ai_delivery','text',[]],
                ['ai_delivery','0.0',[]],
                ['exp_pcroom','text',[]],
                ['exp_pcroom','0.0',[]],
                ['exp_cafeteria','0.1',[]],
                ['ai_vending','text',[]],
                ['ai_vending','1.0',[]],
                ['exp_chalkwall','0.0',[]],
                ['ev_market_ruins','text',[]],
                ['ev_newsstand','text',[]],
                ['ev_near_seoul_sign','text',[]],
                ['ev_drivein_theater','text',[]],
                ['ev_clocktower_bell','text',[]],
                ['crisis_collapse','0.0',[]],
                ['wall_reply','text',[]],
                ['wall_reply','0.0',[]],
                ['find_filmset','text',[]],
                ['exp_radiostation','0.1',[]],
                ['exp_icehouse','0.0',[]],
                ['vg_tollgate','text',[]],
                ['vg_tollgate','0.0',[]],
                ['dj_tower','0.0',[]],
                ['exp_coffee','0.0',[]],
                ['exp_towyard','0.0',[]],
                ['find_trucker_log','text',[]],
                ['find_arrows','0.0',[]],
                ['up_snorkel_ford','0.1',[]],
                ['ev_tollbooth_ghost','text',[]],
                ['ev_factory_mural','text',[]],
                ['ev_wedding_hall_storage','1.0',[]],
                ['ev_highway_sign','text',[]],
                ['ev_chapel_candle','text',[]],
                ['ev_chapel_candle','0.0',[]],
                ['ev_well_bucket','text',[]],
                ['ev_dolmen','1.0',[]],
                ['find_radio_coords','text',['radio']],
                ['signal_bait','text',['radio','radio']],
                ['loc_reststop','text',['radio']],
                ['loc_reststop','0.0',['radio','me']],
                ['loc_sejong','0.0',['radio']],
                ['ai_crosswalk','0.0',['radio']],
                ['exp_glasshouse','0.1',['radio']],
                ['night_djradio','text',['radio']],
                ['night_djradio','0.0',['radio']],
                ['ai_census','text',['cheollian']],
                ['ai_census','0.0',['cheollian']],
                ['ai_census','1.0',['eunsu','cheollian','me','eunsu']],
                ['dj_onair','text',['radio']],
                ['exp_villagehall','0.0',['radio','radio']],
                ['ai_manifest','text',['cheollian','cheollian','cheollian']],
                ['ai_manifest','0.0',['cheollian']],
                ['ai_manifest','1.0',['cheollian']],
                ['ev_checkpoint_broadcast','text',['cheollian']],
                ['ev_radio_birthday','text',['radio']],
                ['ev_radio_birthday','0.0',['radio','radio']],
                ['ev_radio_birthday','1.0',['me','radio','me','radio','radio','radio']],
                ['ev_personal_broadcast','text',['cheollian']],
                ['ev_personal_broadcast','0.0',['me']],
                ['ev_personal_broadcast','1.0',['kangwoo','me','kangwoo','kangwoo']],
                ['ev_radio_dj_signal','text',['radio']],
                ['ev_radio_dj_signal','0.0',['radio']],
                ['ev_radio_dj_signal','1.0',['minji','me','minji','minji']],
                ['ev_lullaby_speaker','text',['cheollian']],
                ['ev_lullaby_speaker','0.0',['me']],
                ['ev_lullaby_speaker','1.0',['parkss','parkss','parkss']],
                ['ev_broadcast_station','0.0',['radio']],
                ['ev_wiretap_speaker','text',['radio']],
                ['ev_named_broadcast','text',['cheollian']],
                ['ev_auto_door','text',['radio','radio']],
                ['ev_greeter_robot','text',['radio']],
                ['ev_greeter_robot','0.0',['me','radio','me','radio']],
                ['ev_greeter_robot','1.0',['radio','me']],
                ['ev_crashed_helicopter','1.0',['radio','minji']],
                ['ev_pc_cafe','1.0',['me','minji','minji']],
                ['ev_apology_broadcast','text',['cheollian']],
                ['world_continuity_broadcast','text',['cheollian']],
              ];
              const nonHumanAttribution=[];
              for(const [eventId,scope,expected] of nonHumanScopes){
                const event=byId(eventId);
                const [choiceIndex,outcomeIndex]=scope.split('.').map(Number);
                const outcome=scope==='text'?null:event?.choices?.[choiceIndex]?.out?.[outcomeIndex];
                const value=scope==='text'?event?.text:outcome?.text;
                const speakers=scope==='text'?event?.turnSpeakers:outcome?.turnSpeakers;
                const turns=event&&value!==undefined?storyTurns(event,value,speakers,scope!=='text'):[];
                nonHumanAttribution.push({eventId,scope,expected,
                  actual:turns.filter(turn=>!['narration','thought','ai'].includes(turn.kind)&&turn.who)
                    .map(turn=>turn.who),
                  unknown:turns.filter(turn=>turn.name==='???'||turn.speakerUncertain)
                    .map(turn=>turn.text)});
              }
              const sameSpeakerQuestions=[];
              const scanSameSpeaker=(scope,turns)=>{
                const dialogue=turns.filter(turn=>turn.kind==='dialogue'&&turn.who);
                if(dialogue.length<2
                  ||new Set(dialogue.map(turn=>`${turn.who}:${turn.name||''}`)).size!==1
                  ||!dialogue.some(turn=>/[?？]/.test(turn.text||''))) return;
                sameSpeakerQuestions.push({scope,who:dialogue[0].who,
                  lines:dialogue.map(turn=>turn.text)});
              };
              for(const event of D.events){
                try{
                  const opening=storyTurns(event,event.text,event.turnSpeakers);
                  scanSameSpeaker(`${event.id}.text`,opening);
                  for(const [choiceIndex,choice] of (event.choices||[]).entries()){
                    for(const [outcomeIndex,outcome] of (choice.out||[]).entries()){
                      const value=typeof outcome.text==='function'?outcome.text(S):outcome.text;
                      scanSameSpeaker(`${event.id}.${choiceIndex}.${outcomeIndex}`,
                        storyTurns(event,value,outcome.turnSpeakers,!!opening.knownSpeaker));
                    }
                  }
                }catch(error){
                  sameSpeakerQuestions.push({scope:`${event.id}.audit-error`,who:'error',lines:[String(error)]});
                }
              }

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

              const stateWith=(patch)=>({...S,flags:{...S.flags,...(patch.flags||{})},...patch});
              const seoulOpenNoCrew=D.seoulOpenEvent.text(stateWith({party:[]}));
              const seoulOpenCrew=D.seoulOpenEvent.text(stateWith({party:['minji','parkss','kangwoo']}));
              const bridgeNoKangwoo=D.bridgeEvent.text(stateWith({party:[]}));
              const bridgeWithKangwoo=D.bridgeEvent.text(stateWith({party:['kangwoo']}));
              const core=(D.seoulStops||[]).find(event=>event.id==='seoul_core');
              const tracesChoice=core.choices.find(choice=>choice.label.includes('143년의 흔적'));
              const traceFlags=Object.fromEntries((D.eraTraces||[]).slice(0,5).map(trace=>[trace.flag,true]));
              const traceNoJaeyi=tracesChoice.out[0].text(stateWith({party:[],flags:traceFlags}));
              const traceWithJaeyi=tracesChoice.out[0].text(stateWith({party:['jaeyi'],flags:traceFlags}));
              const stealth=byId('ev_stealth_dog');
              const groupDefense=stealth.choices.find(choice=>choice.label.includes('불과 소리'));
              const observatory=byId('ev_observatory');
              const wash=byId('exp_selfwash').choices[0].out[0];
              const washNoDog=wash.text(stateWith({dog:false}));
              const washWithDog=wash.text(stateWith({dog:true}));
              const eunsuMemory=byId('talk_es_15');
              const wormRescue=byId('wx_worms').choices[0].out[0];
              G.resetDriveTimers();
              G.applyFx({moodAll:-3});
              const mildCooldown=G.banterCooldown();
              G.resetDriveTimers();
              G.applyFx({moodAll:-4});
              const severeCooldown=G.banterCooldown();

              S.at=original.at; S.driving=original.driving; S.used=original.used; S.flags=original.flags;
              return {
                contactBefore,contactAfter,scenes,fallback,
                contactDialogue:dialogueAudit(contact),
                seaDialogue:dialogueAudit(byId('cell_sea_meet')),
                gangneungDialogue:dialogueAudit(byId('gw_gangneung')),
                scriptedSpeakerMismatches,
                nonHumanAttribution,
                sameSpeakerQuestions,
                gates:{
                  seoulOpenNoCrew,seoulOpenCrew,bridgeNoKangwoo,bridgeWithKangwoo,
                  traceNoJaeyi,traceWithJaeyi,
                  stealthNeedsDog:stealth.needsDog===true,
                  groupParty:groupDefense&&groupDefense.req&&groupDefense.req.party,
                  groupLegacyMinParty:groupDefense&&groupDefense.minParty,
                  observatoryNight:observatory.night===true,
                  washNoDog,washWithDog,
                  eunsuNeedsLeo:eunsuMemory.needsComp2==='leo',
                  eunsuNeedsDog:eunsuMemory.needsDog===true,
                  eunsuNeedFlag:eunsuMemory.needFlag,
                  wormFlag:wormRescue.fx&&wormRescue.fx.flag,
                  mildCooldown,severeCooldown
                }
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
        assert scene["src"].startswith(("data:image/jpeg;base64,", "data:image/webp;base64,")), result
    assert result["fallback"] == "arrival-gumi", result

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
    assert not result["scriptedSpeakerMismatches"], result["scriptedSpeakerMismatches"]
    attribution_errors = [
        row
        for row in result["nonHumanAttribution"]
        if row["unknown"] or row["actual"] != row["expected"]
    ]
    assert not attribution_errors, attribution_errors
    audit_errors = [row for row in result["sameSpeakerQuestions"] if row["scope"].endswith(".audit-error")]
    assert not audit_errors, audit_errors
    fixed_mixed_speaker_scopes = {
        "meet_bathtruck.text",
        "parcel_lead.text",
        "mansu_revenge.0.0",
        "meet_scrapbros.text",
        "bori_tag.0.0",
        "pair_pss_es_1.0.0",
        "ev_postman_ghost.0.0",
        "ev_hunter_meat.0.0",
        "ev_beekeeper.text",
        "roadcrew_sign.0.0",
    }
    remaining_scopes = {row["scope"] for row in result["sameSpeakerQuestions"]}
    assert fixed_mixed_speaker_scopes.isdisjoint(remaining_scopes), remaining_scopes
    gates = result["gates"]
    assert all(name not in gates["seoulOpenNoCrew"] for name in ("민지", "박 선생", "강우")), gates
    assert all(name in gates["seoulOpenCrew"] for name in ("민지", "박 선생", "강우")), gates
    assert "강우" not in gates["bridgeNoKangwoo"] and "강우" in gates["bridgeWithKangwoo"], gates
    assert "재이" not in gates["traceNoJaeyi"] and "재이" in gates["traceWithJaeyi"], gates
    assert gates["stealthNeedsDog"] and gates["groupParty"] == 2, gates
    assert gates["groupLegacyMinParty"] is None, gates
    assert gates["observatoryNight"], gates
    assert "보리" not in gates["washNoDog"] and "보리" in gates["washWithDog"], gates
    assert gates["eunsuNeedsLeo"] and gates["eunsuNeedsDog"], gates
    assert gates["eunsuNeedFlag"] == "worm_rescue_done", gates
    assert gates["wormFlag"] == "worm_rescue_done", gates
    assert gates["mildCooldown"] == 6, gates
    assert 40 <= gates["severeCooldown"] <= 60, gates
    print("✅ 핵심 사건의 사진·선행 만남·화자·장소 대체 규칙 일치")


if __name__ == "__main__":
    main()
