#!/usr/bin/env python3
"""서울까지 400km — 스모크 테스트 (빌드 산출물 대상)
사용: python3 tests/test_smoke.py
검사: 부팅→인트로→게임 진입, 콘솔 에러 0, 의뢰 4종 엔진 플로우, 신규 체인 이벤트 표시
주의: headless 캔버스 getImageData는 못 믿는다 — 픽셀 검증은 스크린샷 눈검수로.
"""
import base64, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / '서울까지400km.html').as_uri()
SHOT = ROOT / 'tests' / 'shots'
SHOT.mkdir(exist_ok=True)

fails = []
def check(name, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + name + (f' — {detail}' if detail and not ok else ''))
    if not ok: fails.append(name)

def save_canvas(page, selector, path):
    data = page.locator(selector).evaluate("(canvas) => canvas.toDataURL('image/png')")
    path.write_bytes(base64.b64decode(data.split(',', 1)[1]))

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
    check('달구지 PNG 런타임 제거', pg.evaluate('typeof D.vanSprites === "undefined"'))
    save_canvas(pg, '#titlecv', SHOT / 'title-procedural.png')
    pg.click('#bt-preview'); pg.wait_for_timeout(180)
    preview = pg.evaluate('''() => ({
      visible:document.querySelector('#scr-preview').classList.contains('on'),
      count:document.querySelectorAll('#preview-grid .preview-card').length,
      loaded:[...document.querySelectorAll('#preview-grid img')].every(img=>img.src.startsWith('data:image/')),
      spoilers:document.querySelector('#preview-grid').textContent.includes('서울 코어')
    })''')
    check('여정 미리보기 8개 실제 삽화', preview['visible'] and preview['count'] == 8 and
          preview['loaded'] and not preview['spoilers'], str(preview))
    pg.click('#bt-previewback'); pg.wait_for_timeout(100)
    check('미리보기에서 제목 화면 복귀', pg.locator('#scr-title').is_visible())
    pg.click('#bt-new'); pg.wait_for_timeout(200)
    pg.click('#mode-on'); pg.wait_for_timeout(300)
    check('인트로 전에 이름 입력', pg.locator('#scr-name').is_visible() and not pg.locator('#scr-intro').is_visible())
    pg.fill('#inp-name', '테스터'); pg.press('#inp-name', 'Enter'); pg.wait_for_timeout(200)
    check('이름 Enter가 첫 턴을 건너뛰지 않음', pg.locator('#intro-count').text_content() == '1 / 12 · 1 / 5')
    intro_layout = pg.evaluate('''() => {
      const book=document.querySelector('#intro-book').getBoundingClientRect();
      const app=document.querySelector('#app').getBoundingClientRect();
      const css=getComputedStyle(document.querySelector('#intro-book'));
      return {bookW:book.width,bookH:book.height,appW:app.width,appH:app.height,top:book.top-app.top,
        border:css.borderTopWidth,radius:css.borderRadius};
    }''')
    check('인트로 전체 화면·카드 프레임 제거',
          abs(intro_layout['bookW']-intro_layout['appW']) < 1 and
          abs(intro_layout['bookH']-intro_layout['appH']) < 1 and
          abs(intro_layout['top']) < 1 and intro_layout['border'] == '0px' and
          intro_layout['radius'] == '0px', str(intro_layout))
    pg.click('#scr-intro'); pg.wait_for_timeout(120)
    child_turn = pg.evaluate('''() => ({
      label:document.querySelector('#intro-txt .chat-name')?.textContent||'',
      portrait:document.querySelector('#intro-txt .chat-avatar')?.src||'',
      expected:D.portraits.player_child||''
    })''')
    check('어린 주인공 이름·전용 초상', child_turn['label'] == '테스터 · 8살' and
          child_turn['portrait'] == child_turn['expected'], str(child_turn))
    pg.click('#scr-intro'); pg.wait_for_timeout(120)
    intro_chat = pg.evaluate('''() => ({
      count:document.querySelectorAll('#intro-txt .chat-msg').length,
      names:[...document.querySelectorAll('#intro-txt .chat-name')].map(x=>x.textContent),
      sides:[...document.querySelectorAll('#intro-txt .chat-msg')].map(x=>x.classList.contains('mine')?'mine':'other')
    })''')
    check('사람 대화는 채팅처럼 누적', intro_chat['count'] == 2 and
          intro_chat['names'] == ['테스터 · 8살','할아버지'] and
          intro_chat['sides'] == ['mine','other'], str(intro_chat))
    for _ in range(pg.evaluate('D.intro.reduce((n,p)=>n+p.beats.length,0) - 2')):
        pg.click('#scr-intro'); pg.wait_for_timeout(120)
    check('이름 저장(S.name)', pg.evaluate('S.name') == '테스터', str(pg.evaluate('S.name')))
    pg.wait_for_timeout(400)
    check('게임 진입(HUD)', pg.locator('#g-fuel').is_visible())
    layout = pg.evaluate('''() => {
      UI.toast('첫 번째 알림'); UI.toast('두 번째 알림'); UI.toast('세 번째 알림');
      UI.speak({who:'sys',t:'첫 번째 주행 소식'});
      UI.speak({who:'sys',t:'두 번째 주행 소식'});
      UI.speak({who:'sys',t:'세 번째 주행 소식'});
      const stage=document.querySelector('#stage').getBoundingClientRect();
      const main=document.querySelector('#main').getBoundingClientRect();
      const toast=document.querySelector('.toast').getBoundingClientRect();
      const bubble=document.querySelector('.bubble').getBoundingClientRect();
      const out={stageH:stage.height,stageW:stage.width,mainH:main.height,toastN:document.querySelectorAll('.toast').length,
        toastW:toast.width,bubbleN:document.querySelectorAll('.bubble').length,bubbleW:bubble.width,
        narrationN:document.querySelectorAll('.bubble.narration').length};
      document.querySelector('#toasts').replaceChildren();
      UI.clearSpeech();
      UI.speak({who:'나',t:'(속말 테스트)'});
      const thought=document.querySelector('.bubble.thought');
      out.thought=!!thought;
      out.thoughtText=thought?.textContent||'';
      out.thoughtLabel=thought?.querySelector('.who')?.textContent||'';
      out.contextRail=!!document.querySelector('.journey-context .context-location') &&
        !!document.querySelector('.journey-context .context-crew');
      out.legacyParty=!document.querySelector('#panel>#party');
      out.missionNoDuplicate=!document.querySelector('#mission-strip').textContent.includes('연료 ');
      UI.clearSpeech();
      return out;
    }''')
    check('상단 풍경 310px 이하·하단 패널 380px 이상', layout['stageH'] <= 311 and layout['mainH'] >= 380, str(layout))
    check('알림 최대 2개·주행 말풍선 한 번에 1개', layout['toastN'] <= 2 and layout['bubbleN'] == 1, str(layout))
    check('알림 360px 이하·서술 캡션 화면 안', layout['toastW'] <= 361 and
          layout['bubbleW'] <= layout['stageW'] - 24, str(layout))
    check('서술·속말 말풍선 분리', layout['narrationN'] == 1 and layout['thought'] and
          layout['thoughtText'].endswith('속말 테스트') and layout['thoughtLabel'] == '생각', str(layout))
    check('위치·인원 한 줄 요약, 자원 중복 제거', layout['contextRail'] and
          layout['legacyParty'] and layout['missionNoDuplicate'], str(layout))
    context_nav = pg.evaluate('''() => {
      document.querySelector('.context-location').click();
      const map=document.querySelector('#ovl-map').classList.contains('on');
      document.querySelector('#map-x').click();
      document.querySelector('.context-crew').click();
      const crew=document.querySelector('#ovl-status').classList.contains('on') &&
        document.querySelector('[data-stpane="crew"]').classList.contains('on');
      document.querySelector('#st-x').click();
      return {map,crew};
    }''')
    check('위치→지도·인원→동료 상태 바로가기', context_nav['map'] and context_nav['crew'], str(context_nav))
    exploration = pg.evaluate('''() => {
      const snapshot=JSON.stringify(S);
      const node=Object.keys(D.nodes).find(id=>!D.nodes[id].stl&&D.nodes[id].type!=='goal');
      S.at=node; S.driving=null; S.min=8*60; S.fatigue=0; S._exploreDay=S.day;
      S._exploreNodes={}; S._salvagedNodes={}; S._salvageCount=2;
      UI.renderAll();
      const firstStatus=G.exploreStatus();
      const d0=S.day*1440+S.min, f0=S.fatigue, scrap0=S.scrap, parts0=S.items['부품']||0;
      const first=G.explore();
      const d1=S.day*1440+S.min, f1=S.fatigue;
      const freshGain={scrap:S.scrap-scrap0,parts:(S.items['부품']||0)-parts0};
      document.querySelector('#ev-wrap').classList.remove('on');
      const secondStatus=G.exploreStatus();
      const second=G.explore();
      const d2=S.day*1440+S.min, f2=S.fatigue;
      document.querySelector('#ev-wrap').classList.remove('on');
      const exhausted=G.exploreStatus();
      const beforeThird={d:S.day*1440+S.min,f:S.fatigue};
      const third=G.explore();
      const unchanged=beforeThird.d===S.day*1440+S.min&&beforeThird.f===S.fatigue;
      S.day++;
      const nextDay=G.exploreStatus();
      S=JSON.parse(snapshot); rng=mulberry32(S.seed+(S.stats.events*7919)); UI.renderAll(); G.save();
      return {firstStatus,secondStatus,exhausted,nextDay,freshGain,first,second,third,unchanged,
        firstMins:d1-d0,secondMins:d2-d1,firstFatigue:f1-f0,secondFatigue:f2-f1};
    }''')
    check('탐색 최소 2시간·재탐색 4시간', exploration['first'] and exploration['second'] and
          exploration['firstMins'] == 120 and exploration['secondMins'] == 240, str(exploration))
    check('재탐색 피로·실패 위험 증가', exploration['firstFatigue'] >= 5 and
          exploration['secondFatigue'] > exploration['firstFatigue'] and
          exploration['secondStatus']['miss'] > exploration['firstStatus']['miss'], str(exploration))
    check('새 지역 확정 고철·세 번째 지역 부품', exploration['firstStatus']['fresh'] and
          exploration['freshGain']['scrap'] == 4 and exploration['freshGain']['parts'] == 1,
          str(exploration))
    check('같은 날 세 번째 탐색 차단·다음 날 해금', not exploration['third'] and
          not exploration['exhausted']['ok'] and exploration['unchanged'] and
          exploration['nextDay']['ok'], str(exploration))
    portraits = pg.evaluate('''() => {
      const recruit=D.events.find(e=>e.id==='meet_scrapyard');
      const rt=UI.storyTurns(recruit.text,recruit);
      const first=rt.find(t=>t.kind==='dialogue');
      const anon={id:'portrait-smoke',title:'길 위',type:'조우'};
      const at=UI.storyTurns('"차 세워요!" 남자가 소리쳤다.',anon);
      const stranger=at.find(t=>t.kind==='dialogue');
      const missing=[];
      const inspect=(value,event,where)=>{
        if(typeof value==='function'){ try{ value=value(S); }catch(e){ return; } }
        if(typeof value!=='string') return;
        UI.storyTurns(value,event).forEach(turn=>{
          if(turn.kind==='dialogue'&&!D.portraits[turn.who]) missing.push(`${where}:${turn.who}`);
        });
      };
      D.events.forEach(event=>{
        inspect(event.text,event,`${event.id}.text`);
        (event.choices||[]).forEach((choice,ci)=>
          (choice.out||[]).forEach((out,oi)=>inspect(out.text,event,`${event.id}.${ci}.${oi}`)));
      });
      return {
        hidden:first?.name==='???',
        recruitFace:first?.who==='minji'&&!!D.portraits[first.who],
        anonRole:stranger?.who==='passer_man'&&stranger?.name==='남자',
        anonFace:!!D.portraits[stranger?.who],
        missing
      };
    }''')
    check('첫 만남은 이름 ???·실제 동료 얼굴', portraits['hidden'] and portraits['recruitFace'], str(portraits))
    check('익명 행인은 역할별 얼굴 표시', portraits['anonRole'] and portraits['anonFace'], str(portraits))
    check('전 이벤트 대화 턴에 얼굴 있음', not portraits['missing'], str(portraits['missing'][:8]))
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
    new_road_scenes = {
        'roadcrew_line', 'roadcrew_bridge', 'roadcrew_washout', 'roadcrew_sign',
        'road_night_circle', 'road_supply_shelter',
    }
    for ev in ['lib_meet', 'freq_catch', 'van_receipt', 'meet_smith', 'vg_cicada', 'night_djradio',
               'circus_meet', 'postman_again', 'seed_harvest', 'wall_reply', 'loc_cablecar', 'loc_filmset',
               'meet_tinker', 'ai_census', 'comp_naming',
               'kids_meet', 'granny_meet', 'dj_tower', 'gp_envelope', 'bori_tag', 'whites_pass',
               'minji_toolbox', 'eunsu_lastshift', 'near_muju_firefly', 'ai_manifest',
               'exp_coffee', 'vanowner_coffee', 'library_scribe', 'freq_L2', 'mansu_opening',
               'up_winch_rescue', 'up_stove_visitor', 'up_beehive_swarm', 'meet_busstop_grandmas', 'exp_selfwash',
               'duo_mechsong', 'duo_nightround', 'crisis_boar', 'wx_ghostlight', 'meet_pansori',
               'roadcrew_line', 'roadcrew_bridge', 'roadcrew_washout', 'roadcrew_sign',
               'road_night_circle', 'road_supply_shelter',
               'roadbeat_300_plate', 'roadbeat_200_archive', 'roadbeat_100_divide', 'roadbeat_50_courtesy',
               'up_bench_first', 'up_cabin_sleepchart', 'up_garden_roster', 'up_armor_argument',
               'up_kitchen_firstmeal', 'up_full_house', 'duo_minji_parkss_space',
               'duo_kangwoo_eunsu_record', 'duo_leo_jaeyi_route', 'party_north_vote']:
        pg.evaluate(f'G.openEventById("{ev}")')
        pg.wait_for_timeout(150)
        vis = pg.locator('#ev-wrap.on').count() > 0
        check(f'이벤트 표시: {ev}', vis)
        if vis:
            if ev in new_road_scenes:
                scene_ready = pg.locator('#ev-sheet img.event-scene').count() == 1 and \
                    pg.locator('#ev-sheet img.event-scene').evaluate(
                        "(img) => img.src.startsWith('data:image/jpeg;base64,')")
                check(f'고유 장면 표시: {ev}', scene_ready)
                pg.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")
                continue
            pg.evaluate('UI.finishStory()')
            pg.locator('#ev-wrap .choice:not([disabled])').first.click()
            pg.wait_for_timeout(150)
            pg.evaluate('''() => { UI.finishStory(); const c=document.querySelector('#ev-wrap .choice:last-child');
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
    # 연속성 게이트: 만나지 않은 NPC·없는 화자·시간대·구식 선택 조건
    continuity = pg.evaluate('''() => {
      const out = {};
      const oldMin = S.min;
      const followups = [
        ['npc_sundeok_2','sundeok','miryang'],
        ['npc_taeho_2','taeho','daegu'],
        ['npc_jaepil_2','jaepil','muju'],
        ['npc_miyoung_2','miyoung','jeonju'],
        ['npc_drhan_2','drhan','daejeon'],
        ['npc_deokgu_2','deokgu','suwon'],
      ];
      S.driving = null;
      out.npcLocked = followups.every(([ev,npc,node]) => {
        S.at = node; S.used = S.used.filter(id => id !== ev);
        S.npcs[npc].met = false;
        return !G.eligible().some(e => e.id === ev);
      });
      S.at = 'daejeon'; S.npcs.drhan.met = true;
      out.npcOpen = G.eligible().some(e => e.id === 'npc_drhan_2');

      S.party = []; S.flags.library_done = true;
      let orphan = 0;
      for (let i = 0; i < 120; i++) {
        const b = G.pickBanter();
        if (b && D.comps[b.who] && !S.party.includes(b.who)) orphan++;
      }
      out.banterSpeaker = orphan === 0;

      const barber = D.events.find(e => e.id === 'ev_barber')
        .choices.find(c => c.minParty === 2);
      S.party = ['minji'];
      out.legacyChoiceLocked = !G.reqVisible(G.choiceReq(barber));
      S.party = ['minji','parkss'];
      out.legacyChoiceOpen = G.reqVisible(G.choiceReq(barber));

      S.party = ['minji']; S.comps.minji.bond = 20;
      S.at = 'daejeon'; S.driving = null;
      S.used = S.used.filter(id => id !== 'talk_mj_09');
      S.min = 12 * 60;
      out.nightTalkLocked = !G.eligible('대화').some(e => e.id === 'talk_mj_09');
      S.min = 23 * 60;
      out.nightTalkOpen = G.eligible('대화').some(e => e.id === 'talk_mj_09');
      S.min = oldMin;
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
      UI.clearSpeech();
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
      out.traceDefs = (D.eraTraces||[]).length;
      out.journeyBeats = (D.journeyBeats||[]).length;
      S.party = []; S.up = {}; UI.renderAll();
      out.emptyCards = [...document.querySelectorAll('#party .pcard')].filter(x=>x.textContent.includes('빈자리')).length;
      out.introBook = D.intro.length === 12 && D.intro.every(p =>
        p.scene && p.era && p.title && p.text && D.scenes[p.scene]);
      out.introTurns = D.intro.every(p => Array.isArray(p.beats) && p.beats.length >= 4 &&
        p.beats.every(turn => turn.text && turn.kind &&
          (!['dialogue','thought','letter'].includes(turn.kind) || (turn.who && turn.name))));
      out.introPortraits = ['mother','father','intro_child','player_child','grandfather','me']
        .every(id => (D.portraits[id]||'').startsWith('data:image/png;base64,'));
      out.introPremise = D.intro.some(p=>p.text.includes('미국의 AI와 반도체망')) &&
        D.intro.some(p=>p.text.includes('엄마는 천리안의 판단을 검증')) &&
        D.intro.some(p=>p.text.includes('등록 인원 6,412명')) &&
        D.intro.some(p=>p.text.includes('사람의 결정권을 되찾기 위해'));
      out.introMystery = D.intro[2].scene === 'intro-first-expulsion' &&
        D.intro[2].text.includes('사유란은 비어 있었다') &&
        D.intro.every(p=>!p.text.includes('사흘')) &&
        D.intro.some(p=>p.text.includes('사실과 짐작을 같은 서랍에 넣으면'));
      out.introHome = D.intro.some(p=>p.scene === 'intro-camper-conversion' &&
        p.text.includes('폐냉장고 단열판') &&
        p.text.includes('연장 레일') &&
        p.text.includes('집은 사는 사람을 따라 커지는 거야') &&
        p.text.includes('좌석과 침대, 부엌'));
      out.seats = [G.maxParty()];
      out.vanSizes = [[G.vanStage().bodyL,G.vanStage().bodyH,G.vanStage().cm]];
      ['bench','cabin','bunk','jumpseat'].forEach(id=>{
        S.up[id]=true;
        out.seats.push(G.maxParty());
        const stage=G.vanStage();
        out.vanSizes.push([stage.bodyL,stage.bodyH,stage.cm]);
      });
      out.vanStagesReady = D.vanStages.length === 5 &&
        D.vanStages.every((stage,i) => i === 0 ||
          (stage.bodyL > D.vanStages[i-1].bodyL &&
           stage.bodyH > D.vanStages[i-1].bodyH &&
           stage.cm > D.vanStages[i-1].cm));
      S.party=['minji','parkss']; S.up={}; out.fullBlocked=!G.doRecruit('kangwoo');
      S.up.bench=true; out.nextOpened=G.doRecruit('kangwoo');
      out.roadBeats=['roadbeat_300_plate','roadbeat_200_archive','roadbeat_100_divide','roadbeat_50_courtesy'].filter(id=>D.events.find(e=>e.id===id)).length;
      const roadCrewIds=['roadcrew_line','roadcrew_bridge','roadcrew_washout','roadcrew_sign'];
      const roadCrewFlags=['roadcrew_met','roadcrew_bridge','roadcrew_safe','roadcrew_road_done'];
      out.roadCrewEvents=roadCrewIds.filter(id=>D.events.find(e=>e.id===id)).length;
      out.roadCrewScenes=roadCrewIds.concat(['road_night_circle','road_supply_shelter']).every(id=>{
        const scene=D.eventScenes[id];
        return !!scene && (D.scenes[scene]||'').startsWith('data:image/jpeg;base64,');
      });
      out.roadCrewChain=roadCrewIds.every((id,i)=>{
        const ev=D.events.find(e=>e.id===id);
        return ev&&ev.choices.length>=2&&ev.choices.every(c=>
          c.out&&c.out.length&&c.out.every(o=>o.fx&&o.fx.flag===roadCrewFlags[i]));
      });
      out.upStories=['up_bench_first','up_cabin_sleepchart','up_garden_roster','up_armor_argument','up_kitchen_firstmeal','up_full_house'].filter(id=>D.events.find(e=>e.id===id)).length;
      out.duoStories=['duo_minji_parkss_space','duo_kangwoo_eunsu_record','duo_leo_jaeyi_route','party_north_vote'].filter(id=>D.events.find(e=>e.id===id)).length;
      out.sceneCount=Object.keys(D.scenes||{}).length;
      out.recruitDefs=Object.keys(D.recruitQuests||{}).length;
      out.recruitEvents=Object.keys(D.recruitQuests||{}).every(id=>{
        const q=D.recruitQuests[id];
        const task=D.events.find(e=>e.id===q.task), follow=D.events.find(e=>e.id===q.follow);
        const join=D.events.find(e=>e.id===q.join);
        const everyFx=(ev,pred)=>ev&&ev.choices.length>=2&&
          ev.choices.every(c=>c.out&&c.out.length&&c.out.every(o=>pred(o.fx||{})));
        const sceneKeys=[q.task,q.follow,q.join].map(eid=>D.eventScenes[eid]);
        return q.guest&&q.approaches&&Object.keys(q.approaches).length===3&&
          everyFx(task,fx=>fx.recruitRoad===id&&!!q.approaches[fx.recruitChoice])&&
          everyFx(follow,fx=>fx.recruitReady===id&&fx.chain===q.join)&&
          join&&join.choices.some(c=>c.out.some(o=>o.fx&&o.fx.offerComp===id))&&
          new Set(sceneKeys).size===3&&sceneKeys.every(key=>!!D.scenes[key]);
      });
      out.localScenery=Object.keys(D.nodeScenery||{}).length;
      out.nodeSceneCount=Object.keys(D.nodeScenes||{}).length;
      out.eventSceneCount=Object.keys(D.eventScenes||{}).length;
      out.geoCount=Object.keys(D.geo||{}).length;
      out.geoReady=Object.keys(D.nodes).every(id => {
        const n=D.nodes[id], g=D.geo[id];
        return Array.isArray(g) && g.length === 2 &&
          Number.isFinite(n.lon) && Number.isFinite(n.lat) &&
          Number.isFinite(n.x) && Number.isFinite(n.y);
      });
      out.geoOrder=D.nodes.busan.lat < D.nodes.seoul.lat &&
        D.nodes.sokcho.lat > D.nodes.seoul.lat &&
        D.nodes.mokpo.lon < D.nodes.busan.lon;
      out.upgradeArtCount=Object.keys(D.upgradeArt||{}).length;
      out.upgradeArtReady=Object.values(D.upgradeArt||{}).every(src=>src.startsWith('data:image/jpeg;base64,'));
      const grouped=(D.upgradeGroups||[]).flatMap(g=>g.ids);
      out.upgradeGroups=(D.upgradeGroups||[]).length;
      out.upgradeCoverage=grouped.length===D.upgrades.length &&
        new Set(grouped).size===D.upgrades.length &&
        D.upgrades.every(u=>grouped.includes(u.id));
      const sceneFor=e=>e.scene||(D.eventScenes&&D.eventScenes[e.id])
        ||(e.locEvent&&D.nodeScenes&&D.nodeScenes[e.locEvent])
        ||D.eventSceneTypes[(e.ai||e.type==='추적')?'추적':e.type]||'generic-story';
      out.allEventsIllustrated=D.events.every(e=>!!D.scenes[sceneFor(e)]);
      out.sceneDataReady=Object.values(D.scenes).every(src=>src.startsWith('data:image/jpeg;base64,'));
      out.turnParser=D.events.every(e=>{
        const raw=typeof e.text==='function'?e.text(S):e.text;
        const turns=UI.storyTurns(raw,e);
        return turns.length>0&&turns.every(t=>t.text&&t.kind&&
          (!['dialogue','thought','letter'].includes(t.kind)||!!t.who));
      });
      const talkSample=D.events.find(e=>e.id==='talk_mj_01');
      const talkTurns=UI.storyTurns(talkSample.text,talkSample);
      out.knownSpeaker=talkTurns.some(t=>t.kind==='dialogue'&&t.who==='minji');
      UI.showEvent(talkSample);
      out.choiceLockedUntilRead=!document.querySelector('#ev-sheet [data-i]')&&
        !!document.querySelector('#ev-sheet .story-turn');
      UI.finishStory();
      out.choiceUnlocked=!!document.querySelector('#ev-sheet [data-i]');
      document.querySelector('#ev-wrap').classList.remove('on');
      G.openEventById('kw_base');
      out.eventScene=!!document.querySelector('#ev-sheet .event-scene');
      const sf=document.querySelector('#ev-sheet .event-scene-frame');
      sf.click(); out.sceneZoom=sf.classList.contains('zoomed');
      sf.click(); out.sceneUnzoom=!sf.classList.contains('zoomed');
      document.querySelector('#ev-wrap').classList.remove('on');
      G.openEventById('meet_waver');
      out.genericScene=!!document.querySelector('#ev-sheet .event-scene');
      document.querySelector('#ev-wrap').classList.remove('on');
      S.party=[]; UI.renderAll();
      G.openEventById('meet_family');
      UI.finishStory();
      out.secretChoiceHidden=!document.querySelector('#ev-sheet').textContent.includes('민지가 트럭을 고친다');
      out.resourceChoiceVisible=document.querySelector('#ev-sheet').textContent.includes('식량 2');
      document.querySelector('#ev-wrap').classList.remove('on');
      S.party=['minji'];
      out.secretChoiceRevealed=G.hasComp('minji');
      UI.showEvent(D.events.find(e=>e.id==='meet_family'));
      UI.finishStory();
      out.secretChoiceRevealed=out.secretChoiceRevealed &&
        document.querySelector('#ev-sheet').textContent.includes('민지가 트럭을 고친다');
      document.querySelector('#ev-wrap').classList.remove('on');
      S.party=[]; UI.renderAll();
      document.querySelector('#dk-status').click();
      document.querySelector('#st-tabs [data-st="crew"]').click();
      const crewText=document.querySelector('[data-stpane="crew"]').textContent;
      out.crewNoSpoilers=Object.values(D.comps).every(c=>!crewText.includes(c.name));
      document.querySelector('#st-x').click();
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
      S.quest={kind:'procure',need:{name:'부품',qty:8},from:'daegu',to:'daejeon',reward:22,due:S.day+2};
      S.items['부품']=3; UI.renderAll();
      out.missionVisible=document.querySelector('#mission-strip').textContent.includes('부품 3/8');
      out.mapMission=document.querySelector('#map-mission').textContent.includes('대전');
      S.min=12*60;
      UI.showStl('daegu');
      out.settlementHub=document.querySelectorAll('[data-stlfocus]').length===3 &&
        !!document.querySelector('#stl-van') &&
        !document.querySelector('#garage') && !document.querySelector('#trade');
      document.querySelector('[data-stlfocus="garage"]').click();
      document.querySelector('#stl-enter').click();
      out.garageGroups=document.querySelectorAll('#garage [data-ug]').length;
      out.garageArt=!!document.querySelector('#garage .upgrade-group-hero img');
      out.garageCards=document.querySelectorAll('#garage .upgrade-card').length;
      out.garageVan=!!document.querySelector('#garage-van-cv');
      out.sectionIsolation=!!document.querySelector('#garage') && !document.querySelector('#trade') &&
        !document.querySelector('[data-npc]');
      const oldScrap=S.scrap, oldParts=S.items['부품'], oldFuelMax=S.fuelMax;
      S.scrap=999; S.items['부품']=99; delete S.up.tank1;
      UI.showStl('daegu','garage');
      document.querySelector('[data-up="tank1"]').click();
      out.upgradeCeremony=!!document.querySelector('.upgrade-install') &&
        !!document.querySelector('#up-before-van') && !!document.querySelector('#up-after-van') &&
        document.querySelector('.upgrade-change').textContent.includes('연료 용량');
      document.querySelector('#upgrade-install-done').click();
      delete S.up.tank1; S.scrap=oldScrap; S.items['부품']=oldParts; S.fuelMax=oldFuelMax;
      document.querySelector('#ovl-stl').classList.remove('on');
      document.querySelector('#dk-status').click();
      document.querySelector('#st-tabs [data-st="journey"]').click();
      out.statusTabs=document.querySelectorAll('#st-tabs button').length===3 &&
        document.querySelector('[data-stpane="journey"]').classList.contains('on');
      document.querySelector('#st-x').click();
      G.openEventById('roadbeat_200_archive');
      out.storyContext=document.querySelector('#ev-sheet').textContent.includes('앞 이야기') &&
        document.querySelector('#ev-sheet').textContent.includes('첫 거리 표식');
      document.querySelector('#ev-wrap').classList.remove('on');
      const flags0={...S.flags}, party0=[...S.party], comps0=structuredClone(S.comps);
      S.party=Object.keys(D.comps);
      Object.keys(D.comps).forEach(id=>{
        const story=D.comps[id].perks[3].id;
        S.comps[id].lvl=3;
        if(!S.comps[id].perks.includes(story)) S.comps[id].perks.push(story);
      });
      (D.deeds||[]).forEach(d=>{ if(d.flag) S.flags[d.flag]=true; });
      (D.eraTraces||[]).forEach(t=>{ S.flags[t.flag]=true; });
      ['ridge_path','sokcho_end','librarian_truth'].forEach(f=>{ S.flags[f]=true; });
      UI.showEvent(D.seoulStops.find(e=>e.id==='seoul_core'));
      UI.finishStory();
      const copy=document.querySelector('.event-scroll');
      const choices=document.querySelector('.event-choice-dock>.choices');
      copy.scrollTop=copy.scrollHeight; choices.scrollTop=choices.scrollHeight;
      out.eventScroll=copy.scrollHeight>copy.clientHeight && copy.scrollTop>0;
      out.choiceScroll=choices.scrollHeight>choices.clientHeight && choices.scrollTop>0;
      out.choiceDock=choices.querySelectorAll('.choice').length===7 &&
        getComputedStyle(document.querySelector('.event-choice-dock')).position!=='fixed';
      document.querySelector('#ev-wrap').classList.remove('on');
      document.querySelector('#ev-sheet').classList.remove('event-mode');
      S.flags=flags0; S.party=party0; S.comps=comps0;
      return out;
    }''')
    check('업그레이드 28종', r4['upCount'] == 28, str(r4['upCount']))
    check('이벤트 866종', r4['eventCount'] == 866, str(r4['eventCount']))
    check('세대의 흔적 9종·보장 본편 6장면', r4['traceDefs'] == 9 and r4['journeyBeats'] == 6, str(r4))
    check('좌석 단계 2→3→4→5→6', r4['seats'] == [2,3,4,5,6], str(r4['seats']))
    check('좌석마다 달구지 길이·높이·실내 길이 증가',
          r4['vanStagesReady'] and r4['vanSizes'] == [[62,25,0],[69,27,40],[78,32,110],[85,37,145],[92,39,185]],
          str(r4['vanSizes']))
    check('메인 패널에 빈자리 카드 미표시', r4['emptyCards'] == 0, str(r4['emptyCards']))
    check('만석 영입 잠금·좌석 개조 후 해금', r4['fullBlocked'] and r4['nextOpened'], str(r4))
    check('천리안 거리 이정표 4종', r4['roadBeats'] == 4, str(r4['roadBeats']))
    check('도로수선단 4부작·선택 결과 연쇄', r4['roadCrewEvents'] == 4 and
          r4['roadCrewChain'] and r4['roadCrewScenes'], str(r4))
    check('천리안 거리·연쇄 게이트', r4['roadTooFar'] and r4['roadInRange'] and r4['roadChainClosed'] and r4['roadChainOpen'], str(r4))
    check('달구지 생활 반응 6종', r4['upStories'] == 6, str(r4['upStories']))
    check('동료 조합 사건 4종', r4['duoStories'] == 4, str(r4['duoStories']))
    check('시네마틱 이미지 87종·빌드 주입', r4['sceneCount'] == 87 and r4['sceneDataReady'], str(r4))
    check('동료 6명 첫 부탁·임시 동행·두 번째 사건·합류 장면', r4['recruitDefs'] == 6 and r4['recruitEvents'], str(r4))
    check('지역 고유 주행 풍경 30곳 이상', r4['localScenery'] >= 30, str(r4['localScenery']))
    check('그림책 도입 12장·고유 컷 연결', r4['introBook'] and r4['introPremise'], str(r4))
    check('인트로 전 장면 화자 턴·가족 초상 연결',
          r4['introTurns'] and r4['introPortraits'], str(r4))
    check('전 이벤트 턴 변환·알려진 화자 식별',
          r4['turnParser'] and r4['knownSpeaker'], str(r4))
    check('이야기를 다 읽기 전 선택지 잠금',
          r4['choiceLockedUntilRead'] and r4['choiceUnlocked'], str(r4))
    check('첫 이송부터 143년 미스터리 유지', r4['introMystery'], str(r4))
    check('달구지 생활차 개조·확장 설정', r4['introHome'], str(r4))
    check('지도 노드 58곳 WGS84 좌표 완비', r4['geoCount'] == 58 and r4['geoReady'], str(r4))
    check('실제 남북·동서 위치관계 반영', r4['geoOrder'], str(r4))
    check('도시 9곳·고유 사건 36개 이상 연결', r4['nodeSceneCount'] == 9 and r4['eventSceneCount'] >= 36, str(r4))
    check('업그레이드 작업대 이미지 7종', r4['upgradeArtCount'] == 7 and r4['upgradeArtReady'], str(r4))
    check('업그레이드 7분류가 28종을 중복 없이 포함', r4['upgradeGroups'] == 7 and r4['upgradeCoverage'], str(r4))
    check('현재 의뢰가 메인·지도에 계속 표시', r4['missionVisible'] and r4['mapMission'], str(r4))
    check('정착지 3개 공간 허브와 실제 달구지 표시', r4['settlementHub'] and r4['garageVan'], str(r4))
    check('장소별 기능 분리', r4['sectionIsolation'], str(r4))
    check('정비소 분류·실제 부품 이미지·카드 표시', r4['garageGroups'] == 7 and r4['garageArt'] and r4['garageCards'] > 0, str(r4))
    check('업그레이드 전후 차체 작업 장면', r4['upgradeCeremony'], str(r4))
    check('상태창 지금·여정·동료 탭 전환', r4['statusTabs'], str(r4))
    check('연쇄 사건에 앞 이야기 표시', r4['storyContext'], str(r4))
    check('긴 사건 본문·7개 선택지 독립 스크롤', r4['eventScroll'] and
          r4['choiceScroll'] and r4['choiceDock'], str(r4))
    rcombat = pg.evaluate('''() => {
      const out={}, oldCombat=S.combat, oldInjuries=structuredClone(S.injuries||{});
      const chains=[
        ['patrol_walker','combat_walker_read','combat_walker_strike'],
        ['patrol_swarm','combat_swarm_read','combat_swarm_break'],
        ['patrol_toll','combat_toll_read','combat_toll_breach']
      ];
      out.threePhase=chains.every(ids=>ids.every((id,i)=>{
        const e=D.events.find(x=>x.id===id);
        return e&&e.combat&&e.combat.phase===i+1&&e.combat.total===3&&D.scenes[e.scene];
      }));
      UI.showEvent(D.events.find(e=>e.id==='patrol_walker')); UI.finishStory();
      out.hud=!!document.querySelector('.combat-hud') &&
        document.querySelector('.combat-hud').textContent.includes('정찰') &&
        document.querySelector('.event-choice-dock').textContent.includes('엄폐');
      document.querySelector('#ev-wrap').classList.remove('on');
      S.injuries={}; S.combat=null;
      G.applyFx({combatStart:{id:'test',threat:'test'},combatEdge:2});
      out.edge=S.combat&&S.combat.edge===2&&G.combatGrade({combatRoll:.5})==='우세';
      G.applyFx({injury:{who:'driver',label:'테스트 타박',days:2}});
      out.injury=G.isInjured('driver')&&S.injuries.driver.days===2;
      G.applyFx({healInjury:'latest',combatEnd:1});
      out.recovered=!G.isInjured('driver')&&S.combat===null;
      out.sound=typeof SND.combat==='function';
      S.combat=oldCombat; S.injuries=oldInjuries; G.save();
      return out;
    }''')
    check('초계·드론·검문소 3단계 교전', rcombat['threePhase'], str(rcombat))
    check('교전 HUD·전술 표식', rcombat['hud'], str(rcombat))
    check('전세·부상·회복 상태 반영', rcombat['edge'] and rcombat['injury'] and rcombat['recovered'], str(rcombat))
    check('Web Audio 전투 효과음 합성기', rcombat['sound'], str(rcombat))
    print('― 합류 전 의뢰')
    rr = pg.evaluate('''() => {
      const out={};
      document.querySelector('#ev-wrap').classList.remove('on');
      S.party=[]; S.up={}; S.recruitQ=null; S.driving={from:'busan',to:'ulsan',dist:80,gone:20};
      out.started=G.startRecruitQuest('minji');
      out.target=S.recruitQ&&S.recruitQ.target==='ulsan';
      S.driving=null; S.at='ulsan';
      out.opened=G.openRecruitStep()&&document.querySelector('#ev-wrap').classList.contains('on');
      document.querySelector('#ev-wrap').classList.remove('on');
      out.remembered=G.rememberRecruitChoice('shield')&&S.recruitQ.choice==='shield';
      out.road=G.markRecruitRoad('minji')&&S.recruitQ.stage==='road'&&S.recruitQ.roadFrom==='ulsan';
      const oldUsed=S.used, oldArrive=UI.onArrive;
      S.used=D.events.map(e=>e.id); UI.onArrive=()=>0;
      G.startTravel('gyeongju');
      out.guestAssist=S.driving&&S.driving.guest==='minji'&&S.driving.guestFuel===.92;
      S.driving.gone=S.driving.dist;
      G.arrive();
      UI.onArrive=oldArrive; S.used=oldUsed;
      out.follow=S.recruitQ&&S.recruitQ.stage==='follow'&&S.recruitQ.target==='gyeongju';
      out.followHeld=!G.openRecruitStep()&&!document.querySelector('#ev-wrap').classList.contains('on');
      S.day++;
      out.followOpened=G.openRecruitStep()&&document.querySelector('#ev-wrap').classList.contains('on');
      out.memoryVisible=document.querySelector('#ev-sheet').textContent.includes('우리가 앞에서 한 일')&&
        document.querySelector('#ev-sheet').textContent.includes('긴 긁힌 자국');
      document.querySelector('#ev-wrap').classList.remove('on');
      out.ready=G.markRecruitReady('minji')&&S.recruitQ.stage==='ready';
      S.party=['parkss','leo'];
      out.fullHeld=!G.doRecruit('minji')&&S.recruitQ&&S.recruitQ.stage==='ready';
      S.up.bench=true;
      out.joined=G.doRecruit('minji')&&G.hasComp('minji')&&S.recruitQ===null;
      return out;
    }''')
    check('첫 만남→지역 과제→임시 동행→두 번째 사건→합류 약속',
          rr['started'] and rr['target'] and rr['opened'] and rr['road'] and
          rr['remembered'] and rr['guestAssist'] and rr['follow'] and rr['followHeld'] and rr['followOpened'] and
          rr['memoryVisible'] and rr['ready'], str(rr))
    check('만석에서도 약속 보존·좌석 개조 후 합류', rr['fullHeld'] and rr['joined'], str(rr))
    pg.click('#dk-map'); pg.wait_for_timeout(160)
    map_detail = pg.evaluate('''() => ({
      modes:document.querySelectorAll('#map-sourcebar,#osmcv,#vworld-map').length,
      canvas:document.querySelector('#mapcv')?.getAttribute('aria-label'),
      rivers:(typeof MAPR==='object'),
      context:Object.keys(D.nodeScenery||{}).length
    })''')
    check('실축 모드 제거·그림 여정도 단일화', map_detail['modes'] == 0 and '그림 여정도' in map_detail['canvas'], str(map_detail))
    check('상세 그림 지도 렌더러 유지', map_detail['rivers'] and map_detail['context'] >= 30, str(map_detail))
    pg.screenshot(path=str(SHOT / 'map-illustrated-detailed.png'))
    pg.click('#map-x')
    check('866개 이벤트 전부 전용·지역·타입 컷 보유', r4['allEventsIllustrated'] and r4['genericScene'], str(r4))
    check('미충족 동료 선택 숨김·자원 조건 유지·합류 후 해금',
          r4['secretChoiceHidden'] and r4['resourceChoiceVisible'] and r4['secretChoiceRevealed'], str(r4))
    check('동료 탭은 미합류 이름을 공개하지 않음', r4['crewNoSpoilers'], str(r4))
    check('회상 이벤트 시네마틱 표시', r4['eventScene'], str(r4))
    check('장면 탭 확대·복귀', r4['sceneZoom'] and r4['sceneUnzoom'], str(r4))
    check('도시 도착 시네마틱 표시', r4['arrivalScene'] and r4['arrivalDelay'] == 3000, str(r4))
    check('needUp 게이트(윈치)', r4['gateClosed'] and r4['gateOpen'], str(r4))
    check('험로 타이어 연비', r4['tiresSave'])
    check('사이드 공구함 정비 강화', r4['repairBoost'], str(r4))
    # 대표 전용 컷을 실제 모바일 이벤트 시트로 남겨 크롭·본문 가독성을 눈검수한다.
    for event_id, filename in [
        ('story_generation_form', 'scene-generation-form.png'),
        ('trace_cortis_relic', 'scene-cortis.png'),
        ('seoul_core', 'scene-seoul-core.png'),
    ]:
        opened = pg.evaluate('''(id) => {
          const ev = D.events.find(e => e.id === id) || (D.seoulStops||[]).find(e => e.id === id);
          if (!ev) return false;
          UI.showEvent(ev);
          UI.finishStory();
          return document.querySelector('#ev-wrap').classList.contains('on');
        }''', event_id)
        check(f'대표 컷 모바일 시트: {event_id}', opened)
        pg.wait_for_timeout(120)
        pg.screenshot(path=str(SHOT / filename))
        pg.evaluate('document.querySelector("#ev-wrap").classList.remove("on")')
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
      Object.keys(D.comps).forEach(id => {
        S.comps[id] = S.comps[id] || {mood:65, bond:20, lvl:3, perks:[], pending:0};
        S.comps[id].lvl = 3;
      });
      // 개인 서사 Lv3 동료 3명 + 다른 기둥 충족 → 관계 기둥 부족
      S.party = ['minji','parkss','kangwoo'];
      ['resist_revealed','cell_road','cell_sea','cell_dome',
       'massacre_known','parent_key_found','es_truth','uplink_seen',
       'postman_letter','gp_envelope_found'].forEach(f => S.flags[f] = true);
      out.partialReady = G.seoulReady();
      out.missPillar = G.seoulMissing().pillar;   // '관계'
      // 선택한 네 사람의 개인 서사 → 열림
      S.party.push('leo');
      out.fourReady = G.seoulReady();
      // 전원 완주는 별도 보상 판정
      S.party.push('jaeyi','eunsu');
      out.fullReady = G.seoulReady();
      out.fullCrew = G.fullCrewStories();
      delete S.flags.uplink_seen;
      out.truthLocked = !G.seoulReady() && G.seoulMissing().pillar === '진실';
      S.flags.uplink_seen = true;
      // 영입 뒤 미합류 동료의 이름·위치를 자동 공개하지 않는다.
      S.party = []; S.notes = []; G.doRecruit('minji');
      out.refer = S.notes.some(n => Object.entries(D.comps).some(([id,c]) =>
        id!=='minji' && n.title.includes(c.name)));
      // 서울 오르막 진행
      S.flags.seoul_open = true; S.seoul = {entered:true};
      out.stage0 = G.seoulStage();
      ['han','ruins','square','base'].forEach(id => S.flags['seoul_'+id+'_done'] = true);
      S.flags.seoul_core_reached = true;
      out.stageEnd = G.seoulStage();
      // 서울 정거장 이벤트 = 5, 각 stop에 무료 선택지 존재
      out.stopEvents = D.seoulStops.length;
      out.allHaveFree = D.seoulStops.every(e => e.choices.some(c => !c.req));
      const core = D.seoulStops.find(e => e.id === 'seoul_core');
      out.traceChoice = core.choices.some(c => c.req && c.req.traces === 5);
      S.flags = {};
      D.eraTraces.slice(0,5).forEach(t => S.flags[t.flag] = true);
      out.traceUnlocked = G.reqOk({traces:5}).ok;
      const traceText = core.choices.find(c => c.req && c.req.traces === 5).out[0].text(S);
      out.traceNarrative = D.eraTraces.slice(0,5).every(t => traceText.includes(t.name)) &&
        !traceText.includes(D.eraTraces[5].name);
      S.used = []; S._storyQueue = []; S.stats.km = 150;
      out.beat1 = G.scheduleJourneyBeat();
      S.used.push('story_generation_form'); S._storyQueue = [];
      out.beat2 = G.scheduleJourneyBeat();
      S.used.push('story_family_principle'); S._storyQueue = [];
      out.beat3 = G.scheduleJourneyBeat();
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
      out.coreNames = core.choices.some(c=>c.req&&c.req.flag==='ridge_path');
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
    check('동료 3명 개인 서사면 관계 기둥 잠김', not r7['partialReady'] and r7['missPillar'] == '관계', str(r7))
    check('동료 4명 개인 서사+기둥→서울 열림', r7['fourReady'])
    check('6명 전원 완주는 별도 보상', r7['fullReady'] and r7['fullCrew'])
    check('세대 흔적 5개 코어 증언·실제 조합 반영', r7['traceChoice'] and r7['traceUnlocked'] and r7['traceNarrative'], str(r7))
    check('주행거리 본편 장면 순서 보장', r7['beat1'] == 'story_generation_form' and
          r7['beat2'] == 'story_family_principle' and r7['beat3'] == 'story_generation_speech', str(r7))
    check('상행선 단서 없으면 진실 기둥 잠김', r7['truthLocked'], str(r7))
    check('영입 시 다음 동료 자동 안내 없음', not r7['refer'], str(r7))

    # 최종 엔딩: 코어 고백 → 실제 집행 선택 → 완결 에필로그
    r8 = pg.evaluate('''() => { const out = {};
      const core = D.seoulStops.find(e => e.id === 'seoul_core');
      const coreText = typeof core.text === 'function'
        ? core.text({day:12, flags:{}, party:[]}) : core.text;
      const lateCoreText = typeof core.text === 'function'
        ? core.text({day:31, flags:{}, party:[]}) : core.text;
      out.coreToDecision = core.choices.every(c => c.out.every(o => o.fx && o.fx.chain === 'seoul_decision'));
      const decision = D.events.find(e => e.id === 'seoul_decision');
      out.decision = !!decision && !!decision.noPool && decision.choices.length === 3;
      out.decisionToNight = decision.choices.every(c => c.out.every(o => o.fx && o.fx.chain === 'seoul_night'));
      out.distinct = [...new Set(decision.choices.map(c => c.out[0].fx.flag2))].sort().join(',') ===
        ['core_quarantine','core_sleep','core_transfer'].join(',');
      const ep = D.events.find(e => e.id === 'seoul_night');
      out.ep = !!ep && !!ep.noPool;
      const principle = D.events.find(e => e.id === 'story_family_principle');
      const keyEvent = D.events.find(e => e.id === 'story_family_key');
      const backdoor = D.events.find(e => e.id === 'es_backdoor');
      out.parentTrail = principle.choices.every(c=>c.out[0].fx.flag === 'parent_principle_found') &&
        keyEvent.choices.every(c=>c.out[0].fx.flag === 'parent_key_found' &&
          c.out[0].fx.item['부모님의 검증키'] === 1);
      out.familyTruth = backdoor.text.includes('정부 책임자들의 승인은 명령보다 열한 분 늦었다') &&
        backdoor.choices.every(c=>c.out[0].fx.flag === 'es_truth' &&
          c.out[0].fx.flag2 === 'uplink_seen') &&
        coreText.includes('가족을 연산망 연속성에 대한 고위험 인과 노드로 분류');
      out.rootMystery = coreText.includes('최초 위험 조건의 목적과 서울을 비워야 했던 이유') &&
        coreText.includes('부모님의 검증키') &&
        coreText.includes('등록 6,412명');
      out.deadlineAdaptive = coreText.includes('첫 이송까지 19일') &&
        lateCoreText.includes('순차 이송 진행 중') &&
        ep.text({day:31,flags:{core_transfer:true},party:[]}).includes('첫 이송은 이미 시작된 뒤였다');
      const render = (v, flags={}) => typeof v === 'function' ? v({flags, party:[]}) : v;
      const costs = decision.choices.map(c => render(c.out[0].text, {}));
      out.distinctCosts = costs[0].includes('느린 합의') &&
        costs[1].includes('원본 기록의 검색창도 꺼졌다') &&
        costs[2].includes('삼중 감시조');
      out.gateSeparate = D.gateEvent.text({flags:{seoulTries:0}}).includes('추방 명령이 아닙니다') &&
        coreText.includes('별도의 인계 규약');
      const reveal = D.events.find(e => e.id === 'resist_reveal');
      out.generations = reveal.choices.every(c => c.out[0].text.includes('세대')) &&
        D.comps.kangwoo.bio.includes('자신이 겪은 서울 추방') &&
        D.comps.jaeyi.bio.includes('서울을 본 적 없는 남쪽 태생');
      const base = D.seoulStops.find(e => e.id === 'seoul_base');
      const envelope = base.choices.find(c => c.label === '봉투를 연다');
      out.familyQuestion = envelope.out[0].text.includes('증조모') &&
        envelope.out[0].text.includes('사유: —');
      const epText = ep.text({flags:{core_transfer:true}, party:[]});
      const epOut = ep.choices.map(c => c.out[0].text({flags:{core_transfer:true}, party:[]}));
      out.subtleClue = epOut.every(t => t.includes('KOR-LOCAL 처리 결과 수신') &&
        t.includes('후속 목록: 없음') && t.includes('〔 서울까지 400km — 끝 〕')) &&
        epOut.every(t => !t.includes('2막') && !t.includes('응답 모형') && !t.includes('다음 목적지'));
      out.storyDone = ep.choices.every(c => c.out[0].fx.flag === 'story_done');
      S._chain = null; G.applyFx({chain:'seoul_decision'});
      out.chainSet = S._chain === 'seoul_decision'; S._chain = null;
      S.flags.seoul_core_reached = true;
      out.chainNotInPool = !G.eligible('스토리').some(e => ['seoul_decision','seoul_night'].includes(e.id));
      delete S.flags.seoul_core_reached;
      S._storyQueue = []; S.used = S.used.filter(id => !['es_nightshift','es_backdoor'].includes(id));
      delete S.flags.es_v1194; G.grantPerk('eunsu','es_story');
      out.storyQueued = S._storyQueue[0] === 'es_nightshift' && G.popStory() === 'es_nightshift';
      return out; }''')
    check('코어 답변 전부 집행 선택으로 연쇄', r8['coreToDecision'])
    check('집행 선택 3종→에필로그 연쇄', r8['decision'] and r8['decisionToNight'] and r8['distinct'], str(r8))
    check('부모 발표 원고→반도체 검증키 보장', r8['parentTrail'])
    check('가족 직접 사유·정부 승인 순서 회수', r8['familyTruth'])
    check('제7 구역 저지·143년 최초 목적 분리', r8['rootMystery'])
    check('30일 전후 이송 상태가 실제 날짜를 반영', r8['deadlineAdaptive'])
    check('추방과 남산 관문은 별도 절차', r8['gateSeparate'])
    check('세대별 추방 기억·남쪽 태생 명시', r8['generations'])
    check('할아버지 집안의 빈 사유표 회수', r8['familyQuestion'])
    check('세 처분의 대가가 서로 다름', r8['distinctCosts'])
    check('완결 뒤 상행선은 짧은 수신 흔적만 남김', r8['subtleClue'] and r8['storyDone'])
    check('결정·에필로그 존재+noPool', r8['ep'] and r8['chainNotInPool'], str(r8))
    check('fx.chain → S._chain 세팅', r8['chainSet'])
    check('은수 필수 단서 큐 등록·회수', r8['storyQueued'], str(r8))
    # 실제 시트 닫기 연쇄: 코어 답변 → 집행 선택 → 남산의 밤
    pg.evaluate('''() => {
      S.flags = {seoul_open:true, ridge_path:true, mingyu_alive:true};
      S.used = S.used.filter(id => !['seoul_decision','seoul_night'].includes(id));
      S._chain = null; S._storyQueue = [];
      G.openEvent(D.seoulStops.find(e => e.id === 'seoul_core'));
      UI.finishStory();
    }''')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.evaluate('UI.finishStory()')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.wait_for_timeout(600)
    pg.evaluate('UI.finishStory()')
    actual_decision = '마지막 집행권' in pg.locator('#ev-sheet').inner_text()
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.evaluate('UI.finishStory()')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.wait_for_timeout(600)
    pg.evaluate('UI.finishStory()')
    actual_night = '남산의 밤' in pg.locator('#ev-sheet').inner_text()
    check('실제 UI 연쇄: 코어→집행 선택→에필로그', actual_decision and actual_night)
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
    check('첫 만남 전 NPC 후속담 6종 잠김', continuity['npcLocked'], str(continuity))
    check('첫 만남 뒤 한 박사 후속담 해금', continuity['npcOpen'], str(continuity))
    check('미탑승 화자 주행 대사 차단', continuity['banterSpeaker'], str(continuity))
    check('구식 minParty 선택 조건 정규화', continuity['legacyChoiceLocked'] and
          continuity['legacyChoiceOpen'], str(continuity))
    check('야간 대화는 실제 밤에만 해금', continuity['nightTalkLocked'] and
          continuity['nightTalkOpen'], str(continuity))
    check('콘솔 에러 0 (최종)', not errors, ' | '.join(errors[:3]))

    print('― 스크린샷')
    pg.evaluate('document.querySelector("#ev-wrap").classList.remove("on")')
    pg.evaluate('document.querySelector("#arrival-scene").classList.remove("on")')
    pg.add_style_tag(content='#arrival-scene,#bubbles,#minimap{display:none!important}')
    pg.screenshot(path=str(SHOT / 'game.png'))
    save_canvas(pg, '#cv', SHOT / 'van-base-procedural.png')
    pg.evaluate('''() => {
      S.up = Object.fromEntries(D.upgrades.map(u => [u.id, true]));
      S.party = ['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
      S.dog = true; S.driving = null; S.at = 'daegu'; S.min = 19 * 60; S.wx = 'clear';
      document.querySelector('#arrival-scene').classList.remove('on');
      UI.renderAll();
    }''')
    pg.wait_for_timeout(250)
    save_canvas(pg, '#cv', SHOT / 'van-all-upgrades.png')
    pg.evaluate('S.at="daegu"; UI.showStl && 0')  # showStl은 비공개 — dock 경유
    ait_pg = b.new_page(viewport={'width': 390, 'height': 844})
    ait_errors = []
    ait_pg.on('pageerror', lambda e: ait_errors.append(str(e)))
    ait_pg.add_init_script("window.ReactNativeWebView={postMessage(){}}")
    ait_pg.goto(URL)
    ait_pg.wait_for_timeout(500)
    ait_pg.click('#bt-new')
    ait_pg.wait_for_timeout(120)
    check('AIT 런타임은 오프로드 선택 없이 온로드 이름 입력으로 직행',
          ait_pg.locator('#scr-name').is_visible() and
          not ait_pg.locator('#scr-mode').is_visible() and
          ait_pg.evaluate("document.documentElement.classList.contains('ait-runtime')") and
          not ait_pg.evaluate('OFF.ready()'), ' | '.join(ait_errors[:2]))
    ait_pg.close()
    b.close()

print()
if fails:
    print(f'❌ 실패 {len(fails)}건: ' + ', '.join(fails)); sys.exit(1)
print('✅ 스모크 전부 통과')
