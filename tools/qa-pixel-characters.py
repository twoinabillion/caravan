#!/usr/bin/env python3
"""Identity-study evidence. Separate browser, native controls, read-only DOM QA."""
from pathlib import Path
import hashlib
import json
import copy
import importlib.util
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-artifacts/pixel-characters-20261106'
IDS = ['minji', 'parkss', 'kangwoo', 'leo', 'jaeyi', 'eunsu']
URL = 'http://127.0.0.1:4386/tools/design-drafts/pixel-characters.html'


def main():
    OUT.mkdir(exist_ok=True)
    before = (ROOT / 'tools/design-drafts/pixel-characters.html').read_bytes()
    subprocess.run(['python3', 'tools/pixel-workshop/build-characters.py'], cwd=ROOT, check=True, capture_output=True)
    assert before == (ROOT / 'tools/design-drafts/pixel-characters.html').read_bytes()
    errors, external = [], []
    evidence = {'scope': 'standalone identity revision, not production or human recognition proof', 'localDeterministicBuild': True}
    # A seventh profile, altered anatomy/hand animation and a new held tool
    # are supplied as data, without adding a renderer identity branch.
    spec = importlib.util.spec_from_file_location('character_extension', ROOT / 'tools/pixel-workshop/characters.py')
    C = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(C)
    C.DATA = copy.deepcopy(C.DATA)
    new = copy.deepcopy(C.DATA['profiles']['minji'])
    new['name'] = '확장 검사 인물'
    new['hair'] = [[-7, -3, 14, 3, 'hair'], [-8, 0, 3, 7, 'hair'], [5, 0, 3, 7, 'hair']]
    new['headAccessories'] = []
    new['faceRows'][10] = [10, -5, 11]
    new['signatureProp'] = {'anchor': 'hand', 'rects': [[0, -1, 5, 2, 'wood'], [4, -2, 4, 3, 'metal']]}
    for i, frame in enumerate(new['activityFrames']):
        frame['hands'][1] = [12 + i % 2, -19 + i]
    C.DATA['profiles']['extension'] = new
    fixture = '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../../tools/design-drafts/pixel-characters.css"><style>' + C.profile_rules() + '</style><main class="identity-study"><label><input id="walk" type="checkbox">걷기</label><svg class="extension-body motion-sample" viewBox="-24 -58 56 62" width="224" height="248">' + C.actor('extension') + '</svg>' + C.portrait('extension') + '</main>'
    (OUT / 'data-extension.html').write_text(fixture)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 960, 'height': 1100}, device_scale_factor=1)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: external.append(r.url) if not r.url.startswith('http://127.0.0.1:4386/') else None)
        page.goto(URL)
        assert page.locator('script,iframe').count() == 0
        assert page.locator('.name-row .identity-name').evaluate_all("es=>es.every(e=>getComputedStyle(e).visibility==='hidden')")
        samples = {key: set() for key in IDS}
        for _ in range(21):
            for key in IDS:
                state = page.locator(f'.lineup .identity-{key} .cmode-activity').evaluate("e=>[...e.querySelectorAll('.cframe')].find(e=>+getComputedStyle(e).opacity>.9)?.dataset.frame")
                samples[key].add(state)
            page.wait_for_timeout(90)
        assert all(len(frames) == 4 and None not in frames for frames in samples.values())
        # The portrait and every body frame use the exact same actual head markup.
        for key in IDS:
            head = page.locator(f'.identity-grid .identity-{key} .portrait-head').inner_html()
            heads = page.locator(f'.identity-grid .identity-{key} .head-anchor').all()
            assert len(heads) == 8 and all(h.inner_html() == head for h in heads)
        # Validate every frame's actual source-space extents, not just the
        # group scene. A tool can fit the world but clip in its enlarged card.
        frame_bounds = []
        for mode in ['activity', 'walk']:
            if mode == 'walk':
                page.locator('#walk').check()
            bounds = page.locator('.body-study').evaluate_all('''(svgs,mode)=>svgs.flatMap(svg=>{
              const v=svg.viewBox.baseVal;
              return [...svg.querySelectorAll('.cmode-'+mode+' .cframe')].map(frame=>{
                const b=frame.getBBox();return {character:svg.querySelector('[data-character]').dataset.character,mode,frame:frame.dataset.frame,
                  inside:b.x>=v.x&&b.y>=v.y&&b.x+b.width<=v.x+v.width&&b.y+b.height<=v.y+v.height,
                  bbox:[b.x,b.y,b.width,b.height],viewBox:[v.x,v.y,v.width,v.height]};
              });
            })''', mode)
            assert all(b['inside'] for b in bounds), [b for b in bounds if not b['inside']]
            frame_bounds.extend(bounds)
        page.locator('#walk').uncheck()
        page.locator('.group-scene').screenshot(path=str(OUT / 'group-desktop.png'))
        page.locator('.identity-grid').screenshot(path=str(OUT / 'faces-desktop.png'))
        page.locator('#names').check()
        assert page.locator('.name-row .identity-name').evaluate_all("es=>es.every(e=>getComputedStyle(e).visibility==='visible')")
        page.locator('#uniform').check()
        assert page.locator('.lineup .person').evaluate_all("es=>new Set(es.map(e=>getComputedStyle(e).getPropertyValue('--coat').trim())).size") == 1
        page.locator('#no-props').check()
        assert page.locator('.signature-prop').evaluate_all("es=>es.every(e=>getComputedStyle(e).display==='none')")
        page.locator('#walk').check()
        assert page.locator('.lineup .cmode-walk').evaluate_all("es=>es.every(e=>getComputedStyle(e).display!=='none')")
        page.locator('#pause').check()
        assert page.evaluate("document.getAnimations().every(a=>a.playState==='paused')")
        page.emulate_media(reduced_motion='reduce')
        assert page.evaluate('document.getAnimations().length') == 0
        page.locator('#silhouette').check()
        silhouettes = {}
        for key in IDS:
            svg = page.locator(f'.identity-grid .body-study:has(.identity-{key})')
            data = svg.screenshot()
            silhouettes[key] = hashlib.sha256(data).hexdigest()
        assert len(set(silhouettes.values())) == 6
        page.locator('.group-scene').screenshot(path=str(OUT / 'silhouettes-desktop.png'))
        # Each selected speaker uses the right face and actual canonical dialogue.
        lines = json.loads((ROOT / 'tools/pixel-workshop/character-dialogue.json').read_text())['actors']
        for key in IDS:
            page.locator('#speaker-' + key).check()
            visible = page.locator('.selected-person').evaluate_all("es=>es.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.classList[1])")
            assert visible == ['selected-' + key]
            assert page.locator('.speaker-turn.selected-' + key + ' p').inner_text() == lines[key]['line']
            assert page.locator('.speaker-turn.selected-' + key + ' .portrait-head .face-speaking').evaluate("e=>getComputedStyle(e).display") != 'none'
        page.locator('#pause').uncheck()
        page.locator('#names').uncheck()
        for control in ['uniform', 'no-props', 'silhouette', 'walk']:
            page.locator('#' + control).uncheck()
        layouts = []
        for width, height in [(320, 740), (360, 850), (480, 900), (800, 360), (960, 1100)]:
            page.set_viewport_size({'width': width, 'height': height})
            assert page.evaluate('document.documentElement.scrollWidth') <= width
            for control in page.locator('.compare-tools label,.speaker-picker label').all():
                b = control.bounding_box()
                assert b['height'] >= 44 and b['x'] >= 0 and b['x'] + b['width'] <= width
            assert page.locator('.lineup .person').evaluate_all("es=>{const w=document.querySelector('.lineup').getBoundingClientRect();return es.every(e=>{const b=e.getBoundingClientRect();return b.left>=w.left&&b.right<=w.right&&b.top>=w.top&&b.bottom<=w.bottom})}")
            if width in [360, 960]:
                page.locator('.group-scene').screenshot(path=str(OUT / f'group-{width}.png'))
                page.locator('.identity-grid').screenshot(path=str(OUT / f'faces-{width}.png'))
                for key in IDS:
                    page.locator('#speaker-' + key).check()
                    page.locator('.conversation-scene').screenshot(path=str(OUT / f'dialogue-{key}-{width}.png'))
            layouts.append({'width': width, 'height': height, 'overflow': False, 'controlsReachable': True, 'actorBoundsInside': True})
        page.locator('.canonical summary').click()
        page.wait_for_function("[...document.querySelectorAll('.reference-grid img')].every(e=>e.complete&&e.naturalWidth>0)")
        page.emulate_media(reduced_motion='no-preference')
        page.goto('http://127.0.0.1:4386/qa-artifacts/pixel-characters-20261106/data-extension.html')
        assert page.locator('[data-character="extension"]').count() == 1
        extension_frames = set()
        for _ in range(12):
            extension_frames.add(page.locator('.extension-body .cmode-activity').evaluate("e=>[...e.querySelectorAll('.cframe')].find(e=>+getComputedStyle(e).opacity>.9)?.dataset.frame"))
            page.wait_for_timeout(90)
        assert len(extension_frames) == 4 and None not in extension_frames
        expected = ','.join(map(str, new['activityFrames'][0]['hands'][1]))
        frame = page.locator('.extension-body .cmode-activity .cframe-0')
        assert frame.get_attribute('data-right-hand') == expected
        assert frame.locator('.signature-prop').get_attribute('transform') == 'translate(' + expected.replace(',', ' ') + ')'
        assert frame.locator('.head-anchor').inner_html() == page.locator('.portrait-head').inner_html()
        page.locator('#walk').check()
        assert page.locator('.cmode-walk').evaluate("e=>getComputedStyle(e).display") != 'none'
        assert page.evaluate('document.documentElement.scrollWidth') <= 960
        page.screenshot(path=str(OUT / 'data-only-extension.png'), full_page=True)
        assert not errors and not external
        evidence.update({'profiles': IDS, 'observedFrames': {key: sorted(frames) for key, frames in samples.items()}, 'portraitUsesSameHead': True, 'bodyCardFrameBounds': frame_bounds, 'silhouetteHashesWithUniformCoatAndHiddenProps': silhouettes, 'distinctSilhouettes': 6, 'dataOnlyCharacterExtension': {'profile': 'extension', 'newHeadAnatomy': True, 'newHeldTool': True, 'newHandFrames': True, 'portraitBodyParity': True, 'activityAndWalk': True}, 'namesInitiallyHidden': True, 'uniformCoats': True, 'propsHidden': True, 'speakerCanonicalLines': True, 'pause': True, 'reducedAnimations': 0, 'layouts': layouts, 'canonicalReferencesLoaded': True, 'pageErrors': errors, 'externalRuntimeRequests': external})
        (OUT / 'verification.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({k:v for k,v in evidence.items() if k not in ['bodyCardFrameBounds','silhouetteHashesWithUniformCoatAndHiddenProps']}, ensure_ascii=False))
        browser.close()


if __name__ == '__main__':
    main()
