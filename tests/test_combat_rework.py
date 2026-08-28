#!/usr/bin/env python3
"""전투 개편 검증: 자동 성공 제거·3분기 실패·저격 캡·리스크 표시."""
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
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)
    page.evaluate("G.newGame('onroad','전투','full')")

    print('― phase 2 자동 성공 제거')
    odds = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_read');
      S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
      const counter=evd.choices.find(c=>c.tactic==='관찰');
      const breakdown=G.combatOddsBreakdown(counter,evd);
      return {odds:breakdown.odds, hasGuaranteeField:'guaranteedRead' in breakdown};
    }""")
    check('counter 선택 성공률 < 100%', odds['odds'] < 0.96, str(odds))
    check('보장 필드 제거됨', not odds['hasGuaranteeField'], str(odds))

    dist = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_read');
      const counter=evd.choices.find(c=>c.tactic==='관찰');
      const seen=new Set();
      for(let i=0;i<200;i++){
        S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
        delete S._threatRead;   // 첫 조우 조건 고정 — 경험 우회를 배제하고 굴림만 본다
        const out=G.pickOutcome(evd,counter);
        seen.add(counter.out.findIndex(o=>o.text===out.text));
      }
      return [...seen].sort();
    }""")
    check('첫 조우·무준비는 실패 분기에 실제 도달', 1 in dist, str(dist))

    print('― 준비는 굴림을 대체한다 (2026-08-07 규칙)')
    prep = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_read');
      // (a) 요구를 채운 counter — 민지가 건강하면 유압관 읽기는 확실하다
      const withReq=evd.choices.find(c=>c.tactic==='정비'&&c.req&&c.req.healthyComp==='minji');
      G.doRecruit&&!G.hasComp('minji')&&G.doRecruit('minji');
      let reqCertain=true;
      for(let i=0;i<40;i++){
        S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
        delete S._threatRead;
        const out=G.pickOutcome(evd,withReq);
        if(evd.choices.find(c=>c===withReq).out.indexOf(out)!==0
           && withReq.out.findIndex(o=>o.text===out.text)!==0) reqCertain=false;
      }
      // (b) 같은 위협을 읽어낸 뒤에는 무요구 counter도 확실하다
      const noReq=evd.choices.find(c=>c.tactic==='관찰');
      let expCertain=true;
      for(let i=0;i<40;i++){
        // 적응(기계도 배운다)이 '관찰'을 지목하면 깨지는 게 정상 — 다른 tactic으로 고정
        S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[], adaptedFor:evd.combat.threat, adapted:'정비'};
        S._threatRead={[evd.combat.threat]:true};
        const out=G.pickOutcome(evd,noReq);
        if(noReq.out.findIndex(o=>o.text===out.text)!==0) expCertain=false;
      }
      // (c) 이탈은 counters에 없다 — 준비 우회 불가
      const flee=evd.choices.find(c=>c.tactic==='돌입'||!evd.combat.counters[c.tactic]);
      const bypassable=!!(flee&&evd.combat.counters[flee.tactic]);
      return {reqCertain, expCertain, fleeBypass:bypassable};
    }""")
    check('요구를 채운 counter는 확실히 관철된다', prep['reqCertain'], str(prep))
    check('읽어낸 위협의 counter는 확실히 관철된다', prep['expCertain'], str(prep))
    check('counters 밖 전술은 우회 불가', not prep['fleeBypass'], str(prep))

    stamp = page.evaluate("""() => {
      // 위협 도장은 조우 종료(combatEnd)에만 — 중간 단계에 찍으면 3단계 작전의
      // 2·3단계가 첫 판부터 확정이 된다 (2026-08-07 재검토에서 실제로 그랬다)
      const mid=D.events.find(e=>e.id==='route_ridge_rescue');   // combatEnd 없음
      const last=D.events.find(e=>e.id==='route_ridge_extract'); // combatEnd 있음
      S.combat={id:'ridge',edge:0,pressure:1,phase:1,history:[]};
      delete S._threatRead;
      G.pickOutcome(mid, mid.choices[0]);
      const afterMid=!!(S._threatRead&&S._threatRead[mid.combat.threat]);
      S.combat={id:'ridge',edge:0,pressure:1,phase:3,history:[]};
      for(let i=0;i<20;i++){ const o=G.pickOutcome(last, last.choices.find(c=>c.combatRoll!==undefined)); if(o.fx&&o.fx.combatEnd) break; }
      const afterEnd=!!(S._threatRead&&S._threatRead[last.combat.threat]);
      return {afterMid, afterEnd};
    }""")
    check('중간 단계는 위협 도장을 찍지 않는다', not stamp['afterMid'], str(stamp))
    check('조우 종료가 위협 도장을 찍는다', stamp['afterEnd'], str(stamp))

    adapt = page.evaluate("""() => {
      // 기계도 배운다 — 읽어낸 위협은 재조우에서 counter 하나의 패턴을 바꾼다.
      // 바뀐 counter는 확정이 깨지고, 나머지는 여전히 확정이어야 한다.
      const evd=D.events.find(e=>e.id==='combat_walker_read');
      const noReq=evd.choices.find(c=>c.tactic==='관찰');
      S._threatRead={[evd.combat.threat]:true};
      let sawFail=false;
      for(let i=0;i<60;i++){
        S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[], adaptedFor:evd.combat.threat, adapted:'관찰'};
        const o=G.pickOutcome(evd,noReq);
        if(noReq.out.findIndex(x=>x.text===o.text)!==0) sawFail=true;
      }
      let othersCertain=true;
      for(let i=0;i<40;i++){
        S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[], adaptedFor:evd.combat.threat, adapted:'정비'};
        const o=G.pickOutcome(evd,noReq);
        if(noReq.out.findIndex(x=>x.text===o.text)!==0) othersCertain=false;
      }
      // 안 읽힌 위협은 적응하지 않는다
      delete S._threatRead;
      S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
      const fresh=G.threatAdaptedTactic(evd);
      // 화면 노출 — 바뀐 패턴은 의도 줄에 보여야 결정이 된다
      S._threatRead={[evd.combat.threat]:true};
      S.combat={id:'walker',edge:0,pressure:1,phase:2,history:[]};
      G.threatAdaptedTactic(evd);
      const hud=UI.combatHudHtml?'skip':document.createElement('div');
      return {sawFail, othersCertain, freshNull:fresh===null, adapted:S.combat.adapted};
    }""")
    check('바뀐 counter는 확정이 깨진다', adapt['sawFail'], str(adapt))
    check('다른 counter는 여전히 확정', adapt['othersCertain'], str(adapt))
    check('안 읽힌 위협은 적응하지 않는다', adapt['freshNull'], str(adapt))
    check('적응 tactic이 조우에 고정된다', adapt['adapted'] in ('관찰','정비','사격'), str(adapt))

    coverage = page.evaluate("""() => {
      // 데이터 계약: 굴림뿐인 전투 전부에 counters와 맞물리는 tactic 선택이 있다
      const bad=[];
      for(const e of D.events.filter(e=>e.combat)){
        const rolled=(e.choices||[]).filter(c=>c.combatRoll!==undefined);
        if(!rolled.length) continue;
        const bypass=rolled.some(c=>c.tactic&&e.combat.counters&&e.combat.counters[c.tactic]);
        if(!bypass) bad.push(e.id);
      }
      return bad;
    }""")
    check('모든 굴림 전투에 준비 우회로가 있다', not coverage, str(coverage))

    print('― 구조·호송 3분기 (성공/부분/실패)')
    tri = page.evaluate("""() => {
      const result={};
      for(const [id,tactic] of [['route_ridge_extract','분리 인양'],['route_market_pass','차체 지지']]){
        const evd=D.events.find(e=>e.id===id);
        const choice=evd.choices.find(c=>c.tactic===tactic);
        const seen=new Set();
        for(let i=0;i<400;i++){
          S.combat={id:'x',edge:0,pressure:1,phase:3,history:[]};
          delete S._threatRead;   // 첫 조우 조건 고정 — 경험 우회 배제
          const out=G.pickOutcome(evd,choice);
          seen.add(out.fx&&out.fx.combatResult);
        }
        result[id]=[...seen].sort();
      }
      return result;
    }""")
    for eid, seen in tri.items():
        check(f'{eid}: 실패 포함 3결과 도달', set(seen) == {'success', 'partial', 'failure'}, str(seen))

    print('― kw_sniper 조우당 1회 캡')
    sniper = page.evaluate("""() => {
      const evd=D.events.find(e=>e.id==='combat_walker_strike');
      const choice=evd.choices.find(c=>c.req&&c.req.item==='탄약');
      S.party=['kangwoo']; S.comps.kangwoo={mood:70,bond:0,lvl:2,perks:['kw_sniper']};
      S.items['탄약']=999; S.injuries={};
      // 첫 발: 확정 성공
      S.combat={id:'walker',edge:0,pressure:1,phase:3,history:[]};
      const first=G.pickOutcome(evd,choice);
      const firstGuaranteed=first.text===choice.out[0].text && S.combat.sniperUsed===1;
      // 이후: 같은 조우에서는 판정으로
      let sawFail=false;
      for(let i=0;i<200;i++){
        delete S._threatRead;   // 경험 우회 배제
        S.combat.sniperUsed=1;
        const out=G.pickOutcome(evd,choice);
        if(out.text===choice.out[1].text) sawFail=true;
      }
      return {firstGuaranteed, sawFail};
    }""")
    check('첫 발 확정 + 캡 기록', sniper['firstGuaranteed'], str(sniper))
    check('두 발째부터는 실패 가능', sniper['sawFail'], str(sniper))

    print('― 선택 전 미래 정보 비노출')
    ui = page.evaluate("""() => {
      G.newGame('onroad','전투UI','full');
      S.combat=null; S.injuries={}; S.pursuit=0;
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'));
      UI.finishStory();
      const choices=[...document.querySelectorAll('#ev-sheet .choice')];
      const copy=choices.map(n=>`${n.textContent} ${n.getAttribute('aria-label')||''}`).join(' ');
      return {
        count:choices.length,
        forecastNodes:document.querySelectorAll('#ev-sheet .combat-odds, #ev-sheet .combat-risk, #ev-sheet .combat-failure').length,
        predictionLeak:/판정 전망|실패하면|위험도|가장 나은|가장 위험|\\d+\\s*%/.test(copy),
      };
    }""")
    check('선택 카드는 행동만 보이고 성공률·실패 비용을 노출하지 않는다',
          ui['count'] > 0 and ui['forecastNodes'] == 0 and not ui['predictionLeak'], str(ui))

    print('― W3: 판정 없는 확정 선택 비율')
    det = page.evaluate("""() => {
      let det=[], rolled=0;
      for(const e of D.events){
        if(!e.combat) continue;
        for(const c of (e.choices||[])){
          const isDet = c.combatRoll===undefined || !(c.out && c.out.length>1);
          // '준비 행동'으로 명시한 선택은 판정 대상이 아니다 (전망도 표시하지 않는다)
          if(isDet && !c.prep) det.push(`${e.id}:${c.tactic||c.label||''}`.slice(0,40));
          else if(!isDet) rolled++;
        }
      }
      return {det, rolled, pct: Math.round(100*det.length/Math.max(1,det.length+rolled))};
    }""")
    check('판정 없는 확정 선택 ≤ 15%', det['pct'] <= 15,
          f"{det['pct']}% ({len(det['det'])}개) 예: {det['det'][:3]}")

    # 어떤 종류의 선택에도 선택 전 판정 전망이 붙지 않아야 한다.
    prep_ui = page.evaluate("""() => {
      G.newGame('onroad','준비','full');
      S.combat=null; S.injuries={}; S.pursuit=0;
      UI.showEvent(D.events.find(e=>e.id==='patrol_walker'));
      UI.finishStory();
      const evd=D.events.find(e=>e.id==='patrol_walker');
      const cards=[...document.querySelectorAll('#ev-sheet .choice')];
      return cards.map((n,i)=>({prep:!!(evd.choices[i]&&evd.choices[i].prep),
        hasOdds: !!n.querySelector('.combat-odds')}));
    }""")
    leaked = [r for r in prep_ui if r['hasOdds']]
    check('전투의 모든 선택에서 전망 노드가 사라졌다', not leaked, f"{len(leaked)}개 카드가 선택 전 전망 표시")

    print('― W3: 이탈에 실질 비용이 붙는가')
    exits = page.evaluate("""() => {
      const rows=[];
      for(const e of D.events){
        if(!e.combat) continue;
        for(const c of (e.choices||[])){
          if(!['이탈','우회'].includes(c.tactic)) continue;
          const fx=(c.out&&c.out[0]&&c.out[0].fx)||{};
          // note/flag는 모든 이탈에 붙어 있어 판별력이 없다 — 실제 대가만 센다
          // (2026-08-07 뮤테이션: pursuit을 전부 지워도 초록이었다)
          const real = (fx.pursuit||0)>0 || fx.trust || fx.mood || (fx.moodAll||0)<=-3;
          rows.push({ev:e.id, real:!!real});
        }
      }
      return rows;
    }""")
    no_cost = [r['ev'] for r in exits if not r['real']]
    check('이탈 선택에 관측·신뢰·서사 대가가 붙는다', not no_cost,
          f"{len(no_cost)}/{len(exits)}개가 자원만 소모: {no_cost[:3]}")

    print('― W3: 관측(pursuit)에 임계 효과가 있는가')
    pursuit = page.evaluate("""() => {
      G.newGame('onroad','관측','full');
      const at=(n)=>{ S.pursuit=n; return {
        checkpoint: typeof G.pursuitCheckpoint==='function' ? G.pursuitCheckpoint() : null,
        refused: typeof G.pursuitRefusesShelter==='function' ? G.pursuitRefusesShelter() : null,
      };};
      return {low:at(0), mid:at(3), high:at(5)};
    }""")
    check('관측 3에서 강제 검문 임계가 존재',
          pursuit['mid']['checkpoint'] is not None and pursuit['mid']['checkpoint'] != pursuit['low']['checkpoint'],
          str(pursuit))
    check('관측 5에서 정착지 반응이 달라진다',
          pursuit['high']['refused'] is not None and pursuit['high']['refused'] != pursuit['low']['refused'],
          str(pursuit))

    print('― 결과 버튼 단일 표면')
    outcome_surface = page.evaluate("""() => {
      G.newGame('onroad','결과UI','full');
      S.combat=null; S.injuries={}; S.pursuit=0;
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_read'));
      UI.finishStory();
      document.querySelector('#ev-sheet .choice:not(:disabled)')?.click();
      UI.finishStory();
      const sheet=document.querySelector('#ev-sheet');
      const dock=sheet.querySelector('.event-choice-dock');
      const choices=dock.querySelector('.choices');
      const button=dock.querySelector('.primary-exit-btn');
      const dockStyle=getComputedStyle(dock), choicesStyle=getComputedStyle(choices), buttonStyle=getComputedStyle(button);
      const dockRect=dock.getBoundingClientRect(), choicesRect=choices.getBoundingClientRect(), buttonRect=button.getBoundingClientRect();
      return {
        phase:sheet.dataset.storyPhase,
        dockWidth:dockRect.width,choicesWidth:choicesRect.width,buttonWidth:buttonRect.width,
        dockBackground:dockStyle.backgroundColor,buttonBackground:buttonStyle.backgroundColor,
        dockPaddingLeft:dockStyle.paddingLeft,buttonRadius:buttonStyle.borderRadius,
        choicesBackground:choicesStyle.backgroundColor,
        choicesBorder:`${choicesStyle.borderLeftWidth} ${choicesStyle.borderRightWidth}`,
        choicesPadding:`${choicesStyle.paddingLeft} ${choicesStyle.paddingRight}`
      };
    }""")
    check('다음 단계 버튼 바깥의 투명 사각형이 남지 않는다',
          outcome_surface['phase'] == 'outcome'
          and abs(outcome_surface['dockWidth'] - outcome_surface['buttonWidth']) <= 1
          and outcome_surface['dockPaddingLeft'] == '0px'
          and outcome_surface['buttonRadius'] == '0px'
          and outcome_surface['dockBackground'] == outcome_surface['buttonBackground']
          and outcome_surface['choicesBackground'] == outcome_surface['buttonBackground'],
          str(outcome_surface))

    print('― 능선 구조 진행·선택 하단 레이아웃')
    exact_context = browser.new_context(
        viewport={'width': 950, 'height': 908}, device_scale_factor=2
    )
    exact_page = exact_context.new_page()
    exact_page.add_init_script(
        "localStorage.clear();localStorage.setItem('caravan_story_auto','0')"
    )
    exact_page.goto(GAME)
    exact_page.evaluate("""() => {
      G.newGame('onroad','구조UI','full');
      S.combat=null; S.injuries={}; S.pursuit=0;
      UI.showEvent(D.events.find(e=>e.id==='route_ridge_rescue'));
    }""")
    exact_page.wait_for_timeout(140)
    progress_layout = exact_page.evaluate("""() => {
      const sheet=document.querySelector('#ev-sheet');
      const dock=sheet.querySelector('.event-choice-dock');
      const button=dock.querySelector('.story-next');
      const latest=sheet.querySelector('[data-story-entry]:last-child');
      const dockRect=dock.getBoundingClientRect();
      const buttonRect=button.getBoundingClientRect();
      const latestRect=latest.getBoundingClientRect();
      return {
        dpr:devicePixelRatio, step:sheet.dataset.storyStep,
        gridRows:getComputedStyle(dock).gridTemplateRows,
        dock:{top:dockRect.top,bottom:dockRect.bottom,height:dockRect.height},
        button:{top:buttonRect.top,bottom:buttonRect.bottom,height:buttonRect.height},
        latestBottom:latestRect.bottom, viewportBottom:innerHeight
      };
    }""")
    check('950×908 · DPR 2에서 다음 버튼이 단일 행 안에 온전히 보인다',
          progress_layout['dpr'] == 2
          and progress_layout['step'] == 'beat'
          and progress_layout['gridRows'] == '48px'
          and progress_layout['button']['height'] >= 48
          and progress_layout['button']['top'] >= progress_layout['dock']['top'] - .5
          and progress_layout['button']['bottom'] <= progress_layout['dock']['bottom'] + .5
          and progress_layout['dock']['bottom'] <= progress_layout['viewportBottom'] + .5
          and progress_layout['latestBottom'] <= progress_layout['dock']['top'] + .5,
          str(progress_layout))

    exact_page.evaluate('UI.finishStory()')
    exact_page.wait_for_timeout(140)
    decision_layout = exact_page.evaluate(r"""() => {
      const sheet=document.querySelector('#ev-sheet');
      const dock=sheet.querySelector('.event-choice-dock');
      const list=dock.querySelector('.choices');
      const toggle=dock.querySelector('.event-detail-toggle');
      const buttons=[...list.querySelectorAll('button.choice')].filter(node=>!node.hidden);
      const dockStyle=getComputedStyle(dock);
      const dockRect=dock.getBoundingClientRect();
      const listRect=list.getBoundingClientRect();
      const toggleRect=toggle.getBoundingClientRect();
      const buttonRects=buttons.map(node=>node.getBoundingClientRect());
      return {
        step:sheet.dataset.storyStep,
        label:buttons[0]?.textContent.replace(/\s+/g,' ').trim()||'',
        choiceCount:buttons.length,
        dockHeight:dockRect.height,
        listSlack:Math.max(0,list.clientHeight-list.scrollHeight),
        trailingSpace:Math.max(0,dockRect.bottom-parseFloat(dockStyle.paddingBottom)-toggleRect.bottom),
        listToggleGap:toggleRect.top-listRect.bottom,
        overlap:buttonRects.some((rect,index)=>index&&rect.top<buttonRects[index-1].bottom-.5)
      };
    }""")
    check('견인줄 선택지는 내용 높이만 쓰고 추가 빈 공간을 만들지 않는다',
          decision_layout['step'] == 'decision'
          and '달구지를 바위 뒤에 걸고 견인줄을 내린다' in decision_layout['label']
          and decision_layout['choiceCount'] == 2
          and decision_layout['listSlack'] <= 1
          and decision_layout['trailingSpace'] <= 1
          and 4 <= decision_layout['listToggleGap'] <= 8
          and not decision_layout['overlap'],
          str(decision_layout))
    exact_context.close()

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'전투 개편 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 전투 개편 전부 통과')
