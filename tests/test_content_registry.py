#!/usr/bin/env python3
"""Content registry and structured authored-body regression probes."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_FILES = (
    "03-data.js",
    "03f-npc-portraits.js",
    "03g-scenes.js",
    "03i-story-expansion.js",
    "03j-camp-conversations.js",
    "03k-main-evidence.js",
    "03l-main-recovery.js",
    "03m-finale-reading.js",
    "03n-route-aftermath.js",
)
ENGINE_FILES = (
    "04a-engine-core.js",
    "04b-engine-crew.js",
    "04c-engine-travel.js",
    "04d-engine-director.js",
    "04e-engine-world.js",
)


def copy_fixture(destination: Path) -> None:
    (destination / "src").mkdir()
    (destination / "tools").mkdir()
    (destination / "docs").mkdir()
    (destination / "reports").mkdir()
    for name in DATA_FILES + ENGINE_FILES:
        shutil.copy2(ROOT / "src" / name, destination / "src" / name)
    shutil.copy2(ROOT / "tools" / "validate-content.cjs", destination / "tools")
    shutil.copy2(ROOT / "tools" / "update-current-doc.mjs", destination / "tools")
    shutil.copy2(ROOT / "tools" / "content-registry.cjs", destination / "tools")
    shutil.copy2(ROOT / "docs" / "CURRENT.md", destination / "docs")
    shutil.copy2(ROOT / "reports" / "asset-budget.json", destination / "reports")


def run(command: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=False)


def runtime_registry(root: Path) -> dict[str, int]:
    source = r"""
const fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({console});
for(const name of %s){
  const file='src/'+name;
  vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});
}
const D=vm.runInContext('D',c);
const permanent=[
  ...(D.events||[]),
  ...(D.roadCheckInEvents||[]),
  D.seoulOpenEvent,D.gateEvent,D.bridgeEvent,
  ...(D.seoulStops||[]),
  D.onboardingMission,
  ...(D.openingDeparture||[]),
].filter(Boolean);
console.log(JSON.stringify({
  eventCount:new Set(permanent.map(row=>row.id)).size,
  sceneCount:Object.keys(D.scenes||{}).length,
  permanentRows:permanent.length,
}));
""" % json.dumps(list(DATA_FILES))
    result = run(["node", "-e", source], root)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


def mutate_data(root: Path, statement: str) -> None:
    path = root / "src" / "03-data.js"
    path.write_text(path.read_text() + "\n" + statement + "\n")


def combined_output(result: subprocess.CompletedProcess[str]) -> str:
    return result.stdout + result.stderr


def verify_built_page(url: str, expected: dict[str, int]) -> dict[str, object]:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=180_000)
        page.wait_for_function("() => typeof D !== 'undefined'", timeout=30_000)
        runtime = page.evaluate(
            """() => {
              const groups={
                events:D.events||[],
                roadCheckIns:D.roadCheckInEvents||[],
                seoulSingletons:[D.seoulOpenEvent,D.gateEvent,D.bridgeEvent].filter(Boolean),
                seoulStops:D.seoulStops||[],
                onboarding:[D.onboardingMission].filter(Boolean),
                opening:D.openingDeparture||[],
              };
              const rows=Object.values(groups).flat();
              const ids=rows.map(row=>row.id);
              return {
                build:GAME_BUILD,
                groups:Object.fromEntries(Object.entries(groups).map(([key,value])=>[key,value.length])),
                rows:rows.length,
                unique:new Set(ids).size,
                duplicates:[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))],
                campConversationKeys:Object.keys(D.campConversations||{}).length,
              };
            }"""
        )
        browser.close()
    assert runtime["duplicates"] == [], runtime
    assert runtime["rows"] == runtime["unique"] == expected["eventCount"], runtime
    return runtime


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="caravan-content-registry-") as raw:
        fixture = Path(raw)
        copy_fixture(fixture)
        expected = runtime_registry(fixture)

        validated = run(["node", "tools/validate-content.cjs"], fixture)
        assert validated.returncode == 0, combined_output(validated)
        match = re.search(r"이벤트 (\d+)", combined_output(validated))
        assert match, combined_output(validated)
        assert int(match.group(1)) == expected["eventCount"], (
            f"validator counted {match.group(1)}, runtime registry counted "
            f"{expected['eventCount']}"
        )
        assert expected["permanentRows"] == expected["eventCount"], (
            "runtime-authored permanent registry contains duplicate IDs"
        )

        generated = run(["node", "tools/update-current-doc.mjs"], fixture)
        assert generated.returncode == 0, combined_output(generated)
        current = (fixture / "docs" / "CURRENT.md").read_text()
        event_match = re.search(r"\| 이벤트 \| (\d+)종 \|", current)
        scene_match = re.search(r"\| 장면 이미지 \| (\d+)종 \|", current)
        assert event_match and int(event_match.group(1)) == expected["eventCount"], current
        assert scene_match and int(scene_match.group(1)) == expected["sceneCount"], current

        page_url = os.environ.get("CARAVAN_REGISTRY_URL")
        if page_url:
            runtime = verify_built_page(page_url, expected)
            print("Built-page registry:", json.dumps(runtime, ensure_ascii=False, sort_keys=True))

    probes = (
        (
            "blank structured turn",
            "D.openingDeparture[0].turns[0].text='';",
            "event:opening_workshop.turn[0]: 본문 없음",
        ),
        (
            "malformed structured turn",
            "D.openingDeparture[0].turns.push({kind:'dialogue',who:'me'});",
            "event:opening_workshop.turn[3]: 본문 없음",
        ),
        (
            "unknown structured turn speaker",
            "D.openingDeparture[1].turns[1].who='missing_test_speaker';",
            "event:opening_bus_repair.turn[1]: 없는 화자 missing_test_speaker",
        ),
        (
            "duplicate permanent authored id",
            "D.openingDeparture.push({...D.openingDeparture[0]});",
            "opening_workshop: 중복 이벤트 ID",
        ),
    )
    for label, mutation, expected_error in probes:
        with tempfile.TemporaryDirectory(prefix="caravan-content-probe-") as raw:
            fixture = Path(raw)
            copy_fixture(fixture)
            mutate_data(fixture, mutation)
            result = run(["node", "tools/validate-content.cjs"], fixture)
            output = combined_output(result)
            assert result.returncode != 0, f"{label} was accepted\n{output}"
            assert expected_error in output, f"{label}: expected {expected_error!r}\n{output}"

    print(
        "PASS content registry matches runtime-authored data and rejects "
        "blank/malformed turns, unknown speakers, and duplicate IDs"
    )


if __name__ == "__main__":
    main()
