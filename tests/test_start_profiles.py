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

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'출발 구성 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 출발 구성 3종이 실제로 다른 시작을 만든다')
