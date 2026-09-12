# Required historical save fixtures

These unchanged saves are tracked dependencies for reproducible regression tests and captures. They retain their original paths and bytes. They are historical inputs, not Task8 final-build earned campaign acceptance.

- `crew-preliminary.save.json`: controller preliminary campaign checkpoint recorded 2026-09-11 before Task7's generic pending-presentation owner. Fresh finite-resource run, 190 actions, 752 km/day 11, Minji/Kangwoo/Jaeyi, actual guest camp choices and paid bench, 77 events and 0 page errors. Stops before an explicitly selected finale method; all three methods were available. Its lack of a pending-presentation receipt is intentional legacy recovery coverage. See `city-finale-audit.md` and Task7 context/report for historical provenance. Used by `tests/test_director_pending.py` and `tests/capture_director_finale.py`.
  SHA256: `7bf69a049fcc5caba2a1be13a2dbb62ee6edabc75645b8d79871fad5d911e86a` (98,797 bytes).
- `minji-first-night-natural.save.json`: controller natural pre-join Minji follow-stage checkpoint at Gyeongju, day 3, 154 km. Despite the retained filename, this is not the literal first guest night: an earlier Ulsan road-stage camp already occurred. Used by `tests/test_director_camp_ui.py` for real guest dialogue/cancel/Continue/result/home/next-road regression. See Task2 report for provenance and this distinction.
  SHA256: `b8c44bcf74f15325643e80dc19c137831c10e0d1bad840a66183e80371cf86be` (28,475 bytes).

No save fields were migrated or replaced in these files. Tests load/normalize their own browser-local copies. The already tracked `task3-conference-route.save.json` remains a separate required input for `tests/capture_director_evidence.py`; it is unchanged in this fix.
