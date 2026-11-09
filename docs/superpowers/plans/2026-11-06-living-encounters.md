# Living encounters implementation plan

> Execute inline with executing-plans. Sang explicitly requested implementation after approving the postman visual direction; do not repeat an approval interview.

**Goal:** Ship the approved postman reader and a complete road greeting/stop, plus Minji camp and earned home presentation.
**Architecture:** Keep engine receipts, effects, RNG, scene provenance and pagination. Add deterministic read-only cutout articulation to the existing road-cue canvas; explicit event opt-in to the approved reader skin; sound cues through existing effects bus; room lighting within the existing HOME owner.
**Tech stack:** Existing JS/Canvas/CSS, node:test, browser QA, HTML builder. No new dependencies or paid services.
**Spec:** `tools/design-drafts/living-world-direction-plan.json`, approved `postman-living-journey.html`, latest user implementation request.

## Constraints and review focus
- Work in original active preview workspace; preserve existing uncommitted drafts. No commit/push/deploy requested.
- Only postman encounters and Minji recruitment/camp opt into the new skin. Long records, combat and other events retain their existing owners.
- Poses are clock-derived; no gameplay writes/RNG. Reduced motion uses a settled pose. Existing actor foot anchors and relative size remain fixed.
- Sound respects user mute/effects mix/suspension and never autoplays from reading old records.
- Old paid receipts/text/scene keys and water costs remain unchanged. Repeated renders/reloads must not repay.

## Tasks
- [x] 1. Add failing behavior checks for deterministic postman poses/articulation, scope of reader opt-in, HOME empty/ownership and sound gating.
- [x] 2. Implement postman segmented cutout gesture/short steps, authored encounter timing and one bicycle bell at discovery in existing canvas/audio owners.
- [x] 3. Apply the approved cinematic reader within passenger-story-reader for postman and Minji scenes; preserve native fit/pagination, record/review, controls and large text.
- [x] 4. Add subtle light to the actual room and a selected-object accent for real Minji keepsakes. No imaginary occupants or objects.
- [x] 5. Build HTML, run targeted existing and new tests, exercise both postman choices and actual camp/room states in a separate QA browser on configured live origin. Check narrow/short/large text, reload, effects and reduced motion. Record actual user-screen access separately.

## Execution rulings
- No pre-existing Studio or preview process answered at 4327/4317/4318/4319. Restarted the configured 4319 dev:live server. This does not recover the user's browser/save; QA will stay in a separate context and cannot claim to inspect that unavailable screen.
- Native canvas articulation uses existing transparent canonical postman artwork, not generated narrative art or a new runtime renderer. Preserve static image fallback outside the authored encounter.

## Completion evidence

Final source suite8598/8598; actual acquired-save fixtures on4319 cover both postman choices, water0/-1, paid reload/no repay, actual departure/approach/handoff, Minji15min camp/reload, earned room inspection/zone clearing,10 viewport/text layouts and reduced motion. Independent review findings fixed. HTML/AIT/aliases rebuilt; source freeze unchanged. Evidence `qa-artifacts/living-encounters-20261106/implementation.json`. Not human fun, real-device performance, user active-screen or listening approval. No new sprite-sheet production/tool install or town-wide rollout claimed.
