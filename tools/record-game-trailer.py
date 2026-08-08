#!/usr/bin/env python3
"""Record a real-play Korean trailer from the built single-file game."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
GAME = (ROOT / '서울까지400km.html').as_uri()
OUT = ROOT / 'exports'
RAW = OUT / 'raw'
OUT.mkdir(exist_ok=True)
RAW.mkdir(exist_ok=True)


def pause(page, milliseconds):
    page.wait_for_timeout(milliseconds)


def click_if_visible(page, selector):
    node = page.locator(selector)
    if node.count() and node.first.is_visible():
        node.first.click()
        return True
    return False


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    context = browser.new_context(
        viewport={'width': 720, 'height': 1280},
        device_scale_factor=1,
        record_video_dir=str(RAW),
        record_video_size={'width': 720, 'height': 1280},
    )
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))

    # Animated title and Korean departure console.
    page.goto(GAME)
    pause(page, 4500)

    # Actual new-game, mode, and name-entry interactions.
    page.click('#bt-new')
    pause(page, 900)
    click_if_visible(page, '#mode-on')
    pause(page, 900)
    page.fill('#inp-name', '도윤')
    pause(page, 700)
    page.press('#inp-name', 'Enter')
    pause(page, 1800)

    # Let the opening story move through several real beats.
    for _ in range(5):
        page.locator('#scr-intro').click(position={'x': 360, 'y': 620})
        pause(page, 1050)

    # Enter the live HUD, then linger on the first decision surface.
    page.evaluate('UI.skipIntro()')
    pause(page, 4300)

    # Begin the first available road through its real button.
    road = page.locator('[data-go]:not([disabled])')
    if road.count():
        road.first.click()
        pause(page, 4800)

    # Live combat event and its decision UI.
    page.evaluate("""() => {
      const wrap=document.querySelector('#ev-wrap');
      if(wrap){ wrap.classList.remove('on'); wrap.setAttribute('aria-hidden','true'); }
      UI.showEvent(D.events.find(e=>e.id==='combat_walker_strike'));
      UI.finishStory();
    }""")
    pause(page, 6200)

    # Live settlement hub with its spatial interaction layout.
    page.evaluate("""() => {
      const wrap=document.querySelector('#ev-wrap');
      if(wrap){ wrap.classList.remove('on'); wrap.setAttribute('aria-hidden','true'); }
      S.at='miryang'; S.driving=null;
      if(!S.visited.includes('miryang')) S.visited.push('miryang');
      if(!S.known.includes('miryang')) S.known.push('miryang');
      UI.renderAll(); UI.showStl(D.nodes.miryang.stl);
    }""")
    pause(page, 5600)

    # A lived-in camp, using real companion and camp rendering.
    page.evaluate("""() => {
      const stl=document.querySelector('#ovl-stl');
      if(stl){ stl.classList.remove('on'); stl.setAttribute('aria-hidden','true'); }
      for(const id of ['minji','leo']){
        if(!S.party.includes(id)) S.party.push(id);
        S.comps[id].lvl=2; S.comps[id].bond=5; S.comps[id].mood=74;
      }
      S.min=20*60; S.up.bench=true; UI.renderAll();
      const buttons=[...document.querySelectorAll('button')];
      const camp=buttons.find(b=>b.offsetParent&&/(야영|캠프|밤|쉬기)/.test(b.textContent));
      if(camp) camp.click();
    }""")
    pause(page, 5600)

    # Finish on the real ending screen, then return to the animated title.
    page.evaluate("""() => {
      const camp=document.querySelector('#ovl-camp');
      if(camp){ camp.classList.remove('on'); camp.setAttribute('aria-hidden','true'); }
      UI.showEnding('story_done');
    }""")
    pause(page, 5000)
    page.goto(GAME)
    pause(page, 3800)

    video = page.video
    context.close()
    raw_path = Path(video.path())
    target = RAW / 'caravan-gameplay-trailer.webm'
    if raw_path != target:
        raw_path.replace(target)
    browser.close()
    print({'video': str(target), 'pageerrors': errors})
