#!/usr/bin/env python3
"""Build the high-resolution settlement runtime atlas from reviewed v3 art.

Facilities keep three times the runtime detail of v3. People and crowd retain
the exact reviewed v3 silhouettes and are only enlarged with nearest-neighbour
sampling. The atlas therefore improves building detail without changing any
character identity or settlement layout.

Runtime atlas contract:
  scale:     3
  buildings: 4 cells 150x129, sx = i*165 + 6, sy = 6
  people:    8 cells  33x51,  sx = i*39 + 6,  sy = 150
  crowd:     8 cells  21x36,  sx = i*27 + 330, sy = 156
"""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "ui" / "settlement"
SCALE = 3
ATLAS_W, ATLAS_H = 224 * SCALE, 70 * SCALE
FACILITY_CELL = (50 * SCALE, 43 * SCALE)
FACILITY_WORK = (50 * 12, 43 * 12)


def largest_component_bbox(alpha: Image.Image, left: int, right: int) -> tuple[int, int, int, int]:
    """Return the largest connected subject in one fixed source column."""
    cell = alpha.crop((left, 0, right, alpha.height))
    width, height = cell.size
    pixels = cell.load()
    seen = bytearray(width * height)
    best_area = 0
    best_bbox = None

    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if seen[offset] or not pixels[x, y]:
                continue
            seen[offset] = 1
            stack = [(x, y)]
            area = 0
            x0 = x1 = x
            y0 = y1 = y
            while stack:
                current_x, current_y = stack.pop()
                area += 1
                x0, x1 = min(x0, current_x), max(x1, current_x)
                y0, y1 = min(y0, current_y), max(y1, current_y)
                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    next_offset = next_y * width + next_x
                    if seen[next_offset] or not pixels[next_x, next_y]:
                        continue
                    seen[next_offset] = 1
                    stack.append((next_x, next_y))
            if area > best_area:
                best_area = area
                best_bbox = (x0 + left, y0, x1 + left + 1, y1 + 1)

    if not best_bbox:
        raise RuntimeError(f"empty facility source column: {left}..{right}")
    return best_bbox


def facility_cells(source: Image.Image) -> list[Image.Image]:
    alpha = source.getchannel("A")
    cells = []
    for index in range(4):
        left = round(index * source.width / 4)
        right = round((index + 1) * source.width / 4)
        subject = source.crop(largest_component_bbox(alpha, left, right))
        if subject.width > FACILITY_WORK[0] or subject.height > FACILITY_WORK[1]:
            raise RuntimeError(f"facility {index} does not fit {FACILITY_WORK}: {subject.size}")
        work = Image.new("RGBA", FACILITY_WORK, (0, 0, 0, 0))
        work.alpha_composite(
            subject,
            ((FACILITY_WORK[0] - subject.width) // 2, FACILITY_WORK[1] - subject.height),
        )
        # The reviewed source was authored on an integer pixel grid. Point
        # sampling keeps those clusters crisp while retaining 3x v3 detail.
        cells.append(work.resize(FACILITY_CELL, Image.Resampling.NEAREST))
    return cells


def main() -> None:
    source = Image.open(OUT / "town-world-facilities-alpha-v3.png").convert("RGBA")
    reviewed_v3 = Image.open(OUT / "town-world-sprite-sheet-alpha-v3.png").convert("RGBA")
    reviewed_v3 = reviewed_v3.resize((ATLAS_W, ATLAS_H), Image.Resampling.NEAREST)

    atlas = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    # Only the reviewed people/crowd rows survive from v3. Do not leave the
    # discarded 1x facilities underneath the new high-resolution cells.
    people_y = 49 * SCALE
    atlas.alpha_composite(reviewed_v3.crop((0, people_y, ATLAS_W, ATLAS_H)), (0, people_y))
    for index, cell in enumerate(facility_cells(source)):
        atlas.alpha_composite(cell, (index * 55 * SCALE + 2 * SCALE, 2 * SCALE))

    alpha_path = OUT / "town-world-sprite-sheet-alpha-v4.png"
    preview_path = OUT / "town-world-sprite-sheet-source-v4.png"
    webp_path = OUT / "town-world-sprite-atlas-v4.webp"
    atlas.save(alpha_path)

    preview = atlas.resize((ATLAS_W * 2, ATLAS_H * 2), Image.Resampling.NEAREST)
    preview_background = Image.new("RGBA", preview.size, (42, 44, 48, 255))
    preview_background.alpha_composite(preview)
    preview_background.convert("RGB").save(preview_path)

    subprocess.run(
        ["cwebp", "-lossless", "-z", "9", "-exact", str(alpha_path), "-o", str(webp_path)],
        check=True,
        capture_output=True,
    )
    print(f"atlas: {webp_path} ({webp_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
