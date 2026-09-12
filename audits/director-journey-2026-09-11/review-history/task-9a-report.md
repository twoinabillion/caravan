# Task 9A report — reviewed source and documentation ready for delivery review

Date: 2026-09-12 KST

BASE: `901fd95527a1ff88f349bb4bd0ab26737c96437f`

Scope status: **Phase A implementation complete; independent Task 9A review and whole-branch approval pending. Phase B original delivery has not started. Task 9 is not complete.**

## Result

The validator, CURRENT generator and actual built page now use one permanent authored-event convention. It contains 1,019 rows and 1,019 unique IDs: 1,005 `D.events`, three Seoul singletons, five Seoul stops, one `D.onboardingMission`, and five `D.openingDeparture` scenes. The six runtime-generated camp conversation identities remain excluded. The validator loads the authored `03i`, `03j`, `03k` and `03l` modules, rejects duplicates across the full registry, and validates a meaningful nonempty body path for text/function events, structured turns and the onboarding mission brief. Structured turns validate kind, text and speaker rather than exempting opening IDs.

The runtime stayed byte-identical to accepted Task 8 evidence: 77,666,839 bytes, SHA-256 `1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07`, `GAME_BUILD=2026-09-11-director-journey`. No `src/` or `assets/` runtime file changed in Task 9A.

`docs/CURRENT.md` now describes the authored opening, mandatory evidence route, six companion arcs and persistent home/road effects, seven settlements and two legal corridors, five Seoul stops and three endings. Its generated metrics report 1,019 events, 58 nodes, 393 scenes, 42 portraits and 74.07 MiB. It records the actual 2026-09-12 documentation date while preserving the accepted 2026-09-11 build identity. It also discloses the 32MB advisory, 80MB hard cap, exact 58 inherited warnings and unmeasured fresh-player/phone experience.

The durable audit at `audits/director-journey-2026-09-11/` contains the current director assessment, all ten spec coverage rows, prioritized remaining issues, eight byte-identical representative captures with source SHA metadata, the compact Task 8 evidence index, the Phase B manifest/procedure, and byte-for-byte Task 1–8 report/review archives plus a dated controller ledger and rulings snapshot. The report keeps two fresh finite-resource routes, six fresh recruits, one earned checkpoint with three finale forks, legacy diagnostic fixtures, static regressions and human evidence limits distinct.

The original `/Users/sang/caravan` was read only for one bounded AIT verifier probe. No source, generated HTML, AIT, dist or other original-project file was written. The original baseline/collision checks, pre-copy generated-artifact backup, accepted-delta copy, original build, AIT payload comparison and isolated 4175 UI proof remain Phase B work.

## Corrections from accepted reviews

- Task 6's Leo fixture now says `van82→73` in both the Task report and durable art audit; `−9` and `+75 min` remain unchanged.
- Task 8 now states 226 indexed evidence files as 223 PNG captures plus three exported journals, and lists the six viewports actually used by the Goal/Bag script: `320×578`, `375×553`, `390×844`, `360×700`, `462×832`, `476×809`.
- Smoke/report wording now says the first/final recruit states are rendered and intermediate membership is data validation. Runtime behavior and assertions are unchanged, so no campaign or broad smoke rerun was added for the description correction.
- The evidence index generator was moved to durable `tools/make-task8-index.py`; the obsolete SDD copy is a small compatibility wrapper. It is an evidence-packaging tool whose complete raw inputs stay in the worktree, not a regression suite promised for the delivered clean project.

## Verification

The registry change followed a focused RED/GREEN cycle:

```text
python3 tests/test_content_registry.py   RED before implementation:
  validator counted 1005, runtime registry counted 1019

python3 tests/test_content_registry.py   PASS after implementation:
  registry agrees; blank/malformed turns, unknown speaker and duplicate ID rejected

CARAVAN_REGISTRY_URL=http://127.0.0.1:4176/game?caravan-live=1 \
  python3 tests/test_content_registry.py
  Built-page registry: events1005 + Seoul3 + stops5 + onboarding1 + opening5
  rows1019, unique1019, duplicates[], campConversationKeys6, correct GAME_BUILD; PASS
```

The evidence count correction also began with a focused failing assertion: the old compact index lacked the qualification split, then the first implementation exposed that its 226 manifest entries already included three journals. The corrected generator reports the actual partition and hashes every entry:

```text
python3 tools/make-task8-index.py
  verified 15 final scenarios, 11,232 trace rows,
  223 PNG captures + 3 journal exports
  compact index SHA-256 b7865a52
```

The temporary packaging check verified that the audit copy equals that compact index byte-for-byte; all eight selected PNGs equal their source bytes/SHA; all 16 accepted Task 1–8 report/review copies equal their SDD origins; the dated ledger snapshot hash is fixed; and the 101,104-byte checkpoint has SHA-256 `0d89072b6a2063c3aac4e2fe05cd294b63ad750ad8e24cc62ff516d300a5fdc4`. This was deliberately kept as a one-time audit receipt rather than a permanent test dependent on 1.1GB raw evidence and eventual SDD cleanup.

Final affected commands:

```text
npm run validate:content
  PASS · events1019, nodes58, scenes393, event groups48/561,
  recruits6, field searches7

python3 tests/test_content_registry.py
  PASS

docs idempotence: capture docs/CURRENT.md bytes; npm run docs:current; compare
  CURRENT.md metrics already current; byte-identical PASS

exact warning-set comparison after validators
  expected58, actual58, added[], removed[], unchanged=true

python3 tools/make-task8-index.py
  15 scenarios, 11,232 rows, 223 PNG + 3 journals verified

node tools/verify-ait-web.mjs /Users/sang/caravan caravan.ait
  read-only old-original diagnostic PASS: format1/app caravan;
  every old index entry hash valid, all five old web entries match old dist,
  all three HTML-referenced assets indexed, old inline build correctly reads
  2026-09-10-director-review

python3 -m py_compile tests/test_content_registry.py tools/make-task8-index.py
node syntax checks for content registry, validator, CURRENT generator and AIT verifier
  exit 0

shasum -a 256 서울까지400km.html; wc -c 서울까지400km.html
  1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07
  77,666,839 bytes

git diff --check
  exit 0
```

The first non-escalated Playwright built-page launch was closed by macOS sandbox browser permissions. The same focused command was rerun with approved local browser execution and passed; this was an environment failure, not a product or assertion failure.

## Self-review and open limits

- Registry membership has one shared source and a separate built-page comparison. Counts are derived, IDs deduplicated, and no threshold or error class was weakened.
- The eight audit images are already-qualified evidence copied without recapture. Their captions describe visible states; the earned checkpoint `final.png` is labeled as Seoul decision readiness rather than a van interior.
- The AIT verifier decompresses once, verifies every new bundle index hash, compares every `web/*` entry to fresh `dist/web/*`, checks all HTML-referenced assets, and reads `GAME_BUILD` from inline `web/index.html`. Its old-original run only proves the tool against the existing old bundle; Phase B must derive the new entry count and hashes.
- Phase B's order protects user work: verify 967 hashes and new-path collisions, back up the prior HTML/three AIT aliases/asset report **before** any watched source copy, copy only the reviewed delta intersected with the manifest allowlist, await the owned 4175 server, build, compare AIT payload, and capture 320/390/desktop original screens.
- Automated campaigns establish reachability and persistence. They do not establish first-time comprehension, agency, companion attachment, finale payoff, human reading time or physical-phone performance. Core reveal 37 turns, epilogue intro 10 turns and up-to-29-turn method/night followups are UI counts only; no new pacing rewrite is prescribed without participant evidence.

Independent review should evaluate the Task 9A diff from `901fd95527a1ff88f349bb4bd0ab26737c96437f`. Root owns that review, the final whole-branch decision, Phase B delivery, director/Obsidian memory and goal closure.

## Fix round 1 — scoped Task 9A review findings

Independent review of `901fd955..2570a80` found one Important procedure gap and one Minor evidence-index aggregation weakness. Both are corrected without runtime or original-project writes.

- `integration-procedure.md` now scopes the added-path command with `git -C "$WORKTREE"`, passes the approved SHA explicitly to the temporary checker, and runs the checker's Git subprocess with `cwd=worktree`. The documented command was executed read-only from `/Users/sang`, outside the checkout, against BASE `73bef1d` and reviewed candidate `2570a80`: 287 total added paths before manifest filtering, `collisions=[]`, exit 0. This is a procedure validation only; Phase B must repeat it against the finally approved commit immediately before integration.
- `tools/make-task8-index.py` now computes the global `indexedEvidenceFileCount` by summing each scenario's verified manifest-backed count. It separately asserts that the current indexed files partition completely into PNG captures and journal exports. Regeneration remains 223 + 3 = 226; the compact JSON is byte-identical, so its durable audit copy did not need refreshing.

Focused fix verification:

```text
cd /Users/sang && python3 - /Users/sang/_workspace/caravan-director-20260911 \
  /Users/sang/caravan 73bef1d73df79fe4d7342182488c64a0f37dc600 \
  2570a805f71fd4c18cbea3c18e1d844bf6480449 < documented checker body
  addedPathCount287, collisions[], exit 0
python3 tools/make-task8-index.py
  15 scenarios, 11,232 rows, 223 PNG + 3 journals; exit 0
cmp artifacts/.../evidence-index.json audits/.../task8-final-evidence-index.json
  byte-identical; exit 0
python3 .superpowers/sdd/2026-09-11-director-journey/make-task8-index.py
  compatibility wrapper resolves the durable tool; same totals; exit 0
python3 -m py_compile tools/make-task8-index.py
git diff --check
  exit 0
```

Task 9A remains pending scoped re-review. Whole-branch approval and Phase B original delivery remain controller-owned and have not started.
