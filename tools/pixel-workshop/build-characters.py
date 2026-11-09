#!/usr/bin/env python3
"""Build the character-identity revision without touching the game or save."""
from pathlib import Path
import html
import json
import characters as C
import build as workshop
import world

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'tools/design-drafts'
ORDER = C.DATA['order']
DIALOGUE = json.loads((C.HERE / 'character-dialogue.json').read_text())['actors']


def background():
    defs = ''.join(workshop.pixel_symbol(name, spec, i) for name, spec in workshop.CATALOG['sprites'].items() for i in range(spec.get('frames', 1)))
    sky = world.rect(0, 0, 240, 144, '#1a3039') + world.sky + world.mountains + world.ground
    pines = ''.join(workshop.use('pine', x, 69) for x in [4, 23, 222])
    props = workshop.use('bench', 66, 117) + workshop.use('crate', 222, 117)
    fire = '<g class="study-fire">' + ''.join(f'<g class="cframe cframe-{i}">{workshop.use("campfire", 43, 113, i)}</g>' for i in range(4)) + '</g>'
    return f'<defs>{defs}</defs>{sky}{pines}{world.van}{props}{fire}'


def build():
    scene_actors = ''.join(C.actor(key, 20 + i * 40, 135) for i, key in enumerate(ORDER))
    # Last actor sits at220; same integer pixel scale as all source parts.
    lineup = f'<svg class="lineup motion-sample" viewBox="0 0 240 144" role="img" aria-label="이름을 가린 여섯 동료의 실제 화면 크기 비교" shape-rendering="crispEdges">{background()}{scene_actors}</svg>'
    labels = ''.join(f'<span><small>{chr(65+i)}</small><b class="identity-name">{html.escape(C.DATA["profiles"][key]["name"])}</b></span>' for i, key in enumerate(ORDER))
    cards = []
    for i, key in enumerate(ORDER):
        p = C.DATA['profiles'][key]
        portrait = C.portrait(key)
        body = f'<svg class="body-study motion-sample" viewBox="-20 -58 48 62" role="img" aria-label="인물 {chr(65+i)}의 자세와 동작" shape-rendering="crispEdges">{C.actor(key)}</svg>'
        cards.append(f'<article class="identity-card"><header><small>{chr(65+i)}</small><b class="identity-name">{p["name"]}</b></header><div class="person-pair">{portrait}{body}</div><p class="identity-name">{html.escape(p["visibleTraits"])}</p></article>')
    speakers = ''.join(f'<label><input type="radio" name="speaker" id="speaker-{key}" {"checked" if i==0 else ""}><span>{C.DATA["profiles"][key]["name"]}</span></label>' for i, key in enumerate(ORDER))
    dialog_actors = ''.join(f'<g class="selected-person selected-{key}">{C.actor(key, 180, 134)}</g>' for key in ORDER)
    dialog_world = f'<svg viewBox="0 0 240 144" class="dialogue-world" role="img" aria-label="말할 때 작업을 멈춘 인물과 야영지" shape-rendering="crispEdges">{background().replace("sprite-", "dialog-sprite-")}{dialog_actors}</svg>'
    # The dialogue scene has its own symbol IDs to keep hrefs unambiguous.
    dialog_world = dialog_world.replace('href="#sprite-', 'href="#dialog-sprite-')
    dialogue = ''.join(f'<div class="speaker-turn selected-{key}">{C.portrait(key)}<div><b>{html.escape(DIALOGUE[key]["name"])}</b><p>{html.escape(DIALOGUE[key]["line"])}</p></div></div>' for key in ORDER)
    references = ''.join(f'<figure><img src="../../{p["reference"]}" width="256" height="256" alt="{p["name"]} 기존 정본" loading="lazy"><figcaption>{p["name"]}</figcaption></figure>' for p in C.DATA['profiles'].values())
    selectors = ''.join(f'.identity-study:has(#speaker-{key}:checked) .selected-{key}{{display:block}}' for key in ORDER)
    document = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Caravan · 이름 없이도 같은 사람</title><link rel="stylesheet" href="pixel-characters.css"><style id="identity-profiles">{C.profile_rules()}{selectors}</style></head><body><main class="identity-study">
    <header class="study-head"><p class="eyebrow">CARAVAN · CHARACTER IDENTITY STUDY</p><h1>이름 없이도, 같은 사람으로.</h1><p>머리·얼굴·체형·습관을 나누고, 하나의 픽셀 세계에 다시 놓았습니다.</p></header>
    <section class="compare-tools" aria-label="인물 식별력 비교"><label><input id="names" type="checkbox"> 이름 보기</label><label><input id="uniform" type="checkbox"> 작업복 색 통일</label><label><input id="no-props" type="checkbox"> 손·몸 소품 감추기</label><label><input id="silhouette" type="checkbox"> 실루엣만 보기</label><label><input id="walk" type="checkbox"> 모두 걷기</label><label><input id="pause" type="checkbox"> 움직임 멈춤</label></section>
    <section class="group-scene"><header class="scene-heading"><h2>같은 화면 안의 여섯 사람</h2><span>240 × 144 · 공통 픽셀 규격</span></header>{lineup}<div class="name-row">{labels}</div></section>
    <p class="read-note">이름을 켜기 전에 누군지 떠올려 보세요. 옷 색과 손에 든 물건을 가려도 머리·얼굴·어깨·자세가 남습니다.</p>
    <section class="faces-section"><header class="section-heading"><h2>작은 인물과, 대화할 때의 얼굴</h2><p>얼굴은 별도 그림이 아니라 장면 속 인물과 같은 부품입니다.</p></header><div class="identity-grid">{"".join(cards)}</div></section>
    <section class="dialogue-section"><header class="section-heading"><h2>대화할 때 가까이 보기</h2><p>한 사람을 고르면 같은 얼굴과 원래 게임의 첫 대사를 보여줍니다.</p></header><fieldset class="speaker-picker"><legend>대화할 인물</legend>{speakers}</fieldset><div class="conversation-scene">{dialog_world}<div class="dialogue-box">{dialogue}</div></div></section>
    <details class="canonical"><summary>기존 정본과 비교하기</summary><div class="reference-grid">{references}</div><p>머리·얼굴·고유 소품은 기존 정본에서 확인했습니다. 키와 몸 비율, 동작 속도는 식별력을 위한 초안입니다.</p></details>
    <footer class="scope"><p>캐릭터 식별력을 검토하는 독립 시안입니다. 여섯 명은 비교를 위해 모두 배치했으며 실제 동행 명단을 재현한 화면이 아닙니다. 대사는 실제 야영 대화 원문이고, 게임의 시간·자원·선택·저장에는 연결되지 않습니다.</p><p>나무·벤치·상자는 기존 Kenney 에셋, 모닥불은 krial의 4프레임 에셋을 계속 사용합니다. 인물과 동작은 로컬 공유 정의에서 확장했습니다. 자동 검사는 형태 차이와 배치를 확인할 뿐, 사람이 실제로 누구인지 알아본다는 증명은 아닙니다.</p><a href="pixel-workshop.html">이전 통합 시안과 비교 →</a></footer>
    </main></body></html>'''
    (OUT / 'pixel-characters.html').write_text(document)
    manifest = OUT / 'manifest.json'
    data = json.loads(manifest.read_text())
    data['drafts'] = [d for d in data['drafts'] if d['id'] != 'pixel-characters-v1']
    data['drafts'].insert(0, {'id': 'pixel-characters-v1', 'file': 'pixel-characters.html', 'title': '이름 없이도 같은 사람 · 여섯 동료', 'revision': '1', 'recommended': True, 'description': '캐릭터가 서로 비슷하다는 피드백을 반영한 수정 시안. 실제 정본 여섯 초상을 확인해 머리/얼굴/체형/고유 소품/활동 동작을 구분했습니다. 이름 숨김·작업복 색 통일·몸 소품 숨김·실루엣·걷기 비교, 같은 부품의 확대 얼굴과 실제 야영 원문 대사를 제공합니다. 키/몸 비율은 초안이며 실제게임/동행명단/시간/자원/저장과 분리했습니다. 자동 적용하지 않습니다.'})
    manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'characters': ORDER, 'bytes': len(document.encode()), 'scope': 'independent identity revision'}, ensure_ascii=False))


if __name__ == '__main__':
    build()
