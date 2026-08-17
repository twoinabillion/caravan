#!/usr/bin/env python3
"""Build the reviewed ImageGen settlement atlas v3 at exact runtime scale.

The three ImageGen sources are intentionally kept as review evidence.  This
builder removes the green key locally, isolates subjects by their fixed source
columns, places each subject on an integer-multiple target canvas, and reduces
only by an integer factor with nearest-neighbour sampling.

The first 1x comparison found that the generated facilities were materially
better than v2, while the generated 11x17 people and 7x12 crowd lost silhouette
clarity.  The shipped v3 is therefore deliberately hybrid: reviewed ImageGen
facilities plus the exact v2 people/crowd cells.  A full-ImageGen candidate is
still emitted beside it as QA evidence; rejected art never silently replaces a
clearer runtime asset.

Runtime atlas contract (unchanged from v2):
  buildings: 4 cells 50x43, sx = i*55 + 2,  sy = 2
  people:    8 cells 11x17, sx = i*13 + 2,  sy = 50
  crowd:     8 cells  7x12, sx = i*9 + 110, sy = 52
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "ui" / "settlement"
ATLAS_W, ATLAS_H = 224, 70


def remove_green(source: Path) -> Image.Image:
    """Hard-key ImageGen's slightly varying green without soft fringes."""
    rgb = Image.open(source).convert("RGB")
    result = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    src = rgb.load()
    dst = result.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = src[x, y]
            green = g > 145 and g > r * 1.28 and g > b * 1.28 and g > max(r, b) + 40
            if green:
                continue
            # Despill the last green edge pixels while keeping the pixel-art
            # source binary-alpha and crisp.
            if g > max(r, b) + 18:
                g = max(r, b) + 18
            dst[x, y] = (r, g, b, 255)
    return result


def isolated_subjects(source: Image.Image, count: int) -> list[Image.Image]:
    """Split a fixed horizontal sheet and tightly crop each non-empty cell."""
    alpha = source.getchannel("A")
    subjects: list[Image.Image] = []
    for index in range(count):
        left = round(index * source.width / count)
        right = round((index + 1) * source.width / count)
        cell_alpha = alpha.crop((left, 0, right, source.height))
        bbox = cell_alpha.getbbox()
        if not bbox:
            raise RuntimeError(f"empty ImageGen cell {index} in {source.width}x{source.height}")
        absolute = (bbox[0] + left, bbox[1], bbox[2] + left, bbox[3])
        subjects.append(source.crop(absolute))
    return subjects


def integer_reduce(subject: Image.Image, target: tuple[int, int], factor: int) -> Image.Image:
    """Bottom-align on target*factor, then reduce by that exact integer."""
    target_w, target_h = target
    work_w, work_h = target_w * factor, target_h * factor
    if subject.width > work_w or subject.height > work_h:
        raise RuntimeError(
            f"subject {subject.size} does not fit integer canvas {(work_w, work_h)}"
        )
    work = Image.new("RGBA", (work_w, work_h), (0, 0, 0, 0))
    x = (work_w - subject.width) // 2
    y = work_h - subject.height
    work.alpha_composite(subject, (x, y))
    return work.resize((target_w, target_h), Image.Resampling.NEAREST)


def integer_cluster_reduce(
    subject: Image.Image,
    target: tuple[int, int],
    factor: int,
    minimum_coverage: float,
    lift: float = 1.0,
) -> Image.Image:
    """Collapse exact integer blocks into one crisp representative pixel.

    A single centre sample is ideal for already-authored low-resolution art,
    but ImageGen sometimes puts a four-pixel coat edge between two 27-pixel
    samples.  This keeps the integer grid while preserving that cluster: a
    target pixel is opaque only when its exact source block has enough subject
    coverage, and its RGB is the average of the block's opaque source pixels.
    The result remains binary-alpha, undithered pixel art.
    """
    target_w, target_h = target
    work_w, work_h = target_w * factor, target_h * factor
    if subject.width > work_w or subject.height > work_h:
        raise RuntimeError(
            f"subject {subject.size} does not fit integer canvas {(work_w, work_h)}"
        )
    work = Image.new("RGBA", (work_w, work_h), (0, 0, 0, 0))
    x = (work_w - subject.width) // 2
    y = work_h - subject.height
    work.alpha_composite(subject, (x, y))
    result = Image.new("RGBA", target, (0, 0, 0, 0))
    src = work.load()
    dst = result.load()
    block_area = factor * factor
    for ty in range(target_h):
        for tx in range(target_w):
            pixels = []
            for sy in range(ty * factor, (ty + 1) * factor):
                for sx in range(tx * factor, (tx + 1) * factor):
                    pixel = src[sx, sy]
                    if pixel[3]:
                        pixels.append(pixel)
            if len(pixels) < block_area * minimum_coverage:
                continue
            # Average the exact block, then lift it slightly because the game
            # renders these figures on charcoal roads.  Binary alpha and the
            # later undithered palette keep the result crisp.
            rgb = []
            for channel in range(3):
                value = sum(pixel[channel] for pixel in pixels) / len(pixels)
                rgb.append(min(255, round(value * lift + (lift - 1) * 18)))
            dst[tx, ty] = tuple(rgb) + (255,)
    return result


def paste_cells(atlas: Image.Image, cells: list[Image.Image], kind: str) -> None:
    if kind == "building":
        for index, cell in enumerate(cells):
            atlas.alpha_composite(cell, (index * 55 + 2, 2))
    elif kind == "person":
        for index, cell in enumerate(cells):
            atlas.alpha_composite(cell, (index * 13 + 2, 50))
    elif kind == "crowd":
        for index, cell in enumerate(cells):
            atlas.alpha_composite(cell, (index * 9 + 110, 52))
    else:
        raise ValueError(kind)


def atlas_cells(atlas: Image.Image, kind: str) -> list[Image.Image]:
    """Read cells back from an atlas without resizing or palette changes."""
    if kind == "person":
        return [
            atlas.crop((index * 13 + 2, 50, index * 13 + 13, 67))
            for index in range(8)
        ]
    if kind == "crowd":
        return [
            atlas.crop((index * 9 + 110, 52, index * 9 + 117, 64))
            for index in range(8)
        ]
    raise ValueError(kind)


def quantize_rgba(image: Image.Image, colors: int = 47) -> Image.Image:
    # FASTOCTREE supports RGBA.  No dithering: the atlas must keep deliberate
    # clusters rather than adding isolated noise pixels.
    return image.quantize(
        colors=colors,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.NONE,
    ).convert("RGBA")


def main() -> None:
    facilities = remove_green(OUT / "town-world-facilities-imagegen-v3.png")
    people = remove_green(OUT / "town-world-people-imagegen-v3.png")
    crowd = remove_green(OUT / "town-world-crowd-imagegen-v3.png")

    # Preserve keyed intermediates so the generated sources and extraction can
    # be reviewed independently of the final 1x atlas.
    facilities.save(OUT / "town-world-facilities-alpha-v3.png")
    people.save(OUT / "town-world-people-alpha-v3.png")
    crowd.save(OUT / "town-world-crowd-alpha-v3.png")

    building_cells = [
        integer_cluster_reduce(subject, (50, 43), 12, 0.035, 1.08)
        for subject in isolated_subjects(facilities, 4)
    ]
    person_cells = [
        integer_cluster_reduce(subject, (11, 17), 27, 0.045, 1.13)
        for subject in isolated_subjects(people, 8)
    ]
    crowd_cells = [
        integer_cluster_reduce(subject, (7, 12), 32, 0.05, 1.16)
        for subject in isolated_subjects(crowd, 8)
    ]

    # Keep the all-ImageGen reduction for side-by-side review.  Its people and
    # crowd are not used by the game because they were less legible at 1x.
    candidate = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    paste_cells(candidate, building_cells, "building")
    paste_cells(candidate, person_cells, "person")
    paste_cells(candidate, crowd_cells, "crowd")
    candidate = quantize_rgba(candidate)
    candidate.save(OUT / "town-world-sprite-sheet-imagegen-candidate-v3.png")

    # Quantize only the new facilities.  Then paste the exact v2 character
    # cells so their already-verified silhouettes and palette remain intact.
    facility_layer = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    paste_cells(facility_layer, building_cells, "building")
    facility_layer = quantize_rgba(facility_layer, colors=27)

    v2 = Image.open(OUT / "town-world-sprite-sheet-alpha-v2.png").convert("RGBA")
    atlas = facility_layer.copy()
    paste_cells(atlas, atlas_cells(v2, "person"), "person")
    paste_cells(atlas, atlas_cells(v2, "crowd"), "crowd")

    colors_used = {pixel for pixel in atlas.getdata() if pixel[3]}
    if len(colors_used) > 48:
        raise RuntimeError(f"palette budget exceeded: {len(colors_used)}")

    alpha_path = OUT / "town-world-sprite-sheet-alpha-v3.png"
    source_path = OUT / "town-world-sprite-sheet-source-v3.png"
    webp_path = OUT / "town-world-sprite-atlas-v3.webp"
    atlas.save(alpha_path)

    preview = atlas.resize((ATLAS_W * 8, ATLAS_H * 8), Image.Resampling.NEAREST)
    preview_bg = Image.new("RGBA", preview.size, (42, 44, 48, 255))
    preview_bg.alpha_composite(preview)
    preview_bg.convert("RGB").save(source_path)

    subprocess.run(
        ["cwebp", "-lossless", "-z", "9", "-exact", str(alpha_path), "-o", str(webp_path)],
        check=True,
        capture_output=True,
    )
    print(f"colors: {len(colors_used)}")
    print(f"atlas: {webp_path} ({os.path.getsize(webp_path)} bytes)")


if __name__ == "__main__":
    main()
