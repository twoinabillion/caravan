# Whole-branch verification fix — 2026-09-12

Base: `9dab9c0ff97f4bdd1a58025fbfeb59ea0721e9fd`. Sole implementer `/root/whole_review_fix`; no subagents, gameplay/runtime/test source changes, or original-project writes.

## Finding and correction

The whole reviewer found one Important verification issue: Task 8 reported direct `python3 tests/test_director_pending.py` exit 0 as a pending/audio regression pass, but the pytest-only file has no direct entry point and executes zero tests that way. Those PASS claims are explicitly withdrawn in the current and archived Task 8 reports. The preparation command now invokes pytest with the requested two-test selector.

Executed exactly this bounded browser regression command from the worktree:

```sh
python3 -m pytest -q tests/test_director_pending.py -k 'close_transition_and_combat_result or new_combat_resolution_has_cues'
```

Result: **2 passed, 39 deselected in 13.89s; exit 0**. Pytest collected 41 cases, selected and executed 2. The tests are `test_close_transition_and_combat_result_do_not_reroll` and `test_new_combat_resolution_has_cues_but_restored_result_is_silent`. They exercise newly applied confirmation/outcome cues, restored-result silence and stable saved state, plus interrupted close-to-next-event handoff without reapplication. No product defect was exposed.

The first identical command in the filesystem sandbox failed at both Chromium fixture setups (`bootstrap_check_in ... Permission denied`) before any test body or game execution: `39 deselected, 2 errors in 0.79s`. With approved isolated browser-process escalation the same command passed. This is a launch diagnostic, not a failed game assertion or an auto-review rejection. Both logs are preserved.

The test's default file URL loaded `/Users/sang/_workspace/caravan-director-20260911/서울까지400km.html`, **77,666,839 bytes**, SHA-256 **`1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07`**, build **`2026-09-11-director-journey`**. Before/after hashes match; the test-file hash is `a80d854c5e20f6a8fd6dca8a740ca30a7987b01ae2174954cdae5810f2a5d3a5`. Exact invocation, counts, paths and hashed logs are in `audits/director-journey-2026-09-11/whole-review-fix/verification.json`.

## External evidence owners

The campaign reload runner executed only opening-event, opening-result and travel. Its 19 other labels are external references, not additional executed campaign cases. `pending-owner-correction.json` now records the class-specific owner and actual scope:

- Ordinary, saved recruitment-offer and eleven Seoul phase references cite accepted historical Task 7 pytest work. These are not fresh final frozen-build reruns. Recruitment labels describe accepted/declined saved offers, not every arbitrary recruitment event/result.
- Camp pending/result references cite the separately executed `tests/test_director_camp.py` and `tests/test_director_camp_ui.py` main scripts, recorded in Task 7 fix1. Pytest did not execute those scripts.
- Combat references cite historical Task 7 work and the two newly executed frozen-runtime tests above.

`tools/qa-director-city-route.py` now loads this explicit mapping for future external-reference metadata rather than asserting blanket final-build coverage. `tools/make-task8-index.py` applies the correction to the derived index and retains old raw labels under `historicalRecordedReference`. The mapping is an intentional durable audit dependency under the existing integration allowlist. The integration worker must recompute the reviewed file list at the accepted fix commit so it includes this JSON and the other new audit evidence.

Current/archived Task 8 reports, preparation, audit README, human evidence index and CURRENT all distinguish historical test evidence from the fresh two-test result. Historical frozen ledgers and qualified raw campaign manifests, traces, reload records, captures, saves and videos are unchanged.

## Bounded validation

- The exact two-test pytest command above: **2 passed, 39 deselected**.
- `python3 tools/make-task8-index.py`: verifies **15 scenarios, 11,232 trace rows, 223 PNG captures + 3 journal exports** against preserved hashes; this is re-indexing, not campaign rerunning.
- Corrected derived index: **78,847 bytes**, SHA-256 **`0d7eaa54c40e0b12f8d759b18aef337782130f7395ef582617db2f9f8edfb300`**; durable audit copy is byte-identical.
- One-time packaging assertions compare the prior index: every scenario field apart from external owner attribution is identical, all qualification values are identical, the raw reload file hash is unchanged, all 19 mappings match runner class order, camp owners are separate, and current/archived Task 8 reports are byte-identical. Receipt: `whole-review-fix/packaging-verification.json`.
- `python3 -m py_compile tools/qa-director-city-route.py tools/make-task8-index.py`: exit 0.
- `git diff --check`: exit 0.
- No changes under `src/`, `assets/` or `tests/`; no generated HTML edit or rebuild, no additional browser suites/campaigns.

## Remaining scope

The named verification issue is corrected. The controller must obtain the one scoped re-review. Original integration, HTML/AIT packaging and original 4175 proof remain Phase B work; the goal is not complete. Existing size/58 visual warnings and human/physical-device playtest limits remain unchanged.
