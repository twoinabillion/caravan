#!/usr/bin/env python3
"""Actual current journey-deck controls at mobile sizes, large text and zoom."""
import os
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from batch_accessibility_helpers import enter_game

failures=[]
metrics=[]
artifact_dir=Path(os.environ['QA_ACCESSIBILITY_ARTIFACT_DIR']) if os.environ.get('QA_ACCESSIBILITY_ARTIFACT_DIR') else None
if artifact_dir: artifact_dir.mkdir(parents=True,exist_ok=True)
def capture(page,label):
    if artifact_dir: page.screenshot(path=str(artifact_dir/(label.replace(' ','-')+'.png')))

def check(label,ok,detail=''):
    print(('✅ ' if ok else '❌ ')+label+(f' — {detail}' if not ok else ''))
    if not ok: failures.append(label)


def controls(page, selector):
    """Measure actual hit targets, then scroll each reachable target into view."""
    root=page.locator(selector)
    buttons=root.locator('button:visible:not(:disabled)')
    problems=[]
    for i in range(buttons.count()):
        button=buttons.nth(i)
        button.scroll_into_view_if_needed()
        info=button.evaluate('''e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);
          return {text:e.textContent.trim(),width:r.width,height:r.height,left:r.left,right:r.right,
          top:r.top,bottom:r.bottom,windowWidth:innerWidth,windowHeight:innerHeight,
          font:parseFloat(s.fontSize),tab:e.tabIndex,overflow:e.scrollWidth>e.clientWidth+2};}''')
        if info['width']<43.5 or info['height']<43.5 or info['left']<-.5 or info['right']>info['windowWidth']+.5 or info['top']<-.5 or info['bottom']>info['windowHeight']+.5 or info['overflow']:
            problems.append(info)
    return {'count':buttons.count(),'problems':problems}


def geometry(page):
    return page.locator('.journey-deck').evaluate('''e=>{const box=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};return {deck:box(e),stage:box(document.querySelector('#stage')),dock:box(document.querySelector('#dock'))}}''')


def route_check(page,label):
    page.locator('button[data-journey-mode="route"]').click()
    page.locator('[data-trip-destination]').click()
    options=page.locator('#trip-destination-dialog [data-trip-destination-select]')
    # Current destination options are public buttons in a native dialog.
    if not options.count(): options=page.locator('#trip-destination-dialog .trip-route-option')
    check(label+' destination alternatives remain available',options.count()>=2)
    targets=controls(page,'#trip-destination-dialog')
    check(label+' destination controls stay reachable at44px',targets['count']>=3 and not targets['problems'],str(targets))
    page.keyboard.press('Escape')
    check(label+' has exactly one enabled departure',page.locator('[data-nav-depart]:visible:not(:disabled)').count()==1)
    layout=page.evaluate('({document:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,panel:document.querySelector("#panel").scrollWidth>document.querySelector("#panel").clientWidth+1})')
    check(label+' contains document and panel horizontally',not layout['document'] and not layout['panel'],str(layout))
    targets=controls(page,'.journey-deck')
    check(label+' current deck controls stay reachable at44px',targets['count']>=6 and not targets['problems'],str(targets))
    gaps=page.locator('.journey-deck').evaluate("""e=>{const r=s=>e.querySelector(s).getBoundingClientRect();const map=r('.trip-map-toggle'),choice=r('[data-trip-destination]'),depart=r('[data-nav-depart]');return {height:document.querySelector('#panel').getBoundingClientRect().height,innerDeck:e.getBoundingClientRect().height,before:map.top-choice.bottom,after:depart.top-map.bottom,zoom:Number(getComputedStyle(document.documentElement).zoom)||1}}""")
    check(label+' map hitbox never overlaps adjacent choices',gaps['before']>=-.5 and gaps['after']>=-.5,str(gaps))
    check(label+' retains272px shell',abs(gaps['height']/gaps['zoom']-272)<=1,str(gaps))
    dock=controls(page,'#dock')
    check(label+' all five dock actions remain reachable',dock['count']==5 and not dock['problems'],str(dock))
    metrics.append({'label':label,'gaps':gaps,'deckTargets':targets,'dockTargets':dock})


with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    for width,height in [(360,700),(390,844),(480,860)]:
        page=browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
        enter_game(page)
        label=f'{width}x{height}'
        route_check(page,label+' normal')
        capture(page,label+'-normal-route')
        route_geometry=geometry(page)
        page.locator('button[data-journey-mode="local"]').click()
        stay_geometry=geometry(page)
        capture(page,label+'-normal-stay')
        check(label+' route and stay retain shared deck/stage/dock geometry',all(abs(x-y)<=1 for k in route_geometry for x,y in zip(route_geometry[k],stay_geometry[k])),str((route_geometry,stay_geometry)))
        page.locator('[data-stay-choice]').click()
        actions=page.locator('#stay-action-dialog [data-stay-select]')
        check(label+' all four public stay actions are listed',actions.count()>=4)
        for i in range(actions.count()):
            actions.nth(i).scroll_into_view_if_needed()
            check(label+f' stay option{i} reachable',actions.nth(i).is_visible())
        page.keyboard.press('Escape')
        page.locator('#dk-menu').click()
        page.locator('#menu-text-toggle').click()
        check(label+' real large-text preference enabled',page.locator('html').evaluate('(e)=>e.classList.contains("ui-large-text")'))
        page.locator('#menu-motion-toggle').click()
        check(label+' real reduced-motion preference enabled',page.locator('html').get_attribute('data-ui-motion')=='reduced')
        page.keyboard.press('Escape')
        route_check(page,label+' large')
        capture(page,label+'-large-route')
        motion=page.evaluate("""()=>[...document.querySelectorAll('#scr-game *')].filter(e=>e.getClientRects().length).flatMap(e=>{const s=getComputedStyle(e),slow=v=>v.split(',').some(t=>parseFloat(t)*(t.trim().endsWith('ms')?1:1000)>1);return ((s.animationName!=='none'&&slow(s.animationDuration))||slow(s.transitionDuration))?[{id:e.id,classes:e.className,animation:s.animationDuration,transition:s.transitionDuration}]:[]})""")
        check(label+' reduced-motion removes sustained visible CSS motion',not motion,str(motion[:5]))
        page.locator('#dk-objectives').click()
        target=controls(page,'#quest-ledger')
        check(label+' ledger targets accessible at44px',target['count']>=1 and not target['problems'],str(target))
        page.locator('.quest-ledger-back').click()
        page.locator('[data-route-map-toggle]').click()
        page.locator('#journey-map-world').click()
        target=controls(page,'#ovl-map')
        check(label+' full-map targets accessible at44px',target['count']>=1 and not target['problems'],str(target))
        page.locator('#map-x').click()
        page.keyboard.press('Escape')
        page.locator('#dk-status').click()
        target=controls(page,'#ovl-status')
        check(label+' bag targets accessible at44px',target['count']>=4 and not target['problems'],str(target))
        page.locator('[data-bag-item="의약품"]').click()
        check(label+' medicine selection updates actual detail',page.locator('[data-bag-item="의약품"]').get_attribute('aria-pressed')=='true' and page.locator('.bag-detail-heading').inner_text().find('의약품')>=0)
        page.keyboard.press('Escape')
        check(label+' no runtime errors',not errors,str(errors))
        page.close()
    zoom=browser.new_page(viewport={'width':720,'height':900})
    zoom.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
    enter_game(zoom)
    zoom.evaluate("document.documentElement.style.zoom='2'")
    route_check(zoom,'200% CSS zoom')
    capture(zoom,'200-percent-zoom')
    zoom.close()
    browser.close()
if artifact_dir: (artifact_dir/'metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2))
if failures: raise SystemExit('\n'.join(failures))
print('✅ Current mobile accessibility reference checks passed')
