#!/usr/bin/env python3
"""장소 사건이 도로 전체로 새지 않고 현재 영입 거점·목적지를 지키는지 검사한다."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()
failures = []


def check(label, ok, detail=""):
    print(("✅ " if ok else "❌ ") + label + (f" — {detail}" if detail and not ok else ""))
    if not ok:
        failures.append(f"{label}: {detail}")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel=os.environ.get("CARAVAN_BROWSER_CHANNEL") or None)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(GAME)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "지리QA")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(120)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")

    contracts = page.evaluate(
        """() => {
          const legacy=D.events.filter(event=>event.nearNode);
          return {
            legacy:legacy.length,
            mapped:legacy.filter(event=>D.eventLocations[event.id]).length,
            node:Object.values(D.eventLocations).filter(location=>location.kind==='node').length,
            waypoint:Object.values(D.eventLocations).filter(location=>location.kind==='waypoint').length
          };
        }"""
    )
    check(
        "구형 nearNode 사건이 모두 현재 위치 계약으로 이전됐다",
        contracts["legacy"] == contracts["mapped"] and contracts["node"] >= contracts["legacy"],
        str(contracts),
    )

    busan = page.evaluate(
        """() => {
          G.startTravel('yangsan');
          return {
            waypoint:S.driving.slots.filter(slot=>slot.waypoint).map(slot=>slot.waypoint),
            road:G.eligible().map(event=>event.id),
            busanNode:G.nodeEvents('busan').map(event=>event.id)
          };
        }"""
    )
    check(
        "부산 지역 사건은 부산 탐색에 남고 양산 도로 랜덤 풀에서는 빠진다",
        "lc_busan_dried" in busan["busanNode"] and "lc_busan_dried" not in busan["road"],
        str(busan),
    )
    check(
        "민지 첫 만남은 부산→양산 도로에 새지 않고 밀양 정착지에 남는다",
        "meet_scrapyard" not in busan["waypoint"] and "meet_scrapyard" not in busan["road"],
        str(busan),
    )

    recruits = page.evaluate(
        """() => {
          const expected={
            minji:['miryang','ulsan'],parkss:['jeonju','gumi'],
            kangwoo:['daegu','daegu'],leo:['gwangju','namwon'],
            jaeyi:['muju','gimcheon'],eunsu:['daejeon','cheongju']
          };
          const out={};
          for(const [id,[meetNode,target]] of Object.entries(expected)){
            G.newGame('story','QA','full','keeper'); S.at=meetNode;
            const started=G.startRecruitQuest(id);
            out[id]={started,meetNode:D.recruitQuests[id].meetNode,
              target:D.recruitQuests[id].target,actual:S.recruitQ&&S.recruitQ.target,
              sameStop:S.recruitQ&&S.recruitQ.sameStop,
              settlement:D.stls[meetNode]&&D.stls[meetNode].recruit};
          }
          G.newGame('story','QA','full','keeper'); S.at='miryang';
          const first=G.startRecruitQuest('minji');
          const second=G.startRecruitQuest('leo');
          out.singleActive={first,second,current:S.recruitQ&&S.recruitQ.id};
          return out;
        }"""
    )
    companion_rows = {key: value for key, value in recruits.items() if key != "singleActive"}
    check(
        "동료 6명은 정해진 정착지에서 만나 대사와 같은 목적지로 향한다",
        all(
            row["started"]
            and row["meetNode"]
            and row["target"] == row["actual"]
            and row["settlement"] == companion_id
            for companion_id, row in companion_rows.items()
        ),
        str(recruits),
    )
    check(
        "강우만 대구 현지 과제이고 다른 동료는 별도 목적지로 이동한다",
        recruits["kangwoo"]["sameStop"]
        and all(
            not row["sameStop"]
            for companion_id, row in companion_rows.items()
            if companion_id != "kangwoo"
        ),
        str(recruits),
    )
    check(
        "동시에 두 영입 의뢰가 겹치지 않는다",
        recruits["singleActive"] == {"first": True, "second": False, "current": "minji"},
        str(recruits["singleActive"]),
    )

    hidden_places = page.evaluate(
        """() => {
          const result={};
          for(const id of ['sunflower','maehwa','cablecar','lighthouse']){
            G.newGame('story','QA','full','keeper'); S.at=id;
            result[id]=G.nodeEvents(id).map(event=>event.id);
          }
          return result;
        }"""
    )
    check(
        "숨은 장소는 낡은 광역 태그와 달라도 그 장소 전용 사건을 잃지 않는다",
        "ev_sunflower_field" in hidden_places["sunflower"]
        and "ev_plum_blossom" in hidden_places["maehwa"]
        and "ev_cablecar_hang" in hidden_places["cablecar"]
        and "ev_lighthouse_visit" in hidden_places["lighthouse"],
        str(hidden_places),
    )

    migration = page.evaluate(
        """() => {
          G.newGame('story','QA','full','keeper');
          const old=JSON.parse(G.exportSave()); old.v=3; old.at=null;
          old.driving={from:'gimcheon',to:'gumi',dist:26,gone:8,road:'high',wx:'clear',slots:[],si:0};
          old.recruitQ={id:'parkss',stage:'task',target:'sangju',startedDay:old.day};
          delete old.stopover; delete old.locationContractVersion;
          localStorage.setItem('seoul400_save_v1',JSON.stringify(old));
          const loaded=G.load();
          return {loaded,v:S.v,target:S.recruitQ.target,stopover:S.stopover,
            contract:S.locationContractVersion};
        }"""
    )
    check(
        "구버전 진행도 현재 주행 방향으로 안전하게 마이그레이션된다",
        migration == {"loaded": True, "v": 6, "target": "gumi", "stopover": None, "contract": 2},
        str(migration),
    )
    check("장소 계약 회귀 중 브라우저 오류가 없다", not errors, str(errors))
    browser.close()

if failures:
    raise SystemExit("\n".join(failures))
print("✅ 사건 지리·영입 동선 회귀 검사 통과")
