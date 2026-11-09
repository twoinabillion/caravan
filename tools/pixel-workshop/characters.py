"""Shared pixel character renderer. Profiles and parts are editable JSON.

No file writes, game state, random choices or identity-specific rendering branches.
All coordinates snap to integer source pixels, with feet at local y=0.
"""
from pathlib import Path
import json

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / 'characters.json').read_text())


def rect(x, y, w, h, role):
    assert all(isinstance(n, int) for n in [x, y, w, h]) and w > 0 and h > 0
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="var(--{role})"/>'


def parts(rows):
    return ''.join(rect(*row) for row in rows)


def group(content, x=0, y=0, cls='', attrs=''):
    return f'<g class="{cls}" transform="translate({x} {y})" {attrs}>{content}</g>'


def face(profile, frame=0):
    g = profile['proposedGeometry']
    h = g['headHeight']
    face = ''
    # Each jaw/cheek silhouette is defined row by row in the profile. Material
    # shading is shared, anatomy and facial anchors are not hardcoded here.
    for y, left, width in profile['faceRows']:
        face += rect(left, y, width, 1, 'skinShade')
        if y > 0 and width > 4:
            face += rect(left + 2, y, width - 3, 1, 'skin')
        highlight_left, highlight_right = max(1, left + 2), min(4, left + width - 1)
        if 3 <= y < h - 4 and highlight_right > highlight_left:
            face += rect(highlight_left, y, highlight_right - highlight_left, 1, 'skinLight')
    face += parts(profile['noseDetails'])
    face += parts(profile['hair']) + parts(profile['faceDetails'])
    face += ''.join(f'<g class="face-state face-{state}">{parts(profile["expressions"][state])}</g>' for state in DATA['sharedExpressionStates'])
    # Glasses, goggles and headphones are identity anchors, not a coat variant.
    return face + parts(profile['headAccessories'])


def stroke(a, b, role, thickness=2):
    """Integer horizontal/vertical pixel segments around an elbow, no rotation blur."""
    x, y = a
    tx, ty = b
    elbow_y = (y + ty) // 2
    return rect(x, min(y, elbow_y), thickness, abs(elbow_y - y) + thickness, role) + rect(min(x, tx), elbow_y, abs(tx - x) + thickness, thickness, role) + rect(tx, min(ty, elbow_y), thickness, abs(elbow_y - ty) + thickness, role)


def pose(profile, mode, frame):
    g = profile['proposedGeometry']
    height, leg, shoulder = g['height'], g['legHeight'], g['shoulderWidth']
    bob = [0, -1, 0, 0][frame] if mode == 'walk' else 0
    top = -height + g['headHeight'] + 1
    left = (-shoulder // 2, top + 3)
    right = (shoulder // 2 - 2, top + 3)
    hands = [(-7, -leg - 3), (8, -leg - 3)]
    settle = 0
    if mode == 'walk':
        stride = profile['stridePx']
        feet = [(-4 - [stride, 0, -stride, 0][frame], -leg, 4, leg), (2 + [stride, 0, -stride, 0][frame], -leg, 4, leg - (frame % 2))]
        hands = [(-8 + [0, 1, 2, 1][frame], -leg - 3), (8 - [0, 1, 2, 1][frame], -leg - 3)]
    else:
        feet = [(-5, -leg, 4, leg), (2, -leg, 4, leg)]
        authored = profile[mode + 'Frames'][frame]
        settle = authored.get('settle', 0)
        feet = authored.get('feet', feet)
        hands = authored.get('hands', hands)
    head_shift = profile.get('headOffset', [0, 0])
    head_delta = [0, 0] if mode == 'walk' else profile[mode + 'Frames'][frame].get('headDelta', [0, 0])
    hx = head_shift[0] + head_delta[0]
    hy = -height + settle + bob + head_shift[1] + head_delta[1]
    top += settle + bob
    left = (left[0], left[1] + settle + bob)
    right = (right[0], right[1] + settle + bob)
    hands = [(x, y + bob) for x, y in hands]
    return {'head': [hx, hy], 'torsoY': top, 'feet': feet, 'shoulders': [left, right], 'hands': hands}


def frame_svg(profile, mode, index):
    g = profile['proposedGeometry']
    p = pose(profile, mode, index)
    sw, y, leg = g['shoulderWidth'], p['torsoY'], g['legHeight']
    left = -(sw // 2)
    torso_height = max(9, -leg - y)
    torso = rect(left + 1, y, sw - 2, 3, 'coat') + rect(left, y + 3, sw, 5, 'coat')
    torso += rect(left + 2, y + 6, sw - 4, torso_height - 4, 'coat')
    torso += rect(left + 1, y + 3, 3, torso_height - 3, 'coatShade')
    torso += rect(1, y + 3, 2, torso_height - 4, 'coatLight')
    torso += rect(left + 1, y + torso_height - 1, sw - 2, 2, 'dark')
    torso += group(parts(profile['bodyDetails']), 0, y, 'coat-details')
    legs = ''.join(rect(x, fy, w, h, 'dark') + rect(x - 1, fy + h - 1, w + 2, 2, 'ink') for x, fy, w, h in p['feet'])
    prop = profile['signatureProp']
    wx, wy = p['hands'][1]
    prop_xy = (wx, wy) if prop['anchor'] == 'hand' else (0, y)
    signature = group(parts(prop['rects']), *prop_xy, 'signature-prop', f'data-anchor="{prop["anchor"]}"')
    behind = signature if prop['anchor'] == 'back' else ''
    front = signature if prop['anchor'] != 'back' else ''
    arms = ''.join(stroke(shoulder, hand, 'coatShade') for shoulder, hand in zip(p['shoulders'], p['hands']))
    hands = ''.join(rect(x, hy, 2, 2, 'skin') for x, hy in p['hands'])
    # Face reuses exactly the same head parts in portraits and body frames.
    head = group(face(profile, index), *p['head'], 'head-anchor', f'data-head="{p["head"][0]},{p["head"][1]}"')
    hand_attrs = f'data-right-hand="{wx},{wy}"'
    return f'<g class="cframe cframe-{index}" data-mode="{mode}" data-frame="{index}" {hand_attrs}>{behind}{legs}{torso}{head}{arms}{front}{hands}</g>'


def actor(key, x=0, y=0, cls=''):
    profile = DATA['profiles'][key]
    frames = ''.join(f'<g class="cmode cmode-{mode}">' + ''.join(frame_svg(profile, mode, i) for i in range(4)) + '</g>' for mode in DATA['motions'])
    return group(frames, x, y, f'person identity-{key} {cls}', f'data-character="{key}" data-baseline="{y}"')


def portrait(key, cls=''):
    profile = DATA['profiles'][key]
    g = profile['proposedGeometry']
    body = rect(-12, g['headHeight'] + 5, 24, 12, 'coatShade') + rect(-9, g['headHeight'] + 2, 18, 18, 'coat')
    body += rect(-3, g['headHeight'] - 1, 6, 5, 'skinShade') + rect(-5, g['headHeight'] + 2, 3, 4, 'coatLight')
    return f'<svg class="pixel-portrait person identity-{key} {cls}" data-portrait="{key}" viewBox="-14 -5 28 28" aria-label="{profile["name"]} 픽셀 얼굴" role="img" shape-rendering="crispEdges">{body}<g class="portrait-head">{face(profile)}</g></svg>'


def profile_rules():
    rules = []
    for key, profile in DATA['profiles'].items():
        colors = ';'.join(f'--{role}:{value}' for role, value in profile['colors'].items())
        duration = profile['cadenceMs']
        rules.append(f'.identity-{key}{{{colors}}}')
        rules.append(f'.identity-{key} .cframe{{animation-duration:{duration}ms}}')
        for i in range(1, 4):
            rules.append(f'.identity-{key} .cframe-{i}{{animation-delay:-{duration*(4-i)/4:g}ms}}')
    return ''.join(rules)
