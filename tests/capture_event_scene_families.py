#!/usr/bin/env python3
"""48개 사건 장면군을 실제 모바일 이벤트 UI에서 캡처·검증한다."""
import json
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / '서울까지400km.html').as_uri()
OUT = ROOT / 'audits' / 'event-image-diversity-2026-08-17' / 'runtime-390x844'
OUT.mkdir(parents=True, exist_ok=True)
for stale in OUT.glob('*.png'):
    stale.unlink()

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
    errors = []
    page.on('console', lambda msg: errors.append(msg.text)
            if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(URL)
    page.wait_for_timeout(600)
    page.click('#bt-new')
    if page.locator('#mode-on').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '장면검수')
    page.press('#inp-name', 'Enter')
    page.click('#intro-skip')
    page.click('#intro-summary-start')
    page.wait_for_selector('#stage-fuel', state='visible')
    page.evaluate('window.__CARAVAN_TEST_AUTO_MS=999999')

    samples = page.evaluate('''() => D.eventSceneFamilyRules.map(rule => {
      const event=D.events.find(item=>{
        const dedicated=(D.eventTurnScenes&&D.eventTurnScenes[item.id])||item.scenes||item.scene||
          (D.eventScenes&&D.eventScenes[item.id])||(item.locEvent&&D.nodeScenes&&D.nodeScenes[item.locEvent]);
        if(dedicated) return false;
        const type=(item.ai||item.type==='추적')?'추적':item.type;
        const text=`${item.id||''} ${String(item.title||'').replace(/<[^>]*>/g,'')} ${type||''}`;
        const selected=D.eventSceneFamilyRules.find(candidate=>
          (!candidate.types||candidate.types.includes(type))&&(!candidate.match||candidate.match.test(text)));
        return selected===rule;
      });
      return {scene:rule.scene,id:event&&event.id,title:event&&String(event.title||'').replace(/<[^>]*>/g,'')};
    })''')

    results = []
    for index, sample in enumerate(samples, 1):
        if not sample['id']:
            raise AssertionError(f"표본 사건 없음: {sample['scene']}")
        page.evaluate("eventId => UI.showEvent(D.events.find(item=>item.id===eventId))", sample['id'])
        page.wait_for_selector('#ev-wrap.on img.event-scene')
        page.evaluate("document.querySelectorAll('#ev-wrap *').forEach(node=>node.getAnimations().forEach(animation=>animation.finish()))")
        page.wait_for_timeout(40)
        actual = page.locator('#ev-sheet .event-scene-frame').get_attribute('data-scene-key')
        src = page.locator('#ev-sheet img.event-scene').get_attribute('src') or ''
        if actual != sample['scene']:
            raise AssertionError(f"{sample['id']}: 기대 {sample['scene']} / 실제 {actual}")
        if not src.startswith('data:image/webp;base64,'):
            raise AssertionError(f"{sample['id']}: WebP 내장 실패")
        filename=f"{index:02d}-{sample['scene']}.png"
        page.screenshot(path=str(OUT / filename), full_page=False)
        results.append({**sample, 'actual':actual, 'file':filename})
        page.evaluate("document.querySelector('#ev-wrap').classList.remove('on')")

    if errors:
        raise AssertionError(f"콘솔 오류: {errors}")
    (OUT / 'manifest.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n')
    browser.close()

print(f"✅ 사건 장면군 실제 UI 48/48 · {OUT}")
