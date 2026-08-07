#!/usr/bin/env python3
"""서울까지 400km — 스모크 테스트 (빌드 산출물 대상)
사용: python3 tests/test_smoke.py
검사: 부팅→인트로→게임 진입, 콘솔 에러 0, 의뢰 4종 엔진 플로우, 신규 체인 이벤트 표시
주의: headless 캔버스 getImageData는 못 믿는다 — 픽셀 검증은 스크린샷 눈검수로.
"""
import base64, json, sys, pathlib
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
    # 용량 상한의 단일 소스는 빌드 예산(reports/asset-budget.json) — 검사에 숫자를 또 박지 않는다
    _budget = json.loads((ROOT / 'reports' / 'asset-budget.json').read_text())
    check(f"모바일 단일 HTML 예산({_budget['html']['maxBytes']//1_000_000}MB) 이하",
          (ROOT / '서울까지400km.html').stat().st_size <= _budget['html']['maxBytes'],
          f"{(ROOT / '서울까지400km.html').stat().st_size / 1_000_000:.1f}MB")
    check('「파란 트럭의 밤」 타이틀 BGM 내장',
          pg.evaluate("D.bgm.title.startsWith('data:audio/mpeg;base64,') && D.bgm.titleLoop === false"))
    early_sound = pg.evaluate('''() => ({
      visible:document.querySelector('#early-sound').offsetParent!==null,
      pressed:document.querySelector('#early-sound').getAttribute('aria-pressed'),
      label:document.querySelector('#early-sound').textContent.trim()
    })''')
    check('초반 화면 전체 소리 토글 표시', early_sound['visible'] and
          early_sound['pressed'] == 'false' and early_sound['label'] == '🔇소리 켜기', str(early_sound))
    pg.click('#bt-song'); pg.wait_for_timeout(120)
    check('타이틀 곡 재생 버튼이 정지 버튼으로 바뀜',
          pg.evaluate("BGM.isSongPlaying() && SND.isEnabled() && document.querySelector('#bt-song').textContent.includes('노래 끄기')"))
    pg.click('#bt-song'); pg.wait_for_timeout(120)
    check('같은 버튼으로 곡을 끄면 타이틀 BGM이 다시 재생되지 않음',
          pg.evaluate("!BGM.isSongPlaying() && BGM.isMusicPaused() && !document.querySelector('#bt-song').classList.contains('playing')"))
    pg.click('#early-sound'); pg.wait_for_timeout(80)
    check('초반 전체 소리 토글로 음소거',
          pg.evaluate("!SND.isEnabled() && document.querySelector('#early-sound').getAttribute('aria-pressed') === 'false'"))
    audio_assets = pg.evaluate('''() => {
      const sfx=Object.entries(D.sfx||{});
      const core=Object.entries(D.vo||{}).filter(([key])=>/^cheollian_core_\\d{2}$/.test(key));
      const humanVoice=Object.keys(D.vo||{}).filter(key=>
        /(mother|father|grandfather|minji|parkss|leo|jaeyi|eunsu|kangwoo|intro)/i.test(key));
      const embedded=value=>String(value||'').startsWith('data:audio/mpeg;base64,');
      return {
        sfxCount:sfx.length,
        sfxEmbedded:sfx.every(([,value])=>embedded(value)),
        driveEmbedded:embedded(D.bgm.drive_day)&&embedded(D.bgm.drive_night),
        coreCount:core.length,
        coreEmbedded:core.every(([,value])=>embedded(value)),
        humanVoice,
        managers:typeof AMBI==='object'&&typeof VO==='object'
      };
    }''')
    check('대표 환경음·차량음 23개와 주행 BGM 내장',
          audio_assets['sfxCount'] == 23 and audio_assets['sfxEmbedded'] and
          audio_assets['driveEmbedded'], str(audio_assets))
    check('천리안 코어 음성 15개만 내장·사람 음성 제외',
          audio_assets['coreCount'] == 15 and audio_assets['coreEmbedded'] and
          not audio_assets['humanVoice'] and audio_assets['managers'], str(audio_assets))
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
    check('사용자가 끈 소리는 프롤로그에서 자동으로 다시 켜지지 않음',
          pg.evaluate("!SND.isEnabled() && document.querySelector('#early-sound').offsetParent !== null"))
    expected_intro_count = pg.evaluate("`1 / ${D.intro.length} · 1 / ${D.intro[0].beats.length}`")
    check('이름 Enter가 첫 턴을 건너뛰지 않음',
          pg.locator('#intro-count').text_content() == expected_intro_count)
    check('프롤로그 자동 진행을 명시하고 언제든 끌 수 있음',
          pg.locator('#intro-auto').get_attribute('aria-pressed') == 'true' and
          '자동으로 이어집니다' in pg.locator('#intro-hint').text_content())
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
      sides:[...document.querySelectorAll('#intro-txt .chat-msg')].map(x=>x.classList.contains('mine')?'mine':'other'),
      lanes:[...document.querySelectorAll('#intro-txt .chat-msg')].map(x=>x.dataset.side),
      narration:document.querySelectorAll('#intro-txt .story-narration').length,
      order:[...document.querySelectorAll('#intro-txt [data-story-entry]')].map(x=>x.dataset.kind),
      narrationW:document.querySelector('#intro-txt .story-narration')?.getBoundingClientRect().width||0,
      transcriptW:document.querySelector('#intro-txt .story-transcript')?.getBoundingClientRect().width||0
    })''')
    check('사람 대화는 채팅처럼 누적', intro_chat['count'] == 2 and
          intro_chat['names'] == ['테스터 · 8살','할아버지'] and
          intro_chat['sides'] == ['mine','other'] and
          intro_chat['lanes'] == ['right','left'], str(intro_chat))
    check('내레이션은 전체 폭으로 남고 채팅을 지우지 않음',
          intro_chat['narration'] == 1 and
          intro_chat['order'] == ['narration','dialogue','dialogue'] and
          intro_chat['narrationW'] >= intro_chat['transcriptW'] - 1, str(intro_chat))
    for _ in range(pg.evaluate('D.intro.reduce((n,p)=>n+p.beats.length,0) - 2')):
        pg.click('#scr-intro'); pg.wait_for_timeout(120)
    check('이름 저장(S.name)', pg.evaluate('S.name') == '테스터', str(pg.evaluate('S.name')))
    pg.wait_for_timeout(400)
    check('게임 진입(HUD)', pg.locator('#g-fuel').is_visible())
    auto_flow = pg.evaluate('''async () => {
      window.__CARAVAN_TEST_AUTO_MS=90;
      const ev=D.events.find(item=>item.id==='lib_meet');
      UI.showEvent(ev);
      document.querySelector('#ev-sheet').getAnimations().forEach(animation=>animation.finish());
      const first=document.querySelector('#ev-sheet .story-next').getBoundingClientRect();
      const announced=document.querySelector('#ev-sheet .story-next .req').textContent.includes('자동으로 다음 대화가 이어집니다');
      const toggle=document.querySelector('#ev-sheet .story-auto-toggle');
      const defaultOn=toggle.getAttribute('aria-pressed')==='true';
      await new Promise(resolve=>setTimeout(resolve,150));
      const badge=document.querySelector('.scene-cut-mark').textContent;
      const second=document.querySelector('#ev-sheet .story-next').getBoundingClientRect();
      document.querySelector('#ev-sheet .story-auto-toggle').click();
      const stoppedAt=document.querySelector('.scene-cut-mark').textContent;
      await new Promise(resolve=>setTimeout(resolve,150));
      const stayed=document.querySelector('.scene-cut-mark').textContent===stoppedAt;
      UI.finishStory();
      const choicePause=document.querySelector('.choice-dock-head small').textContent.includes('직접 선택');
      document.querySelector('#ev-sheet [data-i="2"]').click();
      UI.finishStory();
      const finishLabel=document.querySelector('#ev-sheet [data-r="ok"]').textContent.trim();
      document.querySelector('#ev-sheet [data-r="ok"]').click();
      delete window.__CARAVAN_TEST_AUTO_MS;
      return {announced,defaultOn,badge,stable:Math.abs(first.y-second.y)<1,stayed,choicePause,finishLabel};
    }''')
    check('대화 자동 진행 안내·ON 기본값·선택지에서 정지',
          auto_flow['announced'] and auto_flow['defaultOn'] and '2 / 4' in auto_flow['badge'] and
          auto_flow['stayed'] and auto_flow['choicePause'], str(auto_flow))
    check('진행 버튼 위치 고정·사건 종료 문구 명확',
          auto_flow['stable'] and auto_flow['finishLabel'] == '길로 돌아가기', str(auto_flow))
    identity_flow = pg.evaluate('''() => {
      const backup=JSON.parse(JSON.stringify(S));
      const revealChecks=[];
      for(const ev of D.events.filter(item=>item.recruitStart)){
        const id=ev.recruitStart, name=D.comps[id].name;
        const introText=typeof ev.text==='function'?ev.text(S):ev.text;
        const intro=UI.storyTurns(introText,ev,{turnSpeakers:ev.turnSpeakers});
        const start=[];
        (ev.choices||[]).forEach(choice=>(choice.out||[]).forEach(out=>{
          if(out.fx&&out.fx.startRecruit===id) start.push(out);
        }));
        const outcome=start[0];
        const outcomeText=outcome&&(typeof outcome.text==='function'?outcome.text(S):outcome.text);
        const result=outcome?UI.storyTurns(outcomeText,ev,{
          knownSpeaker:!!intro.knownSpeaker,
          speakers:outcome.speakers,
          turnSpeakers:outcome.turnSpeakers
        }):[];
        const combined=[...intro,...result].filter(turn=>turn.kind==='dialogue'&&turn.who===id);
        const revealAt=combined.findIndex(turn=>String(turn.text||'').includes(name));
        revealChecks.push({id,
          hasStart:!!outcome,
          revealAt,
          revealNamed:revealAt>=0&&combined[revealAt].name!=='???',
          hiddenBefore:combined.slice(0,Math.max(0,revealAt)).every(turn=>turn.name==='???'),
          knownAfter:revealAt>=0&&combined.slice(revealAt).every(turn=>turn.name!=='???')
        });
      }

      localStorage.setItem('caravan_story_auto','0');
      const ev=D.events.find(item=>item.id==='meet_scrapyard');
      UI.showEvent(ev);
      UI.finishStory();
      const beforeRows=[...document.querySelectorAll('#ev-sheet .chat-msg[data-speaker="minji"]')]
        .map(node=>({side:node.dataset.side,name:node.querySelector('.chat-name').textContent.trim()}));
      const beforeFrame=document.querySelector('#ev-sheet .event-scene-frame');
      const beforeScene={
        key:beforeFrame.dataset.sceneKey,
        x:beforeFrame.style.getPropertyValue('--scene-x'),
        y:beforeFrame.style.getPropertyValue('--scene-y'),
        scale:beforeFrame.style.getPropertyValue('--scene-scale')
      };
      document.querySelector('#ev-sheet [data-i="0"]').click();
      UI.finishStory();
      const afterRows=[...document.querySelectorAll('#ev-sheet .chat-msg[data-speaker="minji"]')]
        .map(node=>({side:node.dataset.side,name:node.querySelector('.chat-name').textContent.trim()}));
      const afterFrame=document.querySelector('#ev-sheet .event-scene-frame');
      const afterScene={
        key:afterFrame.dataset.sceneKey,
        x:afterFrame.style.getPropertyValue('--scene-x'),
        y:afterFrame.style.getPropertyValue('--scene-y'),
        scale:afterFrame.style.getPropertyValue('--scene-scale')
      };
      const laneStable=beforeRows.length>0&&afterRows.length>0&&
        [...beforeRows,...afterRows].every(row=>row.side===beforeRows[0].side);
      const revealOnLine=afterRows[0]&&afterRows[0].name==='민지';
      const sceneStable=JSON.stringify(beforeScene)===JSON.stringify(afterScene);
      document.querySelector('#ev-wrap').classList.remove('on');
      S=backup; UI.renderAll();
      return {revealChecks,laneStable,revealOnLine,beforeRows,afterRows,sceneStable,beforeScene,afterScene};
    }''')
    check('여섯 동료 첫 만남의 ???→실명 공개 순서',
          len(identity_flow['revealChecks']) == 6 and all(
            item['hasStart'] and item['revealAt'] >= 0 and item['revealNamed'] and
            item['hiddenBefore'] and item['knownAfter'] for item in identity_flow['revealChecks']),
          str(identity_flow['revealChecks']))
    check('민지가 이름을 밝힌 문장부터 실명 표시',
          identity_flow['revealOnLine'], str(identity_flow))
    check('같은 화자는 ???→실명에서도 좌우 레인 고정',
          identity_flow['laneStable'], str(identity_flow))
    check('같은 장면을 쓰는 선택→결과에서 이미지 크롭 고정',
          identity_flow['sceneStable'], str(identity_flow))
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
      S._exploreNodes={}; S._salvagedNodes={}; S._salvageCount=1;   // 다음 수색이 보장 회차가 되도록
      UI.renderAll();
      const region=G.regionOf();
      const expected=region==='north'?12:region==='mid'?9:6;
      const firstStatus=G.exploreStatus();
      const firstForecast=G.exploreForecast(firstStatus);
      const panelForecast=document.querySelector('[data-a="explore"]')?.textContent||'';
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
      return {firstStatus,secondStatus,exhausted,nextDay,freshGain,first,second,third,unchanged,region,expected,
        firstForecast,panelForecast,firstMins:d1-d0,secondMins:d2-d1,
        firstFatigue:f1-f0,secondFatigue:f2-f1};
    }''')
    check('탐색 최소 2시간·재탐색 4시간', exploration['first'] and exploration['second'] and
          exploration['firstMins'] == 120 and exploration['secondMins'] == 240, str(exploration))
    check('재탐색 피로·실패 위험 증가', exploration['firstFatigue'] >= 5 and
          exploration['secondFatigue'] > exploration['firstFatigue'] and
          exploration['secondStatus']['miss'] > exploration['firstStatus']['miss'], str(exploration))
    # 수확은 지역에 따라 다르다 — 남쪽은 143년 훑였고 북쪽은 위험한 만큼 남아 있다.
    check('새 지역 확정 고철(지역 차등)·부품', exploration['firstStatus']['fresh'] and
          exploration['freshGain']['scrap'] == exploration['expected'] and
          exploration['freshGain']['parts'] == 1,
          f"{exploration['region']} 지역 기대 {exploration['expected']} 실제 {exploration['freshGain']}")
    check('탐색 전에 확정 회수·지역 목표·위험 표시',
          exploration['firstForecast']['guaranteed'] == f"고철 {exploration['expected']} · 체결 부품 가능" and
          '찾을 것' in exploration['panelForecast'] and '탐색 위험' in exploration['panelForecast'], str(exploration))
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
    recruit_dialogue = pg.evaluate('''() => {
      const expected={
        rq_minji_join:['minji','me','minji','me','minji'],
        rq_parkss_join:['me','parkss','me','parkss','parkss'],
        rq_leo_join:['leo','me','leo','me'],
        rq_jaeyi_join:['jaeyi','me','jaeyi','me','jaeyi'],
        rq_eunsu_join:['eunsu','me','eunsu','me','eunsu'],
        rq_kangwoo_join:['kangwoo','seoyeon','kangwoo','me','kangwoo','me','kangwoo']
      };
      const actual={};
      for(const id of Object.keys(expected)){
        const event=D.events.find(item=>item.id===id);
        actual[id]=UI.storyTurns(event.text,event)
          .filter(turn=>turn.kind==='dialogue').map(turn=>turn.who);
      }
      return {
        actual,
        ok:Object.keys(expected).every(id=>JSON.stringify(actual[id])===JSON.stringify(expected[id])),
        invitations:Object.keys(expected).every(id=>{
          const text=D.events.find(item=>item.id===id).text;
          return /서울까지|같이 가|함께/.test(text);
        })
      };
    }''')
    check('동료 합류 대화의 제안→응답 화자 순서 고정',
          recruit_dialogue['ok'] and recruit_dialogue['invitations'], str(recruit_dialogue))
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
      out.bubble = !!document.querySelector('.bubble.radio,.bubble.narration');
      return out;
    }''')
    check('라디오: 진공관 없으면 불가', r3['blocked'], str(r3))
    check('라디오: 수리(진공관 소모+플래그)', r3['fixed'] and r3['consumed'] and r3['flag'], str(r3))
    check('라디오: 재수리 불가', r3['again'])
    check('라디오: 방송·수신 정경 버블 표시', r3['bubble'], str(r3))
    # v2.0 업그레이드
    r4 = pg.evaluate('''() => {
      const out = {};
      out.upCount = D.upgrades.length;
      out.eventCount = D.events.length;
      const director0={events:[...(S._recentEvents||[])],types:[...(S._recentEventTypes||[])],
        breather:S._eventBreather||0,state:structuredClone(S.director)};
      const sample=[
        {id:'repeat_a',type:'조우',w:1},
        {id:'fresh_b',type:'발견',w:1},
        {id:'fresh_c',type:'정경',w:1},
        {id:'fresh_d',type:'동행',w:1}
      ];
      S._recentEvents=['repeat_a']; S._recentEventTypes=[]; S._eventBreather=0;
      out.directorCooldown=!G.directEventPool(sample).some(e=>e.id==='repeat_a');
      S._recentEvents=[]; S._recentEventTypes=[]; S._eventBreather=1;
      const calm=G.directEventPool([{id:'heavy',type:'위기',w:1},...sample]);
      out.directorBreather=calm.length>0&&calm.every(G.eventIsCalm)&&S._eventBreather===0;
      S._recentEventTypes=['조우','조우']; S._eventBreather=0;
      out.directorVariety=G.directEventPool(sample).every(e=>e.type!=='조우');
      out.directorContext=G.eventIsContextual({once:true,needUp:'bench'}) &&
        !G.eventIsContextual({once:false,needUp:'bench'}) &&
        G.eventIsHeavy({type:'추적'}) && G.eventIsCalm({type:'정경'});
      S.director={intensity:55,phase:'build',relaxEvents:0};
      G.rememberEvent({id:'test-heavy',type:'위기'});
      const peak=S.director.phase==='peak';
      G.rememberEvent({id:'test-calm-1',type:'정경'});
      const fade=S.director.phase==='fade';
      G.rememberEvent({id:'test-calm-2',type:'정경'});
      G.rememberEvent({id:'test-calm-3',type:'정경'});
      out.directorArc=peak&&fade&&S.director.phase==='relax';
      S._recentEvents=director0.events; S._recentEventTypes=director0.types;
      S._eventBreather=director0.breather;
      S.director=director0.state;

      const narrative0={flags:{...S.flags},knowledge:structuredClone(S.knowledge),
        memories:structuredClone(S.memories),relations:structuredClone(S.relations),
        party:[...S.party],comps:structuredClone(S.comps),driving:S.driving?structuredClone(S.driving):null,
        events:S.stats.events,km:S.stats.km};
      S.flags.parent_principle_found=true;
      G.syncKnowledgeFromFlags();
      out.knowledgeState=G.knowledgeLevel('current_exodus')===2&&
        G.knowledgeLevel('parent_principle')===2&&G.knowledgeSummary().length===Object.keys(D.knowledge).length;
      S.memories={choices:{},pending:[],history:[]};
      const family=D.events.find(e=>e.id==='meet_family');
      const memoryChip=G.rememberChoice(family,family.choices[0],family.choices[0].out[0]);
      S.stats.km+=20; S.stats.events+=2;
      S.driving={from:'busan',to:'yangsan',dist:35,gone:5,road:'normal',slots:[],si:0};
      const echo=G.takeChoiceEcho(), echoAgain=G.takeChoiceEcho();
      out.choiceMemory=memoryChip.length===1&&echo&&echo.memory.id==='family_fed'&&!echoAgain&&
        S.memories.choices.family_fed.echoed;
      S.party=['minji','leo'];
      S.comps.minji.mood=65; S.comps.leo.mood=65;
      S.relations={pairs:{},seenChats:{}};
      G.rememberCrewChat(D.chats[0]); G.rememberCrewChat(D.chats[0]);
      out.crewRelation=G.relation('minji','leo')===1;
      S.comps.leo.mood=10;
      const refusal=G.reqOk({trustComp:'leo'});
      out.companionRefusal=!refusal.ok&&refusal.t.includes('맡지 않겠다고');
      out.initiatives=D.events.filter(e=>e.id.startsWith('initiative_')).length;
      S.flags=narrative0.flags; S.knowledge=narrative0.knowledge; S.memories=narrative0.memories;
      S.relations=narrative0.relations; S.party=narrative0.party; S.comps=narrative0.comps; S.driving=narrative0.driving;
      S.stats.events=narrative0.events; S.stats.km=narrative0.km;
      out.traceDefs = (D.eraTraces||[]).length;
      // 본편 장면과 세계 질감 조우는 같은 레일을 쓰되 종류로 구분한다
      out.journeyBeats = (D.journeyBeats||[]).filter(b=>b.kind!=='world').length;
      out.worldBeats = (D.journeyBeats||[]).filter(b=>b.kind==='world').length;
      S.party = []; S.up = {}; UI.renderAll();
      out.emptyCards = [...document.querySelectorAll('#party .pcard')].filter(x=>x.textContent.includes('빈자리')).length;
      out.introBook = D.intro.length === 17 && D.intro.every(p =>
        p.scene && p.era && p.title && p.text && D.scenes[p.scene]);
      out.introTurns = D.intro.every(p => Array.isArray(p.beats) && p.beats.length >= 8 &&
        p.beats.filter(turn=>['dialogue','thought','letter','ai'].includes(turn.kind)).length >= 5 &&
        (p.solo || new Set(p.beats.filter(turn=>turn.kind==='dialogue').map(turn=>turn.who)).size >= 2) &&
        p.beats.every(turn => turn.text && turn.kind &&
          (!['dialogue','thought','letter'].includes(turn.kind) || (turn.who && turn.name))));
      out.introPortraits = ['mother','father','intro_child','player_child','grandfather','me']
        .every(id => (D.portraits[id]||'').startsWith('data:image/png;base64,'));
      const familyPrinciple=D.events.find(e=>e.id==='story_family_principle');
      const familyKey=D.events.find(e=>e.id==='story_family_key');
      const principleTurns=UI.storyTurns(familyPrinciple.text,familyPrinciple);
      const keyTurns=UI.storyTurns(familyKey.text,familyKey);
      const keyOutcome=familyKey.choices[0].out[0];
      const keyOutcomeTurns=UI.storyTurns(
        keyOutcome.text,familyKey,{turnSpeakers:keyOutcome.turnSpeakers});
      out.familySpeakers=principleTurns.filter(t=>t.kind==='dialogue').length>=8 &&
        principleTurns.some(t=>t.kind==='dialogue'&&t.who==='father') &&
        principleTurns.some(t=>t.kind==='dialogue'&&t.who==='mother') &&
        keyTurns.filter(t=>t.kind==='record'&&t.who==='father').length===2 &&
        keyTurns.some(t=>t.kind==='dialogue'&&t.who==='father') &&
        keyTurns.some(t=>t.kind==='dialogue'&&t.who==='mother') &&
        keyOutcomeTurns.some(t=>t.kind==='record'&&t.who==='mother');
      out.introPremise = D.intro.some(p=>p.text.includes('미국의 AI와 반도체망')) &&
        D.intro.some(p=>p.text.includes('엄마는 천리안의 판단을 검증')) &&
        D.intro.some(p=>p.text.includes('등록 인원 6,412명')) &&
        D.intro.some(p=>p.text.includes('사람의 결정권을 되찾기 위해'));
      const firstIntroBeats=D.intro[0].beats||[];
      const keepsakeBeats=D.intro.find(p=>p.scene==='intro-mother-keepsakes')?.beats||[];
      const moduleBeats=D.intro.find(p=>p.scene==='intro-dashboard-module')?.beats||[];
      const familyBeats=D.intro.find(p=>p.scene==='intro-dock-aid')?.beats||[];
      const appealBeats=D.intro.find(p=>p.scene==='intro-appeal-denied')?.beats||[];
      const workshopBeats=D.intro.find(p=>p.scene==='intro-workshop-departure')?.beats||[];
      const departureBeats=D.intro.find(p=>p.scene==='intro-departure-choice')?.beats||[];
      out.introCausalDialogue =
        firstIntroBeats.some(t=>t.text.includes('길을 막은 건 경찰과 군인이었어')) &&
        firstIntroBeats.some(t=>t.text.includes('명단은 천리안이 만들었어')) &&
        firstIntroBeats.some(t=>t.text.includes('천리안이 사람들을 골랐다고?')) &&
        firstIntroBeats.every(t=>!t.text.includes('문을 잠그고 이름을 고른')) &&
        keepsakeBeats.some(t=>t.text.includes('현재 이송표에 찍힌 명령 규격')) &&
        keepsakeBeats.some(t=>t.text.includes('검증 모듈 보관 위치')) &&
        moduleBeats.some(t=>t.text.includes('분리 절차 두 장')) &&
        familyBeats.some(t=>t.text.includes('난방 호스')) &&
        appealBeats.some(t=>t.text.includes('서울 남산 중앙 노드')) &&
        departureBeats.some(t=>t.text.includes('같은 이송을 겪은 사람')) &&
        departureBeats.some(t=>t.text.includes('같은 곳까지 가겠다는 사람'));
      out.introImmediateMotive=keepsakeBeats.some(t=>t.text.includes('지금 쫓겨나는 사람')) &&
        familyBeats.some(t=>t.text.includes('6,412명은 더 이상')) &&
        appealBeats.some(t=>t.text.includes('원격 이의 제기 경로가 없습니다')) &&
        workshopBeats.some(t=>t.text.includes('예비 연료를 전부 싣고')) &&
        departureBeats.some(t=>t.text.includes('버스 번호와 사람 이름을 놓치지 않는다')) &&
        ['intro-current-expulsion','intro-dock-aid','intro-appeal-denied','intro-mother-keepsakes',
         'intro-dashboard-module','intro-workshop-departure','intro-departure-choice']
          .every(key=>D.scenes[key].startsWith('data:image/jpeg;base64,')) &&
        D.scenes['intro-mother-keepsakes'].startsWith('data:image/jpeg;base64,') &&
        D.scenes['intro-dashboard-module'].startsWith('data:image/jpeg;base64,');
      const firstTransferBeats=D.intro.find(p=>p.scene==='intro-first-expulsion')?.beats||[];
      const currentTransferBeats=D.intro.find(p=>p.scene==='intro-current-expulsion')?.beats||[];
      out.transferPaperMeaning =
        firstTransferBeats.some(t=>t.text.includes('집 문이 잠기고 배급도 끊겼어')) &&
        firstTransferBeats.some(t=>t.text.includes('강제 이송 명령서')) &&
        currentTransferBeats.some(t=>t.text.includes('한 사람에 20kg')) &&
        currentTransferBeats.some(t=>t.text.includes('집과 배급, 통행 권한')) &&
        appealBeats.some(t=>t.text.includes('이 표, 복사해도 될까요')) &&
        departureBeats.every(t=>!t.text.includes('아이에게 빌린'));
      const gpNote2=D.events.find(e=>e.id==='gp_note2');
      const gpNote3=D.events.find(e=>e.id==='gp_note3');
      out.grandfatherNotes =
        gpNote2.text.includes('절대 기어를 빼지 마라') &&
        gpNote2.choices[0].out[0].text.includes('기어를 낮췄다') &&
        gpNote3.text.includes('잠자리부터 제대로 만들어라') &&
        !gpNote3.text.includes('차는 사람을 고친다');
      out.introMystery = D.intro[2].scene === 'intro-first-expulsion' &&
        D.intro[2].text.includes('사유란은 비어 있었다') &&
        D.intro.every(p=>!p.text.includes('사흘')) &&
        D.intro.some(p=>p.text.includes('우리가 지어낸 답이랑 헷갈리지 않으니까'));
      out.introHome = D.intro.some(p=>p.scene === 'intro-camper-conversion' &&
        p.text.includes('폐냉장고 단열판') &&
        p.text.includes('정비 레일') &&
        p.text.includes('남겨 둔 여지는 나중에도 쓸 수 있으니까') &&
        !p.text.includes('사람이 셋이면') &&
        !p.text.includes('사람이 늘면')) &&
        departureBeats.some(t=>t.text.includes('누구를 태우라고 정해 둔 자리가 아니라')) &&
        D.intro.find(p=>p.scene==='intro-envelope-signal').beats.some(t=>
          t.text.includes('엄마의 철제 상자와 계기판'));
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
      const actionCutKeys=[
        'recruit-minji-task-signal','recruit-minji-task-collapse',
        'recruit-minji-follow-listen','recruit-minji-follow-record',
        'recruit-parkss-task-power','recruit-leo-task-wade','recruit-jaeyi-task-lift',
        'recruit-eunsu-task-breaker','recruit-kangwoo-task-seoyeon','combat-walker-joint',
        'seoul-core-key','roadcrew-bridge-wedge','recruit-parkss-follow-shared',
        'recruit-leo-follow-puddle','recruit-jaeyi-follow-shelf','recruit-eunsu-follow-lights'
      ];
      out.actionCutCount=actionCutKeys.filter(key=>!!D.scenes[key]).length;
      out.actionCutMaps=Object.keys(D.eventTurnScenes||{}).length===4 &&
        Object.keys(D.eventChoiceScenes||{}).length>=12 &&
        Object.values(D.eventChoiceScenes||{}).every(choiceMap=>
          Object.values(choiceMap).flat().every(key=>!!D.scenes[key]));
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
      out.settlementFields=Object.values(D.stls||{}).filter(stl=>stl.field).length===7 &&
        Object.values(D.stls||{}).every(stl=>stl.field&&stl.field.actions.length>=3&&
          stl.field.actions.some(action=>action.hidden));
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
      document.querySelector('#ev-sheet').getAnimations().forEach(animation=>animation.finish());
      out.eventTop=Math.round(document.querySelector('#ev-sheet').getBoundingClientRect().top);
      const firstFrame=document.querySelector('#ev-sheet .event-scene-frame');
      const firstCut=firstFrame&&firstFrame.dataset.cutToken;
      const firstScene=firstFrame&&firstFrame.dataset.sceneKey;
      out.choiceLockedUntilRead=!document.querySelector('#ev-sheet [data-i]')&&
        !!document.querySelector('#ev-sheet [data-story-entry]');
      document.querySelector('#ev-sheet .story-next')?.click();
      const secondFrame=document.querySelector('#ev-sheet .event-scene-frame');
      out.turnSceneStable=!!firstCut&&firstScene==='generic-story' &&
        secondFrame.dataset.cutToken===firstCut &&
        secondFrame.dataset.sceneKey===firstScene;
      UI.finishStory();
      out.choiceUnlocked=!!document.querySelector('#ev-sheet [data-i]');
      document.querySelector('#ev-wrap').classList.remove('on');
      const trio=D.events.find(e=>e.id==='rq_kangwoo_join');
      UI.showEvent(trio); UI.finishStory();
      const trioMessages=[...document.querySelectorAll('#ev-sheet .chat-msg')];
      const laneBySpeaker={};
      let stable=true;
      trioMessages.forEach(msg=>{
        const speaker=msg.dataset.speaker, side=msg.dataset.side;
        if(laneBySpeaker[speaker]&&laneBySpeaker[speaker]!==side) stable=false;
        laneBySpeaker[speaker]=side;
      });
      out.trioDialogue=Object.keys(laneBySpeaker).length>=3&&stable&&
        Object.values(laneBySpeaker).includes('left')&&Object.values(laneBySpeaker).includes('right');
      document.querySelector('#ev-wrap').classList.remove('on');
      const actionSnapshot=structuredClone(S);
      const minjiAction=D.events.find(e=>e.id==='rq_minji_task');
      const minjiArcText=JSON.stringify(['meet_scrapyard','rq_minji_task','rq_minji_follow','rq_minji_join']
        .map(id=>D.events.find(e=>e.id===id)));
      out.minjiDialogueNatural=
        !minjiArcText.includes('이제 대답하러 갈 거야') &&
        !minjiArcText.includes('이제 출발해도 돼요') &&
        minjiArcText.includes('소매 끝으로 눈가를 한 번 훔쳤다') &&
        minjiArcText.includes('네 자리부터 만들자고');
      UI.showEvent(minjiAction);
      const actionKeys=[];
      while(document.querySelector('#ev-sheet .story-next')){
        actionKeys.push(document.querySelector('.event-scene-frame').dataset.sceneKey);
        document.querySelector('#ev-sheet .story-next').click();
      }
      actionKeys.push(document.querySelector('.event-scene-frame').dataset.sceneKey);
      UI.finishStory();
      document.querySelector('#ev-sheet [data-i="2"]').click();
      const signalAt=actionKeys.indexOf('recruit-minji-task-signal');
      out.actionCutRuntime=actionKeys[0]==='recruit-minji-task' &&
        signalAt>0 &&
        actionKeys.slice(signalAt).every(key=>key==='recruit-minji-task-signal') &&
        document.querySelector('.event-scene-frame').dataset.sceneKey==='recruit-minji-task-collapse';
      document.querySelector('#ev-wrap').classList.remove('on');
      S=actionSnapshot; rng=mulberry32(S.seed+(S.stats.events*7919)); UI.renderAll();
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
      const recruit0=S.recruitQ;
      S.recruitQ={id:'minji',stage:'task',target:'ulsan'};
      UI.renderAll();
      out.missionSecondary=document.querySelector('#mission-strip').classList.contains('has-secondary') &&
        document.querySelector('#mission-strip').textContent.includes('함께 진행 중') &&
        document.querySelector('#mission-strip').textContent.includes('대전') &&
        document.querySelector('#mission-strip').textContent.includes('본편') &&
        document.querySelector('#mission-strip').textContent.includes('남산 조치');
      S.recruitQ=recruit0; UI.renderAll();
      S.min=12*60;
      const walkParty0=[...S.party];
      S.party=['minji'];
      UI.showStl('miryang');
      out.settlementWalkParty=document.querySelectorAll('.stl-walker-face').length===2 &&
        document.querySelector('.stl-focus-copy').textContent.includes('민지와');
      UI.showStl('miryang','alley');
      const fieldSpots=[...document.querySelectorAll('.stl-field-switcher [data-fieldspot]')];
      out.settlementFieldMap=fieldSpots.length===3 &&
        document.querySelectorAll('.stl-field-map-face').length===2 &&
        document.querySelector('.stl-field-map').textContent.includes('현장 동선') &&
        !document.querySelector('.stl-field-map').textContent.includes('천막 뒤 번호표');
      fieldSpots[1].click();
      out.settlementFieldMove=fieldSpots[1].getAttribute('aria-pressed')==='true' &&
        document.querySelector('[data-fieldcard="'+fieldSpots[1].dataset.fieldspot+'"]').classList.contains('focused');
      document.querySelector('#stl-hub-back').click();
      document.querySelector('[data-stlfocus="garage"]').click();
      out.settlementWalkMove=document.querySelector('.stl-hub').dataset.focus==='garage' &&
        document.querySelector('[data-stlfocus="garage"]').getAttribute('aria-pressed')==='true' &&
        document.querySelector('.stl-route').classList.contains('garage');
      document.querySelector('#stl-enter').click();
      out.settlementSceneLarge=document.querySelector('.stl-section-hero').getBoundingClientRect().height>=190 &&
        document.querySelectorAll('.stl-section-face').length===2 &&
        document.querySelector('.stl-section-party').textContent.includes('민지와');
      const settlementSnapshot=structuredClone(S);
      S.at='miryang'; S.driving=null; S.party=['minji']; S.scrap=100;
      S._stlField={daily:{},once:{},impact:{},log:[]};
      const firstChange=G.doStlFieldAction('miryang','parts');
      const secondChange=G.doStlFieldAction('miryang','pump');
      const impact=G.stlImpact('miryang');
      UI.showStl('miryang','hub');
      out.settlementImpactState=firstChange.firstImpact&&secondChange.firstImpact&&
        impact.count===2&&impact.stage===2&&impact.discount===.9&&
        S.npcs.sundeok.att>=8;
      out.settlementImpactVisual=document.querySelector('.stl-hub').dataset.impactStage==='2'&&
        document.querySelectorAll('.stl-impact-layer.stage-2').length===1&&
        document.querySelector('.stl-place-impact').textContent.includes('우리 손길 2/4');
      UI.showStl('miryang','alley');
      out.settlementImpactBeforeAfter=document.querySelectorAll('.stl-field-action.changed').length===2&&
        document.querySelector('[data-fieldcard="pump"]')?.textContent.includes('오늘은 이미 들렀다')&&
        document.querySelector('.stl-field-intro').textContent.includes('현장 변화 2/4');
      UI.showStl('miryang','market');
      out.settlementImpactTrade=document.querySelector('.trade-local-trust')?.textContent.includes('10% 덜 받는다');
      S.at='muju'; S.water=5; S.food=0;
      S._stlField.impact['muju:candle_round']={day:S.day,min:S.min};
      S._stlField.impact['muju:vent_fan']={day:S.day,min:S.min};
      UI.showStl('muju','market');
      const trustedBarter=document.querySelector('[data-t="0"]');
      trustedBarter?.click();
      out.settlementBarterTrust=document.querySelector('.trade-local-trust')?.textContent.includes('한 단계 후하게')&&
        document.querySelector('#trade')?.textContent.includes('물 1통 ⇄ 식량 1')&&S.water===4&&S.food===1;
      S=settlementSnapshot; rng=mulberry32(S.seed+(S.stats.events*7919));
      S.party=walkParty0;
      UI.showStl('daegu');
      out.settlementHub=document.querySelectorAll('[data-stlfocus]').length===4 &&
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
      const upgradeParty=[...S.party]; S.party=['minji'];
      S.scrap=999; S.items['부품']=99; delete S.up.tank1;
      UI.showStl('daegu','garage');
      document.querySelector('[data-up="tank1"]').click();
      out.upgradeCeremony=!!document.querySelector('.upgrade-install') &&
        !!document.querySelector('#up-before-van') && !!document.querySelector('#up-after-van') &&
        document.querySelector('.upgrade-change').textContent.includes('연료 용량');
      out.upgradeAdviser=document.querySelector('.upgrade-adviser')?.textContent.includes('민지') &&
        document.querySelector('.upgrade-adviser')?.textContent.includes('마른 천');
      document.querySelector('#upgrade-step-action').click();
      document.querySelector('#upgrade-step-action').click();
      document.querySelector('#upgrade-step-action').click();
      out.upgradeInteractive=document.querySelector('.upgrade-install').classList.contains('ready') &&
        document.querySelectorAll('.upgrade-phases .active').length===3;
      document.querySelector('#upgrade-install-done').click();
      delete S.up.tank1; S.scrap=oldScrap; S.items['부품']=oldParts; S.fuelMax=oldFuelMax; S.party=upgradeParty;
      document.querySelector('#ovl-stl').classList.remove('on');
      document.querySelector('#dk-status').click();
      out.statusModalAria=document.querySelector('#ovl-status').getAttribute('aria-hidden')==='false' &&
        document.querySelector('#ovl-status').getAttribute('role')==='dialog';
      const root=document.documentElement;
      const textStart=root.classList.contains('ui-large-text');
      document.querySelector('[data-ui-pref="text"]').click();
      const textChanged=root.classList.contains('ui-large-text')!==textStart &&
        document.querySelector('[data-ui-pref="text"]').getAttribute('aria-pressed')===String(!textStart);
      document.querySelector('[data-ui-pref="text"]').click();
      const motionStart=root.classList.contains('ui-reduce-motion');
      document.querySelector('[data-ui-pref="motion"]').click();
      const motionChanged=root.classList.contains('ui-reduce-motion')!==motionStart &&
        document.querySelector('[data-ui-pref="motion"]').getAttribute('aria-pressed')===String(!motionStart);
      document.querySelector('[data-ui-pref="motion"]').click();
      out.uiPrefs=textChanged&&motionChanged&&root.classList.contains('ui-large-text')===textStart &&
        root.classList.contains('ui-reduce-motion')===motionStart;
      document.querySelector('#st-tabs [data-st="journey"]').click();
      out.statusTabs=document.querySelectorAll('#st-tabs button').length===3 &&
        document.querySelector('[data-stpane="journey"]').classList.contains('on') &&
        document.querySelector('#st-tabs [data-st="journey"]').getAttribute('aria-selected')==='true' &&
        document.querySelector('#st-tabs [data-st="now"]').getAttribute('aria-selected')==='false';
      const knowledgeText=document.querySelector('[data-stpane="journey"]').textContent;
      out.knowledgeUi=knowledgeText.includes('아는 것과 모르는 것') &&
        knowledgeText.includes('제7 잔류구역의 현재 이송') && knowledgeText.includes('소문은 사실처럼 말하지 않는다');
      out.departureBrief=knowledgeText.includes('왜 지금 서울로 가는가') &&
        knowledgeText.includes('남산 조치까지') && knowledgeText.includes('분리 절차') &&
        knowledgeText.includes('자기 이유');
      document.querySelector('#st-x').click();
      G.openEventById('roadbeat_200_archive');
      out.eventModalAria=document.querySelector('#ev-wrap').getAttribute('aria-hidden')==='false' &&
        document.querySelector('#ev-wrap').getAttribute('aria-modal')==='true';
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
      const seoulFirst=document.querySelector('.event-scene-frame').dataset.sceneKey;
      UI.finishStory();
      out.seoulSceneArc=seoulFirst==='seoul-core' &&
        document.querySelector('.event-scene-frame').dataset.sceneKey==='seoul-testimony' &&
        !!D.scenes['seoul-liberation'];
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
      const systemSnapshot=structuredClone(S);
      S.at='gimcheon'; S.driving=null; S.routePlan=null;
      const ridgeForecast=G.routeForecast('ridge'), marketForecast=G.routeForecast('market');
      UI.showEvent(D.events.find(e=>e.id==='route_mid_fork')); UI.finishStory();
      const routeChoiceText=document.querySelector('.event-choice-dock').textContent;
      out.routeForecast=ridgeForecast.km===130&&marketForecast.km===219&&
        ridgeForecast.fuel<marketForecast.fuel&&routeChoiceText.includes('순수 주행')&&
        routeChoiceText.includes('보급 거점');
      document.querySelector('#ev-wrap').classList.remove('on');
      G.chooseRoute('ridge');
      const ridgeGo=G.canTravelTo('sangju'), marketBlocked=G.canTravelTo('muju');
      out.routeChoice=G.routeStatus()?.def.id==='ridge'&&ridgeGo.ok&&!marketBlocked.ok&&
        marketBlocked.why.includes('청주')&&S._storyQueue.includes('route_ridge_rescue');
      const routeIds=['route_ridge_rescue','route_ridge_anchor','route_ridge_extract',
        'route_market_convoy','route_market_mask','route_market_pass'];
      out.nonlethalMissions=routeIds.every(id=>{
        const ev=D.events.find(e=>e.id===id);
        return ev&&ev.combat&&['구조','호송'].includes(ev.type)&&
          D.scenes[D.eventScenes[id]].startsWith('data:image/jpeg;base64,');
      })&&['route_ridge_extract','route_market_pass'].every(id=>
        D.events.find(e=>e.id===id).choices.every(c=>c.combatRoll!==undefined&&
          c.out.every(o=>o.fx.combatEnd&&['success','partial','failure'].includes(o.fx.combatResult))&&
          c.out.some(o=>o.fx.combatResult==='failure')));
      S.stats.nonlethal=0;
      G.applyFx({combatStart:{id:'test_rescue',kind:'구조',threat:'테스트 비탈',objective:'사람을 꺼낸다'}});
      G.applyFx({combatEnd:1,combatResult:'success'});
      out.nonlethalLedger=S.stats.nonlethal===1&&S.notes.some(n=>n.title.includes('구조 기록'));
      S.at='miryang'; S.routePlan=null; S._impactEcho=null;
      S._stlField={daily:{},once:{},impact:{'miryang:pump':{day:S.day,min:S.min}},roadEchoed:{},
        log:[{stl:'miryang',id:'pump',day:S.day,min:S.min}]};
      const echoDrive={wx:'rain',dist:34,slots:[]};
      const settlementEcho=G.prepareSettlementRoadEcho(echoDrive,'miryang','yangsan');
      const echoResult=G.resolveImpactEcho('relay');
      out.settlementRoadEcho=!!settlementEcho&&echoDrive.slots.some(slot=>slot.special==='impact')&&
        !!S._stlField.roadEchoed['miryang:pump']&&echoResult.fx.time===15&&
        D.scenes['settlement-road-echo'].startsWith('data:image/jpeg;base64,');
      S=systemSnapshot; rng=mulberry32(S.seed+(S.stats.events*7919));
      return out;
    }''')
    check('업그레이드 28종', r4['upCount'] == 28, str(r4['upCount']))
    check('플레이 이벤트 890종 이상', r4['eventCount'] >= 890, str(r4['eventCount']))
    check('사건 감독: 최근 반복·종류 연속 차단', r4['directorCooldown'] and
          r4['directorVariety'], str(r4))
    check('사건 감독: 무거운 장면 뒤 숨 고르기·맥락 우선', r4['directorBreather'] and
          r4['directorContext'], str(r4))
    check('사건 감독: 상승→절정→하강→휴식 전환', r4['directorArc'], str(r4))
    check('핵심 지식: 소문·확인 단계와 플래그 마이그레이션', r4['knowledgeState'], str(r4))
    check('선택 기억: 거리 뒤 한 번만 후속 대화', r4['choiceMemory'], str(r4))
    check('동료 관계: 같은 대화 중복 적립 방지', r4['crewRelation'], str(r4))
    check('동료 능동 사건 6종·낮은 사기에서 맡김 거절',
          r4['initiatives'] == 6 and r4['companionRefusal'], str(r4))
    check('세대의 흔적 9종·보장 본편 6장면', r4['traceDefs'] == 9 and r4['journeyBeats'] == 6, str(r4))
    check('세계 질감 조우도 같은 레일로 보장된다', r4['worldBeats'] >= 5, str(r4['worldBeats']))
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
    check('시네마틱 이미지 115종·빌드 주입', r4['sceneCount'] == 115 and r4['sceneDataReady'], str(r4))
    check('김천 노선 선택·청주까지 경로 잠금', r4['routeChoice'], str(r4))
    check('김천 두 노선에 실제 거리·시간·연료·보급 전망 표시', r4['routeForecast'], str(r4))
    check('비살상 구조·호송 3단계 임무와 장부 기록',
          r4['nonlethalMissions'] and r4['nonlethalLedger'], str(r4))
    check('정착지 행동이 다음 도로 사건으로 한 번 이어짐', r4['settlementRoadEcho'], str(r4))
    check('행동 단위 신규 컷 16장·선택 스포일러 분리',
          r4['actionCutCount'] == 16 and r4['actionCutMaps'], str(r4))
    check('민지 사건 상황→손 신호→붕괴 결과 컷 실제 전환',
          r4['actionCutRuntime'], str(r4))
    check('민지 첫 합류 대사가 선언 대신 행동·망설임·선택으로 연결',
          r4['minjiDialogueNatural'], str(r4))
    check('동료 6명 첫 부탁·임시 동행·두 번째 사건·합류 장면', r4['recruitDefs'] == 6 and r4['recruitEvents'], str(r4))
    check('지역 고유 주행 풍경 30곳 이상', r4['localScenery'] >= 30, str(r4['localScenery']))
    check('그림책 도입 17장·고유 컷 연결', r4['introBook'] and r4['introPremise'], str(r4))
    check('인트로 전 장면 화자 턴·가족 초상 연결',
          r4['introTurns'] and r4['introPortraits'], str(r4))
    check('부모 핵심 기록은 엄마 음성·아빠 글씨로 식별', r4['familySpeakers'], str(r4))
    check('전 이벤트 턴 변환·알려진 화자 식별',
          r4['turnParser'] and r4['knownSpeaker'], str(r4))
    check('이야기를 다 읽기 전 선택지 잠금',
          r4['choiceLockedUntilRead'] and r4['choiceUnlocked'], str(r4))
    check('이벤트 화면이 상단 16px 안에서 시작', r4['eventTop'] <= 16, str(r4['eventTop']))
    check('같은 장면은 대사마다 깜빡이거나 구도를 바꾸지 않음',
          r4['turnSceneStable'], str(r4))
    check('세 명 대화도 화자별 좌우 레인 유지', r4['trioDialogue'], str(r4))
    check('첫 이송부터 143년 미스터리 유지', r4['introMystery'], str(r4))
    check('인트로 행동·원인 대사가 구체적으로 이어짐', r4['introCausalDialogue'], str(r4))
    check('한 가족 도움→이의 제기 실패→유품·대가→시한 선언으로 출발', r4['introImmediateMotive'], str(r4))
    check('이송표 내용·강제력·사본을 가져가는 이유 설명', r4['transferPaperMeaning'], str(r4))
    check('할아버지 수첩은 구체적이고 안전한 정비 조언', r4['grandfatherNotes'], str(r4))
    check('달구지 생활차 개조·확장 설정', r4['introHome'], str(r4))
    check('지도 노드 58곳 WGS84 좌표 완비', r4['geoCount'] == 58 and r4['geoReady'], str(r4))
    check('실제 남북·동서 위치관계 반영', r4['geoOrder'], str(r4))
    check('도시 9곳·고유 사건 36개 이상 연결', r4['nodeSceneCount'] == 9 and r4['eventSceneCount'] >= 36, str(r4))
    check('업그레이드 작업대 이미지 7종', r4['upgradeArtCount'] == 7 and r4['upgradeArtReady'], str(r4))
    check('업그레이드 7분류가 28종을 중복 없이 포함', r4['upgradeGroups'] == 7 and r4['upgradeCoverage'], str(r4))
    check('현재 의뢰가 메인·지도에 계속 표시', r4['missionVisible'] and r4['mapMission'], str(r4))
    check('동료 과제 중에도 일반 의뢰와 마감이 보임', r4['missionSecondary'], str(r4))
    check('정착지 4개 공간 허브와 실제 달구지 표시', r4['settlementHub'] and r4['garageVan'], str(r4))
    check('모든 정착지에 소모·발견·숨은 현장 행동', r4['settlementFields'], str(r4))
    check('정착지에서 현재 동료와 장소 사이를 이동', r4['settlementWalkParty'] and r4['settlementWalkMove'], str(r4))
    check('현장 동선·동행 마커·숨은 장소 비공개', r4['settlementFieldMap'] and r4['settlementFieldMove'], str(r4))
    check('정착지 내부 장면 확대·동행 상태 유지', r4['settlementSceneLarge'], str(r4))
    check('정착지 행동이 날짜를 넘어 영구 변화로 저장', r4['settlementImpactState'], str(r4))
    check('정착지 전후 풍경·현장 변화가 모바일 화면에 표시',
          r4['settlementImpactVisual'] and r4['settlementImpactBeforeAfter'], str(r4))
    check('두 현장을 거들면 주민 신뢰·품앗이 가격·교환 반영',
          r4['settlementImpactTrade'] and r4['settlementBarterTrust'], str(r4))
    check('장소별 기능 분리', r4['sectionIsolation'], str(r4))
    check('정비소 분류·실제 부품 이미지·카드 표시', r4['garageGroups'] == 7 and r4['garageArt'] and r4['garageCards'] > 0, str(r4))
    check('업그레이드 전후 차체 작업 장면·3단계 직접 조작',
          r4['upgradeCeremony'] and r4['upgradeInteractive'], str(r4))
    check('업그레이드 분야별 작업·동료 전문가 참여', r4['upgradeAdviser'], str(r4))
    check('상태창 탭 전환·ARIA 선택 상태', r4['statusTabs'] and r4['statusModalAria'], str(r4))
    check('기기별 큰 글자·움직임 줄임 설정', r4['uiPrefs'], str(r4))
    check('상태창에서 확인된 사실·남은 질문 분리', r4['knowledgeUi'], str(r4))
    check('상태창에서 지금 떠나는 이유·동료 합류 원칙 상시 확인', r4['departureBrief'], str(r4))
    check('사건 모달 ARIA 상태', r4['eventModalAria'], str(r4))
    check('연쇄 사건에 앞 이야기 표시', r4['storyContext'], str(r4))
    check('긴 사건 본문·7개 선택지 독립 스크롤', r4['eventScroll'] and
          r4['choiceScroll'] and r4['choiceDock'], str(r4))
    check('서울 코어 증언→해방 장면 분리', r4['seoulSceneArc'], str(r4))
    pg.click('#dk-status')
    pg.wait_for_timeout(120)
    focus_open = pg.evaluate("document.activeElement && document.activeElement.id")
    pg.keyboard.press('Escape')
    pg.wait_for_timeout(120)
    focus_close = pg.evaluate("document.activeElement && document.activeElement.id")
    check('모달 포커스 진입·Escape 닫기·원위치 복귀',
          focus_open == 'st-x' and focus_close == 'dk-status',
          f'open={focus_open}, close={focus_close}')
    rcombat = pg.evaluate('''() => {
      const out={}, oldCombat=S.combat, oldInjuries=structuredClone(S.injuries||{}),
        oldNotes=structuredClone(S.notes||[]), oldParty=[...S.party];
      const chains=[
        ['patrol_walker','combat_walker_read','combat_walker_strike'],
        ['patrol_swarm','combat_swarm_read','combat_swarm_break'],
        ['patrol_toll','combat_toll_read','combat_toll_breach']
      ];
      const combatEvents=D.events.filter(e=>e.combat);
      out.intentData=combatEvents.length===15&&combatEvents.every(e=>
        e.combat.intent&&e.combat.counters&&Object.keys(e.combat.counters).length>=2);
      out.threePhase=chains.every(ids=>ids.every((id,i)=>{
        const e=D.events.find(x=>x.id===id);
        return e&&e.combat&&e.combat.phase===i+1&&e.combat.total===3&&D.scenes[e.scene];
      }));
      UI.showEvent(D.events.find(e=>e.id==='patrol_walker')); UI.finishStory();
      out.hud=!!document.querySelector('.combat-hud') &&
        document.querySelector('.combat-hud').textContent.includes('정찰') &&
        document.querySelector('.combat-hud').textContent.includes('폐차 행렬') &&
        document.querySelector('.combat-hud').textContent.includes('다음 움직임') &&
        document.querySelector('.combat-hud').textContent.includes('실패하면') &&
        document.querySelector('.event-choice-dock').textContent.includes('엄폐') &&
        document.querySelector('.event-choice-dock').textContent.includes('의도 대응');
      document.querySelector('#ev-sheet [data-i="0"]').click();
      out.choiceFeedback=!!document.querySelector('.combat-last.result') &&
        document.querySelector('.combat-last.result').textContent.includes('엄폐') &&
        S.combat&&S.combat.history&&S.combat.history[0].tactic==='엄폐' &&
        S.combat.terrain.includes('폐차 행렬')&&S.combat.pressure===0;
      UI.finishStory();
      out.chainLabel=document.querySelector('#ev-sheet [data-r="ok"]')?.textContent.includes('다음 단계');
      document.querySelector('#ev-wrap').classList.remove('on');
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_read')); UI.finishStory();
      document.querySelector('#ev-sheet [data-i="0"]').click(); UI.finishStory();
      /* 2단계는 더 이상 확정 성공이 아니다(자동 성공 제거). 어느 분기가 나오든
         '틈을 읽었다는 사실이 저장되고 3단계에 전달되는가'가 검사 대상이다. */
      out.readStored=!!(S.combat&&S.combat.read&&Array.isArray(S.combat.read.tactics)&&
        S.combat.read.tactics.length&&S.combat.read.label)&&
        document.querySelector('.combat-read')?.textContent.includes('읽어낸 틈');
      document.querySelector('#ev-wrap').classList.remove('on');
      const strike=D.events.find(e=>e.id==='combat_walker_strike');
      const strikeChoice=strike.choices[0];
      /* 판정이 갈리므로 앞 단계 결과에 기대지 않고, 3단계에 유리한 틈을 명시적으로 세워
         '읽은 틈이 최종 판정에 반영되는가'만 격리해서 잰다.
         화면 렌더보다 먼저 세워야 선택 카드에도 반영된다. */
      S.combat.read={label:'세 번째 걸음 뒤 몸통이 처지는 순간',tactics:[strikeChoice.tactic]};
      UI.showEvent(strike); UI.finishStory();
      const savedRead=S.combat.read;
      const prepared=G.combatOdds(strikeChoice,strike);
      S.combat.read=null;
      const unprepared=G.combatOdds(strikeChoice,strike);
      S.combat.read=savedRead;
      out.readBonus=prepared-unprepared>=.04&&prepared<=.95&&
        G.combatReadNote(strikeChoice)==='읽어낸 틈 활용'&&
        document.querySelector('.event-choice-dock').textContent.includes('읽어낸 틈 활용');
      document.querySelector('#ev-wrap').classList.remove('on');
      S.injuries={}; S.combat=null;
      G.applyFx({combatStart:{id:'test',threat:'test',terrain:'테스트 지형',objective:'테스트 목표',stakes:'테스트 실패',pressure:0},combatEdge:2});
      out.edge=S.combat&&S.combat.edge===2&&G.combatGrade({combatRoll:.5})==='우세';
      G.applyFx({injury:{who:'driver',label:'테스트 타박',days:2}});
      out.injury=G.isInjured('driver')&&S.injuries.driver.days===2;
      S.combat.history=[
        {phase:1,step:'정찰',tactic:'엄폐',label:'차체 뒤에서 각도를 읽었다'},
        {phase:2,step:'대응',tactic:'해킹',label:'센서 연결을 끊었다'}
      ];
      const same={combatRoll:.55,tactic:'해킹'}, switched={combatRoll:.55,tactic:'기동'};
      out.tacticAdapt=G.combatOdds(same)<G.combatOdds(switched) &&
        G.combatTacticNote(same)==='같은 수를 읽힘' && G.combatTacticNote(switched)==='전술 전환';
      S.combat.history=[]; S.combat.pressure=0;
      const openOdds=G.combatOdds({combatRoll:.5,tactic:'기동'});
      S.combat.pressure=2;
      const rushedOdds=G.combatOdds({combatRoll:.5,tactic:'기동'});
      const terrainOdds=G.combatOdds({combatRoll:.5,tactic:'기동',terrainFit:2});
      out.combatContext=rushedOdds<openOdds&&terrainOdds>rushedOdds &&
        G.combatContextNote({terrainFit:2,noise:2}).includes('지형 정답') &&
        G.combatContextNote({terrainFit:2,noise:2}).includes('경보 노출 큼');
      S.combat.history=[
        {phase:1,step:'정찰',tactic:'엄폐',label:'차체 뒤에서 각도를 읽었다'},
        {phase:2,step:'대응',tactic:'해킹',label:'센서 연결을 끊었다'}
      ];
      S.party=['minji']; const moodBefore=S.comps.minji.mood;
      G.applyFx({healInjury:'latest',combatEnd:1});
      out.recovered=!G.isInjured('driver')&&S.combat===null;
      out.combatReport=S.lastCombatReport?.result==='종료'&&
        S.lastCombatReport.tactics.join(',')==='엄폐,해킹'&&S.lastCombatReport.history.length===2;
      out.combatJournal=S.notes.at(-1)?.title==='교전 기록: test' &&
        S.notes.at(-1)?.body.includes('정찰 — 엄폐') && S.notes.at(-1)?.body.includes('지형: 테스트 지형') &&
        S.comps.minji.mood===Math.min(100,moodBefore+1);
      const oldFire=S.items['화염병']||0;
      S.items['화염병']=1; out.twoItemBlocked=!G.reqOk({item:'화염병',itemQty:2}).ok;
      S.items['화염병']=2; out.twoItemReady=G.reqOk({item:'화염병',itemQty:2}).ok;
      S.items['화염병']=oldFire;
      out.sound=typeof SND.combat==='function';
      S.combat=oldCombat; S.injuries=oldInjuries; S.notes=oldNotes; S.party=oldParty; G.save();
      return out;
    }''')
    check('초계·드론·검문소 3단계 교전', rcombat['threePhase'], str(rcombat))
    check('교전 HUD·전술 표식·직전 선택 기억',
          rcombat['hud'] and rcombat['choiceFeedback'] and rcombat['chainLabel'], str(rcombat))
    check('15개 전투·구조·호송 단계에 다음 움직임과 대응법 표시', rcombat['intentData'], str(rcombat))
    check('앞 단계에서 읽은 틈이 마지막 판정에 실제 반영',
          rcombat['readStored'] and rcombat['readBonus'], str(rcombat))
    check('전세·부상·회복 상태 반영', rcombat['edge'] and rcombat['injury'] and rcombat['recovered'], str(rcombat))
    check('같은 전술 반복 불리·전술 전환 유리', rcombat['tacticAdapt'], str(rcombat))
    check('지형 활용·시간 압박이 실제 성공률에 반영', rcombat['combatContext'], str(rcombat))
    check('교전 전술을 일지에 남기고 조합 보상', rcombat['combatJournal'], str(rcombat))
    check('교전 종료 뒤 전술 흐름·결과·손실 결산 저장', rcombat['combatReport'], str(rcombat))
    check('전투 소모품은 실제 필요 수량까지 검사', rcombat['twoItemBlocked'] and rcombat['twoItemReady'], str(rcombat))
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
      cleanMode:MAPR&&MAPR.mode,
      title:document.querySelector('#map-title')?.textContent,
      context:Object.keys(D.nodeScenery||{}).length
    })''')
    check('실축 모드 제거·대한민국 여정 지도 단일화', map_detail['modes'] == 0 and
          '대한민국 주요 도시' in map_detail['canvas'] and '대한민국' in map_detail['title'], str(map_detail))
    check('강·산맥 장식 없는 도시 중심 지도', map_detail['cleanMode'] == 'cities-only' and
          map_detail['context'] >= 30, str(map_detail))
    map_source = (ROOT / 'src' / '06-mapgraph.js').read_text(encoding='utf-8')
    check('강 이름·보조 도로·지역명 레이어 제거', not any(token in map_source for token in
          ('RIVERS', 'SECONDARY_ROUTES', 'REGION_LABELS', "nm:'한강'", "nm:'낙동강'")))
    pg.screenshot(path=str(SHOT / 'map-illustrated-detailed.png'))
    pg.click('#map-x')
    check('모든 이벤트가 전용·지역·타입 컷 보유', r4['allEventsIllustrated'] and r4['genericScene'], str(r4))
    check('미충족 동료 선택 숨김·자원 조건 유지·합류 후 해금',
          r4['secretChoiceHidden'] and r4['resourceChoiceVisible'] and r4['secretChoiceRevealed'], str(r4))
    check('동료 탭은 미합류 이름을 공개하지 않음', r4['crewNoSpoilers'], str(r4))
    check('회상 이벤트 시네마틱 표시', r4['eventScene'], str(r4))
    check('장면 탭 확대·복귀', r4['sceneZoom'] and r4['sceneUnzoom'], str(r4))
    # 9.0 arrival recap keeps the city image on screen long enough to read the
    # route-contract and resource ledger before the next authored event opens.
    check('도시 도착 시네마틱 표시', r4['arrivalScene'] and r4['arrivalDelay'] == 4500, str(r4))
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
      // 관계 요구(D.seoulPillars.관계)보다 한 명 모자라면 관계 기둥이 잠긴다
      const allIds=['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
      S.party = allIds.slice(0, D.seoulPillars.관계 - 1);
      ['resist_revealed','cell_road','cell_sea','cell_dome',
       'massacre_known','parent_key_found','es_truth','uplink_seen',
       'postman_letter','gp_envelope_found'].forEach(f => S.flags[f] = true);
      out.partialReady = G.seoulReady();
      out.missPillar = G.seoulMissing().pillar;   // '관계'
      // 요구 인원을 채우면 열림
      S.party = allIds.slice(0, D.seoulPillars.관계);
      out.fourReady = G.seoulReady();
      // 전원 완주는 별도 보상 판정
      S.party = allIds.slice();
      out.fullReady = G.seoulReady();
      out.fullCrew = G.fullCrewStories();
      // 진실 플래그를 요구 미만으로 지우면 진실 기둥이 잠긴다 (요구는 D.seoulPillars.진실)
      const truthFlags=['massacre_known','parent_key_found','es_truth','uplink_seen'];
      const removed=truthFlags.slice(D.seoulPillars.진실 - 1);
      removed.forEach(f=>delete S.flags[f]);
      out.truthLocked = !G.seoulReady() && G.seoulMissing().pillar === '진실';
      removed.forEach(f=>S.flags[f]=true);
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
      /* 본편 장면은 거리 순서를 지켜야 한다. 같은 레일에 세계 질감 조우가 함께
         실리므로, 본편만 골라 순서를 본다(대기열에는 둘 다 들어간다). */
      S.used = []; S._storyQueue = []; S._beatQueue = []; S.stats.km = 150;
      const storyOnly = () => {
        G.scheduleJourneyBeat();
        const q = (S._beatQueue||[]).filter(id =>
          (D.journeyBeats||[]).some(b => b.id === id && b.kind !== 'world'));
        return q[0] || null;
      };
      out.beat1 = storyOnly();
      S.used.push('story_generation_form'); S._beatQueue = [];
      out.beat2 = storyOnly();
      S.used.push('story_family_principle'); S._beatQueue = [];
      out.beat3 = storyOnly();
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
    check('관계 요구 미만이면 관계 기둥 잠김', not r7['partialReady'] and r7['missPillar'] == '관계', str(r7))
    check('관계 요구 충족+기둥→서울 열림', r7['fourReady'])
    check('6명 전원 완주는 별도 보상', r7['fullReady'] and r7['fullCrew'])
    check('세대 흔적 5개 코어 증언·실제 조합 반영', r7['traceChoice'] and r7['traceUnlocked'] and r7['traceNarrative'], str(r7))
    check('주행거리 본편 장면 순서 보장', r7['beat1'] == 'story_generation_form' and
          r7['beat2'] == 'story_family_principle' and r7['beat3'] == 'story_generation_speech', str(r7))
    check('진실 요구 미만이면 진실 기둥 잠김', r7['truthLocked'], str(r7))
    check('영입 시 다음 동료 자동 안내 없음', not r7['refer'], str(r7))

    # 최종 엔딩: 코어 고백 → 실제 집행 선택 → 완결 에필로그
    r8 = pg.evaluate('''() => { const out = {};
      const core = D.seoulStops.find(e => e.id === 'seoul_core');
      const coreText = typeof core.text === 'function'
        ? core.text({day:12, flags:{}, party:[]}) : core.text;
      const lateCoreText = typeof core.text === 'function'
        ? core.text({day:D.transferDeadlineDay+1, flags:{}, party:[]}) : core.text;
      const coreTurns = UI.storyTurns(coreText, core, {turnSpeakers:core.turnSpeakers});
      const testimony = core.choices[2].out[0];
      const testimonyTurns = UI.storyTurns(testimony.text, core, {turnSpeakers:testimony.turnSpeakers});
      out.coreDialogue = coreTurns.filter(t=>t.kind==='dialogue'&&t.who==='me').length === 13 &&
        coreTurns.filter(t=>t.kind==='ai'&&t.who==='cheollian').length >= 10 &&
        !coreTurns.some(t=>t.name==='???') &&
        testimonyTurns.some(t=>t.kind==='dialogue'&&t.who==='minji') &&
        testimonyTurns.some(t=>t.kind==='dialogue'&&t.who==='eunsu');
      // 코어 증언 → 대가 목격(seoul_costs) → 처분(seoul_decision)으로 한 박자가 늘었다
      out.coreToDecision = core.choices.every(c => c.out.every(o => o.fx && o.fx.chain === 'seoul_costs')) &&
        D.events.find(e => e.id === 'seoul_costs').choices.every(c => c.out.every(o => o.fx.chain === 'seoul_decision'));
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
      out.rootMystery = coreText.includes('최초 위험 조건은 외부에서 배부') &&
        coreText.includes('목적, 발신자, 승인자는 제 지역 기록에 없습니다') &&
        coreText.includes('부모님의 검증키') &&
        coreText.includes('등록 6,412명');
      // 시한 값은 데이터에서 파생한다 — 상수를 복제하면 밸런스 튜닝 때마다 여기서 깨진다
      const due=D.transferDeadlineDay;
      const day1=D.transferStatus({day:1}), dayDue=D.transferStatus({day:due}), dayLate=D.transferStatus({day:due+1});
      out.deadlineAdaptive = day1.remaining===due && dayDue.remaining===1 && dayDue.onTime && !dayLate.onTime &&
        day1.mission.includes(`남산 조치까지 ${due}일`) &&
        lateCoreText.includes('첫 이송 발생 · 1일 경과') &&
        // 지각은 사람 수로 청구된다 (하루 = 버스 12대 · 540명)
        dayLate.departed===540 && dayLate.remainingResidents===D.residentCount-540 &&
        ep.text({day:due+1,flags:{core_transfer:true},party:[]}).includes('이송은 1일 전에 시작됐다') &&
        ep.text({day:due+1,flags:{core_transfer:true},party:[]}).includes('540명');
      const render = (v, flags={}) => typeof v === 'function' ? v({flags, party:[]}) : v;
      const costs = decision.choices.map(c => render(c.out[0].text, {}));
      out.distinctCosts = costs[0].includes('첫 회의 채널이 열렸다') &&
        costs[1].includes('원본 기록 검색창도 코어와 함께 꺼져 있었다') &&
        costs[2].includes('근무표 첫 줄에는 이름 세 칸');
      out.gateSeparate = D.gateEvent.text({flags:{seoulTries:0}}).includes('추방 명령이 아닙니다') &&
        coreText.includes('인계 규약을 만들었습니다');
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
    check('서울 코어는 주인공 질문·천리안 답변·동료 증언으로 분리', r8['coreDialogue'], str(r8))
    check('제7 구역 저지·143년 최초 목적 분리', r8['rootMystery'])
    check('시한 전후 이송 상태가 실제 날짜·인원을 반영', r8['deadlineAdaptive'])
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
      /* 처분에는 요구 조건이 있다(W5) — 준비된 일행으로 최종막을 연다.
         빈 상태면 셋 다 잠겨 누를 선택지가 없다(그 자체가 의도된 동작). */
      S.party = ['minji','parkss','kangwoo','eunsu'];
      for(const id of S.party) S.comps[id] = {mood:80,bond:20,lvl:3,perks:[]};
      S.injuries = {};
      for(const cell of (D.resistance||[])) S.flags[cell.flag] = true;
      S.used = S.used.filter(id => !['seoul_decision','seoul_night','seoul_costs'].includes(id));
      S._chain = null; S._storyQueue = []; S._beatQueue = [];
      G.openEvent(D.seoulStops.find(e => e.id === 'seoul_core'));
      UI.finishStory();
    }''')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.evaluate('UI.finishStory()')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.wait_for_timeout(600)
    pg.evaluate('UI.finishStory()')
    # 새 박자: 처분 전에 세 개의 값을 먼저 목격한다
    actual_costs = '세 개의 값' in pg.locator('#ev-sheet').inner_text()
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.evaluate('UI.finishStory()')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.wait_for_timeout(600)
    pg.evaluate('UI.finishStory()')
    actual_decision = actual_costs and '마지막 집행권' in pg.locator('#ev-sheet').inner_text()
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.evaluate('UI.finishStory()')
    pg.locator('#ev-wrap .choice:not([disabled])').first.click()
    pg.wait_for_timeout(600)
    pg.evaluate('UI.finishStory()')
    actual_night = '남산의 밤' in pg.locator('#ev-sheet').inner_text()
    check('실제 UI 연쇄: 코어→대가 확인→집행 선택→에필로그', actual_decision and actual_night)
    locked = pg.evaluate('''() => {
      S.party = []; S.flags = {seoul_open:true};
      for(const cell of (D.resistance||[])) delete S.flags[cell.flag];
      const dec = D.events.find(e => e.id === 'seoul_decision');
      return (dec.choices||[]).map(c => !c.req || G.reqOk(c.req).ok !== false);
    }''')
    check('준비 못 하면 처분이 잠긴다', not any(locked), str(locked))
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
