"""Shared proof helpers for final director-journey browser campaigns.

These helpers observe and persist gameplay.  They never grant resources,
progress, party members, bonds, locations, or presentation phases.
"""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any


SAVE_KEY = "seoul400_save_v1"
ARCHIVE_KEY = "seoul400_quality_archive_v1"
TRACE_VERSION = 1


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return sha256_bytes(text.encode("utf-8"))


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


SNAPSHOT_JS = """() => {
  const pending=S.pendingPresentation&&structuredClone(S.pendingPresentation);
  const drive=S.driving?{from:S.driving.from,to:S.driving.to,dist:S.driving.dist,
    gone:Number(S.driving.gone||0),approach:!!S.driving.approach,
    campEchoes:structuredClone(S.driving.campEchoes||[]),campEcho:S.driving.campEcho||null}:null;
  const plan=typeof G.questNavigationPlan==='function'?G.questNavigationPlan():null;
  const event=document.querySelector('#ev-wrap.on #ev-sheet');
  return {
    build:typeof GAME_BUILD==='string'?GAME_BUILD:null,schema:S.v||S._v||S.version||null,
    at:S.at,day:S.day,min:Number(S.min||0),km:Number(S.stats?.km||0),drive,
    opening:S.opening?structuredClone(S.opening):null,
    eventId:event?.dataset.eventId||pending?.eventId||null,
    presentationPhase:event?.dataset.storyPhase||pending?.phase||null,
    storyStep:event?.dataset.storyStep||null,pending,
    party:[...(S.party||[])],injuries:structuredClone(S.injuries||{}),
    comps:Object.fromEntries(Object.entries(S.comps||{}).map(([id,row])=>
      [id,{mood:row.mood,bond:row.bond,lvl:row.lvl,perks:[...(row.perks||[])],pending:row.pending||0,
        injury:S.injuries?.[id]?structuredClone(S.injuries[id]):null,
        isInjured:typeof G.isInjured==='function'?G.isInjured(id):!!S.injuries?.[id],
        approach:row.approach||null,storyReady:!!row.storyReady}])),
    recruitQ:S.recruitQ?structuredClone(S.recruitQ):null,
    campMemories:structuredClone(S.campMemories||{}),
    resources:{fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,van:S.van,
      fatigue:S.fatigue,items:structuredClone(S.items||{})},
    flags:Object.keys(S.flags||{}).filter(k=>S.flags[k]).sort(),
    evidence:{rows:typeof G.mainEvidenceRows==='function'?structuredClone(G.mainEvidenceRows()):null,
      pillars:typeof G.pillars==='function'?structuredClone(G.pillars()):null,
      ready:typeof G.mainStoryReady==='function'?G.mainStoryReady():null,
      linkedCells:typeof G.coreLinkedCells==='function'?structuredClone(G.coreLinkedCells()):null},
    routePlan:S.routePlan?structuredClone(S.routePlan):null,navigationPlan:plan,
    upgrades:structuredClone(S.up||{}),notes:structuredClone(S.notes||[]),noteSeq:S.noteSeq||0,
    seoul:{stage:typeof G.seoulStage==='function'?G.seoulStage():null,
      ready:typeof G.seoulReady==='function'?G.seoulReady():null,
      missing:typeof G.seoulMissing==='function'?G.seoulMissing():null,
      method:typeof G.resolvedFinaleMethod==='function'?G.resolvedFinaleMethod():null},
    ended:!!S.ended,endKind:S.endKind||null,usedCount:(S.used||[]).length,
    choiceCount:S._quality?.counts?.choices||0,eventCount:S._quality?.counts?.events||0,
    archives:JSON.parse(localStorage.getItem('seoul400_quality_archive_v1')||'[]').length
  };
}"""


def snapshot(page) -> dict[str, Any]:
    return page.evaluate(SNAPSHOT_JS)


def resource_delta(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    delta: dict[str, Any] = {}
    for key in ("fuel", "water", "food", "scrap", "van", "fatigue"):
        left, right = before["resources"].get(key), after["resources"].get(key)
        if left != right:
            delta[key] = round(right - left, 6)
    before_items, after_items = before["resources"]["items"], after["resources"]["items"]
    item_delta = {
        key: after_items.get(key, 0) - before_items.get(key, 0)
        for key in sorted(set(before_items) | set(after_items))
        if after_items.get(key, 0) != before_items.get(key, 0)
    }
    if item_delta:
        delta["items"] = item_delta
    return delta


class TraceChain:
    """Append-only canonical trace with a SHA-256 link per gameplay action."""

    def __init__(self, scenario: str):
        self.scenario = scenario
        self.rows: list[dict[str, Any]] = []
        self.previous = "0" * 64

    def add(self, action: str, before: dict[str, Any], after: dict[str, Any], **extra: Any) -> dict[str, Any]:
        row = {
            "version": TRACE_VERSION,
            "sequence": len(self.rows) + 1,
            "scenario": self.scenario,
            "action": action,
            "control": extra.pop("control", None),
            "eventId": before.get("eventId") or after.get("eventId"),
            "presentationPhase": before.get("presentationPhase") or after.get("presentationPhase"),
            "storyStep": before.get("storyStep") or after.get("storyStep"),
            "choiceId": extra.pop("choiceId", None),
            "resultId": extra.pop("resultId", None),
            "location": after.get("at"),
            "day": after.get("day"),
            "minutes": after.get("min"),
            "km": after.get("km"),
            "travel": after.get("drive") or before.get("drive"),
            "routePlan": after.get("routePlan"),
            "navigationPlan": after.get("navigationPlan"),
            "party": after.get("party"),
            "recruitment": after.get("recruitQ"),
            "camp": after.get("campMemories"),
            "seoul": after.get("seoul"),
            "flags": after.get("flags"),
            "evidence": after.get("evidence"),
            "resources": after.get("resources"),
            "delta": resource_delta(before, after),
            "before": before,
            "after": after,
            "previousHash": self.previous,
            **extra,
        }
        payload = canonical_json(row).encode("utf-8")
        row["rowHash"] = sha256_bytes(payload)
        self.previous = row["rowHash"]
        self.rows.append(row)
        return row


def visible_control(page, selectors: list[str]):
    for selector in selectors:
        locator = page.locator(selector)
        for index in range(locator.count()):
            candidate = locator.nth(index)
            if candidate.is_visible() and candidate.is_enabled():
                return candidate, selector
    return None, None


def wait_and_click(page, selectors: list[str], pause_ms: int = 0):
    control, selector = visible_control(page, selectors)
    if control is None:
        raise AssertionError(f"no enabled visible control: {selectors}")
    if pause_ms:
        page.wait_for_timeout(pause_ms)
    control.click()
    return selector


def capture_gameplay_save(page, path: Path) -> dict[str, Any]:
    """Persist through G.save and copy the exact localStorage bytes it wrote."""
    page.evaluate("G.save()")
    raw = page.evaluate("localStorage.getItem('seoul400_save_v1')")
    assert raw, "gameplay did not write an active save"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw.encode("utf-8"))
    return {"path": str(path), "bytes": len(raw.encode('utf-8')), "sha256": sha256_text(raw)}


def install_checkpoint_once(context, save_text: str, archive_text: str = "[]") -> None:
    """Preload once in a fresh context; reloads consume the save gameplay wrote."""
    payload = canonical_json([SAVE_KEY, ARCHIVE_KEY, save_text, archive_text])
    context.add_init_script(
        f"""(() => {{
          const [saveKey,archiveKey,saveText,archiveText]={payload};
          if(sessionStorage.getItem('director_checkpoint_preloaded')==='1') return;
          localStorage.clear();
          localStorage.setItem(saveKey,saveText);
          localStorage.setItem(archiveKey,archiveText);
          localStorage.setItem('caravan_story_auto','0');
          localStorage.setItem('caravan_intro_auto','0');
          sessionStorage.setItem('director_checkpoint_preloaded','1');
        }})()""",
    )


def continue_from_title(page, settle_ms: int = 550) -> str:
    """Resume through live auto-entry or the actual title Continue control."""
    page.wait_for_function(
        "document.querySelector('#scr-game')?.classList.contains('on') || "
        "!!document.querySelector('#bt-continue:not([disabled])')",
    )
    if page.locator("#scr-game.on").count():
        page.wait_for_timeout(settle_ms)
        return "live-auto-resume"
    page.click("#bt-continue:not([disabled])")
    page.wait_for_selector("#scr-game.on")
    page.wait_for_timeout(settle_ms)
    return "explicit-continue"


def presentation_identity(page) -> dict[str, Any]:
    return page.evaluate(r"""() => {
      const sheet=document.querySelector('#ev-wrap.on #ev-sheet');
      return {eventId:sheet?.dataset.eventId||null,phase:sheet?.dataset.storyPhase||null,
        storyStep:sheet?.dataset.storyStep||null,title:sheet?.querySelector('.event-title,h2')?.textContent?.trim()||'',
        text:sheet?.querySelector('.event-scroll')?.textContent?.replace(/\s+/g,' ').trim()||'',
        authoredText:sheet?.querySelector('.story-reader')?.textContent?.replace(/\s+/g,' ').trim()||'',
        tutorialVisible:!!sheet?.querySelector('.event-tutorial-note'),
        choices:[...document.querySelectorAll('#ev-wrap.on #ev-sheet [data-i]')].map(node=>({
          id:node.dataset.i,text:node.textContent.replace(/\s+/g,' ').trim(),disabled:node.disabled})),
        results:[...document.querySelectorAll('#ev-wrap.on #ev-sheet [data-r]')].map(node=>({
          id:node.dataset.r,text:node.textContent.replace(/\s+/g,' ').trim(),disabled:node.disabled}))};
    }""")


def reload_exact_once(page, pause_ms: int = 50) -> tuple[dict[str, Any], dict[str, Any]]:
    def saved_state(raw: str) -> dict[str, Any]:
        persisted = json.loads(raw)
        return {
            "schema": persisted.get("v"), "day": persisted.get("day"), "minutes": persisted.get("min"),
            "km": (persisted.get("stats") or {}).get("km"), "drive": persisted.get("driving"),
            "resources": {key: persisted.get(key) for key in ("fuel", "water", "food", "scrap", "van", "fatigue")}
                         | {"items": persisted.get("items") or {}},
            "flags": sorted(key for key, value in (persisted.get("flags") or {}).items() if value),
            "notes": persisted.get("notes") or [], "noteSeq": persisted.get("noteSeq") or 0,
            "party": persisted.get("party") or [], "usedCount": len(persisted.get("used") or []),
            "choiceCount": ((persisted.get("_quality") or {}).get("counts") or {}).get("choices", 0),
            "eventCount": ((persisted.get("_quality") or {}).get("counts") or {}).get("events", 0),
            "pending": persisted.get("pendingPresentation"), "opening": persisted.get("opening"),
        }
    saved_input = page.evaluate("localStorage.getItem('seoul400_save_v1')")
    assert saved_input
    before = {"state": snapshot(page), "presentation": presentation_identity(page),
              "saveInput": {"bytes": len(saved_input.encode()), "sha256": sha256_text(saved_input),
                            "state": saved_state(saved_input)}}
    page.add_init_script("window.__DIRECTOR_LOADED_SAVE=localStorage.getItem('seoul400_save_v1')")
    page.reload(wait_until="commit", timeout=300_000)
    page.wait_for_function("typeof G!=='undefined'&&typeof UI!=='undefined'", timeout=120_000)
    loaded_input = page.evaluate("window.__DIRECTOR_LOADED_SAVE")
    assert loaded_input
    continue_from_title(page, settle_ms=50)
    page.wait_for_timeout(pause_ms)
    saved_current = page.evaluate("localStorage.getItem('seoul400_save_v1')")
    after = {"state": snapshot(page), "presentation": presentation_identity(page),
             "loadedInput": {"bytes": len(loaded_input.encode()), "sha256": sha256_text(loaded_input),
                             "state": saved_state(loaded_input)},
             "saveCurrent": {"bytes": len(saved_current.encode()), "sha256": sha256_text(saved_current)}}
    return before, after


def timed_pause(page, label: str, milliseconds: int, records: list[dict[str, Any]]) -> None:
    started = time.monotonic()
    page.wait_for_timeout(milliseconds)
    records.append({"label": label, "requestedMs": milliseconds,
                    "observedMs": round((time.monotonic() - started) * 1000)})
