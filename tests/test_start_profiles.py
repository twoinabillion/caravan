#!/usr/bin/env python3
"""출발 구성 — 같은 길을 다른 무게로 시작하는가.

재플레이 축: 프로필 3종이 실제로 다른 시작 상태를 만들고, 이름 화면에서
고를 수 있고, 세이브를 오가도 유지되는지 본다.
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

    print('― 프로필 3종이 서로 다른 시작을 만든다')
    stats = page.evaluate("""() => {
      const res={};
      for(const id of Object.keys(D.startProfiles)){
        G.newGame('onroad','프로필','full',id);
        res[id]=JSON.stringify({f:S.fuel,s:S.scrap,w:S.water,i:S.items});
      }
      return res;
    }""")
    check('프로필 3종 존재', len(stats) == 3, str(list(stats)))
    check('세 시작 상태가 전부 다르다', len(set(stats.values())) == 3, '')

    print('― 이름 화면에서 고를 수 있다')
    picker = page.evaluate("""() => {
      const bt=document.querySelector('#bt-new');
      if(bt) bt.click();
      const modeOn=document.querySelector('#mode-on');   // 오프로드 설정이 있으면 모드 화면을 경유한다
      if(modeOn&&document.querySelector('#scr-mode').classList.contains('on')) modeOn.click();
      const box=document.querySelector('#profile-pick');
      const cards=box?box.querySelectorAll('[data-profile]').length:0;
      let picked=null;
      if(cards){
        const second=box.querySelectorAll('[data-profile]')[1];
        second.click();
        picked=box.querySelector('[aria-checked="true"]');
        picked=picked&&picked.dataset.profile;
      }
      return {cards, picked};
    }""")
    check('선택 카드 3장 렌더', picker.get('cards') == 3, str(picker))
    check('클릭으로 선택 전환', picker.get('picked') == 'runner', str(picker))

    print('― 세이브를 오가도 유지된다')
    kept = page.evaluate("""() => {
      G.newGame('onroad','저장','full','hauler');
      G.save();
      const raw=localStorage.getItem('caravan_save')||localStorage.getItem('save')||null;
      S=null; G.load&&G.load();
      return {profile:S&&S.profile, scrap:S&&S.scrap};
    }""")
    check('로드 후 profile 유지', kept.get('profile') == 'hauler', str(kept))

    print('― 이전 순환의 흔적 (지난 결말이 다음 런에 남는다)')
    trace = page.evaluate("""() => {
      const out={};
      for(const kind of ['story_done','too_late','thirst','stranded','shunned','empty_district']){
        G.newGame('onroad','전판','full'); S.day=9; G.archiveQualityRun(kind);
        G.newGame('onroad','후판','full');
        out[kind]=(S._storyQueue||[]).includes('prev_trace_'+kind);
      }
      // 첫 런(아카이브 없음)엔 흔적이 없다
      localStorage.removeItem('caravan_quality_runs_v1');
      const keys=Object.keys(localStorage).filter(k=>/quality|archive/i.test(k));
      keys.forEach(k=>localStorage.removeItem(k));
      G.newGame('onroad','첫판','full');
      out.firstRunClean=!(S._storyQueue||[]).some(id=>id.startsWith('prev_trace_'));
      return out;
    }""")
    for kind in ['story_done','too_late','thirst','stranded','shunned','empty_district']:
        check(f'{kind} 결말 → 다음 런에 흔적', bool(trace.get(kind)), '')
    check('첫 런에는 흔적이 없다', bool(trace.get('firstRunClean')), str(trace))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'출발 구성 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 출발 구성 3종이 실제로 다른 시작을 만든다')
