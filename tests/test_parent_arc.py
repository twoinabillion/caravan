#!/usr/bin/env python3
"""부모 추적선의 도달성·검증키 관문·서울 회수를 실데이터로 고정한다."""
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

    graph = page.evaluate("""() => {
      const event=id=>(D.events||[]).find(item=>item.id===id);
      const outcomes=id=>(event(id)?.choices||[]).flatMap(choice=>choice.out||[]);
      const chains=id=>[...new Set(outcomes(id).map(out=>out.fx?.chain).filter(Boolean))].sort();
      const beats=Object.fromEntries((D.journeyBeats||[]).map(beat=>[beat.id,beat.km]));
      const scheduled={};
      for(const id of ['memory_busan_terminal','parents_diversion_manifest',
                        'parents_separated_work','story_family_key','story_personal_cache',
                        'history_failed_namsan','history_parents_network']){
        scheduled[id]=beats[id]??null;
      }
      return {
        scheduled,
        cacheChains:chains('story_personal_cache'),
        fatherChain:chains('history_failed_namsan'),
        motherChain:chains('history_parents_network'),
        truthChain:chains('parents_mother_reunion')
      };
    }""")
    check('부모 추적의 일곱 관문이 북상 거리 순서에 예약된다', graph['scheduled'] == {
        'memory_busan_terminal': 20,
        'parents_diversion_manifest': 85,
        'parents_separated_work': 175,
        'story_family_key': 240,
        'story_personal_cache': 260,
        'history_failed_namsan': 330,
        'history_parents_network': 370,
    }, str(graph['scheduled']))
    check('개인 보관함의 두 선택 모두 실제 검증키 회수 장면으로 이어진다',
          graph['cacheChains'] == ['story_parent_route_guarded', 'story_parent_route_shared'],
          str(graph['cacheChains']))
    check('남산 실패 기록이 아버지의 마지막 기록으로 이어진다',
          graph['fatherChain'] == ['parents_father_last_log'], str(graph['fatherChain']))
    check('부모 연락망이 어머니 재회와 진실 고백까지 이어진다',
          graph['motherChain'] == ['parents_mother_reunion'] and
          graph['truthChain'] == ['parents_mother_truth'], str(graph))

    flags = page.evaluate("""() => {
      const event=id=>(D.events||[]).find(item=>item.id===id);
      const outcomes=id=>(event(id)?.choices||[]).flatMap(choice=>choice.out||[]);
      const applies=(id,names)=>outcomes(id).map(out=>{
        G.newGame('onroad','부모선','full');
        G.applyFx(out.fx||{});
        return names.every(name=>S.flags[name]===true);
      });
      return {
        shared:applies('story_parent_route_shared',['parent_key_found']),
        guarded:applies('story_parent_route_guarded',['parent_key_found']),
        father:applies('parents_father_last_log',['father_fate_known']),
        mother:applies('parents_mother_truth',['mother_reunited','mother_broadcast_ready'])
      };
    }""")
    check('공유·비공개 경로 모두 부모님의 검증키를 실제 획득한다',
          bool(flags['shared']) and all(flags['shared']) and
          bool(flags['guarded']) and all(flags['guarded']), str(flags))
    check('아버지와 어머니 장면의 결과 플래그가 모든 선택에서 남는다',
          bool(flags['father']) and all(flags['father']) and
          bool(flags['mother']) and all(flags['mother']), str(flags))

    readiness = page.evaluate("""() => {
      G.newGame('onroad','검증키 관문','full');
      S.party=['minji','parkss','leo'];
      for(const cid of ['minji','parkss','leo']){
        S.comps[cid]={mood:80,bond:20,lvl:3,perks:[]};
      }
      for(const flag of ['cell_road','cell_sea','cell_dome','massacre_known','es_truth',
                          'uplink_seen','postman_letter','gp_envelope_found','first_order_trace',
                          'parents_routes_traced','father_fate_known','mother_reunited',
                          'parent_key_located']) S.flags[flag]=true;
      const snapshot=()=>({
        main:G.mainStoryReady(),
        seoul:G.seoulReady(),
        pillars:G.pillars(),
        spine:{
          first_order_trace:!!S.flags.first_order_trace,
          parent_key_found:!!S.flags.parent_key_found,
          es_truth:!!S.flags.es_truth,
          parents_routes_traced:!!S.flags.parents_routes_traced,
          father_fate_known:!!S.flags.father_fate_known,
          mother_reunited:!!S.flags.mother_reunited
        }
      });
      const locatedOnly=snapshot();
      S.flags.parent_key_found=true;
      const keyRecovered=snapshot();
      return {locatedOnly,keyRecovered};
    }""")
    check('검증키 위치만 알아서는 서울 코어가 열리지 않는다',
          not readiness['locatedOnly']['main'] and not readiness['locatedOnly']['seoul'],
          str(readiness['locatedOnly']))
    check('실물 검증키를 회수해야 같은 준비 상태에서 서울 코어가 열린다',
          readiness['keyRecovered']['main'] and readiness['keyRecovered']['seoul'],
          str(readiness['keyRecovered']))

    payoff = page.evaluate("""() => {
      S.flags.father_fate_known=true;
      S.flags.mother_reunited=true;
      S.flags.mother_broadcast_ready=true;
      S.flags.core_transfer=true;
      const text=id=>{
        const value=[...(D.events||[]),...(D.seoulStops||[])]
          .find(item=>item.id===id)?.text;
        return typeof value==='function' ? value(S) : (value||'');
      };
      const core=text('seoul_core');
      const night=text('seoul_night');
      const bible=Array.isArray(D.worldBible) ? D.worldBible.join('\\n') : String(D.worldBible||'');
      return {
        fatherUsed:(core+night).includes('의료·급수') && (core+night).includes('강제 이송'),
        motherUsed:(core+night).includes('여섯') && (core+night).includes('주파수'),
        canonFather:bible.includes('아빠는 남산 유지선') && bible.includes('사망했다'),
        canonMother:bible.includes('엄마는 중부 기록소') && bible.includes('현재 서울 외곽 중계소에 살아'),
        canonSeparation:bible.includes('남산 안으로 동행하지'),
        canonKey:bible.includes('부모님의 인간 확인 검증키')
      };
    }""")
    check('아버지의 마지막 작업과 어머니의 방송이 코어·에필로그에서 회수된다',
          payoff['fatherUsed'] and payoff['motherUsed'], str(payoff))
    check('월드 바이블이 아버지 사망·어머니 생존·비동행·공동 검증키를 정사로 고정한다',
          all(payoff[key] for key in ['canonFather','canonMother','canonSeparation','canonKey']),
          str(payoff))
    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'부모 추적선 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 부모 추적선이 출발 기억부터 서울 에필로그까지 끊기지 않는다')
