#!/usr/bin/env python3
"""Offline authoring spike. Build a script-free study from editable local parts.

No game imports/state access. Source PNGs are read, never overwritten. Pixel runs
become SVG so original silhouettes can use a shared material palette. Requires Pillow.
"""
from pathlib import Path
import hashlib
import html
import json
import re
from PIL import Image
import world

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'tools/design-drafts'
STYLE = json.loads((HERE / 'style.json').read_text())
CATALOG = json.loads((HERE / 'catalog.json').read_text())
ACTORS = json.loads((HERE / 'actors.json').read_text())
PALETTE = STYLE['palette']


def color(role):
    return f'var(--{role},{PALETTE[role]})'


def box(x, y, w, h, role):
    assert all(isinstance(n, int) for n in [x, y, w, h]) and w > 0 and h > 0
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color(role)}"/>'


def parts(rows):
    return ''.join(box(*r) for r in rows)


def pixel_symbol(name, spec, frame):
    im = Image.open(HERE / 'vendor' / spec['source']).convert('RGBA')
    x, y, w, h = spec['rect']
    dx, dy = spec.get('stride', [0, 0])
    x += frame * dx
    y += frame * dy
    assert x >= 0 and y >= 0 and x + w <= im.width and y + h <= im.height
    result = []
    for row in range(h):
        col = 0
        while col < w:
            rgba = im.getpixel((x + col, y + row))
            if not rgba[3]:
                col += 1
                continue
            key = ''.join(f'{v:02x}' for v in rgba[:3])
            role = spec['palette'][key]  # Fail on an unaccounted source color.
            end = col + 1
            while end < w and im.getpixel((x + end, y + row)) == rgba:
                end += 1
            result.append(box(col, row, end - col, 1, role))
            col = end
    return f'<g id="sprite-{name}-{frame}" data-source="{spec["source"]}" data-frame="{frame}">{"".join(result)}</g>'


def use(name, x, y, frame=0):
    return f'<use href="#sprite-{name}-{frame}" x="{x}" y="{y}"/>'


def expression():
    return (
        '<g class="expression focused" data-expression="focused">'
        + box(2, -3, 2, 1, 'ink') + box(3, -1, 1, 1, 'ink') + box(2, 3, 3, 1, 'woodDark') + '</g>'
        + '<g class="expression speaking" data-expression="speaking">'
        + box(2, -3, 2, 1, 'ink') + box(3, -1, 1, 2, 'ink') + box(2, 3, 2, 2, 'woodDark') + '</g>'
        + '<g class="expression relaxed" data-expression="relaxed">'
        + box(2, -1, 2, 1, 'ink') + box(2, 3, 1, 1, 'woodDark') + box(3, 4, 2, 1, 'woodDark') + '</g>'
    )


def actor_frame(identity, pose, index, f):
    hx, hy = f['head']
    bx, by, bw, bh = f['body']
    wx, wy = f['hand']
    outfit = box(bx, by, bw, bh, 'cloth') + box(bx, by + 2, 3, bh - 2, 'clothShade')
    outfit += box(bx + 4, by + 1, 1, bh - 3, 'clothLight') + box(bx, by + bh - 2, bw, 2, 'woodDark')
    for lx, ly, lw, lh in f['legs']:
        outfit += box(lx, ly, lw, lh, 'shade') + box(lx - 1, min(ly + lh, -1), lw + 2, 2, 'ink')
    head = box(-4, -5, 9, 10, 'skinShade') + box(0, -4, 6, 8, 'skin') + box(5, -1, 2, 3, 'skin')
    options = ['ponytail'] if identity == 'minji' else ACTORS['heads'].keys()
    head += ''.join(f'<g class="hair hair-{key}">{parts(ACTORS["heads"][key])}</g>' for key in options)
    if ACTORS['appearances'][identity]['goggles']:
        head += box(-3, -7, 3, 2, 'woodLight') + box(2, -7, 3, 2, 'woodLight')
        head += box(-2, -7, 1, 1, 'light') + box(3, -7, 1, 1, 'light')
    head += expression()
    shoulder_y = by + 3
    # Every pose carries the wrist and tool in the same local frame.
    arm = box(4, shoulder_y, 4, 7, 'clothShade')
    arm += box(7, min(shoulder_y + 5, wy), 4, abs(shoulder_y + 5 - wy) + 3, 'cloth')
    arm += box(10, wy, max(wx - 10, 1), 3, 'cloth') + box(wx - 1, wy, 3, 3, 'skin')
    keys = ['wrench'] if identity == 'minji' else ACTORS['tools'].keys()
    held = ''.join(f'<g class="held held-{key}">{parts(ACTORS["tools"][key])}</g>' for key in keys)
    head_group = f'<g class="head" transform="translate({hx} {hy})">{head}</g>'
    tool_group = f'<g class="tool-anchor" data-hand="{wx},{wy}" transform="translate({wx} {wy})">{held}</g>'
    return f'<g class="frame frame-{index}" data-pose="{pose}" data-frame="{index}" data-head="{hx},{hy}">{outfit}{head_group}{arm}{tool_group}</g>'


def actor(identity, x, y):
    poses = ''.join(
        f'<g class="pose pose-{key}">' + ''.join(actor_frame(identity, key, i, f) for i, f in enumerate(frames)) + '</g>'
        for key, frames in ACTORS['poses'].items()
    )
    return f'<g transform="translate({x} {y})"><g class="actor {identity}" data-identity="{identity}" data-ground="{x},{y}">{poses}</g></g>'


def scene():
    defs = ''.join(pixel_symbol(name, spec, i) for name, spec in CATALOG['sprites'].items() for i in range(spec.get('frames', 1)))
    night = world.rect(0, 0, 240, 144, PALETTE['night']) + world.sky + world.mountains + world.ground
    day = world.rect(0, 0, 240, 144, PALETTE['day']) + world.mountains.replace('#263e46', '#617a6b').replace('#263d3d', '#576c57')
    day += world.rect(0, 95, 240, 49, '#667153') + world.rect(0, 111, 240, 33, '#5a6549')
    # A second environment uses the same renderer, assets, grid and material roles.
    day += world.rect(1, 47, 77, 49, '#72785d') + world.rect(0, 45, 80, 3, '#425647')
    for x in [9, 29, 49]:
        day += world.rect(x, 57, 12, 17, '#3a544d') + world.rect(x + 1, 58, 10, 1, '#9ba080')
    day += world.rect(20, 81, 44, 3, '#a18a62')
    trees = ''.join(use('pine', x, y) for x, y in [(4, 71), (20, 66), (37, 77), (220, 65), (232, 79)])
    props = use('bench', 68, 117) + use('crate', 224, 119) + use('barrel', 5, 118)
    kettle = '<g class="kettle" transform="translate(62 125)">' + parts(ACTORS['originalProps']['kettle']) + '</g>'
    steam = '<g class="steam">' + world.rect(60, 112, 2, 2, '#a5b49b') + world.rect(62, 109, 2, 2, '#a5b49b') + '</g>'
    fire = '<g class="fire" data-source="krial-campfire.png">' + ''.join(f'<g class="frame frame-{i}">{use("campfire", 43, 115, i)}</g>' for i in range(4)) + '</g>'
    glow = '<g class="fire-glow"><ellipse cx="51" cy="130" rx="25" ry="6" fill="#efb85b" opacity=".08"/></g>'
    return f'''<svg viewBox="0 0 240 144" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="같은 픽셀 세계의 달구지, 민지와 새 동료. 불과 작업이 이어집니다." shape-rendering="crispEdges"><defs>{defs}</defs>
    <g class="env-night">{night}</g><g class="env-day">{day}</g>{trees}{world.van}{world.lamp}{world.box}{props}{glow}{fire}{kettle}{steam}{actor('newcrew', 88, 134)}{actor('minji', 180, 131)}</svg>'''


def radio_group(legend, name, values, checked):
    items = ''.join(f'<label><input type="radio" id="{name}-{key}" name="{name}" value="{key}" {"checked" if key == checked else ""}><span>{html.escape(label)}</span></label>' for key, label in values)
    return f'<fieldset><legend>{legend}</legend><div class="options">{items}</div></fieldset>'


def variants():
    """All added catalog parts get one selector and stay hidden unless selected."""
    groups = [('heads', 'hair', '새 동료 · 머리', 'hair'), ('clothes', 'coat', '새 동료 · 작업복', 'clothes'),
              ('tools', 'tool', '새 동료 · 손에 든 도구', 'tool'), ('poses', 'action', '새 동료 · 동작', 'pose')]
    controls, rules = [], []
    appearance = ACTORS['appearances']['newcrew']
    for catalog, field, legend, default_key in groups:
        rows = ACTORS[catalog]
        assert all(re.fullmatch('[a-z][a-z0-9_-]*', key) for key in rows), 'unsafe part identifier'
        default = appearance.get(default_key, next(iter(rows)))
        assert default in rows, f'missing default {catalog}: {default}'
        labels = ACTORS.get('labels', {}).get(catalog, {})
        values = [(key, value.get('label', key) if catalog == 'clothes' else labels.get(key, key)) for key, value in rows.items()]
        controls.append(radio_group(legend, field, values, default))
        for key, value in rows.items():
            selector = f'.workshop:where(:has(#{field}-{key}:checked)) .newcrew'
            if catalog == 'clothes':
                declarations = ';'.join(f'--{role}:{PALETTE[color_role]}' for role, color_role in value['colors'].items())
                assert set(value['colors']) <= {'cloth', 'clothShade', 'clothLight'}
                rules.append(f'{selector}{{{declarations}}}')
            else:
                part = {'heads': 'hair', 'tools': 'held', 'poses': 'pose'}[catalog]
                rules.append(f'{selector} .{part}-{key}{{display:inline}}')
    return ''.join(controls), ''.join(rules)


def build():
    OUT.mkdir(exist_ok=True)
    controls = radio_group('배경', 'place', [('night', '밤 야영지'), ('day', '낮 정비소')], 'night')
    part_controls, part_rules = variants()
    controls += part_controls
    provenance = json.loads((HERE / 'vendor/provenance.json').read_text())
    sources = ''.join(f'<li><a href="{html.escape(s["creatorUrl"])}">{html.escape(s["author"])} · {html.escape(s["title"])}</a> — {s["license"]}</li>' for s in provenance['sources'])
    doc = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Caravan · 함께 만드는 픽셀 세계</title><link rel="stylesheet" href="pixel-workshop.css"><style id="pixel-workshop-variants">{part_rules}</style></head><body>
    <main class="workshop"><header class="study-head"><p class="eyebrow">CARAVAN · ONE WORLD, MANY STORIES</p><h1>같은 세계를, 계속 넓혀 가기.</h1><p>기존 픽셀 부품과 우리 인물·도구를 한 장면에 놓았어요.</p></header>
    <article class="game-preview" aria-label="픽셀 야영지 통합 시안"><header class="location"><h2><span class="name-night">밀양 외곽 야영지</span><span class="name-day">밀양의 작은 정비소</span></h2><span class="clock-night">DAY 2 · 밤</span><span class="clock-day">DAY 2 · 늦은 오후</span></header>
    <span id="talk" class="state-anchor"></span><span id="listen" class="state-anchor"></span><span id="choice" class="state-anchor"></span><span id="done" class="state-anchor"></span><span id="resume" class="state-anchor"></span>
    <div class="world">{scene()}<div class="ambient-bubble"><b>민지</b><span>조금만 더 조이면 돼.</span></div></div>
    <section class="conversation" aria-label="대화"><div class="talk-turn turn-one"><b>민지</b><p>대장님, 잠깐만. 내일 출발하기 전에 바퀴 쪽을 한 번 더 보고 싶어.</p><a href="#listen" class="next">다음 <span>→</span></a></div>
    <div class="talk-turn turn-two"><b>새 동료</b><p>아까부터 그쪽을 보고 있었네. 어디가 마음에 걸려?</p><a href="#choice" class="next">다음 <span>→</span></a></div>
    <div class="talk-turn turn-choice"><b>민지</b><p>지금은 괜찮아. 그래도 날이 밝을 때 다시 보면 좋겠어.</p><div class="choices"><a href="#done">오늘은 쉬자. 내일 같이 보자.</a><a href="#resume">여기까지만 마저 정리하자.</a></div></div>
    <div class="talk-turn turn-done"><b>민지</b><p>응. 공구만 챙기고 불 옆으로 갈게.</p><a href="#resume" class="next">다른 연출도 보기 <span>→</span></a></div></section>
    <footer class="scene-actions"><span class="status status-working">수리 중 · 불과 생활 동작은 계속됩니다.</span><span class="status status-talking">이야기를 나누는 중 · 작업하던 손을 멈춥니다.</span><span class="status status-done">오늘 작업은 여기까지 · 쉬는 표정으로 바뀝니다.</span><a class="start-talk" href="#talk">민지와 이야기하기 <span>→</span></a><a class="cancel-talk" href="#resume">대화 접기</a></footer></article>
    <section class="review-controls" aria-label="시안 비교 도구"><header><h2>새 동료를 바꿔 보세요</h2><p>같은 몸과 동작에 머리·작업복·도구를 바꿔 끼웁니다.</p></header>{controls}<label class="pause"><input id="pause" type="checkbox"> 움직임 멈춤</label></section>
    <details class="source-notes"><summary>무엇을 가져오고, 무엇을 확장했나요?</summary><p>나무·벤치·상자·통은 Kenney, 모닥불 4프레임은 krial의 공개 원본을 사용했습니다. 픽셀 모양은 유지하고 색을 공통 재료 색상표에 맞췄습니다.</p><p>민지와 새 동료, 머리·작업복·도구 교체, 걷기·작업 동작, 표정과 주전자는 이 시안의 공유 부품 정의로 추가했습니다. 원본에 없는 새 내용입니다.</p><ul>{sources}</ul><a href="../pixel-workshop/README.md">제작 규칙·원본·재생성 방법</a></details>
    <p class="scope">방향을 확인하는 독립 시안입니다. 대사와 작업 상태는 연출 예시이며 실제 게임의 이야기·선택·자원·시간·저장과 연결되지 않습니다. 새 동료는 외형 조합 예시입니다.</p>
    </main></body></html>'''
    (OUT / 'pixel-workshop.html').write_text(doc)
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest['drafts'] = [d for d in manifest['drafts'] if d['id'] != 'pixel-workshop-v1']
    manifest['drafts'].insert(0, {'id': 'pixel-workshop-v1', 'file': 'pixel-workshop.html', 'title': '함께 만드는 픽셀 세계 · 외형·도구·대화', 'revision': '1', 'recommended': True, 'description': '외부 CC0 나무/소품/4프레임 모닥불과 직접 확장한 인물/주전자/동작을 같은 색상표와 픽셀 규격으로 통합. 새 동료의 머리·옷·도구·걷기/작업, 밤/낮 배경과 말풍선→하단 대화→선택→작업 종료/표정 전환을 비교합니다. 실제 게임·저장과 분리한 방향 검토용이며 선택만으로 자동 적용하지 않습니다.'})
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (HERE / 'vendor').glob('*.png')}
    print(json.dumps({'htmlBytes': len(doc.encode()), 'sourceHashes': hashes}, ensure_ascii=False))


if __name__ == '__main__':
    build()
