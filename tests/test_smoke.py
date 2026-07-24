#!/usr/bin/env python3
"""서울까지 400km — 스모크 테스트 (빌드 산출물 대상)
사용: python3 tests/test_smoke.py
검사: 부팅→인트로→게임 진입, 콘솔 에러 0, 의뢰 4종 엔진 플로우, 신규 체인 이벤트 표시
주의: headless 캔버스 getImageData는 못 믿는다 — 픽셀 검증은 스크린샷 눈검수로.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / '서울까지400km.html').as_uri()
SHOT = ROOT / 'tests' / 'shots'
SHOT.mkdir(exist_ok=True)

fails = []
def check(name, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + name + (f' — {detail}' if detail and not ok else ''))
    if not ok: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 480, 'height': 860})
    errors = []
    IGNORE = ('Failed to load resource',)  # 오프로드 환경감지 프로브(401)는 정상
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and not any(x in m.text for x in IGNORE) else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(600)

    print('― 부팅/진입')
    check('타이틀 표시', pg.locator('#bt-new').is_visible())
    pg.click('#bt-new'); pg.wait_for_timeout(200)
    pg.click('#mode-on'); pg.wait_for_timeout(300)
    for _ in range(len(pg.evaluate('D.intro'))):
        pg.click('#scr-intro'); pg.wait_for_timeout(120)
    pg.fill('#inp-name', '테스터'); pg.click('#bt-name'); pg.wait_for_timeout(200)   # 이름 입력 화면
    check('이름 저장(S.name)', pg.evaluate('S.name') == '테스터', str(pg.evaluate('S.name')))
    pg.wait_for_timeout(400)
    check('게임 진입(HUD)', pg.locator('#g-fuel').is_visible())
    check('콘솔 에러 0', not errors, ' | '.join(errors[:3]))

    print('― 의뢰 엔진')
    r = pg.evaluate('''() => {
      const out = {};
      S.at = 'daegu'; S.quest = null; S._qoffer = null;
      const q1 = G.rollQuests();
      out.offers = q1.length;
      out.kinds = q1.map(q => q.kind);
      out.stable = JSON.stringify(G.rollQuests()) === JSON.stringify(q1);   // 같은 날 리롤 방지
      // deliver/express 완료 플로우
      const dq = {kind:'deliver', item:'약 꾸러미', from:'daegu', to:'daejeon', reward:12, due:S.day+4};
      G.acceptQuest(dq); const sc0 = S.scrap; S.at = 'daejeon';
      out.deliverReady = G.questReady();
      G.checkQuest(); out.deliverPaid = S.scrap - sc0; out.deliverCleared = S.quest === null;
      // procure 플로우
      S.at = 'daegu'; S._qoffer = null;
      G.acceptQuest({kind:'procure', need:{name:'부품', qty:2}, from:'daegu', to:'daegu', reward:15, due:S.day+6});
      S.items['부품'] = 0; out.procNotReady = !G.questReady();
      S.items['부품'] = 2; out.procReady = G.questReady();
      G.checkQuest(); out.procConsumed = S.items['부품'] === 0;
      // letter 플로우
      S.at = 'daegu'; S._qoffer = null;
      const stlNode = Object.keys(D.nodes).find(id => D.nodes[id].stl && id !== 'daegu');
      const npc = D.stls[D.nodes[stlNode].stl].npcs[0];
      G.acceptQuest({kind:'letter', npc, from:'daegu', to:stlNode, reward:6, due:S.day+5});
      const att0 = S.npcs[npc].att; S.at = stlNode; G.checkQuest();
      out.letterAtt = S.npcs[npc].att - att0;
      // v1.2 세이브 마이그레이션
      S.quest = {item:'책 꾸러미', from:'daegu', to:'suwon', reward:10, due:S.day+4};
      G.save(); G.load(); out.migrated = S.quest.kind === 'deliver';
      S.quest = null; return out;
    }''')
    check('게시판 2건 제시', r['offers'] == 2, str(r))
    check('의뢰 종류 상이', len(set(r['kinds'])) == 2, str(r['kinds']))
    check('같은 날 리롤 방지', r['stable'])
    check('배달 완료/보상', r['deliverReady'] and r['deliverCleared'] and r['deliverPaid'] >= 12, str(r))
    check('조달 물량 게이트', r['procNotReady'] and r['procReady'] and r['procConsumed'], str(r))
    check('편지 호감 보상', r['letterAtt'] >= 12, str(r))
    check('v1.2 세이브 의뢰 마이그레이션', r['migrated'])

    print('― 신규 콘텐츠')
    for ev in ['lib_meet', 'freq_catch', 'van_receipt', 'meet_smith', 'vg_cicada', 'night_djradio',
               'circus_meet', 'postman_again', 'seed_harvest', 'wall_reply', 'loc_cablecar', 'loc_filmset',
               'meet_tinker', 'ai_census', 'comp_naming',
               'kids_meet', 'granny_meet', 'dj_tower', 'gp_envelope', 'bori_tag', 'whites_pass',
               'minji_toolbox', 'eunsu_lastshift', 'near_muju_firefly', 'ai_manifest',
               'exp_coffee', 'vanowner_coffee', 'library_scribe', 'freq_L2', 'mansu_opening',
               'up_winch_rescue', 'up_stove_visitor', 'up_beehive_swarm', 'meet_busstop_grandmas', 'exp_selfwash',
               'duo_mechsong', 'duo_nightround', 'crisis_boar', 'wx_ghostlight', 'meet_pansori',
               'roadbeat_300_plate', 'roadbeat_200_archive', 'roadbeat_100_divide', 'roadbeat_50_courtesy',
               'up_bench_first', 'up_cabin_sleepchart', 'up_garden_roster', 'up_armor_argument',
               'up_kitchen_firstmeal', 'up_full_house', 'duo_minji_parkss_space',
               'duo_kangwoo_eunsu_record', 'duo_leo_jaeyi_route', 'party_north_vote']:
        pg.evaluate(f'G.openEventById("{ev}")')
        pg.wait_for_timeout(150)
        vis = pg.locator('#ev-wrap.on').count() > 0
        check(f'이벤트 표시: {ev}', vis)
        if vis:
            pg.locator('#ev-wrap .choice:not([disabled])').first.click()
            pg.wait_for_timeout(150)
            pg.evaluate('''() => { const c=document.querySelector('#ev-wrap .choice:last-child');
              if (c) c.click(); document.querySelector('#ev-wrap').classList.remove('on'); }''')
    # 체인 게이트: needFlag 미충족 시 풀에서 제외
    gated = pg.evaluate('''() => { delete S.flags.library_met;
      return G.eligible().some(e => e.id === 'lib_request'); }''')
    check('체인 게이트(lib_request 잠김)', not gated)
    opened = pg.evaluate('''() => { S.flags.library_met = true; S.driving = null;
      return G.eligible().some(e => e.id === 'lib_request'); }''')
    check('체인 게이트(플래그 후 해금)', opened)
    # noComp 게이트: 동료 소문은 미영입일 때만
    r2 = pg.evaluate('''() => {
      const out = {};
      S.party = S.party.filter(id => id !== 'minji');
      out.rumorOpen = G.eligible().some(e => e.id === 'rumor_minji');
      S.party.push('minji'); S.comps.minji = S.comps.minji || {mood: 60, bond: 0};
      out.rumorClosed = !G.eligible().some(e => e.id === 'rumor_minji');
      S.party = S.party.filter(id => id !== 'minji');
      // 신규 히든 노드 도달성
      out.newNodes = ['cablecar', 'filmset'].every(id => D.nodes[id] && D.edges.some(e => e[0] === id || e[1] === id));
      return out;
    }''')
    # 라디오 수리 플로우
    r3 = pg.evaluate('''() => {
      const out = {};
      S.items['라디오 진공관'] = 0; out.blocked = !G.fixRadio();
      S.items['라디오 진공관'] = 1; out.fixed = G.fixRadio();
      out.consumed = S.items['라디오 진공관'] === 0;
      out.flag = !!S.flags.radio_fixed;
      out.again = !G.fixRadio();          // 재수리 불가
      UI.playRadio();
      out.bubble = !!document.querySelector('.bubble.radio');
      return out;
    }''')
    check('라디오: 진공관 없으면 불가', r3['blocked'], str(r3))
    check('라디오: 수리(진공관 소모+플래그)', r3['fixed'] and r3['consumed'] and r3['flag'], str(r3))
    check('라디오: 재수리 불가', r3['again'])
    check('라디오: 방송 버블 표시', r3['bubble'], str(r3))
    # v2.0 업그레이드
    r4 = pg.evaluate('''() => {
      const out = {};
      out.upCount = D.upgrades.length;
      out.eventCount = D.events.length;
      S.party = []; S.up = {}; UI.renderAll();
      out.emptyCards = [...document.querySelectorAll('#party .pcard')].filter(x=>x.textContent.includes('빈자리')).length;
      out.seats = [G.maxParty()];
      ['bench','cabin','bunk','jumpseat'].forEach(id=>{ S.up[id]=true; out.seats.push(G.maxParty()); });
      S.party=['minji','parkss']; S.up={}; out.fullBlocked=!G.doRecruit('kangwoo');
      S.up.bench=true; out.nextOpened=G.doRecruit('kangwoo');
      out.roadBeats=['roadbeat_300_plate','roadbeat_200_archive','roadbeat_100_divide','roadbeat_50_courtesy'].filter(id=>D.events.find(e=>e.id===id)).length;
      out.upStories=['up_bench_first','up_cabin_sleepchart','up_garden_roster','up_armor_argument','up_kitchen_firstmeal','up_full_house'].filter(id=>D.events.find(e=>e.id===id)).length;
      out.duoStories=['duo_minji_parkss_space','duo_kangwoo_eunsu_record','duo_leo_jaeyi_route','party_north_vote'].filter(id=>D.events.find(e=>e.id===id)).length;
      out.sceneCount=Object.keys(D.scenes||{}).length;
      out.nodeSceneCount=Object.keys(D.nodeScenes||{}).length;
      out.eventSceneCount=Object.keys(D.eventScenes||{}).length;
      G.openEventById('kw_base');
      out.eventScene=!!document.querySelector('#ev-sheet .event-scene');
      document.querySelector('#ev-wrap').classList.remove('on');
      S.at='daegu'; out.arrivalDelay=UI.onArrive();
      out.arrivalScene=!!document.querySelector('#arrival-scene img');  // .on은 rAF 비동기라 레이스 — 이미지 주입만 검증
      document.querySelector('#arrival-scene').classList.remove('on');
      const roadIds=['roadbeat_300_plate','roadbeat_200_archive','roadbeat_100_divide','roadbeat_50_courtesy'];
      S.used=S.used.filter(id=>!roadIds.includes(id)); S.at='daejeon'; S.driving=null;
      const oldRemain=G.remainKm;
      G.remainKm=()=>350; out.roadTooFar=!G.eligible().some(e=>e.id==='roadbeat_300_plate');
      G.remainKm=()=>299; out.roadInRange=G.eligible().some(e=>e.id==='roadbeat_300_plate');
      G.remainKm=()=>199; delete S.flags.ai_identified;
      out.roadChainClosed=!G.eligible().some(e=>e.id==='roadbeat_200_archive');
      S.flags.ai_identified=true; out.roadChainOpen=G.eligible().some(e=>e.id==='roadbeat_200_archive');
      G.remainKm=oldRemain;
      S.party=[]; S.up={};
      S.used = S.used.filter(id => id !== 'up_winch_rescue');   // 앞 단계 표시 테스트로 소진된 once 복구
      S.up = {}; out.gateClosed = !G.eligible().some(e => e.id === 'up_winch_rescue');
      S.up.winch = true; S.driving = null;
      out.gateOpen = G.eligible().some(e => e.id === 'up_winch_rescue');
      const f0 = G.fuelFor(100, 'rough'); S.up.mudtires = true;
      out.tiresSave = G.fuelFor(100, 'rough') < f0;
      S.items['부품'] = 5; S.van = 10; S.up.sidebox = true;
      const p0 = S.items['부품']; G.fieldRepair();
      out.repairBoost = S.van >= 50;   // 45 이상 회복
      return out;
    }''')
    check('업그레이드 28종', r4['upCount'] == 28, str(r4['upCount']))
    check('이벤트 821종', r4['eventCount'] == 821, str(r4['eventCount']))
    check('좌석 단계 2→3→4→5→6', r4['seats'] == [2,3,4,5,6], str(r4['seats']))
    check('빈자리 카드는 하나만 표시', r4['emptyCards'] == 1, str(r4['emptyCards']))
    check('만석 영입 잠금·좌석 개조 후 해금', r4['fullBlocked'] and r4['nextOpened'], str(r4))
    check('천리안 거리 이정표 4종', r4['roadBeats'] == 4, str(r4['roadBeats']))
    check('천리안 거리·연쇄 게이트', r4['roadTooFar'] and r4['roadInRange'] and r4['roadChainClosed'] and r4['roadChainOpen'], str(r4))
    check('달구지 생활 반응 6종', r4['upStories'] == 6, str(r4['upStories']))
    check('동료 조합 사건 4종', r4['duoStories'] == 4, str(r4['duoStories']))
    check('시네마틱 이미지 12종', r4['sceneCount'] == 12, str(r4['sceneCount']))
    check('도시 장면 9곳·사건 장면 6연결', r4['nodeSceneCount'] == 9 and r4['eventSceneCount'] == 6, str(r4))
    check('회상 이벤트 시네마틱 표시', r4['eventScene'], str(r4))
    check('도시 도착 시네마틱 표시', r4['arrivalScene'] and r4['arrivalDelay'] == 3000, str(r4))
    check('needUp 게이트(윈치)', r4['gateClosed'] and r4['gateOpen'], str(r4))
    check('험로 타이어 연비', r4['tiresSave'])
    check('사이드 공구함 정비 강화', r4['repairBoost'], str(r4))
    # v2.4 1:1 대화 시스템
    r5 = pg.evaluate('''() => {
      const out = {};
      out.talkCount = D.events.filter(e => e.type === '대화').length;
      S.party = ['minji']; S.comps.minji.bond = 0; S.driving = null; S._talked = {};
      out.noDeep = !G.eligible('대화').some(e => e.id === 'talk_mj_06');   // needBond 5 잠김
      S.comps.minji.bond = 6;
      out.deepOpen = G.eligible('대화').some(e => e.id === 'talk_mj_06');
      out.talked = G.talkTo('minji');                                      // 대화 발동
      document.querySelector('#ev-wrap').classList.remove('on');
      out.dailyLimit = !G.talkTo('minji');                                 // 하루 1회 제한
      return out;
    }''')
    check('대화 이벤트 195종', r5['talkCount'] == 195, str(r5['talkCount']))
    # 티키타카(연속 잡담)
    r6 = pg.evaluate('''() => {
      const out = {};
      out.chatCount = D.chats.length;
      S.party = ['minji', 'leo']; S.dog = true; G.startTravel('yangsan');
      const c = G.pickChat();
      out.picked = c ? c.lines.length : 0;
      // 화자 전원 탑승 검증: minji만 태우면 leo 등장 대화는 안 뽑힘
      S.party = ['minji'];
      let bad = 0;
      for (let i = 0; i < 40; i++) { const x = G.pickChat();
        if (x) for (const ln of x.lines) { const w = ln[0];
          if (w !== '나' && w !== 'sys' && D.comps[w] && !S.party.includes(w)) bad++; } }
      out.orphan = bad;
      return out;
    }''')
    # 여정 장부 + 서울 관문 + 서울 맵
    r7 = pg.evaluate('''() => {
      const out = {};
      out.deeds = D.deeds.length; out.maxParty = D.maxParty; out.compCount = Object.keys(D.comps).length;
      S.flags = {}; S.party = []; out.emptyReady = G.seoulReady();
      // 동료 5명 + 세계3 + 진실 + 회수2 → 관계 기둥(6명) 부족으로 잠김
      S.party = ['minji','parkss','kangwoo','leo','jaeyi'];
      ['cell_road','cell_sea','cell_dome','massacre_known','postman_letter','gp_envelope_found'].forEach(f => S.flags[f] = true);
      out.partialReady = G.seoulReady();          // false여야 (은수 없음)
      out.missPillar = G.seoulMissing().pillar;   // '관계'
      // 6명 전원 → 열림
      S.party.push('eunsu');
      out.fullReady = G.seoulReady();
      // 소개 체인
      S.party = []; S.notes = []; G.doRecruit('minji');
      out.refer = S.notes.some(n => n.title.includes('강우'));
      // 서울 오르막 진행
      S.flags.seoul_open = true; S.seoul = {entered:true};
      out.stage0 = G.seoulStage();
      ['han','ruins','square','base'].forEach(id => S.flags['seoul_'+id+'_done'] = true);
      S.flags.seoul_core_reached = true;
      out.stageEnd = G.seoulStage();
      // 서울 정거장 이벤트 = 5, 각 stop에 무료 선택지 존재
      out.stopEvents = D.seoulStops.length;
      out.allHaveFree = D.seoulStops.every(e => e.choices.some(c => !c.req));
      return out;
    }''')
    # 저항 연대망
    r8 = pg.evaluate('''() => {
      const out = {};
      out.cells = D.resistance.length;
      out.cellEvents = D.events.filter(e => e.id.startsWith('cell_') && e.id.endsWith('_meet')).length;
      out.reveal = !!D.events.find(e => e.id === 'resist_reveal');
      // 각 거점 flag가 이벤트로 세팅되는지 (스캐너가 이미 검증하지만 재확인)
      S.flags = {}; out.emptyLinked = G.cellsLinked().length;
      D.resistance.forEach(c => S.flags[c.flag] = true);
      out.allLinked = G.cellsLinked().length;
      // flag2 지원 확인
      G.applyFx({flag:'test_a', flag2:'test_b'});
      out.flag2 = S.flags.test_a && S.flags.test_b;
      return out;
    }''')
    check('저항 거점 6·접선 5·계시 1', r8['cells'] == 6 and r8['cellEvents'] == 5 and r8['reveal'], str(r8))
    # 저항 후속 + 서울 피날레 통합
    r9 = pg.evaluate('''() => {
      const out = {};
      out.followups = ['cell_sea_2','cell_dome_2','cell_sotgot_2','cell_ghost_2','cell_mountain_2'].filter(id=>D.events.find(e=>e.id===id)).length;
      const core = D.seoulStops.find(e=>e.id==='seoul_core');
      out.coreNames = core.choices.some(c=>c.req&&c.req.flag==='massacre_known');
      const base = D.seoulStops.find(e=>e.id==='seoul_base');
      out.baseRidge = base.choices.some(c=>c.req&&c.req.flag==='ridge_path');
      const ruins = D.seoulStops.find(e=>e.id==='seoul_ruins');
      out.ruinsDome = ruins.choices.some(c=>c.req&&c.req.flag==='dome_dossier');
      // needFlag2 지원
      S.flags={'a':true}; out.nf2 = G.eligible().length >= 0; // 그냥 크래시 안 나면 통과
      return out;
    }''')
    check('저항 후속 5종', r9['followups'] == 5, str(r9))
    check('서울 피날레 저항 통합', r9['coreNames'] and r9['baseRidge'] and r9['ruinsDome'], str(r9))
    check('연대 연결 추적', r8['emptyLinked'] == 0 and r8['allLinked'] == 6, str(r8))
    check('fx.flag2 지원', r8['flag2'])
    check('좌석 6·동료 6', r7['maxParty'] == 6 and r7['compCount'] == 6, str(r7))
    check('빈 상태 서울 잠김', not r7['emptyReady'])
    check('동료 5명이면 잠김(관계 기둥)', not r7['partialReady'] and r7['missPillar'] == '관계', str(r7))
    check('6명 전원+기둥→서울 열림', r7['fullReady'])
    check('소개 체인(영입 시 다음 동료 안내)', r7['refer'])

    # 1막 엔딩: 코어 고백 → 에필로그 연쇄
    r8 = pg.evaluate('''() => { const out = {};
      const core = D.seoulStops.find(e => e.id === 'seoul_core');
      out.chainAll = core.choices.every(c => c.out.every(o => o.fx && o.fx.chain === 'seoul_night'));
      const ep = D.events.find(e => e.id === 'seoul_night');
      out.ep = !!ep && !!ep.noPool;
      S._chain = null; G.applyFx({chain:'seoul_night'});
      out.chainSet = S._chain === 'seoul_night'; S._chain = null;
      S.flags.seoul_core_reached = true;
      out.epNotInPool = !G.eligible('스토리').some(e => e.id === 'seoul_night');
      delete S.flags.seoul_core_reached;
      return out; }''')
    check('코어 3답변 전부 에필로그 연쇄', r8['chainAll'])
    check('에필로그 존재+noPool', r8['ep'] and r8['epNotInPool'], str(r8))
    check('fx.chain → S._chain 세팅', r8['chainSet'])
    check('서울 오르막 5정거장', r7['stopEvents'] == 5 and r7['stageEnd'] == 5, str(r7))
    check('각 정거장 무료 선택지', r7['allHaveFree'])
    check('티키타카 45종', r6['chatCount'] == 45, str(r6['chatCount']))
    check('연속 대화 재생(2줄+)', r6['picked'] >= 2, str(r6['picked']))
    check('화자 전원 탑승 보장', r6['orphan'] == 0, str(r6['orphan']))
    check('needBond 게이트(유대 5 해금)', r5['noDeep'] and r5['deepOpen'], str(r5))
    check('말 걸기 발동', r5['talked'])
    check('하루 1회 제한', r5['dailyLimit'])
    check('noComp 게이트(미영입 소문 열림)', r2['rumorOpen'], str(r2))
    check('noComp 게이트(영입 후 닫힘)', r2['rumorClosed'], str(r2))
    check('신규 히든 노드 도로 연결', r2['newNodes'])
    check('콘솔 에러 0 (최종)', not errors, ' | '.join(errors[:3]))

    print('― 스크린샷')
    pg.evaluate('document.querySelector("#ev-wrap").classList.remove("on")')
    pg.screenshot(path=str(SHOT / 'game.png'))
    pg.evaluate('S.at="daegu"; UI.showStl && 0')  # showStl은 비공개 — dock 경유
    b.close()

print()
if fails:
    print(f'❌ 실패 {len(fails)}건: ' + ', '.join(fails)); sys.exit(1)
print('✅ 스모크 전부 통과')
