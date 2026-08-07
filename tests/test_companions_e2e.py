#!/usr/bin/env python3
"""동료 6명 전원 — 영입 상태기계를 실엔진으로 끝까지 돈다.

2026-08-07 완주봇이 밝힌 것: 동료 콘텐츠는 그동안 자동으로 검증된 적이 한 번도
없었다(offerComp가 UI 다이얼로그 전용이라 봇이 태우질 못했음). 이 검사는 6명
각각에 대해 시작(startRecruit)→임무(task@목표 노드)→임시 동행(road)→후일담
(follow)→합류(join/doRecruit)까지 실제 상태기계를 밟고, 합류 뒤에는
접근 방식 기억(첫 주행 메아리)·유대 Lv3 시그니처 퍽·엔딩 콜백 데이터가
실제로 배선돼 있는지를 본다.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    results = page.evaluate("""() => {
      const out={};
      const noop=()=>{};
      for(const k of ['toast','speak','renderAll','renderHud','onDepart','clearSpeech']) UI[k]=noop;
      UI.onArrive=()=>0; UI.modalOpen=()=>false;
      let pending=null;
      UI.showEvent=(e)=>{ pending=e; };
      UI.showStl=noop;

      const resolve=()=>{
        let guard=0;
        while(pending&&guard++<10){
          const evd=pending; pending=null;
          const usable=(evd.choices||[]).filter(c=>{
            if(!c.req) return true;
            const rq=G.reqOk(c.req); return !rq||rq.ok!==false;
          });
          if(!usable.length) break;
          const o=G.pickOutcome(evd, usable[0]);
          G.applyFx(o.fx||{});
          if(o.fx&&o.fx.offerComp&&S.party.length<G.maxParty()) G.doRecruit(o.fx.offerComp);
          if(o.fx&&o.fx.chain){ const nx=D.events.find(e=>e.id===o.fx.chain); if(nx) G.openEvent(nx); }
        }
        pending=null;
      };

      for(const cid of Object.keys(D.comps)){
        G.newGame('onroad','전수','full');
        S.scrap=200; S.items['부품']=10; S.water=40; S.food=40; S.fuel=90;
        // 자리 확보 — 좌석 업그레이드 두 개를 미리 단다
        for(const uid of ['bench','cabin']) if(G.canBuyUp(uid).ok) G.buyUpgrade(uid);
        const row={};
        try{
          const started=G.startRecruitQuest(cid);
          row.started=!!started;
          const q=S.recruitQ;
          if(q){
            // 임무 노드로 순간이동해 상태기계를 단계별로 민다 (여정은 완주봇이 검증)
            let guard=0;
            while(S.recruitQ&&guard++<12){
              const stage=S.recruitQ.stage;
              if(stage==='task'||stage==='follow') S.at=S.recruitQ.target;
              if(stage==='road'){
                // 임시 동행은 한 구간 주행이 조건 — 다음 정차를 시뮬레이트
                S.recruitQ.stage='follow';
                if(!Number.isFinite(S.recruitQ.roadDay)) S.recruitQ.roadDay=S.day;
                S.day+=1;   // 길 위의 하룻밤
                continue;
              }
              if(Number.isFinite(S.recruitQ.roadDay)&&S.day<=S.recruitQ.roadDay) S.day=S.recruitQ.roadDay+1;
              const opened=G.openRecruitStep();
              if(opened) resolve(); else break;
            }
          }
          row.joined=G.hasComp(cid);
          row.approach=row.joined?(S.comps[cid]||{}).approach||null:null;
          if(row.joined){
            // 첫 주행 메아리 — 접근 방식이 실제 주행 효과를 만든다 (drive 데이터가 있는 동료만)
            const quest=D.recruitQuests[cid];
            const hasDrive=Object.values(quest.approaches||{}).some(a=>a.drive);
            const dv={slots:[], dist:30, gone:0, si:0};
            G.prepareRecruitMemory(dv);
            row.driveEcho=!hasDrive||!!dv.recruitMemory;
            // 유대를 끝까지 — 대기 퍽은 사람처럼 고르고, Lv3 시그니처가 자동 습득되는가
            for(let k=0;k<30&&(S.comps[cid].lvl||0)<3;k++){
              G.bond(cid,2);
              if(S.comps[cid].pending) G.choosePerk(cid,0);
            }
            row.lvl=S.comps[cid].lvl;
            const sig=D.comps[cid].perks[3];
            row.signature=!!(sig&&S.comps[cid].perks.includes(sig.id));
            // 엔딩 콜백 — 접근 방식 메아리가 데이터로 존재하는가
            const echo=G.recruitApproachEchoes().find(e=>e.id===cid);
            row.endingEcho=!!(echo&&echo.memory);
          }
        }catch(e){ row.error=String(e).slice(0,80); }
        out[cid]=row;
      }
      return out;
    }""")

    print('― 6명 전원: 시작→임무→동행→합류')
    for cid, row in results.items():
        ok = row.get('joined') and row.get('lvl') == 3 and row.get('signature')
        check(f"{cid}: 합류·Lv3·시그니처", bool(ok), str(row))
    print('― 접근 방식이 문구로 남지 않는다')
    for cid, row in results.items():
        if row.get('joined'):
            check(f"{cid}: 첫 주행 메아리", bool(row.get('driveEcho')), str(row.get('driveEcho')))
            check(f"{cid}: 엔딩 콜백 데이터", bool(row.get('endingEcho')), '')

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'동료 전수 검증 실패 {len(failures)}건: ' + ', '.join(failures[:6]))
print('✅ 동료 6명 전원이 실엔진 상태기계로 합류-성장-메아리까지 돈다')
