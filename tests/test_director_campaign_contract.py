"""Fast contract checks for the final journey proof runner and trace schema."""
from pathlib import Path
import ast
import re

from tests.director_journey_helpers import TraceChain, canonical_json, resource_delta, sha256_text


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "tools/qa-director-city-route.py"
HELPER = ROOT / "tests/director_journey_helpers.py"


def test_runner_has_direct_main_and_every_required_scenario():
    source = RUNNER.read_text()
    tree = ast.parse(source)
    assert any(isinstance(node, ast.FunctionDef) and node.name == "main" for node in tree.body)
    assert 'if __name__=="__main__":main()' in source
    for scenario in ("route", "recruit", "crew-checkpoint", "finale", "reload-matrix", "normal-opening", "normal-earned"):
        assert f'"{scenario}"' in source


def test_runner_has_no_post_start_grant_or_hidden_wayfinding_patterns():
    source = RUNNER.read_text()
    forbidden = (
        "questGraphDistance", "Dijkstra", "restoreQaView", "G.openEvent(",
        "S.party=", "S.flags[", "Object.assign(S", "S.at=", "S.fuel=",
        "S.water=", "S.food=", "S.scrap=", "S.comps[", "G.bond(",
    )
    assert not {token for token in forbidden if token in source}
    assert "G.questPreferredNeighbor" in source
    assert "G.questNavigationPlan" in source
    assert "fixed-visible-meet-itinerary" in source
    assert '"rev" not in self.a.url' in source


def test_helper_never_assigns_game_state_and_preloads_checkpoint_once():
    source = HELPER.read_text()
    assert not re.search(r"\bS\.[A-Za-z_$][\w$]*(?:\[[^]]+\])?\s*=", source)
    assert "director_checkpoint_preloaded" in source
    assert "sessionStorage" in source
    assert "G.save()" in source and "localStorage.getItem('seoul400_save_v1')" in source


def test_trace_rows_are_canonical_hash_chained_and_include_required_state():
    before = {"at":"busan","day":1,"min":480,"km":0,"drive":None,"eventId":None,
              "presentationPhase":None,"routePlan":None,"navigationPlan":{"target":"seoul"},
              "party":[],"recruitQ":None,"campMemories":{},"seoul":{"stage":0},
              "flags":[],"evidence":{"have":0},
              "resources":{"fuel":60,"water":20,"food":16,"scrap":12,"van":100,"fatigue":0,"items":{}}}
    after = {**before,"at":"yangsan","km":20,
             "resources":{**before["resources"],"fuel":56}}
    trace = TraceChain("contract")
    first = trace.add("travel", before, after, control='[data-nav-depart="yangsan"]',
                      candidates=["yangsan"], preferred="yangsan", chosen="yangsan")
    second = trace.add("continue", after, after)
    assert first["delta"] == {"fuel": -4}
    assert second["previousHash"] == first["rowHash"]
    assert len(first["rowHash"]) == 64
    for key in ("eventId","presentationPhase","location","day","minutes","km","travel",
                "routePlan","navigationPlan","party","recruitment","camp","seoul","flags",
                "evidence","resources","before","after","previousHash","rowHash"):
        assert key in first
    unhashed = {key:value for key,value in first.items() if key != "rowHash"}
    assert first["rowHash"] == sha256_text(canonical_json(unhashed))
    reversed_insertion = dict(reversed(list(unhashed.items())))
    assert canonical_json(unhashed) == canonical_json(reversed_insertion)


def test_reload_matrix_names_every_presentation_owner_class():
    source = RUNNER.read_text()
    for name in ("opening-event","opening-result","travel","recruitment-event","recruitment-result",
                 "camp-event","camp-result","ordinary-event","ordinary-result","combat-event","combat-result",
                 "seoul_open","seoul_han","seoul_ruins","seoul_square","seoul_base","seoul_core",
                 "seoul_costs","seoul_decision","seoul_night","seoul_uplink_reveal","seoul_session_reset"):
        assert name in source


def test_resource_delta_includes_named_items_without_noise():
    before={"resources":{"fuel":20,"water":8,"food":8,"scrap":3,"van":90,"fatigue":4,"items":{"부품":1}}}
    after={"resources":{"fuel":17,"water":8,"food":8,"scrap":3,"van":90,"fatigue":4,"items":{"부품":3}}}
    assert resource_delta(before,after)=={"fuel":-3,"items":{"부품":2}}
