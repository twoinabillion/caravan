#!/usr/bin/env python3
"""Authored main-route evidence, legacy alternatives and actionable recovery contracts.
Fixture tests are not a no-grant campaign; the companion live probe supplies that proof.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
fail=[]
def check(name,result):
    print(('PASS ' if result else 'FAIL ')+name)
    if not result: fail.append(name)
with sync_playwright() as p:
    browser=p.chromium.launch()
    page=browser.new_page()
    page.goto((ROOT/'서울까지400km.html').as_uri())
    result=page.evaluate('''() => {
      G.newGame('onroad','기록 경로','full');
      const spine=['first_order_trace','parents_routes_traced','parent_key_found','father_fate_known','mother_reunited','mother_broadcast_ready'];
      spine.forEach(f=>S.flags[f]=true);
      const resolve=id=>{
        const ev=D.events.find(e=>e.id===id);
        if(!ev) return false;
        G.applyFx(ev.choices[0].out[0].fx); return true;
      };
      const authored=['main_transfer_testimony','main_command_ledger','main_relay_conference'].every(resolve);
      const main=G.mainStoryReady(),ready=G.seoulReady();
      S.flags.cell_road=true;
      const uniqueContacts=G.coreLinkedCells().length===3;
      const noComp=S.party.length===0&&!S.flags.es_truth&&G.deedsDone().filter(d=>d.comp).length===0;
      const aligned=Object.values(G.pillars()).every(p=>p.have>=p.need)&&G.departureSteps().filter(s=>['witness','command','relay','mother'].includes(s.id)).every(s=>s.done);
      const decision=D.events.find(e=>e.id==='seoul_decision');
      const actionableDecision=decision.choices.some(c=>G.reqOk(c.req).ok);
      delete S.flags.main_command_record;
      const missing=G.seoulMissing(),nav=G.questNavigationPlan();
      const honestMissing=!G.mainStoryReady()&&!G.seoulReady()&&missing.target===nav.target&&nav.target!=='seoul'&&missing.hint.includes('주변 탐색');
      S.at='seoul';
      const recoverAtSeoul=G.mainQuestEntry().chapterId!=='seoul-0'&&G.questNavigationPlan().target!=='seoul';
      G.save();G.load();
      const preserved=!S.flags.main_command_record&&S.flags.main_testimony_record&&!G.seoulReady();
      return {authored,main,ready,uniqueContacts,noComp,aligned,actionableDecision,honestMissing,recoverAtSeoul,preserved};
    }''')
    for name,ok in result.items(): check(name,ok)
    result=page.evaluate('''() => {
      G.newGame('onroad','기존 기록','full');
      S.party=['minji','parkss','leo'];S.party.forEach(id=>S.comps[id].lvl=3);
      ['first_order_trace','parents_routes_traced','parent_key_found','father_fate_known','mother_reunited','mother_broadcast_ready','es_truth','massacre_known','uplink_seen','cell_road','cell_sea','cell_dome','postman_letter'].forEach(f=>S.flags[f]=true);
      const legacy=G.seoulReady();
      delete S.flags.mother_broadcast_ready;
      const broadcastRequired=!G.seoulReady();
      G.newGame('onroad','미확인','full');S.stats.km=500;S.at='suwon';G.save();G.load();
      const noDistanceGrant=!G.seoulReady()&&!S.flags.main_testimony_record&&!S.flags.parent_key_found;
      const opportunity=typeof G.mainEvidenceOpportunity==='function'?G.mainEvidenceOpportunity():null;
      const lateRecovery=!!opportunity&&opportunity.target==='suwon'&&opportunity.sourceEvent==='onboarding_first_road'&&opportunity.event==='main_recovery_onboarding_first_road';
      G.newGame('onroad','출발','interactive');
      const noPrematureNotes=!S.notes.some(n=>['계기판 속 검증 모듈','도윤의 가족','남산 코어로 가서 강제 이송 명령을 멈춘다'].includes(n.title));
      const noPrematureSteps=G.departureSteps().slice(0,3).every(row=>!/(보았다|받았다|일치했다)/.test(row.detail));
      return {legacy,broadcastRequired,noDistanceGrant,lateRecovery,noPrematureNotes,noPrematureSteps};
    }''')
    for name,ok in result.items(): check(name,ok)
    result=page.evaluate('''() => {
      G.newGame('onroad','탐색 복구','full');
      ['first_order_trace','parents_split_known','parents_routes_traced','parent_key_found'].forEach(f=>S.flags[f]=true);
      S.at='cheongju';S._exploreDay=S.day;S._exploreNodes={cheongju:2};
      UI.restoreQaView({screen:'game'});
      const before=S.day*1440+S.min,opened=G.explore();
      const deterministic=opened&&document.querySelector('#ev-sheet').dataset.eventId==='main_transfer_testimony';
      const readCost=S.day*1440+S.min-before===30;
      const unresolved=!S.flags.main_testimony_record;
      return {deterministic,readCost,unresolved};
    }''')
    for name,ok in result.items(): check(name,ok)
    page.evaluate("G.newGame('onroad','하린','full');G.openEventById('main_transfer_testimony');UI.finishStory()")
    check('player testimony question has a named speaker', '???' not in page.locator('#ev-sheet').inner_text())
    page.locator('#ev-sheet [data-i="0"]').click()
    page.evaluate('UI.finishStory()')
    check('resolved testimony keeps attribution and evidence', '???' not in page.locator('#ev-sheet').inner_text() and page.evaluate('!!S.flags.main_testimony_record'))
    browser.close()
if fail: raise SystemExit('Failed: '+', '.join(fail))
