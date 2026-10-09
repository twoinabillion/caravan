# Road encounter kit v2 — 2026-10-06 checkpoint

Sang approved generated transparent encounter components matching the Dalguji and requested further characters plus game wiring. Built-in imagegen was used; no external credential or renderer was used. The canonical four references were attached; Mansu additionally used `assets/portraits/mansu.png`. Large PNG masters remain in `assets/road-cues/masters/`; delivery WebPs and exact geometry are registered in `manifest-v2.json`. Hunter/musician/refugee prompts are in `road-characters-v2.prompts.json`; merchant/clinic/cow prompts are in `road-vehicles-v2.prompts.json`. Earlier postman/trader/beekeeper provenance remains separately registered.

## Implemented scope

- Dedicated Mansu, monk, barber, hunter, anonymous musician and role-based adults/child/elder/medic/refugee. Named character mappings are separate from generic roles.
- Merchant truck, food truck, clinic bus, cinema truck and cow, all without baked-in human crowds. Existing coffee/broken-vehicle/barrier components retained.
- Same live canvas composition, fixed caravan size,52% cue vehicle width, shared adult foot/wheel baseline; family cargo children draw behind the truck.
- Empty tollbooth/fuel-tank events suppress invented staff. Existing gameplay effects, saved events and transition owners are untouched.
- Large masters and alpha deliveries inspected after generation. No claim that every authored named NPC now has a unique full-body asset; uncovered facilities still use existing renderers.

## Verification and outstanding work

- Build passed at78,138,800bytes under unchanged80MB limit. Asset bytes are losslessly encoded for delivery; every payload is round-trip verified during build. Canonical seven portrait byte checks passed.
- Geometry/identity/empty-facility tests, event-handoff tests, draft isolation/alpha tests and narrative-presence regressions passed.
- New files are listed at actual4319`/__live/assets`.
- Current actual preview remains title/no save,360×728, loaded1791255232640, pending1791256186330. The current screen/save was not changed to manufacture an encounter.
- Applying through Studio and actual moving-road/stop/night/crop visual QA remain pending. Native browser control was interrupted by concurrent user input, so no apply click was attempted afterwards. VM/state/static checks are not actual visual QA.
- All592encoded main-script payloads decoded in an isolated desktop Node VM in1,132ms after lookup-table optimization; this is not mobile/browser startup performance evidence. Delivery decode CPU/memory on mobile remains unmeasured. Full-body anonymous role identity and uncovered named NPCs require further authored-event review before claiming all encounters complete.
