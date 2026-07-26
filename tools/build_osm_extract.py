#!/usr/bin/env python3
"""Build the compact offline OSM archive used by the game.

The nationwide source is Geofabrik's South Korea PBF.  A small OSM XML export
can optionally be layered on top as a detailed city archive.  The generated
JavaScript contains quantized, simplified geometry only; the original PBF/XML
is never bundled into the single-file game.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Iterator, Sequence


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FILTER = ROOT / "tools" / "osm-game-filter.txt"
DEFAULT_OUTPUT = ROOT / "src" / "03h-osm.js"
DISPLAY_BOUNDS = [124.25, 32.30, 132.40, 38.75]  # 제주·울릉도·독도 포함
Q = 8191

ROAD_CLASSES = {
    "motorway": 0,
    "trunk": 1,
    "primary": 2,
    "secondary": 3,
}
ROAD_TOLERANCE = {0: 0.0015, 1: 0.0022, 2: 0.0032, 3: 0.0055}

LOCAL_ROAD_CLASSES = {
    "motorway": 0,
    "motorway_link": 0,
    "trunk": 0,
    "trunk_link": 0,
    "primary": 0,
    "primary_link": 0,
    "secondary": 1,
    "secondary_link": 1,
    "tertiary": 1,
    "tertiary_link": 1,
    "residential": 2,
    "unclassified": 2,
    "living_street": 2,
    "service": 3,
    "pedestrian": 4,
    "footway": 4,
    "path": 4,
    "steps": 4,
    "cycleway": 4,
}


def run(args: Sequence[str], **kwargs: Any) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(map(str, args)))
    return subprocess.run(args, check=True, text=True, **kwargs)


def osmium_value(pbf: Path, key: str) -> str:
    return subprocess.check_output(
        ["osmium", "fileinfo", "-g", key, str(pbf)], text=True
    ).strip()


def sq_distance(point: Sequence[float], start: Sequence[float], end: Sequence[float]) -> float:
    x, y = point
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    if dx or dy:
        t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        x1 += dx * t
        y1 += dy * t
    dx, dy = x - x1, y - y1
    return dx * dx + dy * dy


def simplify(points: Sequence[Sequence[float]], tolerance: float) -> list[list[float]]:
    """Iterative Douglas-Peucker simplification in lon/lat display space."""
    if len(points) <= 2:
        return [list(p) for p in points]
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    threshold = tolerance * tolerance
    while stack:
        start, end = stack.pop()
        best_index = -1
        best_distance = threshold
        for index in range(start + 1, end):
            distance = sq_distance(points[index], points[start], points[end])
            if distance > best_distance:
                best_index, best_distance = index, distance
        if best_index >= 0:
            keep.add(best_index)
            stack.extend(((start, best_index), (best_index, end)))
    return [list(points[index]) for index in sorted(keep)]


def iter_lines(geometry: dict[str, Any]) -> Iterator[list[list[float]]]:
    kind = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if kind == "LineString":
        yield coords
    elif kind == "MultiLineString":
        yield from coords


def iter_rings(geometry: dict[str, Any]) -> Iterator[list[list[float]]]:
    kind = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if kind == "Polygon":
        if coords:
            yield coords[0]
    elif kind == "MultiPolygon":
        for polygon in coords:
            if polygon:
                yield polygon[0]


def quantize(point: Sequence[float], bounds: Sequence[float]) -> tuple[int, int]:
    west, south, east, north = bounds
    lon, lat = point
    x = round((lon - west) / (east - west) * Q)
    y = round((north - lat) / (north - south) * Q)
    return x, y


def flat_quantized(points: Sequence[Sequence[float]], bounds: Sequence[float]) -> list[int]:
    out: list[int] = []
    previous: tuple[int, int] | None = None
    for point in points:
        current = quantize(point, bounds)
        if current == previous:
            continue
        out.extend(current)
        previous = current
    return out


def merge_quantized(lines: Sequence[list[int]]) -> list[list[int]]:
    """Join OSM way fragments through degree-two endpoints.

    OSM intentionally splits a road whenever its attributes change.  Those
    fragments are useful to editors but wasteful in a game map, so we restore
    continuous display lines while keeping real junctions separate.
    """
    clean = [line for line in lines if len(line) >= 4]
    endpoints: dict[tuple[int, int], list[int]] = {}
    for index, line in enumerate(clean):
        endpoints.setdefault((line[0], line[1]), []).append(index)
        endpoints.setdefault((line[-2], line[-1]), []).append(index)

    used: set[int] = set()

    def extend(chain: list[int], at_start: bool) -> list[int]:
        while True:
            endpoint = (chain[0], chain[1]) if at_start else (chain[-2], chain[-1])
            candidates = [index for index in endpoints.get(endpoint, []) if index not in used]
            if len(endpoints.get(endpoint, [])) != 2 or len(candidates) != 1:
                return chain
            index = candidates[0]
            used.add(index)
            next_line = clean[index]
            if (next_line[0], next_line[1]) == endpoint:
                oriented = next_line
            else:
                points = list(zip(next_line[0::2], next_line[1::2]))
                oriented = [value for point in reversed(points) for value in point]
            if at_start:
                chain = oriented[:-2] + chain
            else:
                chain = chain + oriented[2:]

    merged: list[list[int]] = []
    # Start at real endpoints/junctions first, then consume any closed loops.
    order = sorted(
        range(len(clean)),
        key=lambda index: (
            len(endpoints[(clean[index][0], clean[index][1])]) == 2
            and len(endpoints[(clean[index][-2], clean[index][-1])]) == 2
        ),
    )
    for index in order:
        if index in used:
            continue
        used.add(index)
        chain = extend(list(clean[index]), False)
        chain = extend(chain, True)
        merged.append(chain)
    return merged


def korean_name(properties: dict[str, Any]) -> str:
    return str(
        properties.get("name:ko")
        or properties.get("name")
        or properties.get("name:en")
        or ""
    ).strip()


def build_country(pbf: Path, filter_file: Path, work: Path) -> dict[str, Any]:
    filtered = work / "south-korea-game.osm.pbf"
    sequence = work / "south-korea-game.geojsonseq"
    run(
        [
            "osmium",
            "tags-filter",
            "-t",
            "-O",
            "-e",
            str(filter_file),
            "-o",
            str(filtered),
            str(pbf),
        ]
    )
    run(
        [
            "osmium",
            "export",
            "-O",
            "-f",
            "geojsonseq",
            "-o",
            str(sequence),
            str(filtered),
        ]
    )

    road_fragments: dict[int, list[list[int]]] = {road_class: [] for road_class in set(ROAD_CLASSES.values())}
    rail_fragments: list[list[int]] = []
    coast_fragments: list[list[int]] = []
    boundary: list[list[int]] = []
    places: list[list[Any]] = []
    road_labels: list[list[Any]] = []
    seen_road_labels: set[str] = set()
    seen_places: set[tuple[str, int, int]] = set()

    with sequence.open("r", encoding="utf-8") as handle:
        for raw in handle:
            raw = raw.lstrip("\x1e").strip()
            if not raw:
                continue
            feature = json.loads(raw)
            geometry = feature.get("geometry") or {}
            properties = feature.get("properties") or {}

            highway = properties.get("highway")
            if highway in ROAD_CLASSES:
                road_class = ROAD_CLASSES[highway]
                label = str(properties.get("ref") or properties.get("name:ko") or properties.get("name") or "")
                # Unnumbered secondary streets are useful in a city tile but
                # become an unreadable solid mass on the nationwide canvas.
                if road_class == 3 and not properties.get("ref"):
                    continue
                for line in iter_lines(geometry):
                    if len(line) < 2:
                        continue
                    points = simplify(line, ROAD_TOLERANCE[road_class])
                    encoded = flat_quantized(points, DISPLAY_BOUNDS)
                    if len(encoded) >= 4:
                        road_fragments[road_class].append(encoded)
                        if label and label not in seen_road_labels:
                            midpoint = points[len(points) // 2]
                            x, y = quantize(midpoint, DISPLAY_BOUNDS)
                            road_labels.append([x, y, label[:24], road_class])
                            seen_road_labels.add(label)
                continue

            if (
                properties.get("railway") == "rail"
                and not properties.get("service")
                and properties.get("usage", "") in {"", "main", "branch"}
            ):
                for line in iter_lines(geometry):
                    if len(line) < 2:
                        continue
                    encoded = flat_quantized(simplify(line, 0.0032), DISPLAY_BOUNDS)
                    if len(encoded) >= 4:
                        rail_fragments.append(encoded)
                continue

            if properties.get("natural") == "coastline":
                for line in iter_lines(geometry):
                    if len(line) < 2:
                        continue
                    encoded = flat_quantized(simplify(line, 0.0014), DISPLAY_BOUNDS)
                    if len(encoded) >= 4:
                        coast_fragments.append(encoded)
                continue

            if properties.get("place") in {"city", "town"} and geometry.get("type") == "Point":
                name = korean_name(properties)
                if not name:
                    continue
                x, y = quantize(geometry["coordinates"], DISPLAY_BOUNDS)
                key = (name, round(x / 18), round(y / 18))
                if key not in seen_places:
                    seen_places.add(key)
                    places.append([x, y, name, 0 if properties["place"] == "city" else 1])
                continue

            if properties.get("ISO3166-1") == "KR":
                for ring in iter_rings(geometry):
                    encoded = flat_quantized(simplify(ring, 0.0025), DISPLAY_BOUNDS)
                    if len(encoded) >= 8:
                        boundary.append(encoded)

    roads: list[list[Any]] = []
    for road_class in sorted(road_fragments):
        roads.extend([road_class, line] for line in merge_quantized(road_fragments[road_class]))
    rails = merge_quantized(rail_fragments)
    coast = merge_quantized(coast_fragments)
    places.sort(key=lambda place: (place[3], place[2]))
    road_labels.sort(key=lambda label: (label[3], label[2]))
    return {
        "bounds": DISPLAY_BOUNDS,
        "q": Q,
        "boundary": boundary,
        "roads": roads,
        "rails": rails,
        "coast": coast,
        "places": places,
        "roadLabels": road_labels[:500],
        "counts": {
            "boundary": len(boundary),
            "roads": len(roads),
            "rails": len(rails),
            "coast": len(coast),
            "places": len(places),
        },
        "sourceDate": osmium_value(pbf, "header.option.osmosis_replication_timestamp"),
    }


def tags_of(element: ET.Element) -> dict[str, str]:
    return {tag.attrib["k"]: tag.attrib["v"] for tag in element.findall("tag")}


def inside(point: Sequence[float], bounds: Sequence[float]) -> bool:
    west, south, east, north = bounds
    return west <= point[0] <= east and south <= point[1] <= north


def lines_near_bounds(
    points: Sequence[Sequence[float]], bounds: Sequence[float]
) -> Iterator[list[list[float]]]:
    """Keep in-bounds runs plus one outside endpoint to avoid clipped road gaps."""
    current: list[list[float]] = []
    previous: list[float] | None = None
    previous_inside = False
    for raw in points:
        point = list(raw)
        point_inside = inside(point, bounds)
        if point_inside:
            if not previous_inside and previous is not None:
                current.append(previous)
            current.append(point)
        elif previous_inside:
            current.append(point)
            if len(current) >= 2:
                yield current
            current = []
        elif current:
            if len(current) >= 2:
                yield current
            current = []
        previous, previous_inside = point, point_inside
    if len(current) >= 2:
        yield current


def build_local(osm_xml: Path) -> dict[str, Any]:
    root = ET.parse(osm_xml).getroot()
    bounds_node = root.find("bounds")
    if bounds_node is None:
        raise ValueError(f"{osm_xml} has no <bounds>")
    bounds = [
        float(bounds_node.attrib["minlon"]),
        float(bounds_node.attrib["minlat"]),
        float(bounds_node.attrib["maxlon"]),
        float(bounds_node.attrib["maxlat"]),
    ]

    nodes: dict[str, list[float]] = {}
    node_tags: dict[str, dict[str, str]] = {}
    for node in root.findall("node"):
        node_id = node.attrib["id"]
        nodes[node_id] = [float(node.attrib["lon"]), float(node.attrib["lat"])]
        tags = tags_of(node)
        if tags:
            node_tags[node_id] = tags

    roads: list[list[Any]] = []
    rails: list[list[int]] = []
    buildings: list[list[int]] = []
    greens: list[list[int]] = []
    waters: list[list[int]] = []
    road_names: list[list[Any]] = []
    seen_road_names: set[str] = set()

    for way in root.findall("way"):
        tags = tags_of(way)
        points = [nodes[ref.attrib["ref"]] for ref in way.findall("nd") if ref.attrib["ref"] in nodes]
        if len(points) < 2 or not any(inside(point, bounds) for point in points):
            continue

        highway = tags.get("highway")
        if highway in LOCAL_ROAD_CLASSES:
            road_class = LOCAL_ROAD_CLASSES[highway]
            for run_points in lines_near_bounds(points, bounds):
                encoded = flat_quantized(run_points, bounds)
                if len(encoded) >= 4:
                    roads.append([road_class, encoded])
            name = tags.get("name:ko") or tags.get("name")
            if name and name not in seen_road_names and road_class <= 1:
                mid = points[len(points) // 2]
                x, y = quantize(mid, bounds)
                road_names.append([x, y, name[:24]])
                seen_road_names.add(name)
            continue

        if tags.get("railway"):
            for run_points in lines_near_bounds(points, bounds):
                encoded = flat_quantized(run_points, bounds)
                if len(encoded) >= 4:
                    rails.append(encoded)
            continue

        closed = points[0] == points[-1]
        if not closed:
            continue
        encoded = flat_quantized(points, bounds)
        if len(encoded) < 8:
            continue
        if tags.get("building"):
            buildings.append(encoded)
        elif (
            tags.get("leisure") in {"park", "garden", "playground", "nature_reserve"}
            or tags.get("landuse") in {"forest", "grass", "recreation_ground", "meadow"}
            or tags.get("natural") in {"wood", "grassland"}
        ):
            greens.append(encoded)
        elif tags.get("natural") == "water" or tags.get("waterway") == "riverbank":
            waters.append(encoded)

    poi_candidates: list[tuple[int, list[Any]]] = []
    for node_id, tags in node_tags.items():
        name = tags.get("name:ko") or tags.get("name")
        point = nodes[node_id]
        if not name or not inside(point, bounds):
            continue
        kind = ""
        priority = 9
        if tags.get("railway") in {"station", "halt", "subway_entrance"}:
            kind, priority = "역", 0
        elif tags.get("public_transport"):
            kind, priority = "교통", 1
        elif tags.get("amenity") in {"hospital", "clinic", "school", "university", "library", "police", "marketplace"}:
            kind, priority = tags["amenity"], 2
        elif tags.get("amenity"):
            kind, priority = tags["amenity"], 4
        elif tags.get("shop"):
            kind, priority = "상점", 5
        elif tags.get("tourism") or tags.get("historic"):
            kind, priority = "기록", 3
        else:
            continue
        x, y = quantize(point, bounds)
        poi_candidates.append((priority, [x, y, name[:32], kind]))

    seen_poi: set[str] = set()
    pois: list[list[Any]] = []
    for _, poi in sorted(poi_candidates, key=lambda item: (item[0], item[1][2])):
        if poi[2] in seen_poi:
            continue
        seen_poi.add(poi[2])
        pois.append(poi)
        if len(pois) >= 120:
            break

    return {
        "bounds": bounds,
        "q": Q,
        "roads": roads,
        "rails": rails,
        "buildings": buildings,
        "greens": greens,
        "waters": waters,
        "roadNames": road_names[:80],
        "pois": pois,
        "counts": {
            "roads": len(roads),
            "rails": len(rails),
            "buildings": len(buildings),
            "greens": len(greens),
            "waters": len(waters),
            "pois": len(pois),
        },
    }


def write_js(output: Path, country: dict[str, Any], local: dict[str, Any] | None) -> None:
    payload = {
        "attribution": {
            "text": "© OpenStreetMap contributors · ODbL",
            "url": "https://www.openstreetmap.org/copyright",
            "extract": "Geofabrik South Korea",
            "extractUrl": "https://download.geofabrik.de/asia/south-korea.html",
        },
        "country": country,
        "local": local,
    }
    compact = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    content = (
        "/* Generated by tools/build_osm_extract.py. Do not edit by hand. */\n"
        f"D.osmArchive={compact};\n"
    )
    output.write_text(content, encoding="utf-8")
    print(f"Wrote {output} ({output.stat().st_size:,} bytes)")
    print("Country:", country["counts"])
    if local:
        print("Local:", local["counts"])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("pbf", type=Path, help="Geofabrik South Korea .osm.pbf")
    parser.add_argument(
        "--local-osm",
        type=Path,
        help="Optional detailed OSM XML export, e.g. Downloads/map.osm",
    )
    parser.add_argument("--filter", type=Path, default=DEFAULT_FILTER)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--work-dir", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.pbf.is_file():
        raise SystemExit(f"PBF not found: {args.pbf}")
    if args.local_osm and not args.local_osm.is_file():
        raise SystemExit(f"Local OSM XML not found: {args.local_osm}")
    if not args.filter.is_file():
        raise SystemExit(f"Filter not found: {args.filter}")
    if not shutil_which("osmium"):
        raise SystemExit("osmium-tool is required (brew install osmium-tool)")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.work_dir:
        args.work_dir.mkdir(parents=True, exist_ok=True)
        country = build_country(args.pbf, args.filter, args.work_dir)
    else:
        with tempfile.TemporaryDirectory(prefix="caravan-osm-") as temporary:
            country = build_country(args.pbf, args.filter, Path(temporary))
    local = build_local(args.local_osm) if args.local_osm else None
    write_js(args.output, country, local)


def shutil_which(program: str) -> str | None:
    for directory in os.environ.get("PATH", "").split(os.pathsep):
        candidate = Path(directory) / program
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return str(candidate)
    return None


if __name__ == "__main__":
    main()
