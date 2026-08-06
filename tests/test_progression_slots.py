#!/usr/bin/env python3
"""탑재 슬롯 배타·중량 항이 실제 배선됐는지 확인한다."""
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
    page.evaluate("G.newGame('onroad','성장','full')")

    print('― 지붕 슬롯 배타 (cap 3)')
    roof = page.evaluate("""() => {
      S.scrap=999; S.items['부품']=99;
      for(const id of ['garden','solar','scope']) G.buyUpgrade(id);
      const denied=G.canBuyUp('beehive');
      const collector=G.canBuyUp('collector');
      return {used:G.slotUsage('roof').length, denied:denied.ok, why:denied.why, collectorDenied:collector.ok};
    }""")
    check('지붕 3개 장착 후 4번째 거부', roof['used'] == 3 and not roof['denied'], str(roof))
    check('거부 사유에 장착 중 장비 명시', '자리 없음' in (roof['why'] or ''), roof['why'])

    print('― 후미 슬롯 배타 (탱크 vs 좌석)')
    rear = page.evaluate("""() => {
      for(const id of ['tank1','tank2']) G.buyUpgrade(id);
      for(const id of ['bench','cabin','bunk']) G.buyUpgrade(id);
      const jump=G.canBuyUp('jumpseat');
      return {tank2:!!S.up.tank2, jumpDenied:!jump.ok, why:jump.why};
    }""")
    check('대형탱크 장착 시 서비스칸 거부', rear['tank2'] and rear['jumpDenied'], str(rear))

    print('― 중량 → 연비·마모')
    weight = page.evaluate("""() => {
      // solar(연비 -8%) 같은 효과가 섞이지 않게 무게만 있는 장비로 격리 비교
      S.up={tank1:true,armor:true,bench:true,cabin:true,bunk:true,garden:true};
      const loaded={fuel:G.fuelFor(120,'normal'), w:G.upWeight(), factor:G.weightFuelFactor(), wear:G.weightWearFactor()};
      S.up={};
      const empty={fuel:G.fuelFor(120,'normal'), factor:G.weightFuelFactor()};
      return {loaded, empty};
    }""")
    check('무거운 빌드가 연료를 더 쓴다',
          weight['loaded']['fuel'] > weight['empty']['fuel'] and weight['loaded']['factor'] > 1,
          str(weight))
    check('중량이 험로 마모에도 반영', weight['loaded']['wear'] > 1, str(weight['loaded']))

    print('― 저장 호환 (기존 세이브 초과 장착은 유지)')
    grandfather = page.evaluate("""() => {
      // 정원 초과 상태를 옛 세이브처럼 만든 뒤 load가 걷어내지 않는지
      for(const id of ['garden','solar','scope','beehive','antenna']) S.up[id]=true;
      G.save();
      S=null; const ok=G.load();
      return {ok, kept:['garden','solar','scope','beehive','antenna'].every(id=>S.up[id])};
    }""")
    check('초과 장착 세이브도 그대로 로드', grandfather['ok'] and grandfather['kept'], str(grandfather))

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'성장 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 슬롯·중량 배선 전부 통과')
