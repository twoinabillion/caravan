#!/usr/bin/env python3
"""대사 전수 감사: 런타임 화자 파싱과 대표 화면 증거를 수집한다."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SCREENSHOTS = OUT / "screenshots"
GAME = (ROOT / "서울까지400km.html").as_uri()


def capture(page, name):
    page.wait_for_timeout(180)
    page.screenshot(path=str(SCREENSHOTS / name))


SCREENSHOTS.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(
        viewport={"width": 390, "height": 844},
        device_scale_factor=1,
        reduced_motion="reduce",
    )
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    page.goto(GAME)
    page.wait_for_timeout(700)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "하람")
    page.click("#bt-name")

    # 2쪽 마지막 말까지 진행: 1쪽 5턴 + 2쪽 7턴.
    for _ in range(11):
        page.click("#scr-intro")
    capture(page, "01-intro-cheollian-conversation.png")

    page.evaluate("UI.skipIntro()")
    page.evaluate(
        """() => {
          S.party=['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
          S.dog=true;
          S.wx='clear';
          S.day=12;
          S.min=20*60;
          S.at='suwon';
          S.driving=null;
          S.flags.es_backdoor_ready=true;
          for(const id of S.party){
            S.comps[id].mood=70;
            S.comps[id].bond=80;
          }
          UI.renderAll();
        }"""
    )

    runtime = page.evaluate(
        """() => {
          const states=[
            {key:'clear-day',wx:'clear',day:12,min:12*60},
            {key:'storm-night',wx:'storm',day:13,min:23*60},
            {key:'rain-morning',wx:'rain',day:14,min:7*60}
          ];
          const rows=[];
          const add=(stateKey,scope,ev,path,value,knownSpeaker=false,turnSpeakers,speakers)=>{
            const turns=UI.storyTurns(value,ev,{knownSpeaker,turnSpeakers,speakers});
            turns.forEach((turn,index)=>rows.push({
              state:stateKey,scope,id:ev.id||'',title:ev.title||'',type:ev.type||'',
              needsComp:ev.needsComp||'',needsComp2:ev.needsComp2||'',
              recruitStart:ev.recruitStart||'',speakers:ev.speakers||[],
              portrait:(D.eventPortraits&&D.eventPortraits[ev.id])||'',
              path,index,kind:turn.kind||'',who:turn.who||'',name:turn.name||'',
              text:String(turn.text||'').replace(/<[^>]+>/g,'').trim()
            }));
          };
          for(const state of states){
            S.wx=state.wx; S.day=state.day; S.min=state.min;
            for(const ev of D.events){
              try{
                const value=typeof ev.text==='function'?ev.text(S):ev.text;
                add(state.key,'event',ev,`${ev.id}.text`,value);
              }catch(error){
                rows.push({state:state.key,scope:'error',id:ev.id||'',path:`${ev.id}.text`,
                  error:String(error)});
              }
              (ev.choices||[]).forEach((choice,ci)=>{
                (choice.out||[]).forEach((out,oi)=>{
                  try{
                    const value=typeof out.text==='function'?out.text(S):out.text;
                    add(state.key,'outcome',ev,`${ev.id}.choices[${ci}].out[${oi}]`,value,false,out.turnSpeakers,out.speakers);
                  }catch(error){
                    rows.push({state:state.key,scope:'error',id:ev.id||'',
                      path:`${ev.id}.choices[${ci}].out[${oi}]`,error:String(error)});
                  }
                });
              });
            }
          }
          return rows;
        }"""
    )
    (OUT / "runtime-turns.json").write_text(
        json.dumps(runtime, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # 이름을 밝히기 전 얼굴은 보이되 이름은 숨겨지는 첫 만남.
    page.evaluate("G.openEventById('meet_scrapyard')")
    page.evaluate("UI.finishStory()")
    page.locator("#ev-sheet .event-scroll").evaluate("(el) => el.scrollTop=el.scrollHeight")
    capture(page, "02-first-meeting-hidden-name.png")
    page.locator("#ev-wrap").evaluate("(el) => el.classList.remove('on')")

    # 인물 말투와 시스템 기록이 섞이는 대표 동료 장면.
    page.evaluate("G.openEventById('es_nightshift')")
    page.evaluate("UI.finishStory()")
    page.locator("#ev-sheet .event-scroll").evaluate("(el) => el.scrollTop=el.scrollHeight")
    capture(page, "03-eunsu-nightshift.png")
    page.locator("#ev-wrap").evaluate("(el) => el.classList.remove('on')")

    # 따옴표 안의 따옴표가 실제 런타임에서 어떻게 쪼개지는지 확인.
    page.evaluate(
        """() => {
          const ev=D.events.find(x=>x.id==='ev_chunrian_lab');
          const target=ev.choices[0].out[0];
          G.pickOutcome=()=>target;
          G.openEvent(ev);
        }"""
    )
    page.evaluate("UI.finishStory()")
    page.click('#ev-sheet .choice[data-i="0"]')
    page.evaluate("UI.finishStory()")
    page.locator("#ev-sheet .event-scroll").evaluate("(el) => el.scrollTop=el.scrollHeight")
    capture(page, "04-nested-quote-runtime-split.png")

    # 이미 민지라고 아는 합류 과제에서도 익명 행인으로 되돌아가는지 확인.
    page.evaluate("G.openEventById('rq_minji_task')")
    page.evaluate("UI.finishStory()")
    page.locator("#ev-sheet .event-scroll").evaluate("(el) => el.scrollTop=el.scrollHeight")
    capture(page, "05-recruit-quest-loses-identity.png")

    # 상대에게 던진 질문이 상대 본인의 말로 붙는 화자 역전 사례.
    page.evaluate("G.openEventById('talk_kw_09')")
    page.evaluate("UI.finishStory()")
    page.locator("#ev-sheet .event-scroll").evaluate("(el) => el.scrollTop=el.scrollHeight")
    capture(page, "06-self-address-speaker-reversal.png")

    # 성별 미선택을 그대로 노출하는 괄호형 호칭.
    page.evaluate("G.openEventById('talk_leo_02')")
    page.evaluate("UI.finishStory()")
    page.locator("#ev-sheet .event-scroll").evaluate("(el) => el.scrollTop=el.scrollHeight")
    capture(page, "07-gender-placeholder-in-dialogue.png")

    result = {
        "viewport": {"width": 390, "height": 844},
        "runtime_turns": len(runtime),
        "console_errors": errors,
        "screenshots": sorted(p.name for p in SCREENSHOTS.glob("*.png")),
    }
    (OUT / "browser-result.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    browser.close()

print(OUT)
