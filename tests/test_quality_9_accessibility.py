#!/usr/bin/env python3
"""Reference mobile sizes, large text, reduced motion, and 200% zoom gate."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail and not ok else ''))
    if not ok:
        failures.append(label)


def enter_game(page):
    page.goto(GAME)
    page.click('#bt-new')
    if page.locator('#scr-mode').is_visible():
        page.click('#mode-on')
    page.fill('#inp-name', '접근성')
    page.click('#bt-name')
    page.evaluate('UI.skipIntro()')
    page.wait_for_timeout(160)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")
    page.click('[data-journey-mode="route"]')
    page.wait_for_timeout(160)


def layout_state(page):
    return page.evaluate("""() => {
      const panel=document.querySelector('#panel');
      const controls=[...panel.querySelectorAll('button:not([disabled])')].filter(node=>{
        if(node.offsetParent===null) return false;
        if(node.getAttribute('aria-hidden')==='true') return false;
        if(node.matches('.nav-destination-card:not(.is-selected)')) return false;
        return true;
      });
      const panelRect=panel.getBoundingClientRect();
      const rects=controls.map(node=>({node,rect:node.getBoundingClientRect()}));
      const stage=document.querySelector('#stage');
      const dock=document.querySelector('#dock');
      const dash=document.querySelector('#dash');
      const roadStatus=document.querySelector('#road-status')?.getBoundingClientRect();
      const stageTime=document.querySelector('#stage-time')?.getBoundingClientRect();
      const contentEnd=[...panel.children].reverse().find(node=>node.getClientRects().length);
      return {
        documentOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
        panelOverflow:panel.scrollWidth>panel.clientWidth+1,
        shortControls:rects.filter(({node,rect})=>node.closest('.nav-carousel-dots')
          ? rect.width<23.5||rect.height<23.5
          : rect.width<43.5||rect.height<43.5).length,
        escaped:rects.filter(({rect})=>rect.left<panelRect.left-1||rect.right>panelRect.right+1).length,
        escapedControls:rects.filter(({rect})=>rect.left<panelRect.left-1||rect.right>panelRect.right+1)
          .map(({node,rect})=>`${node.className||node.id}:${Math.round(rect.left)}–${Math.round(rect.right)}`),
        routeCount:panel.querySelectorAll('[data-route-select]').length,
        primaryCount:panel.querySelectorAll('[data-nav-depart]').length,
        dashVisible:!!(dash&&dash.offsetParent!==null),
        compactHud:!!(roadStatus&&stageTime&&roadStatus.height<=40&&stageTime.height<=40&&
          roadStatus.width<=150&&stageTime.width<=120),
        stageHeight:stage?.getBoundingClientRect().height||0,
        dockGap:contentEnd&&dock?dock.getBoundingClientRect().top-contentEnd.getBoundingClientRect().bottom:null,
        guide:panel.querySelector('.journey-guide')?.textContent||''
      };
    }""")


def tool_target_state(page, selector):
    return page.evaluate("""selector => {
      const root=document.querySelector(selector);
      const rootRect=root.getBoundingClientRect();
      const controls=[...root.querySelectorAll('button:not([disabled])')].filter(node=>
        node.offsetParent!==null&&!node.closest('#st-tabs'));
      const short=controls.map(node=>({node,rect:node.getBoundingClientRect()})).filter(({rect})=>
        rect.width<43.5||rect.height<43.5);
      const escaped=controls.map(node=>node.getBoundingClientRect()).filter(rect=>
        rect.left<rootRect.left-1||rect.right>rootRect.right+1||rect.top<rootRect.top-1||rect.bottom>rootRect.bottom+1);
      return {
        count:controls.length,
        short:short.map(({node,rect})=>`${node.className||node.id}:${Math.round(rect.width)}x${Math.round(rect.height)}`),
        escaped:escaped.length
      };
    }""", selector)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    for width, height in [(360, 700), (390, 844), (480, 860)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = []
        page.on('console', lambda msg: errors.append(msg.text)
                if msg.type == 'error' and 'Failed to load resource' not in msg.text else None)
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
        enter_game(page)

        normal = layout_state(page)
        check(f'{width}×{height} normal text keeps the primary route path usable',
              normal['routeCount'] >= 2 and
              normal['primaryCount'] == 1 and
              not normal['dashVisible'] and normal['compactHud'] and
              not normal['documentOverflow'] and not normal['panelOverflow'] and
              normal['shortControls'] == 0 and normal['escaped'] == 0, str(normal))
        if height >= 800:
            check(f'{width}×{height} returns surplus height to the road scene',
                  14 <= normal['dockGap'] <= 26, str(normal))

        page.evaluate("""() => {
          document.documentElement.classList.add('ui-large-text');
          UI.renderAll();
        }""")
        large = layout_state(page)
        check(f'{width}×{height} large text has no clipped or sub-44px critical control',
              not large['documentOverflow'] and not large['panelOverflow'] and
              large['shortControls'] == 0 and large['escaped'] == 0, str(large))

        motion = page.evaluate("""() => {
          document.documentElement.classList.add('ui-reduce-motion');
          const option=document.querySelector('.nav-destination-track');
          const style=getComputedStyle(option);
          return {duration:style.animationDuration,transition:style.transitionDuration};
        }""")
        check(f'{width}×{height} reduced motion collapses animation and transition time',
              motion['duration'] in ('0.001ms', '0.000001s', '1e-06s', '0s') and
              motion['transition'] in ('0.001ms', '0.000001s', '1e-06s', '0s'), str(motion))

        page.click('#dk-objectives')
        page.wait_for_timeout(80)
        goal = tool_target_state(page, '#ovl-status')
        check(f'{width}×{height} goal folio keeps visible controls at least 44px',
              goal['count'] >= 4 and not goal['short'] and goal['escaped'] == 0, str(goal))
        page.click('.folio-road-button')

        page.click('#dk-map')
        page.evaluate("UI.showNodeCard(S.known.find(id => id !== S.at))")
        page.wait_for_timeout(80)
        map_state = tool_target_state(page, '#ovl-map')
        check(f'{width}×{height} map keeps visible controls at least 44px',
              map_state['count'] >= 4 and not map_state['short'] and map_state['escaped'] == 0,
              str(map_state))
        page.click('#map-x')

        page.click('#dk-status')
        page.wait_for_timeout(80)
        bag = tool_target_state(page, '#ovl-status')
        check(f'{width}×{height} bag keeps visible controls at least 44px',
              bag['count'] >= 6 and not bag['short'] and bag['escaped'] == 0, str(bag))
        page.click('[data-bag-item="의약품"]')
        bag_selection = page.evaluate("""() => ({
          selected:document.querySelector('[data-bag-item="의약품"]')?.getAttribute('aria-pressed'),
          heading:document.querySelector('.bag-detail-heading span')?.textContent,
          count:document.querySelector('.bag-detail-heading b')?.textContent
        })""")
        check(f'{width}×{height} bag selection updates the live detail panel',
              bag_selection['selected'] == 'true' and bag_selection['heading'] == '의약품' and
              bool(bag_selection['count']), str(bag_selection))
        page.evaluate("""() => { S.items['부품']=2; S.van=50; UI.renderAll(); }""")
        page.click('[data-bag-item="부품"]')
        before_repair = page.evaluate("() => ({parts:S.items['부품'],van:S.van})")
        page.click('[data-bag-action="부품"]')
        after_repair = page.evaluate("() => ({parts:S.items['부품'],van:S.van})")
        check(f'{width}×{height} bag repair action changes inventory and vehicle state',
              after_repair['parts'] == before_repair['parts'] - 1 and
              after_repair['van'] > before_repair['van'],
              f'{before_repair} -> {after_repair}')
        page.click('#dk-road')

        check(f'{width}×{height} console/runtime errors remain zero', not errors, str(errors[:5]))
        page.close()

    zoom = browser.new_page(viewport={'width': 720, 'height': 900})
    zoom.add_init_script("localStorage.clear(); localStorage.setItem('caravan_story_auto','0')")
    enter_game(zoom)
    zoom.evaluate("document.documentElement.style.zoom='2'")
    zoom.wait_for_timeout(100)
    zoom_state = layout_state(zoom)
    check('200% zoom preserves a scrollable, horizontally contained primary route path',
          zoom_state['routeCount'] >= 2 and not zoom_state['panelOverflow'] and
          zoom_state['shortControls'] == 0 and zoom_state['escaped'] == 0, str(zoom_state))
    zoom.close()
    browser.close()

if failures:
    print('\n실패 목록:')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)
print('\n✅ Quality 9 accessibility reference gate passed')
