# Shared reader observation for cycle13

`reader-runtime.cjs` exports `code()`. It reads the current actual 07-ui implementation for buildStoryTurns, speakerInfo, prepareEventAudio and eventSceneKeys. Inject once into an engine-only VM. The existing ten-persona setup already installs several of these lexical constants; do not inject the full helper twice.

When assembling another script, use `source.replace(anchor, () => injection)`. A replacement string expands `$&` and other dollar sequences inside the copied production parser and can corrupt it. Cycle12 story attempt01 is preserved as exactly this pre-game assembly failure.

```js
vm.runInContext(require(helperPath).code(), ctx);
const entryTurns = ctx.qaEntry(event);
const knownSpeaker = !!entryTurns.knownSpeaker;
const entryScenes = ctx.qaSceneKeys(event);
G.capturePresentationView({eventId:event.id, phase:'event',
  turns:entryTurns, knownSpeaker, sceneKeys:entryScenes, index:0});
// Public choice resolution remains unchanged.
const resultTurns = ctx.qaResult(event, choice, result.out, {knownSpeaker});
const resultScenes = ctx.qaSceneKeys(event, [result.out.scenes,
  result.out.scene, choice.scenes, choice.scene,
  D.eventChoiceScenes?.[event.id]?.[choiceIndex]]);
G.capturePresentationView({eventId:event.id, phase:'outcome',
  turns:resultTurns, knownSpeaker, sceneKeys:resultScenes, index:0});
```

Record `qaNamed(turns)` for the actual displayName in addition to who/kind/name. Keep the original text too. After paid load, pass the returned out through qaResult again: saved out.turns takes precedence; text-only frozen receipts use frozenTextOnly and an empty turnSpeakers route. Compare parsed objects with deep equality, not JSON strings whose object key insertion order can differ. These are parser/receipt checks, not browser crop/input/audio checks.

Capture UI.speak arguments with actual time/location/party. UI.playChat forwards each supplied `[who,text]` as a drivingOnly speech row. UI.playRadio calls actual G.pickRadio before forwarding its result, just like current UI; this consumes RNG and must be enabled from the fresh start, not inserted halfway through a retained journey. A speech call does not prove all queued bubbles were visibly rendered before leaving driving.

NPC adapters must retain every showNpcDialogue call, including the initial greeting, before selecting a rumor/chat. For an isolated adapter, collect a local `shown=[]` and append a plain copied `{nid,turns,actions:actions.map(a=>a.label)}` in showNpcDialogue. Return that full list with the action result, then clear it per public interaction. Do not retain executable callbacks in JSON. Cycle12 story retained the final rumor reply only; its three initial greetings are an explicit observation gap.

Keep unmatched/unknown names separate: an unnamed villager may remain anonymous; a known named speaker, a quoted player line, a recording or a written inscription requires its established identity/source. Pure parser diagnostics and partial UI replays do not add natural journey completions or choices to the cohort.
