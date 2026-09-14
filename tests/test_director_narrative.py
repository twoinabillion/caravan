"""Opening choice readability: metadata must not collapse or ignore large text.

Regressions: joining cost and lasting information into one tiny line; breaking
Korean words despite spare wrap space; exposing unseen outcome copy.
"""
import os
import re
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CARAVAN_TEST_URL', (ROOT / '서울까지400km.html').as_uri())
ARTIFACTS = ROOT / 'artifacts/director-narrative-20260914'


@pytest.fixture
def page():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width':390,'height':844})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        yield page
        assert not errors, errors
        browser.close()


def opening(page, width=390, large=False, event='opening_parents_module'):
    page.set_viewport_size({'width':width,'height':578 if width==320 else 900 if width==1440 else 844})
    page.goto(URL)
    page.evaluate("""async ({large,event})=>{
      G.newGame('onroad','검수','full');
      S.flags.main_mission_started=true;S.flags.onboarding_event_guide=true;
      await UI.restoreQaView({screen:'game'});
      document.documentElement.classList.remove('qa-exact-replay');
      document.documentElement.classList.toggle('ui-large-text',large);
      UI.showEvent(D.openingDeparture.find(e=>e.id===event));UI.finishStory();
    }""", {'large':large,'event':event})
    page.locator('#ev-sheet [data-i]').first.wait_for(state='visible')


def settled_story(page):
    page.wait_for_function("""()=>[...document.querySelectorAll('#ev-sheet .story-entry, #ev-sheet .story-narration-text, #ev-sheet .turn-text, #ev-sheet .chat-bubble')]
      .filter(n=>n.getBoundingClientRect().height>0).every(n=>Number(getComputedStyle(n).opacity)>.99)""")


@pytest.mark.parametrize('width', [320,390,1440])
@pytest.mark.parametrize('large', [False,True])
def test_opening_information_has_separate_readable_rows(page,width,large):
    opening(page,width,large)
    settled_story(page)
    page.screenshot(path=ARTIFACTS/f'module-{width}-{"large" if large else "normal"}.png')
    choices=page.locator('#ev-sheet [data-i]')
    assert choices.count()==2
    rows=choices.first.locator('.choice-forecast')
    assert rows.count()==2, '소모와 남기는 흔적을 한 줄에 합치지 않는다'
    metrics=rows.evaluate_all("""nodes=>nodes.map(n=>{
      const r=n.getBoundingClientRect(),b=n.closest('button').getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,font:parseFloat(getComputedStyle(n).fontSize),
        fits:r.left>=b.left&&r.right<=b.right+1&&r.bottom<=b.bottom+1,
        full:n.scrollWidth<=n.clientWidth+1};
    })""")
    assert metrics[1]['top']>=metrics[0]['bottom']-1, metrics
    assert all(m['fits'] and m['full'] for m in metrics), metrics
    assert all(m['font']>=(16 if large else 12) for m in metrics), metrics
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    # All options remain reachable in the one reader scroll on short screens.
    choices.last.scroll_into_view_if_needed()
    assert choices.last.evaluate("""n=>{const r=n.getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight+1
      &&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}""")


def test_korean_choice_title_keeps_words_together(page):
    opening(page,320,True)
    title=page.locator('#ev-sheet [data-i="0"] .choice-title>span').last
    assert title.evaluate("n=>getComputedStyle(n).wordBreak")=='keep-all'
    assert title.evaluate('n=>n.scrollWidth<=n.clientWidth+1')


def test_choice_information_contrasts_in_normal_and_focus_states(page):
    opening(page)
    button=page.locator('#ev-sheet [data-i="0"]')
    for focused in [False,True]:
        if focused:
            button.focus()
        else:
            button.evaluate('n=>n.blur()')
        ratio=button.evaluate("""n=>{
          const linear=x=>(x/=255)<=.04045?x/12.92:((x+.055)/1.055)**2.4;
          const lum=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number).map(linear)
            .reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
          const bg=lum(getComputedStyle(n).backgroundColor);
          const fg=lum(getComputedStyle(n.querySelector('.choice-forecast')).color);
          return (Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05);
        }""")
        assert ratio>=4.5, ratio


def test_forecast_does_not_reveal_unseen_outcome(page):
    opening(page)
    page.evaluate("""()=>{
      UI.showEvent({id:'qa_forecast_boundary',type:'발견',scene:'intro-dashboard-module',
        text:'잠긴 상자다.',choices:[{label:'상자를 살펴본다',
          foreseeable:{expense:'시간 5분'},
          out:[{p:1,text:'숨겨진 수신기가 나타났다.',fx:{item:{'비상식량':1}}}]}]});
      UI.finishStory();
    }""")
    button=page.locator('#ev-sheet [data-i="0"]')
    assert '시간 5분' in button.inner_text()
    assert '수신기' not in button.inner_text()
    assert '비상식량' not in button.get_attribute('aria-label')


def test_mothers_memo_does_not_borrow_an_unmet_companion(page):
    opening(page)
    assert page.evaluate('S.party.length')==0
    # A speaker fallback must never introduce Minji (or another future recruit)
    # into the opening while the player is alone with a handwritten memo.
    for name in ['민지','박 선생','강우','레오','재이','은수']:
        assert name not in page.locator('.story-transcript').inner_text()


def test_combat_forecasts_keep_their_readable_inline_separators(page):
    opening(page)
    page.evaluate("""()=>{
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_read'));UI.finishStory();
    }""")
    rows=page.locator('#ev-sheet .choice-forecast').all_inner_texts()
    assert rows
    assert all(re.match(r'^(즉시|위험|노출|이후)\s+·\s+\S',row) for row in rows),rows


@pytest.mark.parametrize('width,large,choices',[
    (320,False,[0,0,0,0,0]),
    (390,True,[1,2,1,1,1]),
])
def test_new_journey_reaches_first_drive_with_saved_opening(page,width,large,choices):
    page.set_viewport_size({'width':width,'height':578 if width==320 else 844})
    page.goto(URL)
    if large:
        page.evaluate("localStorage.setItem('caravan_ui_text','large')")
        page.reload()
    page.locator('#bt-new').click()
    page.locator('#inp-name').fill('길벗')
    page.locator('#bt-name').click()
    events=['opening_workshop','opening_bus_repair','opening_failed_appeal',
            'opening_parents_module','opening_departure']
    for event,index in zip(events,choices):
        page.wait_for_function('id=>document.querySelector("#ev-sheet").dataset.eventId===id',arg=event)
        page.evaluate('UI.finishStory()')
        settled_story(page)
        page.screenshot(path=ARTIFACTS/f'journey-{width}-{event}.png')
        page.locator(f'#ev-sheet [data-i="{index}"]').click()
        page.evaluate('UI.finishStory()')
        assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
        if event=='opening_failed_appeal':
            before=page.evaluate('JSON.stringify({opening:S.opening,day:S.day,min:S.min,items:S.items,scrap:S.scrap,notes:S.notes})')
            page.reload()
            if page.locator('#bt-continue').is_visible():
                page.locator('#bt-continue').click()
            page.wait_for_selector('#ev-wrap.on')
            page.evaluate('UI.finishStory()')
            after=page.evaluate('JSON.stringify({opening:S.opening,day:S.day,min:S.min,items:S.items,scrap:S.scrap,notes:S.notes})')
            assert after==before
            assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
        page.locator('#ev-sheet .primary-exit-btn').click()
    assert page.evaluate('S.opening.completed && Object.keys(S.opening.decisions).length===5')
    assert not page.evaluate('G.isInfiniteResourceMode()')
    assert page.locator('#ev-wrap.on').count()==0
    page.screenshot(path=ARTIFACTS/f'journey-{width}-departure.png')
    page.locator('.nav-depart-cta').click()
    page.wait_for_function('!!S.driving')
    assert page.evaluate('S.driving.to')=='yangsan'
    page.screenshot(path=ARTIFACTS/f'journey-{width}-driving.png')
