# Caravan UI refinement

Use superpowers:executing-plans. Sang approved the four concrete findings from the current-screen UI review and requested implementation. Continue inline on the existing dirty branch; do not repeat direction approval, commit, push or reset.

## Approved outcome
Short dialogue panels fit their content, preserve legible type and manual pages, and place choices near the text. Keep original HD images and portraits. Reduce heavy reading-frame/button decoration using the existing art and style owners. Art enlargement uses a native modal above the narrow game column, with whole-picture fit and a separate detail magnification/pan control. Completed/blocked stay actions retain their reason while the main button opens the existing action picker instead of presenting a dead end; selection remains free and execution remains explicit.

## Boundaries
No engine/content/save/paginator/RNG/time changes. Preserve the source/high-water distinction, physical evidence, short-screen/large-text fallback and old paid readers. Scene image aspect and source stay unchanged. Content-height layout may move the whole scene group vertically as the dock changes; the picture dimensions do not depend on a decision/result. Default scene stays contained without cropping. This replaces excess manuscript height, not its text.

## Tasks
- [x] Register and show the independent draft. Back up the current42runtime source owners.
- [x] Reproduce zoom size and large manuscript gap; test native close/detail behavior and free stay-alternative navigation before implementation.
- [x] Modify owning reader layout/materials/cinematic CSS, add one small DOM lightbox owner, and wire the existing stay picker from the disabled-action slot. Keep all real actions and requirements unchanged.
- [x] Verify reading/choices/results, ordinary/long/portrait art, Escape/Tab/detail/pan/rotation, evidence and paid reload at six viewport/accessibility conditions. Inspect the user's actual current scene when available; preserve its receipt and never replace it with a fresh save.
- [x] One fresh read-only final review required by executing-plans; fix important findings with RED→GREEN. Freeze final sources, run full source suite/source-health and HTML/AIT build, compare all authored D and protected sources, write current checkpoint and scope limits.


Completion scope: final native user crop unavailable; actual current save/tab was preserved, and final visual/interaction matrix ran in isolated repository Chromium contexts. See qa-artifacts/ui-refinement-20261107/verification.json and gallery. No commit/push/deployment.
