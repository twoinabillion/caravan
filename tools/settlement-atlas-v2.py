#!/usr/bin/env python3
"""Settlement sprite atlas v2 — authored at exact render size.

v1 cells were generated large (56x48 buildings, 16x24 people) and drawn at
50x43 / 11x17 / 7x12 through non-integer nearest-neighbor downscales, which
dropped pixel rows unevenly and made the in-world art mushier than the
surrounding UI. v2 authors every cell at its exact logical render size so
every runtime draw is 1:1.

Atlas layout v2 (224x70, transparent):
  buildings: 4 cells 50x43, sx = i*55 + 2,  sy = 2
  people:    8 cells 11x17, sx = i*13 + 2,  sy = 50
  crowd:     8 cells  7x12, sx = i*9 + 110, sy = 52

Cell mapping is unchanged from v1:
  buildings: 0 market / 1 garage / 2 campfire shelter / 3 utility-archive
  people:    0 player, 1-2 companions, 7 recruit, rest residents/crowd

Outputs:
  assets/ui/settlement/town-world-sprite-sheet-alpha-v2.png   (1x RGBA)
  assets/ui/settlement/town-world-sprite-sheet-source-v2.png  (8x preview)
  assets/ui/settlement/town-world-sprite-atlas-v2.webp        (runtime, lossless)
"""
import os, subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(ROOT, 'assets', 'ui', 'settlement')

def hx(s, a=255):
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)

# shared palette — neutral materials that sit inside all seven city palettes
OUT   = hx('141618')   # outline
SHD   = hx('1e2126')   # interior dark
CORR  = hx('2b2f33')   # corrugation / dark metal silhouette
WALL1 = hx('33383d')
WALL2 = hx('41474d')
WALL3 = hx('4f565c')
WOOD1 = hx('46331f')
WOOD2 = hx('63492b')
WOOD3 = hx('7f6238')
TAN   = hx('9a854f')
RUST1 = hx('5e2c22')
RUST2 = hx('823b2c')
RUST3 = hx('9c4f38')
OLIV1 = hx('3f4028')
OLIV2 = hx('5a5a35')
TEAL1 = hx('3d5a55')
TEAL2 = hx('5d8b82')
AMBER = hx('f0bd58')
AMBR2 = hx('d28f3d')
FLAME = hx('e36e32')
FLAM2 = hx('f2d178')
MET1  = hx('4c4f4b')
MET2  = hx('676b64')
MET3  = hx('848881')
SKIN  = hx('bd956f')
SKIN2 = hx('8f6b49')
HAIR  = hx('23252b')
GRAY  = hx('968f84')
NAVY  = hx('32404b')
CLOTH = hx('282c2f')
FLOOR = hx('39362f')
FLORD = hx('2c2a26')
TIRE  = hx('17191b')
SA    = (10, 12, 14, 100)  # baked contact shadow (semi-transparent)

class Cell:
    """Draw surface clipped to one atlas cell — anything outside raises."""
    def __init__(self, img, ox, oy, w, h):
        self.img, self.ox, self.oy, self.w, self.h = img, ox, oy, w, h
    def px(self, x, y, c):
        if not (0 <= x < self.w and 0 <= y < self.h):
            raise ValueError(f'pixel ({x},{y}) outside {self.w}x{self.h} cell')
        self.img.putpixel((self.ox + x, self.oy + y), c)
    def rect(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.px(xx, yy, c)
    def hl(self, x, y, w, c): self.rect(x, y, w, 1, c)
    def vl(self, x, y, h, c): self.rect(x, y, 1, h, c)
    def pts(self, c, *pairs):
        for x, y in pairs: self.px(x, y, c)
    def stamp(self, x, y, rows, legend):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                col = legend.get(ch)
                if col is not None:
                    self.px(x + dx, y + dy, col)

# ---------------------------------------------------------------- buildings

def draw_market(g):
    """Supply stall: patched canvas awning, open counter, crates, sacks,
    hanging goods, warm lamp, walk-in entrance on the right."""
    # awning top plane + patches
    g.hl(2, 0, 46, OUT)
    g.rect(1, 1, 48, 2, RUST3)
    g.rect(1, 3, 48, 2, RUST2)
    g.rect(31, 1, 8, 3, OLIV2)          # canvas patch
    g.pts(OUT, (30, 2), (39, 2))        # patch stitches
    g.rect(8, 3, 4, 2, OLIV1)           # second, darker patch
    g.vl(0, 1, 8, OUT)
    g.vl(49, 1, 8, OUT)
    # valance with stripes + ragged scalloped hem
    g.rect(1, 5, 48, 4, RUST1)
    for x in range(3, 48, 5):
        g.vl(x, 5, 4, RUST3)
    for x in range(1, 49):
        if (x // 4) % 2 == 0:
            g.px(x, 9, RUST1)
    g.pts(RUST1, (6, 10), (27, 10), (41, 10))
    # open interior under the awning
    g.hl(3, 10, 44, OUT)                # awning underside shadow line
    g.rect(3, 11, 44, 17, SHD)
    # support poles to the ground
    g.vl(2, 10, 27, OUT); g.rect(3, 10, 2, 27, WOOD2); g.vl(4, 10, 27, WOOD1)
    g.vl(47, 10, 27, OUT); g.rect(45, 10, 2, 27, WOOD2); g.vl(45, 10, 27, WOOD1)
    g.pts(OUT, (3, 37), (4, 37), (45, 37), (46, 37))  # pole feet
    # hanging goods: peppers, herbs, dried amber bundles
    g.pts(GRAY, (9, 11), (14, 11), (37, 11), (41, 11))
    g.vl(9, 12, 3, RUST3)
    g.vl(14, 12, 3, OLIV2)
    g.vl(37, 12, 3, AMBR2)
    g.vl(41, 12, 2, RUST3)
    # hanging lamp — the single warm light of the stall
    g.px(32, 12, MET1)
    g.rect(31, 13, 3, 3, AMBER)
    g.px(32, 16, AMBR2)
    # interior shelf with jars
    g.hl(7, 19, 18, WOOD2)
    for jx, col in ((8, TAN), (12, AMBR2), (16, TAN)):
        g.hl(jx, 16, 2, OUT)
        g.rect(jx, 17, 2, 2, col)
    # stacked stock in the right of the interior
    g.rect(36, 20, 8, 8, WOOD1)
    g.hl(36, 20, 8, WOOD2)
    g.vl(40, 21, 7, SHD)
    # hanging cloth rolls + produce basket to keep the stall busy
    g.rect(20, 12, 2, 4, TEAL1)
    g.rect(23, 12, 2, 3, OLIV1)
    g.hl(26, 21, 4, WOOD2)
    g.pts(AMBR2, (26, 20), (28, 20))
    g.px(27, 20, RUST3)
    g.pts(TAN, (21, 24), (22, 25), (20, 25))
    # goods sitting on the counter line
    g.hl(9, 21, 6, WOOD3)               # crate
    g.rect(9, 22, 6, 4, WOOD2)
    g.pts(WOOD1, (10, 22), (11, 23), (12, 24), (13, 25), (13, 22), (10, 25))
    g.hl(30, 23, 2, TAN)                # sacks
    g.px(31, 22, WOOD1)
    g.rect(29, 24, 4, 2, TAN)
    g.px(32, 25, WOOD3)
    g.hl(35, 23, 2, OUT)                # jar
    g.rect(35, 24, 2, 2, AMBR2)
    # counter on legs
    g.hl(6, 26, 33, WOOD3)
    g.hl(6, 27, 33, WOOD2)
    g.rect(6, 28, 33, 5, WOOD2)
    for x in (12, 19, 26, 33):
        g.vl(x, 28, 5, WOOD1)
    g.hl(6, 33, 33, OUT)
    for x in (7, 22, 37):
        g.vl(x, 34, 3, WOOD1)
        g.px(x, 37, OUT)
    # walk-in entrance on the right, threshold facing the road
    g.rect(39, 28, 6, 9, SHD)
    g.hl(39, 37, 6, WOOD1)
    g.pts(AMBER, (41, 26), (42, 26))
    # crates stacked outside left
    g.hl(1, 27, 4, WOOD2)
    g.rect(1, 28, 4, 3, WOOD1)
    g.hl(0, 31, 6, WOOD3)
    g.rect(0, 32, 6, 5, WOOD2)
    g.pts(WOOD1, (1, 33), (2, 34), (3, 35), (4, 33), (3, 34), (2, 35))
    g.hl(0, 37, 6, OUT)
    # barrel outside right
    g.hl(46, 30, 4, WOOD3)
    g.rect(46, 31, 4, 6, WOOD2)
    g.hl(46, 32, 4, MET2)
    g.hl(46, 35, 4, MET2)
    g.hl(46, 37, 4, OUT)
    # ground contact shadow
    g.hl(1, 38, 47, SA)
    g.hl(4, 39, 41, SA)

def draw_garage(g):
    """Repair workshop: flat industrial roof, corrugated wall, big dark
    service opening facing the road, tires, tool shelves, oil drum."""
    # roof plane + vent + exhaust pipe
    g.hl(3, 0, 44, OUT)
    g.rect(3, 1, 44, 2, RUST2)
    g.rect(3, 3, 44, 2, RUST1)
    g.hl(3, 5, 44, CORR)
    g.rect(9, 1, 6, 3, MET2)
    g.pts(SHD, (10, 2), (12, 2), (14, 2))
    g.rect(40, 0, 2, 5, MET1)
    g.px(40, 0, MET3)
    # corrugated wall face
    g.rect(3, 6, 44, 31, WALL1)
    g.vl(2, 1, 36, OUT)
    g.vl(47, 1, 36, OUT)
    for x in range(6, 46, 4):
        g.vl(x, 7, 29, CORR)
    # warm windows upper right
    g.hl(37, 7, 3, OUT); g.rect(37, 8, 3, 3, AMBER)
    g.hl(42, 7, 3, OUT); g.rect(42, 8, 3, 3, AMBR2)
    # service opening with rolled door + frame
    g.hl(13, 11, 20, MET2)
    g.vl(13, 12, 25, MET2)
    g.vl(32, 12, 25, MET2)
    g.hl(14, 12, 18, MET1)              # rolled-up door
    g.rect(14, 13, 18, 24, SHD)
    # inside: hanging work lamp, bench and lift silhouettes
    g.vl(22, 13, 2, GRAY)
    g.pts(AMBER, (22, 15), (23, 15))
    g.hl(15, 30, 7, MET2)
    g.rect(15, 31, 7, 6, MET1)
    g.hl(16, 32, 5, CORR)
    g.vl(29, 20, 17, MET1)
    g.hl(28, 20, 3, MET2)
    g.px(24, 36, hx('4a3d26'))
    # tool shelves on the left wall
    g.hl(5, 15, 7, WOOD2)
    g.vl(6, 16, 3, MET3)
    g.vl(9, 16, 2, MET2)
    g.px(11, 16, RUST3)
    g.hl(5, 21, 7, WOOD2)
    g.rect(6, 19, 3, 2, OLIV2)
    g.px(7, 18, OLIV1)
    g.rect(10, 19, 2, 2, RUST2)
    # tire stack right of the opening
    for yy in (28, 31, 34):
        g.rect(36, yy, 6, 3, TIRE)
        g.hl(37, yy, 4, hx('34383c'))
        g.rect(38, yy + 1, 2, 1, MET3)
    # scrap pile by the door
    g.pts(MET2, (33, 35), (34, 34), (34, 36))
    g.pts(RUST3, (33, 36), (35, 35))
    # oil drum outside left
    g.hl(0, 29, 4, RUST3)
    g.rect(0, 30, 4, 7, RUST2)
    g.hl(0, 32, 4, RUST1)
    g.hl(0, 35, 4, RUST1)
    g.hl(0, 37, 4, OUT)
    # base + shadow
    g.hl(3, 37, 44, OUT)
    g.hl(2, 38, 46, SA)
    g.hl(4, 39, 41, SA)

def draw_shelter(g):
    """Communal campfire shelter: dark awning with rust trim, open floor,
    fire bowl, benches, two seated figures, supplies."""
    # awning band
    g.hl(2, 0, 46, OUT)
    g.rect(1, 1, 48, 5, CLOTH)
    g.hl(1, 3, 48, hx('31363a'))
    g.hl(1, 6, 48, RUST2)
    for x in range(1, 49):
        if (x // 4) % 2 == 1:
            g.px(x, 7, RUST1)
    g.vl(0, 1, 6, OUT)
    g.vl(49, 1, 6, OUT)
    # back wall with warm windows
    g.rect(3, 8, 44, 7, WALL1)
    g.hl(3, 8, 44, SHD)
    g.hl(15, 10, 2, OUT); g.rect(15, 11, 2, 3, AMBR2)
    g.hl(33, 10, 2, OUT); g.rect(33, 11, 2, 3, AMBR2)
    # corner posts
    g.vl(2, 7, 29, OUT); g.rect(3, 8, 2, 28, WOOD2); g.vl(4, 8, 28, WOOD1)
    g.vl(47, 7, 29, OUT); g.rect(45, 8, 2, 28, WOOD2); g.vl(45, 8, 28, WOOD1)
    g.pts(OUT, (3, 36), (4, 36), (45, 36), (46, 36))
    # lantern on the right post
    g.px(45, 12, MET1)
    g.px(45, 13, AMBER)
    # open communal floor
    g.rect(5, 15, 40, 20, hx('34322c'))
    g.rect(5, 15, 40, 3, FLORD)
    for yy in range(18, 34, 4):
        for xx in range(6 + (yy % 8) // 4 * 3, 44, 7):
            g.px(xx, yy, FLORD)
    g.hl(5, 35, 40, OUT)
    # supplies against the back wall
    g.hl(7, 10, 6, WOOD3)
    g.rect(7, 11, 6, 4, WOOD2)
    g.vl(10, 11, 4, WOOD1)
    g.hl(39, 12, 4, TAN)
    g.rect(38, 13, 5, 2, TAN)
    g.px(40, 12, WOOD1)
    # fire bowl: stone rim, embers, small flame — no baked glow
    g.rect(21, 26, 7, 3, MET1)
    g.rect(22, 26, 5, 2, SHD)
    g.pts(WOOD1, (22, 27), (26, 27))
    g.pts(FLAME, (23, 25), (25, 25), (24, 26))
    g.px(24, 24, FLAM2)
    g.px(24, 25, FLAM2)
    # benches flanking the fire
    g.rect(9, 23, 8, 2, WOOD3)
    g.pts(WOOD1, (10, 25), (15, 25))
    g.rect(33, 23, 8, 2, WOOD3)
    g.pts(WOOD1, (34, 25), (39, 25))
    # two seated silhouettes facing the fire
    g.px(12, 19, SKIN2)
    g.rect(11, 20, 3, 3, NAVY)
    g.px(14, 21, SKIN2)
    g.pts(CLOTH, (11, 25), (13, 25))
    g.px(36, 19, SKIN2)
    g.rect(35, 20, 3, 3, OLIV2)
    g.px(34, 21, SKIN2)
    g.pts(CLOTH, (35, 25), (37, 25))
    # contact shadow
    g.hl(3, 36, 44, SA)
    g.hl(6, 37, 38, SA)

def draw_utility(g):
    """Utility / storage / research site: radio mast, solar panel, archive
    shelving behind a wide opening, generator unit, teal trim."""
    # radio mast
    g.vl(8, 0, 5, MET3)
    g.hl(7, 1, 3, MET3)
    g.hl(7, 3, 3, MET3)
    g.px(8, 0, TEAL2)
    # roof + solar panel
    g.hl(4, 4, 42, OUT)
    g.rect(4, 5, 42, 3, WALL2)
    g.hl(4, 8, 42, WALL1)
    g.rect(30, 5, 8, 2, NAVY)
    g.pts(TEAL1, (31, 5), (33, 5), (35, 5), (37, 5), (32, 6), (34, 6), (36, 6))
    # wall with teal trim band
    g.rect(4, 9, 42, 28, WALL2)
    g.vl(3, 5, 32, OUT)
    g.vl(46, 5, 32, OUT)
    g.hl(4, 9, 42, TEAL1)
    # archive opening with shelves of record boxes
    g.hl(7, 13, 16, MET2)
    g.vl(7, 14, 16, MET2)
    g.vl(22, 14, 16, MET2)
    g.rect(8, 14, 14, 16, SHD)
    g.hl(9, 18, 12, WOOD2)
    g.hl(9, 23, 12, WOOD2)
    g.rect(9, 15, 3, 3, TAN)
    g.rect(13, 15, 3, 3, RUST3)
    g.rect(17, 16, 3, 2, OLIV2)
    g.rect(9, 20, 3, 3, OLIV2)
    g.rect(13, 20, 3, 3, TAN)
    g.rect(17, 20, 3, 3, WOOD3)
    g.rect(9, 26, 4, 3, WOOD2)
    g.rect(15, 27, 4, 2, TAN)
    g.hl(8, 30, 14, WALL1)
    # wall-mounted radio with a single amber dial
    g.hl(37, 11, 6, OUT)
    g.rect(37, 12, 6, 4, WOOD1)
    g.px(38, 13, AMBER)
    g.vl(40, 13, 2, SHD)
    g.vl(42, 13, 2, SHD)
    # teal observation window
    g.hl(30, 11, 3, OUT)
    g.rect(30, 12, 3, 4, TEAL2)
    g.vl(31, 12, 4, TEAL1)
    # front door facing the road
    g.hl(25, 23, 9, MET2)
    g.vl(25, 24, 13, MET2)
    g.vl(33, 24, 13, MET2)
    g.rect(26, 24, 7, 13, SHD)
    g.px(29, 26, AMBR2)
    # generator unit on the right
    g.hl(37, 26, 8, MET2)
    g.rect(37, 27, 8, 9, MET1)
    g.hl(38, 29, 6, SHD)
    g.hl(38, 32, 6, SHD)
    g.px(43, 34, AMBR2)
    g.hl(34, 35, 3, CORR)               # cable run to the door
    # stencilled crate outside left
    g.hl(0, 30, 5, WOOD3)
    g.rect(0, 31, 5, 6, WOOD2)
    g.pts(TEAL1, (1, 33), (3, 33))
    g.hl(0, 37, 5, OUT)
    # base + shadow
    g.hl(4, 37, 42, OUT)
    g.hl(3, 38, 44, SA)
    g.hl(5, 39, 40, SA)

# ------------------------------------------------------------------ people

PLEG = {
    '#': OUT, 'H': HAIR, 'k': SKIN, 'K': SKIN2, 'A': AMBER, 'm': AMBR2,
    'o': OLIV1, 'O': OLIV2, 'n': NAVY, 'd': CLOTH, 'x': WOOD2, 'y': WOOD3,
    'r': RUST2, 'R': RUST3, 'g': TEAL1, 'G': TEAL2, 'h': GRAY, 'b': NAVY,
    'w': WALL2, 't': TAN, '1': MET1, '2': MET2, '3': MET3, 's': SHD,
    'F': FLAME, '.': None,
}

def person(rows):
    assert len(rows) == 17, f'person needs 17 rows, got {len(rows)}'
    for r in rows:
        assert len(r) == 11, f'person row must be 11 wide: {r!r} ({len(r)})'
    return rows

# 0 — player Daon: bare dark hair, olive travel jacket, amber sash (row 7,
# where the runtime identity band also lands), backpack on the left, walking.
P_PLAYER = person([
    '...#####...',
    '..#HHHHH#..',
    '..#HHHHH#..',
    '..#kkkkk#..',
    '..#KkkkK#..',
    '.##ooooo##.',
    'x#oOOOOOo#.',
    'x#AAAAAAA#.',
    'x#oOOOOOo#.',
    'x#kOOOOOk#.',
    '.#ooooooo#.',
    '.##ooooo##.',
    '..#nn#nn#..',
    '..#nn#nn#..',
    '..#nn.nn#..',
    '..#n#..nn#.',
    '.##....##..',
])

# 1 — companion: head scarf, long brown coat, satchel strap, steady stance.
P_COMP_A = person([
    '...#####...',
    '..#rrrrr#..',
    '..#rHHHr#..',
    '..#kkkkk#..',
    '..#KkkkK#..',
    '.##xxxxx##.',
    '.#xyxxxxx#.',
    '.#xxyxxxt#.',
    '.#xxxyxxt#.',
    '.#xxxxyxx#.',
    '.#xxxxxxx#.',
    '.##xxxxx##.',
    '..#xx#xx#..',
    '..#xx#xx#..',
    '..#ww.ww#..',
    '..#ww.ww#..',
    '..##...##..',
])

# 2 — companion: cap, work jacket with teal collar, tool roll on the back.
P_COMP_B = person([
    '...#####...',
    '..#nnnnn#..',
    '.##nnnnn##.',
    '..#kkkkk#..',
    '..#KkkkK#..',
    '.##ggggg##.',
    '.#dGddddd#y',
    '.#ddddddd#y',
    '.#ddddddd#y',
    '.#ddddddd#.',
    '.#ddddddd#.',
    '.##ddddd##.',
    '..#nn#nn#..',
    '..#nn#nn#..',
    '..#nn.nn#..',
    '..#nn..nn#.',
    '..##...##..',
])

# 3 — resident: hood up, layered travel clothes, carried bundle.
P_HOOD = person([
    '...#####...',
    '..#ooooo#..',
    '.#ooooooo#.',
    '.#oo###oo#.',
    '.#o#kkk#o#.',
    '.##ooooo##.',
    '.#ooooooo#.',
    '.#oxxxxxo#.',
    'tt#xxxxx#..',
    'tt#xxxxx#..',
    '.#ooooooo#.',
    '.##ooooo##.',
    '..#dd#dd#..',
    '..#dd#dd#..',
    '..#dd.dd#..',
    '..#dd.dd#..',
    '..##...##..',
])

# 4 — resident: amber hard hat, work vest, wrench in hand, working stance.
P_WORKER = person([
    '...#####...',
    '..#AAAAA#..',
    '.##AmmmA##.',
    '..#kkkkk#..',
    '..#KkkkK#..',
    '.##ttttt##.',
    '.#tdddddt#.',
    '.#tdddddt#.',
    '.#tdddddt#.',
    '.#ddddddd#2',
    '.#ddddddd#2',
    '.##ddddd##2',
    '..#nn#nn#..',
    '..#nn#nn#..',
    '..#nn.nn#..',
    '.#nn...nn#.',
    '.##.....##.',
])

# 5 — resident: loose hair, long charcoal coat, radio on the hip.
P_COAT = person([
    '...#####...',
    '..#HHHHH#..',
    '.#HHHHHHH#.',
    '.#Hkkkkk#..',
    '..#KkkkK#..',
    '.##ggggg##.',
    '.#wdddddd#.',
    '.#wdddddd#.',
    '.#wddddd1#.',
    '.#kddddd1#.',
    '.#ddddddk#.',
    '.#ddddddd#.',
    '.##dd#dd##.',
    '..#dd#dd#..',
    '..#dd.dd#..',
    '..#dd.dd#..',
    '..##...##..',
])

# 6 — resident: grey-haired elder with a cane, slightly stooped.
P_ELDER = person([
    '...........',
    '...#####...',
    '..#hhhhh#..',
    '..#hhhhh#..',
    '..#kkkkk#..',
    '..#KkkKK#..',
    '.##wwwww##.',
    '.#wwwwwww#y',
    '.#wwwwwww#y',
    '.#wwwwwww#y',
    '.#wwwwwww#y',
    '.##wwwww##y',
    '..#dd#dd#.y',
    '..#dd#dd#.y',
    '..#dd.dd#.y',
    '..#dd.dd#..',
    '..##...##..',
])

# 7 — recruit: rust-red coat, bare head, pack, mid-stride — reads as the
# person worth walking up to without any neon outline.
P_RECRUIT = person([
    '...#####...',
    '..#HHHHH#..',
    '..#HHHHH#..',
    '..#kkkkk#..',
    '..#KkkkK#..',
    '.##rrrrr##.',
    '.#rRrrrrr#x',
    '.#rrrrrrr#x',
    '.#rrrrrrr#x',
    '.#rrrrrrr#x',
    '.#rrrrrrr#.',
    '.##rrrrr##.',
    '..#dd#dd#..',
    '.#dd##dd#..',
    '.#dd..#dd#.',
    '.#d#...dd#.',
    '.##.....##.',
])

PEOPLE = [P_PLAYER, P_COMP_A, P_COMP_B, P_HOOD, P_WORKER, P_COAT, P_ELDER, P_RECRUIT]

def crowd(rows):
    assert len(rows) == 12, f'crowd needs 12 rows, got {len(rows)}'
    for r in rows:
        assert len(r) == 7, f'crowd row must be 7 wide: {r!r} ({len(r)})'
    return rows

CROWD = [
    crowd(['..###..', '.#HHH#.', '.#kkk#.', '.#ooo#.', '#ooooo#', '#oOOOo#',
           '#ooooo#', '.#ooo#.', '.#n#n#.', '.#n#n#.', '.#n.n#.', '.##.##.']),
    crowd(['..###..', '.#rrr#.', '.#kkk#.', '.#xxx#.', '#xxxxx#', '#xyxxx#',
           '#xxxxx#', '.#xxx#.', '.#d#d#.', '.#d#d#.', '.#d.d#.', '.##.##.']),
    crowd(['..###..', '.#nnn#.', '.#kkk#.', '.#ddd#.', '#dddddt', '#ddddd#',
           '#ddddd#', '.#ddd#.', '.#n#n#.', '.#n#n#.', '.#n.n#.', '.##.##.']),
    crowd(['..###..', '.#HHH#.', '.#kkk#.', '.#rrr#.', '#rrrrr#', '#rRrrr#',
           '#rrrrr#', '.#rrr#.', '.#d#d#.', '.#d#d#.', '.#d.d#.', '.##.##.']),
    crowd(['..###..', '.#ooo#.', '.#okko#', '.#ooo#.', '#ooooo#', '#ooooo#',
           '#ooooo#', '.#ooo#.', '.#d#d#.', '.#d#d#.', '.#d.d#.', '.##.##.']),
    crowd(['..###..', '.#hhh#.', '.#kkk#.', '.#www#.', '#wwwww#', '#wwwww#',
           '#wwwww#', '.#www#.', '.#d#d#.', '.#d#d#.', '.#d.d#.', '.##.##.']),
    crowd(['..###..', '.#AAA#.', '.#kkk#.', '.#ddd#.', '#dddddx', '#dddddx',
           '#ddddd#', '.#ddd#.', '.#n#n#.', '.#n#n#.', '.#n.n#.', '.##.##.']),
    crowd(['..###..', '.#HHH#.', '.#kkk#.', '.#ggg#.', '#gggggt', '#gGggg#',
           '#ggggg#', '.#ggg#.', '.#d#d#.', '.#d#d#.', '.#d.d#.', '.##.##.']),
]

# ------------------------------------------------------------------- build

ATLAS_W, ATLAS_H = 224, 70

def build():
    img = Image.new('RGBA', (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    for i, fn in enumerate((draw_market, draw_garage, draw_shelter, draw_utility)):
        fn(Cell(img, i * 55 + 2, 2, 50, 43))
    for i, rows in enumerate(PEOPLE):
        Cell(img, i * 13 + 2, 50, 11, 17).stamp(0, 0, rows, PLEG)
    for i, rows in enumerate(CROWD):
        Cell(img, i * 9 + 110, 52, 7, 12).stamp(0, 0, rows, PLEG)

    colors = {p for p in img.getdata() if p[3] > 0}
    print(f'opaque/semi colors used: {len(colors)}')
    assert len(colors) <= 48, 'palette budget exceeded'

    alpha_png = os.path.join(OUTDIR, 'town-world-sprite-sheet-alpha-v2.png')
    img.save(alpha_png)
    preview = img.resize((ATLAS_W * 8, ATLAS_H * 8), Image.NEAREST)
    bg = Image.new('RGBA', preview.size, (42, 44, 48, 255))
    bg.alpha_composite(preview)
    bg.convert('RGB').save(os.path.join(OUTDIR, 'town-world-sprite-sheet-source-v2.png'))

    webp = os.path.join(OUTDIR, 'town-world-sprite-atlas-v2.webp')
    subprocess.run(['cwebp', '-lossless', '-z', '9', '-exact', alpha_png, '-o', webp],
                   check=True, capture_output=True)
    print(f'atlas: {webp} ({os.path.getsize(webp)} bytes)')

if __name__ == '__main__':
    build()
