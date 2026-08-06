#!/usr/bin/env python3
"""LLM/외부 문자열이 이벤트 렌더 경로에서 마크업으로 실행되지 않는지 확인한다.

오프로드 생성 이벤트는 sanit()이 1차로 태그를 벗기지만, 렌더러(fmt/esc)가
2차 방어선으로 이스케이프해야 한다. 이 테스트는 렌더러 방어선을 직접 친다.
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


PAYLOAD_EVENT = """() => {
  G.newGame('onroad','보안 픽스처','full');
  window.__xss = 0;
  G.openEvent({
    gen: true, type: '조우',
    title: '<img src=x onerror="window.__xss=1">제목',
    text: '본문 <script>window.__xss=2<\\u002fscript> <img src=x onerror="window.__xss=3"> 끝',
    choices: [
      {label: '<img src=x onerror="window.__xss=4">선택', out: [{p:1, text: '<svg onload="window.__xss=5">결과', fx:{}}]},
    ],
  });
  return true;
}"""


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 780})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    print('― 이벤트 본문/제목 페이로드')
    page.evaluate(PAYLOAD_EVENT)
    page.wait_for_timeout(400)
    # 스토리 리더를 끝까지 진행해 모든 턴을 렌더시킨다
    for _ in range(8):
        page.evaluate("""() => {
          const next=document.querySelector('.story-next');
          if(next) next.click();
        }""")
        page.wait_for_timeout(120)

    xss = page.evaluate('window.__xss')
    check('주입 핸들러 미실행 (__xss===0)', xss == 0, f'__xss={xss}')

    injected_img = page.evaluate(
        "document.querySelectorAll('#ev-sheet img:not(.turn-avatar):not(.chat-avatar):not(.pimg):not(.event-scene)').length")
    check('이벤트 시트에 주입 img 요소 없음', injected_img == 0, f'{injected_img}개')

    title_text = page.evaluate(
        "(document.querySelector('#ev-sheet h2')||{}).textContent||''")
    check('제목이 텍스트로 렌더됨', '제목' in title_text and 'onerror' in title_text, title_text[:80])

    body_html = page.evaluate("(document.querySelector('.story-reader')||{}).innerHTML||''")
    check('본문에 실제 <script> 태그 없음', '<script' not in body_html)

    print('― authored 마크업은 계속 동작해야 한다')
    # <span class="ai">…</span>은 buildStoryTurns 파서가 ai-턴으로 소비한다.
    # 이스케이프 강화가 이 파서 경로를 깨지 않았는지 확인한다.
    page.evaluate("""() => {
      G.openEvent({type:'조우', title:'승인 태그', text:'<span class="ai">천리안</span> 방송',
        choices:[{label:'확인', out:[{p:1,text:'끝',fx:{}}]}]});
    }""")
    page.wait_for_timeout(300)
    ai_turn = page.evaluate(
        "document.querySelectorAll('#ev-sheet [data-kind=\\'ai\\']').length")
    check('authored span.ai → ai 턴 변환 유지', ai_turn >= 1, f'{ai_turn}개')

    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'XSS guard 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ XSS guard 통과')
