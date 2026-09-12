#!/usr/bin/env python3
"""Build the compact Task 8 evidence index from preserved campaign artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "artifacts/director-pass-2026-09-11/task8-final"
OUT = EVIDENCE / "evidence-index.json"
OWNER_CORRECTION = ROOT / "audits/director-journey-2026-09-11/whole-review-fix/pending-owner-correction.json"
owner_correction = json.loads(OWNER_CORRECTION.read_text())


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()


def verify_trace(path: Path) -> tuple[int, str]:
    rows = json.loads(path.read_text())
    assert isinstance(rows, list) and rows
    previous = "0" * 64
    for sequence, row in enumerate(rows, 1):
        assert row["sequence"] == sequence
        assert row["previousHash"] == previous
        unhashed = {key: value for key, value in row.items() if key != "rowHash"}
        assert hashlib.sha256(canonical(unhashed)).hexdigest() == row["rowHash"]
        previous = row["rowHash"]
    return len(rows), previous


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT))


scenarios = []
for manifest_path in sorted(EVIDENCE.glob("*/manifest.json")):
    manifest = json.loads(manifest_path.read_text())
    folder = manifest_path.parent
    trace_path = folder / "trace.json"
    rows, chain_head = verify_trace(trace_path)
    assert rows == manifest["trace"]["rows"]
    assert chain_head == manifest["trace"]["head"]
    assert digest(trace_path) == manifest["trace"]["sha256"]
    assert manifest["localHtml"]["sha256"] == manifest["mainResponse"]["sha256"]
    assert manifest["localHtml"]["bytes"] == manifest["mainResponse"]["bytes"]
    indexed_files = manifest.get("captures", [])
    for capture in indexed_files:
        capture_path = folder / capture["path"]
        assert capture_path.is_file() and digest(capture_path) == capture["sha256"]
    journal_exports = [
        row for row in indexed_files
        if row.get("kind") == "journal-export" or Path(row["path"]).suffix.lower() == ".md"
    ]
    png_captures = [row for row in indexed_files if Path(row["path"]).suffix.lower() == ".png"]
    other_indexed_files = [
        row for row in indexed_files
        if row not in png_captures and row not in journal_exports
    ]
    assert not other_indexed_files, (
        f"{folder.name}: indexed evidence is not partitioned into PNG captures and journal exports: "
        f"{other_indexed_files}"
    )
    video = manifest.get("video")
    if video:
        video_path = folder / video["path"]
        assert video_path.is_file() and digest(video_path) == video["sha256"]
    save = manifest.get("save")
    if save:
        save_path = Path(save["path"])
        assert save_path.is_file() and digest(save_path) == save["sha256"]
    final = manifest["final"]
    camp = {
        cid: {
            "choiceId": row.get("choiceId"),
            "home": bool(row.get("home")),
            "road": bool(row.get("road")),
            "pendingRoad": row.get("pendingRoad"),
        }
        for cid, row in (final.get("campMemories") or {}).items()
    }
    entry = {
        "scenario": folder.name,
        "runnerScenario": manifest["scenario"],
        "directory": relative(folder),
        "status": manifest["status"],
        "command": manifest["command"],
        "commit": manifest["commit"],
        "seed": manifest["seed"],
        "pace": manifest["pace"],
        "viewport": manifest["viewport"],
        "runtimeBuild": manifest["runtimeBuild"],
        "html": manifest["localHtml"],
        "browserDocument": manifest["mainResponse"],
        "runnerSha256": manifest["runnerSha256"],
        "helperSha256": manifest["helperSha256"],
        "routePolicy": manifest["routePolicy"],
        "manifestSha256": digest(manifest_path),
        "trace": manifest["trace"],
        "traceChainVerified": True,
        "captureCount": len(png_captures),
        "captureHashesVerified": True,
        "journalExports": journal_exports,
        "indexedEvidenceFileCount": len(indexed_files),
        "pageErrors": manifest.get("pageErrors", []),
        "httpErrors": manifest.get("httpErrors", []),
        "resumeMode": manifest.get("resumeMode"),
        "checkpointInput": manifest.get("checkpointInput"),
        "save": manifest.get("save"),
        "video": video,
        "final": {
            "at": final.get("at"), "day": final.get("day"), "km": final.get("km"),
            "party": final.get("party"), "resources": final.get("resources"),
            "injuries": final.get("injuries"), "campMemories": camp,
            "evidenceReady": (final.get("evidence") or {}).get("ready"),
            "evidenceRowsDone": sum(bool(row.get("done")) for row in (final.get("evidence") or {}).get("rows", [])),
            "linkedCells": [row.get("id") for row in (final.get("evidence") or {}).get("linkedCells", [])],
            "upgrades": final.get("upgrades"), "noteSeq": final.get("noteSeq"),
            "ended": final.get("ended"), "endKind": final.get("endKind"),
            "method": (final.get("seoul") or {}).get("method"), "archives": final.get("archives"),
        },
    }
    if manifest.get("timings"):
        entry["timings"] = {
            "count": len(manifest["timings"]),
            "requestedTotalMs": sum(row["requestedMs"] for row in manifest["timings"]),
            "observedTotalMs": sum(row["observedMs"] for row in manifest["timings"]),
            "minimumObservedMs": min(row["observedMs"] for row in manifest["timings"]),
        }
    if manifest["scenario"] == "reload-matrix":
        reload_entries = json.loads((folder / "reloads.json").read_text())
        entry["executedReloadClasses"] = [row["class"] for row in reload_entries if not row.get("owner")]
        recorded_references = [row for row in reload_entries if row.get("owner")]
        corrected_references = owner_correction["references"]
        assert [row["class"] for row in recorded_references] == [row["class"] for row in corrected_references]
        # Preserve the qualified raw bytes and expose the old attribution beside
        # its correction. A reference never counts as a campaign execution.
        entry["referencedPendingClasses"] = [
            {**corrected, "historicalRecordedReference": recorded}
            for recorded, corrected in zip(recorded_references, corrected_references)
        ]
        entry["pendingOwnerCorrection"] = relative(OWNER_CORRECTION)
    scenarios.append(entry)

diagnostics = sorted(relative(path) for path in (EVIDENCE / "diagnostics").iterdir() if path.is_dir())
auxiliary = []
for path in (
    ROOT / "artifacts/director-pass-2026-09-11/task8-route-forecast-final/trace.json",
    ROOT / "artifacts/director-pass-2026-09-11/final-route-event-spacing.json",
    ROOT / "artifacts/director-pass-2026-09-11/controller-qualified-integrity.json",
    ROOT / "artifacts/director-pass-2026-09-11/legacy-visual-warnings-baseline.json",
):
    auxiliary.append({"path": relative(path), "bytes": path.stat().st_size, "sha256": digest(path)})

index = {
    "version": 1,
    "scope": "Compact index for Task 8 final evidence; raw traces, saves, captures, videos, logs, and exports remain at the named paths.",
    "runtimeFreeze": {
        "commit": "3a3c9aa868a8963edbc6d77fc873d180cbe352b6",
        "gameBuild": "2026-09-11-director-journey",
        "htmlBytes": 77666839,
        "htmlSha256": "1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07",
        "hardLimitBytes": 80000000,
        "inheritedVisualWarningCount": 58,
    },
    "qualification": {
        "scenarioCount": len(scenarios),
        "allComplete": all(row["status"] == "complete" for row in scenarios),
        "allExactFrozenHtml": all(row["html"]["sha256"] == "1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07" for row in scenarios),
        "allTraceChainsAndIndexedMediaVerified": True,
        "pngCaptureCount": sum(row["captureCount"] for row in scenarios),
        "journalExportCount": sum(len(row["journalExports"]) for row in scenarios),
        "indexedEvidenceFileCount": sum(row["indexedEvidenceFileCount"] for row in scenarios),
        "browserHttpCaveat": "Each context logged the optional dev-server /assets/app-icon.png 404; pageErrors are zero.",
    },
    "scenarios": scenarios,
    "auxiliaryEvidence": auxiliary,
    "pendingOwnerCorrection": {
        "path": relative(OWNER_CORRECTION),
        "bytes": OWNER_CORRECTION.stat().st_size,
        "sha256": digest(OWNER_CORRECTION),
        "scope": owner_correction["scope"],
    },
    "diagnosticOnlyDirectories": diagnostics,
    "legacyOnlyFixtures": [
        "artifacts/director-pass-2026-09-11/crew-preliminary.save.json",
        "artifacts/director-pass-2026-09-11/minji-first-night-natural.save.json",
    ],
}
OUT.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes; sha256={digest(OUT)})")
print(
    f"verified {len(scenarios)} final scenarios, "
    f"{sum(row['trace']['rows'] for row in scenarios)} trace rows, "
    f"{sum(row['captureCount'] for row in scenarios)} PNG captures + "
    f"{sum(len(row['journalExports']) for row in scenarios)} journal exports"
)
