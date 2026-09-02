#!/usr/bin/env python3
"""Road events stay unique, paced, and explicit about temporary passengers."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get("CARAVAN_TEST_URL", (ROOT / "서울까지400km.html").as_uri())
SHOT_DIR = os.environ.get("CARAVAN_VISUAL_SHOT_DIR")


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL)
        result = page.evaluate(
            """() => {
              G.newGame('onroad','검수','full');

              const synthetic={id:'qa_unique_event',type:'정경',w:1,
                title:'재등장 검사',text:'한 번만 보이는 길이다.',choices:[]};
              S.driving=null; S.at='gumi';
              G.openEvent(synthetic);
              const unique={
                remembered:S.used.includes(synthetic.id),
                available:G.eventAvailable(synthetic,{mode:'local'})
              };
              document.querySelector('#ev-wrap')?.classList.remove('on');

              S._driveLegsSinceBlock=3;
              const short=G.normalizeDriveSlots({dist:20,slots:[{at:8},{at:14}]});
              S._driveLegsSinceBlock=3;
              const regular=G.normalizeDriveSlots({dist:40,slots:[{at:8},{at:18},{at:31}]});
              const afterEvent=G.normalizeDriveSlots({dist:40,slots:[{at:20}]});
              S._driveLegsSinceBlock=0;
              const waypoint=G.normalizeDriveSlots({dist:20,slots:[{at:10,waypoint:'qa_waypoint'}]});
              const pacing={short:short.slots.length,regular:regular.slots.length,
                afterEvent:afterEvent.slots.length,waypoint:waypoint.slots.length};

              S.at='muju'; S.driving=null;
              S.recruitQ={id:'jaeyi',stage:'task',target:'gimcheon',escort:true};
              UI.renderAll();
              const passenger=document.querySelector('.stop-guest-status');
              const passengerText=passenger?.textContent||'';
              const passengerState={
                text:passengerText,
                hasPortrait:!!passenger?.querySelector('img.pimg'),
                hasDeadAction:/다른 시간·장소 필요|진행 대기/.test(
                  document.querySelector('#journey-mode-local')?.textContent||'')
              };

              S.recruitQ={id:'jaeyi',stage:'task',target:'gimcheon',escort:true};
              S.at=null;
              S.driving={from:'daegu',to:'gumi',dist:38,gone:10,road:'normal',wx:'clear',
                slots:[],si:0,eventCount:0,snapshot:{gameMinute:0,fuel:S.fuel,water:S.water,
                  food:S.food,scrap:S.scrap,van:S.van,fatigue:S.fatigue,pursuit:S.pursuit,
                  build:'기본 생존형'},recruitEscort:'jaeyi'};
              UI.renderAll();
              const place=document.querySelector('.travel-destination-known')?.textContent||'';
              const drivingState={
                hasGuide:!!document.querySelector('#panel > .journey-guide'),
                guest:document.querySelector('#panel .road-guest-card')?.textContent||''
              };

              const convoy=D.events.find(event=>event.id==='route_market_convoy');
              UI.showEvent(convoy); UI.finishStory();
              const combat=document.querySelector('.combat-hud')?.textContent||'';
              const transcript=document.querySelector('.story-reader')?.textContent||'';
              return {unique,pacing,passengerState,place,drivingState,combat,transcript};
            }"""
        )
        if SHOT_DIR:
            shot_dir = Path(SHOT_DIR)
            shot_dir.mkdir(parents=True, exist_ok=True)
            page.evaluate(
                """() => {
                  document.querySelector('#ev-wrap')?.classList.remove('on');
                  document.querySelectorAll('.scr').forEach(node=>node.classList.remove('on'));
                  document.querySelector('#scr-game')?.classList.add('on');
                  document.querySelector('#app').dataset.screen='game';
                  S.at=null;
                  S.recruitQ={id:'jaeyi',stage:'task',target:'gimcheon',escort:true};
                  S.driving={from:'daegu',to:'gumi',dist:38,gone:10,road:'normal',wx:'clear',
                    slots:[],si:0,eventCount:0,recruitEscort:'jaeyi',snapshot:{gameMinute:0,
                      fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,van:S.van,
                      fatigue:S.fatigue,pursuit:S.pursuit,build:'기본 생존형'}};
                  UI.renderAll();
                }"""
            )
            page.screenshot(path=str(shot_dir / "driving-with-passenger.png"), full_page=True)
            page.evaluate(
                """() => {
                  document.querySelector('#ev-wrap')?.classList.remove('on');
                  document.querySelectorAll('.scr').forEach(node=>node.classList.remove('on'));
                  document.querySelector('#scr-game')?.classList.add('on');
                  document.querySelector('#app').dataset.screen='game';
                  S.at='muju'; S.driving=null;
                  S.recruitQ={id:'jaeyi',stage:'task',target:'gimcheon',escort:true};
                  UI.renderAll();
                }"""
            )
            page.locator('[data-journey-mode="local"]').click()
            page.locator('.stop-guest-status').scroll_into_view_if_needed()
            page.screenshot(path=str(shot_dir / "temporary-passenger.png"), full_page=True)
            page.evaluate(
                """() => {
                  const convoy=D.events.find(event=>event.id==='route_market_convoy');
                  UI.showEvent(convoy); UI.finishStory();
                }"""
            )
            page.screenshot(path=str(shot_dir / "market-convoy.png"), full_page=True)
        browser.close()

    assert not errors, errors
    assert result["unique"]["remembered"] and not result["unique"]["available"], result
    assert result["pacing"] == {"short": 0, "regular": 1, "afterEvent": 0, "waypoint": 1}, result
    passenger = result["passengerState"]
    assert "달구지 탑승 중" in passenger["text"] and "재이" in passenger["text"], result
    assert "김천 갈림길" in passenger["text"] and passenger["hasPortrait"], result
    assert not passenger["hasDeadAction"], result
    assert "장소 정보" in result["place"] and "멈춘 공장" in result["place"], result
    assert "아직 직접 가 본 적은 없다" not in result["place"], result
    assert not result["drivingState"]["hasGuide"], result
    assert "달구지 탑승 중" in result["drivingState"]["guest"], result
    assert "호송" in result["combat"] and "교전" not in result["combat"], result
    assert "장터 운송 담당자" in result["transcript"] and "???" not in result["transcript"], result
    print("✅ 임시 동행 표시 · 사건 1회성 · 도로 호흡 · 장터 호송 화자 일치")


if __name__ == "__main__":
    main()
