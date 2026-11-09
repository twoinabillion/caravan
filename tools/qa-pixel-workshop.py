#!/usr/bin/env python3
"""Render/interaction evidence for the standalone pixel extension milestone.

Separate Chromium context, never the user's game/profile. DOM evaluation is
read-only; all changes use visible native radios, links and checkboxes.
"""
from pathlib import Path
import hashlib
import itertools
import json
import copy
import contextlib
import importlib.util
import io
import shutil
import subprocess
import sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-artifacts/pixel-workshop-20261106'
URL = 'http://127.0.0.1:4386/tools/design-drafts/pixel-workshop.html'

ACTOR_STATE = '''(identity)=>{
 const actor=document.querySelector('.actor.'+identity);
 const pose=[...actor.querySelectorAll('.pose')].find(e=>getComputedStyle(e).display!=='none');
 const frame=[...pose.querySelectorAll('.frame')].find(e=>+getComputedStyle(e).opacity>.9);
 const tool=[...frame.querySelectorAll('.held')].find(e=>getComputedStyle(e).display!=='none');
 const hair=[...frame.querySelectorAll('.hair')].find(e=>getComputedStyle(e).display!=='none');
 const expression=[...frame.querySelectorAll('.expression')].find(e=>getComputedStyle(e).display!=='none');
 const anchor=frame.querySelector('.tool-anchor');const b=tool.getBoundingClientRect();
 const world=document.querySelector('.world').getBoundingClientRect();
 return {pose:frame.dataset.pose,frame:+frame.dataset.frame,tool:tool.classList[1],hair:hair.classList[1],expression:expression.dataset.expression,
  cloth:getComputedStyle(actor).getPropertyValue('--cloth').trim(),hand:anchor.dataset.hand,transform:anchor.getAttribute('transform'),
  attached:anchor.getAttribute('transform')==='translate('+anchor.dataset.hand.replace(',',' ')+')',
  toolInside:b.left>=world.left&&b.right<=world.right&&b.top>=world.top&&b.bottom<=world.bottom,
  ground:actor.dataset.ground};
}'''


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # Prove local reproducibility and retention of exact source originals.
    generated = ROOT / 'tools/design-drafts/pixel-workshop.html'
    first = generated.read_bytes()
    subprocess.run(['python3', 'tools/pixel-workshop/build.py'], cwd=ROOT, check=True, capture_output=True)
    assert generated.read_bytes() == first
    provenance = json.loads((ROOT / 'tools/pixel-workshop/vendor/provenance.json').read_text())
    for source in provenance['sources']:
        data = (ROOT / 'tools/pixel-workshop/vendor' / source['file']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == source['sha256']
    # Add parts not known to the builder/CSS. No production catalog is modified.
    sys.path.insert(0, str(ROOT / 'tools/pixel-workshop'))
    spec = importlib.util.spec_from_file_location('pixel_workshop_extension', ROOT / 'tools/pixel-workshop/build.py')
    extension = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(extension)
    extension.ACTORS = copy.deepcopy(extension.ACTORS)
    extension.ACTORS['heads']['bun'] = [[-6, -7, 10, 4, 'hair'], [-9, -8, 4, 4, 'hair'], [-6, -4, 3, 6, 'hair']]
    extension.ACTORS['tools']['brush'] = [[0, -1, 6, 2, 'wood'], [5, -3, 3, 5, 'metal']]
    extension.ACTORS['clothes']['teal'] = {'label': '청록색', 'colors': {'cloth': 'leaf', 'clothShade': 'ink', 'clothLight': 'metal'}}
    extension.ACTORS['poses']['wave'] = copy.deepcopy(extension.ACTORS['poses']['idle'])
    for i, frame in enumerate(extension.ACTORS['poses']['wave']):
        frame['hand'] = [13 + (i % 2), -23 + i]
    extension.OUT = OUT / 'extension'
    extension.OUT.mkdir(exist_ok=True)
    (extension.OUT / 'manifest.json').write_text('{"drafts":[]}')
    shutil.copyfile(ROOT / 'tools/design-drafts/pixel-workshop.css', extension.OUT / 'pixel-workshop.css')
    with contextlib.redirect_stdout(io.StringIO()):
        extension.build()
    errors, external = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 960, 'height': 1100}, device_scale_factor=1)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: external.append(r.url) if not r.url.startswith('http://127.0.0.1:4386/') else None)
        page.goto(URL)
        assert page.locator('script,iframe').count() == 0
        page.locator('.game-preview').screenshot(path=str(OUT / 'camp-desktop.png'))
        fire_frames, worker_frames = set(), set()
        for _ in range(12):
            fire_frames.add(page.locator('.fire').evaluate("e=>[...e.querySelectorAll('.frame')].find(e=>+getComputedStyle(e).opacity>.9)?.classList[1]"))
            worker_frames.add(page.evaluate(ACTOR_STATE, 'minji')['frame'])
            page.wait_for_timeout(100)
        assert len(fire_frames) == 4 and len(worker_frames) == 4
        variants = []
        for hair, coat, tool, action in itertools.product(['short', 'ponytail', 'cap'], ['olive', 'rust'], ['lamp', 'wrench'], ['idle', 'walk', 'work']):
            for key, value in [('hair', hair), ('coat', coat), ('tool', tool), ('action', action)]:
                page.locator(f'#{key}-{value}').check()
            state = page.evaluate(ACTOR_STATE, 'newcrew')
            assert state['hair'] == 'hair-' + hair and state['tool'] == 'held-' + tool and state['pose'] == action
            assert state['attached'] and state['toolInside'] and state['ground'] == '88,134'
            assert state['cloth'] == ('#996b4c' if coat == 'rust' else '#4d6248')
            variants.append({'hair': hair, 'coat': coat, 'tool': tool, 'action': action, 'state': state})
        page.locator('#action-work').check()
        page.locator('#tool-wrench').check()
        page.locator('#hair-ponytail').check()
        page.locator('.game-preview').screenshot(path=str(OUT / 'custom-work-desktop.png'))
        page.locator('.start-talk').click()
        assert page.evaluate(ACTOR_STATE, 'minji')['pose'] == 'idle'
        assert page.evaluate(ACTOR_STATE, 'minji')['expression'] == 'speaking'
        before = page.evaluate(ACTOR_STATE, 'minji')
        ambient = page.locator('.fire').evaluate("e=>[...e.querySelectorAll('.frame')].find(e=>+getComputedStyle(e).opacity>.9).classList[1]")
        page.wait_for_timeout(250)
        assert page.evaluate(ACTOR_STATE, 'minji') == before
        assert page.locator('.fire').evaluate("e=>[...e.querySelectorAll('.frame')].find(e=>+getComputedStyle(e).opacity>.9).classList[1]") != ambient
        page.locator('.turn-one .next').click()
        assert page.evaluate(ACTOR_STATE, 'newcrew')['expression'] == 'speaking'
        assert page.evaluate(ACTOR_STATE, 'newcrew')['tool'] == 'held-wrench'
        # Appearance changes retain the speaking face and its tool attachment.
        page.locator('#hair-cap').check()
        assert page.evaluate(ACTOR_STATE, 'newcrew')['expression'] == 'speaking'
        page.locator('.turn-two .next').click()
        assert page.locator('.choices a').count() == 2
        page.locator('.choices a[href="#done"]').click()
        assert page.evaluate(ACTOR_STATE, 'minji')['expression'] == 'relaxed'
        assert page.evaluate(ACTOR_STATE, 'minji')['pose'] == 'idle'
        page.locator('.game-preview').screenshot(path=str(OUT / 'completed-desktop.png'))
        page.locator('.turn-done .next').click()
        assert page.evaluate(ACTOR_STATE, 'minji')['pose'] == 'work'
        # Explicit second choice and cancel each resume the study, without paid effects.
        page.locator('.start-talk').click()
        page.locator('.cancel-talk').click()
        assert page.evaluate(ACTOR_STATE, 'minji')['pose'] == 'work'
        page.locator('.start-talk').click()
        page.locator('.turn-one .next').click()
        page.locator('.turn-two .next').click()
        page.locator('.choices a[href="#resume"]').click()
        assert page.evaluate(ACTOR_STATE, 'minji')['pose'] == 'work'
        # Manual pause freezes frame selection; unpause permits actual frame changes.
        page.locator('#pause').check()
        state = page.evaluate(ACTOR_STATE, 'minji')
        page.wait_for_timeout(350)
        assert page.evaluate(ACTOR_STATE, 'minji') == state
        assert page.evaluate("document.getAnimations().every(a=>a.playState==='paused')")
        page.locator('#pause').uncheck()
        layouts = []
        for width in [320, 360, 480, 960]:
            page.set_viewport_size({'width': width, 'height': 850})
            for place in ['night', 'day']:
                page.locator('#place-' + place).check()
                assert page.locator('.env-' + place).evaluate("e=>getComputedStyle(e).display") != 'none'
                assert page.locator('.world use').count() >= 12
                b = page.locator('.ambient-bubble').bounding_box()
                w = page.locator('.world').bounding_box()
                assert b['x'] >= w['x'] and b['x'] + b['width'] <= w['x'] + w['width']
                assert b['y'] + b['height'] < w['y'] + w['height']
                assert page.evaluate('document.documentElement.scrollWidth') <= width
                if width in [360, 960]:
                    page.locator('.game-preview').screenshot(path=str(OUT / f'{place}-{width}.png'))
                page.locator('.start-talk').click()
                assert page.locator('.turn-one').is_visible()
                if width == 360:
                    page.locator('.game-preview').screenshot(path=str(OUT / f'dialogue-{place}-mobile.png'))
                page.locator('.turn-one .next').click()
                page.locator('.turn-two .next').click()
                for choice in page.locator('.choices a').all():
                    cb = choice.bounding_box()
                    assert cb['height'] >= 44 and cb['x'] >= 0 and cb['x'] + cb['width'] <= width
                assert page.evaluate('document.documentElement.scrollWidth') <= width
                if width == 360:
                    page.locator('.game-preview').screenshot(path=str(OUT / f'choices-{place}-mobile.png'))
                page.locator('.cancel-talk').click()
                layouts.append({'width': width, 'place': place, 'overflow': False, 'bubbleInside': True, 'choicesReachable': True})
        page.emulate_media(reduced_motion='reduce')
        assert page.evaluate('document.getAnimations().length') == 0
        for identity in ['minji', 'newcrew']:
            assert page.evaluate(ACTOR_STATE, identity)['frame'] == 0
        page.locator('#action-work').check()
        page.locator('#tool-lamp').check()
        assert page.evaluate(ACTOR_STATE, 'newcrew')['attached']
        page.locator('.game-preview').screenshot(path=str(OUT / 'reduced-motion.png'))
        page.emulate_media(reduced_motion='no-preference')
        page.goto('http://127.0.0.1:4386/qa-artifacts/pixel-workshop-20261106/extension/pixel-workshop.html')
        assert page.locator('.newcrew .pose-idle .frame-0 .hair').evaluate_all("es=>es.filter(e=>getComputedStyle(e).display!=='none').length") == 1
        assert page.locator('.newcrew .pose-idle .frame-0 .held').evaluate_all("es=>es.filter(e=>getComputedStyle(e).display!=='none').length") == 1
        for field, value in [('hair', 'bun'), ('coat', 'teal'), ('tool', 'brush'), ('action', 'wave')]:
            page.locator(f'#{field}-{value}').check()
        extended = page.evaluate(ACTOR_STATE, 'newcrew')
        assert extended['hair'] == 'hair-bun' and extended['tool'] == 'held-brush' and extended['pose'] == 'wave'
        assert extended['attached'] and extended['toolInside'] and extended['cloth'] == '#48634c'
        page.locator('.game-preview').screenshot(path=str(OUT / 'new-data-only-extension.png'))
        page.locator('.start-talk').click()
        page.locator('.turn-one .next').click()
        assert page.evaluate(ACTOR_STATE, 'newcrew')['expression'] == 'speaking'
        assert page.evaluate(ACTOR_STATE, 'newcrew')['hair'] == 'hair-bun'
        assert page.evaluate('document.documentElement.scrollWidth') <= 960
        assert not errors and not external
        evidence = {'scope': 'independent script-free study; not production/game-save validation', 'sourcesUnmodified': True, 'offlineDeterministicBuild': True, 'fireFrames': sorted(fire_frames), 'workerFrames': sorted(worker_frames), 'variants': variants, 'layouts': layouts, 'dialogue': {'manualAdvance': True, 'speakingWorkerPaused': True, 'ambientContinues': True, 'secondSpeakerExpression': True, 'appearanceSwapRetainsExpression': True, 'bothChoicesAndCancel': True, 'completionStopsWork': True}, 'dataOnlyExtension': {'head': 'bun', 'tool': 'brush', 'clothes': 'teal', 'pose': 'wave', 'selectedState': extended, 'onlyOneHeadAndToolVisible': True, 'speakingExpressionRetained': True}, 'pause': True, 'reducedAnimations': 0, 'pageErrors': errors, 'externalRuntimeRequests': external}
        (OUT / 'verification.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({k: v for k, v in evidence.items() if k not in ['variants']}, ensure_ascii=False))
        browser.close()


if __name__ == '__main__':
    main()
