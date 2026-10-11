# Detail sound pass — 2026-10-10

Implemented in the existing AMBI owner, not a parallel playback engine. No story,
resource, RNG, save, visual or music decisions are changed. Existing recorded
vehicle/settlement/radio/threat effects and synthesized combat effects remain.

## Generated assets and rights

- 30 world/action clips plus the previous 6 intro clips: 36 mono 44.1kHz/96kbps
  MP3 deliveries, 1,998,060 bytes. Original masters, prompts and request metadata
  remain in each `assets/audio/auditions/*/manifest.json`.
- API account counter: 220 before this batch, 1,620/10,000 afterward. Per-request
  reported cost headers total 1,640 across both batches; the header sum differs
  from the account counter by 20. No paid upgrade or generation retry.
- Free-plan assets are noncommercial auditions. Their bytes are not embedded by
  the HTML builder. Runtime resolves them only on localhost/127.0.0.1 with
  `caravan-live` through the existing active preview `/__live/asset/` route.
- Commercial release requires eligible regenerated/licensed replacements and an
  explicit packaging pass. These audition paths do not play in production/offline.

## Connected behavior

| Context/action | Routing |
| --- | --- |
| Actual rain/storm, stopped cab | Clear glass/roof light/heavy cab rain v2; old takes retained for comparison |
| Wet driving | Cab rain + separate wipers; existing road/engine sound |
| Outdoor events/camp | Light/heavy exterior rain or subdued wind |
| Market shelter | Sheltered rain; garage/core interiors exclude exterior rain |
| Storm | Infrequent distant thunder, not an immediate load/scene stinger |
| Dry night/outdoor stop | Insects; day river/forest at explicit compatible nodes |
| Underground context | Tunnel bed at the explicit tunnel nodes |
| Intro | Action-indexed cup, notebook, stairs, tools, water, bag, radio, switch |
| Repair/radio/craft | Foley only after the engine reports success |
| Trade/bundle/sale | Bag packing after success; barter does NOT play coins |
| Completed settlement work | Water/tools/paper/switch/latch/cloth by actual result |
| Camp meal/preparation/rest | Meal, repair or cloth; no invented universal campfire |
| Bag/journal/map/menu | Quiet foley only when opening the actual surface |

Unknown events retain their existing authored sound and conservative world context;
we do not infer physical actions or present weather by scanning dialogue. Companion
conversations remain inside the cab unless an explicit scene context says otherwise.
Intro scene markers can retire sound inside a page as well as between chapters.

Nine files remain reserved until a matching action is explicitly introduced:
camp_fire, steps_metal, bottle, stove, repair_hammer, coins, cassette, dog_breath,
generator_shutdown. Registration is not a claim that every clip plays in-game.

## Playback safeguards and QA

- Independent place/weather/wipers/nature owners, 480ms gain fades, ambience/effects
  settings respected. At most six simultaneous one-shots and two players per key;
  180ms logical-family retrigger throttle. Reusable media nodes use real WebAudio gain on iOS paths.
- Muting/backgrounding stops even retiring fade tails. Resume rebuilds interrupted
  driving from the actual saved leg, without replaying ignition or paid actions.
- 23 isolated state/transition/lifecycle tests; browser mixer test checks gain and bus duck/release;
  155 story-flow regressions. All 36 deliveries decode and actual preview GETs
  match local bytes. Build remains below the unchanged 80MB limit.
- **Listening review is still pending:** no claim of auditioned loop seams,
  subjective quality, mobile loudness, speaker/headphone balance or actual gameplay
  audio synchronization. Live code is staged, not forcibly applied. Test wet driving
  → stop → market → garage → event → back, sound off/on, background/resume, and
  intro current-memory cuts after deliberate Studio apply. Preserve the current save.

## Cab clarity / repetition / mix follow-up — 2026-10-11

- Generated14 new takes, retaining masters/prompts. The first heavy revision
  remained bass-heavy on spectral inspection and is a comparison candidate, not
  the runtime choice. Selected glass/roof takes become2 processed v2 deliveries
  with250ms circular overlap and8ms MP3 boundary taper. No EQ. Light rain's relative
  energy above2.5kHz changed from about -30.4dB to -12.8dB; a metric is not approval
  of subjective clarity or a seamless loop.
- Gravel/wood steps, paper, ratchet and bag use3 takes each, excluding immediate
  repeats; rate0.97–1.03 and gain±0.8dB use audio-only randomness, not gameplay RNG.
  No action is inferred from dialogue. Rest foley waits for actual camp success.
- Music, ambience, effects and voice share -3dB master headroom. Audible voice
  playback ducks music9dB and ambience6dB with120ms attack/650ms release.
  End/error/rejection/close/mute/background restore or stop appropriately; stale
  play promises cannot cancel a newer voice. Voice nodes are reused. Recorded road
  no longer has extra synthesized low motor. This is not a limiter or an all-scene
  guarantee against mix clipping.
- The117-entry listening catalogue includes20 renders of actual combat/UI synth
  recipes, not extra runtime MP3 assets.37 source-connected local clips,
  15 comparison/unintroduced candidates and65 registered/reference entries.
- Generation account counter1,640→2,180/10,000; this follow-up's per-request cost
  headers total780 versus measured delta540. Preserve the discrepancy. No paid
  upgrade, automatic POST retries or saved credential. Two rejected prompts over
  450 characters generated no file; the generator now preflights this limit.
- All117 files decode and match actual Studio/preview GET bytes. Running preview
  labels MP3 `application/octet-stream`; source MIME is fixed for its next normal
  restart, not force-restarted here. Actual Studio tab played both v2 rain files
  readyState4/no error; this is playback evidence, not subjective listening.
  See `reports/audio-refinement-v2.json`.
- Isolated actual-browser gains confirm master0.707946, duck0.354813/0.501187
  and restoration1/1. Audio23/23, story155/155 pass. HTML79,644,442bytes is under
  the existing80MB cap, above32MB recommendation. No image/CSS/UI layout changes,
  save reset, gameplay advance, server restart or forced structural apply.
- Headphone/speaker quality, every event's individual foley timing, physical-device
  mix and applied-game synchronization remain pending. The live user progressed
  from Busan07:30 to a postman event during this task; do not claim a frozen scene
  or that the pending code is already running.
