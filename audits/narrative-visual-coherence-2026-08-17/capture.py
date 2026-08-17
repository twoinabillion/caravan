#!/usr/bin/env python3
"""Current-run evidence for event text, cast, scene, and early pacing coherence."""

import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
OUT = Path(__file__).resolve().parent / "after"


def settle(page):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(120)


def enter_game(page):
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          UI.renderAll();
          document.querySelector('#arrival-scene')?.classList.remove('on');
        }"""
    )
    settle(page)


def capture_event(page, event_id, filename, choose=None, finish=False):
    page.evaluate(
        """eventId => {
          document.querySelector('#ev-wrap')?.classList.remove('on');
          const event=D.events.find(item => item.id===eventId);
          if(!event) throw new Error(`event missing: ${eventId}`);
          UI.showEvent(event);
        }""",
        event_id,
    )
    settle(page)
    if choose is not None:
        page.evaluate("UI.finishStory()")
        settle(page)
        page.locator(f'#ev-sheet .choice[data-i="{choose}"]').click()
        settle(page)
    if finish:
        page.evaluate("UI.finishStory()")
        settle(page)
    state = page.evaluate(
        """() => {
          const frame=document.querySelector('#ev-sheet .event-scene-frame');
          const image=frame?.querySelector('.event-scene');
          const report=document.querySelector('#ev-sheet .event-field-report');
          return {
            title:document.querySelector('#ev-sheet .event-title')?.textContent?.trim()||'',
            sceneKey:frame?.dataset.sceneKey||'',
            sceneAlt:image?.alt||'',
            reportText:report?.innerText?.replace(/\\n{3,}/g,'\\n\\n').trim()||'',
            choices:[...document.querySelectorAll('#ev-sheet .choice')].map(node=>node.innerText.trim()),
            imageWidth:image?.naturalWidth||0,
            imageHeight:image?.naturalHeight||0
          };
        }"""
    )
    path = OUT / filename
    page.screenshot(path=str(path))
    return state


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None
        )
        page = browser.new_page(viewport={"width": 390, "height": 844})
        enter_game(page)

        captures = {
            "resist_opening": capture_event(page, "resist_reveal", "01-contact-opening.png"),
            "resist_outcome": capture_event(page, "resist_reveal", "02-contact-after-sit.png", 0),
            "library_meeting": capture_event(page, "lib_meet", "03-library-meeting.png"),
            "library_outcome_last": capture_event(
                page, "lib_meet", "03b-library-outcome-last.png", 0, True
            ),
            "parkss_meeting": capture_event(page, "meet_bus", "04-parkss-meeting.png"),
            "sea_cell": capture_event(page, "cell_sea_meet", "05-sea-cell.png"),
            "gangneung_hospital": capture_event(page, "gw_gangneung", "06-gangneung-hospital.png"),
        }

        analysis = page.evaluate(
            """() => {
              const firstScene=event=>{
                const first=value=>Array.isArray(value)?value[0]:value;
                let key=first(D.eventTurnScenes?.[event.id]);
                if(!key) key=first(event.scenes)||event.scene||D.eventScenes?.[event.id];
                if(!key&&event.locEvent) key=D.nodeScenes?.[event.locEvent];
                if(!key){
                  const type=(event.ai||event.type==='추적')?'추적':event.type;
                  key=D.eventSceneTypes?.[type];
                }
                return key||'generic-story';
              };
              const generic=D.events.filter(event=>firstScene(event)==='generic-story');
              const names=[
                ...Object.values(D.comps||{}).map(person=>person.name),
                ...Object.values(D.npcs||{}).map(person=>person.name),
                '한별','우편부','지도장이','김 선장','하 여사','금자'
              ].filter(Boolean);
              const namedGeneric=generic.filter(event=>{
                const copy=typeof event.text==='string'?event.text:'';
                return names.some(name=>copy.includes(name));
              });

              const originalDriving=S.driving, originalAt=S.at;
              S.at=null;
              S.driving={from:'geochang',to:'gumi',dist:32,gone:0,road:'normal',slots:[],si:0,eventCount:0};
              const reveal=D.events.find(event=>event.id==='resist_reveal');
              const revealFreshMid=G.eventAvailable(reveal,{mode:'road'});
              S.driving=originalDriving; S.at=originalAt;

              const edges=(D.edges||[]).map(edge=>({from:edge[0],to:edge[1],km:Number(edge[2])||0}));
              const adjacency={};
              for(const edge of edges){
                (adjacency[edge.from]??=[]).push([edge.to,edge.km]);
                (adjacency[edge.to]??=[]).push([edge.from,edge.km]);
              }
              const shortest=(start,target)=>{
                const distance={[start]:0}, todo=[[0,start]];
                while(todo.length){
                  todo.sort((a,b)=>a[0]-b[0]);
                  const [cost,node]=todo.shift();
                  if(cost!==distance[node]) continue;
                  if(node===target) return cost;
                  for(const [next,km] of adjacency[node]||[]){
                    const candidate=cost+km;
                    if(distance[next]===undefined||candidate<distance[next]){
                      distance[next]=candidate; todo.push([candidate,next]);
                    }
                  }
                }
                return null;
              };
              const gumiDistance=shortest('busan','gumi');
              const busEdge=edges.find(edge=>(edge.from==='gumi'&&edge.to==='gimcheon')||(edge.from==='gimcheon'&&edge.to==='gumi'));
              const parkssEncounterKm=gumiDistance+(busEdge?.km||0)*.52;
              return {
                resistReveal:{
                  firstScene:firstScene(reveal),
                  freshMidEligible:revealFreshMid,
                  prerequisiteFields:Object.fromEntries(Object.entries(reveal).filter(([key])=>
                    /^(need|needs|minDay|minRemain|maxRemain)/.test(key)))
                },
                genericStory:{count:generic.length,namedCount:namedGeneric.length,
                  namedExamples:namedGeneric.slice(0,30).map(event=>({id:event.id,title:event.title}))},
                parkssPacing:{
                  eventLocation:D.eventLocations.meet_bus,
                  hasMinimumDay:false,
                  busanToEncounterKm:parkssEncounterKm,
                  rawDrivingSeconds:parkssEncounterKm/G.tickKmPerSecond()
                }
              };
            }"""
        )
        metrics = {"captures": captures, "analysis": analysis}
        (OUT / "metrics.json").write_text(
            json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        browser.close()
        print(json.dumps(analysis, ensure_ascii=False, indent=2))
        print(OUT)


if __name__ == "__main__":
    main()
