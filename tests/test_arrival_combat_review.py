#!/usr/bin/env python3
"""Player-paced arrivals, honest combat information and scene continuity."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / '서울까지400km.html').as_uri()
SHOTS = ROOT / 'artifacts' / 'arrival-combat-review'
SHOTS.mkdir(parents=True, exist_ok=True)
failures = []


def check(label, ok, detail=None):
    print(('PASS ' if ok else 'FAIL ') + label)
    if not ok:
        failures.append(label)
        print(json.dumps(detail, ensure_ascii=False))


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL)
    page.evaluate("""() => {
      localStorage.setItem('caravan_story_auto','0');
      G.newGame('onroad','검수','full');
      S.flags.main_mission_started=true; S.flags.armed_age=true;
      document.querySelectorAll('.scr,.screen').forEach(n=>n.classList.remove('on'));
      document.querySelector('#scr-game').classList.add('on');
      S.at='gumi'; S.driving={from:'gumi',to:'daegu',dist:38,gone:38,road:'normal',
        slots:[],si:0,eventCount:0,snapshot:{gameMinute:S.day*1440+S.min,
          fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,van:S.van,fatigue:S.fatigue,pursuit:S.pursuit}};
      G.arrive();
    }""")
    page.wait_for_timeout(4700)
    check('major arrival waits for the player', page.locator('#arrival-scene').evaluate("n=>n.classList.contains('on')"))
    check('arrival blocks the next event until continued', page.evaluate("S.pendingArrival==='daegu'&&!document.querySelector('#ev-wrap').classList.contains('on')"))
    check('arrival has a real continue control', page.locator('[data-arrival-continue]').count() == 1)
    page.reload()
    page.locator('#bt-continue').click()
    page.wait_for_timeout(200)
    check('arrival survives save and reload', page.locator('#arrival-scene').evaluate("n=>n.classList.contains('on')"))
    if page.locator('[data-arrival-continue]').count():
        page.locator('[data-arrival-continue]').evaluate('n=>{n.click();n.click()}')
        page.wait_for_timeout(350)
        check('continue consumes arrival exactly once', page.evaluate("!S.pendingArrival"))
        check('next story or settlement is reachable', page.locator('#ev-wrap.on,#ovl-stl.on').count() > 0)

    for width, height in [(360, 640), (390, 844), (1280, 900)]:
        page.set_viewport_size({'width': width, 'height': height})
        for city in ['miryang', 'gwangju', 'daegu', 'muju', 'jeonju', 'daejeon', 'suwon', 'seoul']:
            page.evaluate("""city => {
              document.querySelectorAll('.ovl,#ev-wrap').forEach(n=>n.classList.remove('on'));
              S.at=city; S.pendingArrival=null;
              S.lastJourneyRecap={from:'busan',to:city,km:38,minutes:140,events:2,build:'기본 생존형',
                changes:[{label:'연료',value:-4,unit:'L',good:false}],
                checkIn:{name:'민지',moment:{title:'길에서 나눈 이야기',text:'다음 정차지에서 공구함을 함께 정리하기로 했다.'}},
                chapter:{title:'북쪽으로',text:'사람들이 남긴 기록을 가지고 다음 도시로 간다.'}};
              UI.onArrive();
            }""", city)
            page.wait_for_timeout(650)
            layout = page.evaluate("""() => {
              const a=document.querySelector('#arrival-scene'), b=a.querySelector('[data-arrival-continue]');
              const r=b?.getBoundingClientRect(), box=a.getBoundingClientRect();
              return {button:!!b,inside:!!r&&r.top>=box.top&&r.bottom<=box.bottom&&r.height>=44,
                overflow:a.scrollWidth>a.clientWidth+1,art:!!a.querySelector('img')?.naturalWidth};
            }""")
            check(f'{width}x{height} {city}: art and reachable continue', layout['inside'] and layout['art'] and not layout['overflow'], layout)
            if width in (360, 390) and city in ('daegu', 'miryang', 'suwon'):
                page.screenshot(path=str(SHOTS / f'{city}-{width}.png'))

    page.evaluate("document.documentElement.classList.add('ui-reduce-motion')")
    check('in-game reduced motion removes arrival animation', page.locator('.arrival-copy').evaluate("n=>getComputedStyle(n).animationName==='none'"))
    page.keyboard.press('Escape')
    page.wait_for_timeout(100)
    check('Escape closes arrival and returns keyboard focus', page.evaluate("!document.querySelector('#arrival-scene').classList.contains('on')&&document.activeElement.id==='dk-road'"))
    page.evaluate("document.documentElement.classList.remove('ui-reduce-motion')")

    # Each handoff exercises the actual engine and modal, including interruptions.
    for city, fuel, armed, expected in [
        ('daejeon', 50, False, 'perimeter_first'),
        ('miryang', 0, True, 'crisis_nofuel'),
        ('seoul', 50, True, 'seoul_gate'),
    ]:
        expected = page.evaluate("""args => {
          document.querySelectorAll('.ovl,#ev-wrap').forEach(n=>n.classList.remove('on'));
          S.at=args.city; S.fuel=args.fuel; S.flags.armed_age=args.armed;
          S.pendingArrival=args.city; UI.onArrive();
          return args.city==='seoul'?D.gateEvent.id:args.expected;
        }""", {'city':city,'fuel':fuel,'armed':armed,'expected':expected})
        page.locator('[data-arrival-continue]').click()
        page.wait_for_timeout(2400 if city == 'seoul' else 300)
        check(f'{city} hands off to {expected}', page.evaluate("id=>!S.pendingArrival&&document.querySelector('#ev-wrap').classList.contains('on')&&document.querySelector('#ev-sheet').dataset.eventId===id", expected))

    # A quiet stop with no encounter must still leave a visible keyboard target.
    page.evaluate("""() => {
      document.querySelectorAll('.ovl,#ev-wrap').forEach(n=>n.classList.remove('on'));
      S.at='yangsan'; S.fuel=50; S.pendingArrival='yangsan'; S.used=D.events.map(e=>e.id);
      window.arrivalTestOriginals={maybeCrisis:G.maybeCrisis,popStory:G.popStory};
      G.maybeCrisis=()=>false; G.popStory=()=>null; UI.onArrive();
    }""")
    page.locator('[data-arrival-continue]').click()
    page.wait_for_timeout(100)
    check('quiet stop returns focus after the engine handoff', page.evaluate("!S.pendingArrival&&document.activeElement.id==='dk-road'"))
    page.evaluate("Object.assign(G,window.arrivalTestOriginals); delete window.arrivalTestOriginals")

    page.evaluate("""() => {
      document.querySelector('#arrival-scene').classList.remove('on');
      S.party=[]; S.injuries={}; S.combat=null;
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_read')); UI.finishStory();
    }""")
    combat = page.evaluate("""() => {
      const ev=D.events.find(e=>e.id==='combat_walker_read');
      const intent=document.querySelector('.combat-intent');
      return {intent:intent?.innerText||'',visible:!!intent&&getComputedStyle(intent).display!=='none',
        lock:document.querySelector('.choice[data-i="1"]')?.innerText||'',
        illegal:D.events.filter(e=>e.combat).flatMap(e=>e.choices.flatMap(c=>c.out.filter(o=>o.fx?.combatEnd&&o.fx?.chain).map(()=>e.id)))};
    }""")
    check('enemy intent is visible before choosing', combat['visible'] and bool(combat['intent']), combat)
    check('locked companion choice explains missing companion', '민지 필요' in combat['lock'], combat)
    check('no encounter ends while chaining into combat', not combat['illegal'], combat)
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(650)
    check('combat choices remain outside the text scroller', page.locator('.event-choice-dock').evaluate("n=>n.parentElement.id==='ev-sheet'"))
    check('walker art is fully loaded', page.locator('.event-scene').evaluate('n=>n.naturalWidth>=768'))
    page.screenshot(path=str(SHOTS / 'walker-390.png'))
    page.evaluate("UI.showEvent(D.events.find(e=>e.id==='patrol_toll')); UI.finishStory()")
    scene = page.locator('.event-scene-frame').get_attribute('data-scene-key')
    check('checkpoint approach does not depict a breach', scene != 'combat-checkpoint-breach', scene)
    page.wait_for_timeout(650)
    page.screenshot(path=str(SHOTS / 'checkpoint-390.png'))
    # Failure must retain the prepared encounter through its final phase.
    phase = page.evaluate("""() => {
      const e=D.events.find(e=>e.id==='combat_walker_read');
      S.combat={id:'walker',phase:2,edge:1,pressure:1,history:[]};
      G.applyFx(e.choices.find(c=>c.tactic==='돌입').out[1].fx);
      return {active:!!S.combat,chain:S._chain,edge:S.combat?.edge};
    }""")
    check('failed approach retains encounter for phase three', phase['active'] and phase['chain']=='combat_walker_strike', phase)
    # A solo player using a tool must not summon an absent named companion.
    solo = page.evaluate("""() => {
      const e=D.events.find(e=>e.id==='combat_walker_strike');
      return e.choices.find(c=>c.tactic==='근접').out.every(o=>!o.text.includes('강우'));
    }""")
    check('solo melee outcomes do not invent a companion', solo)
    check('no runtime errors', not errors, errors)
    browser.close()

if failures:
    raise SystemExit(f'{len(failures)} failures: ' + ', '.join(failures))
