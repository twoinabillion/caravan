# New 30-agent expedition audit — read before acting

You are one NEW independent subagent, not an actual human or browser player. Repository `/Users/sang/caravan`. Read `AGENTS.md` and `docs/DEVELOPMENT_GUARDRAILS.md`. This task collects problems; **never edit production `src/`, `assets/`, `tools/`, tests, generated HTML, old artifacts or another player's directory**. Do not operate the user's Studio/browser/save/server. Root handles actual current-scene GET and final synthesis. No further subagents.

## Your assignment

Root supplies your player01–30 ID, seed207001–207030, persona, emphasis and desired stops. Create files ONLY inside `qa-artifacts/expedition-thirty-20261020/playerNN/` with `apply_patch`. The isolated engine writes its trace/summary/save/coverage into your attemptNN directory. Historical logs and your earlier attempts are immutable. Do not read historical player policies, reports, source event outcomes or old findings before your first run. Project instructions disclose past pitfalls, so this is fresh independent discovery, not a scientifically blind human study.

Write your own `policy.cjs`, with:

```
module.exports={id:'playerNN',seed:2070NN,persona:'...',name:'상혁',pack:'fuel',
 reloadBeforeChoice:true,reloadAfterChoice:true,acceptCompanions:true,
 maxActions:3000,maxDays:90,visitGoals:['known place IDs'],
 choose(observation,memory){return enabledVisibleChoiceIndex;},
 decide(observation,memory){return {type:'travel',to:'...'};},
 evidence(){return yourPolicyCountersAndPublicDecisionLog;}};
if(require.main===module)require('../harness.cjs').run(module.exports,process.argv[2]||'attempt01');
```

Use pack `fuel`, `repair` or `provisions` only. Independent reproducible PRNG separate from engine: each enabled visible choice should have positive weight, with roughly25% uniform exploration and remaining personality-biased selection. Log enough calls/branch counters to establish that choices actually vary. **No hidden outcome/flag peeking, source-derived event-ID answer key, forced ending quotas, resource grants, injected allies/upgrades, infinite mode, teleport, choosing disabled actions or bypassing public route forecast shortage.** Public IDs of the event currently observed can identify it, but not select a known future reward. Final-method preferences are fine when the currently displayed option is actually available.

Run `node qa-artifacts/expedition-thirty-20261020/playerNN/policy.cjs attempt01` from repo root. Reuse no old policy. If the audit adapter itself fails, report root promptly and preserve the attempt. If your planning fails/thirst ends or day limit is reached, you may improve public observation-based planning and retry at the SAME seed, at most3 attempts. Preserve original policy as `policy-attempt01.cjs` BEFORE editing; explain the changed public-planning mistake, not a guaranteed win. No source repair. Never count a fatal ending as the main ending.

The adapter now captures your `evidence()` in the same process immediately AFTER a run (`attemptNN/adapter-policy-evidence.json`). This post-run bookkeeping changes neither observations nor choices/game RNG. The initial three agents began before this metadata capture and retain their original stdout evidence/limitations; do not pretend a fresh require's zero counters are their runtime evidence.

Optional `perkChoice:0|1` chooses the first/second actually earned perk; use either to vary builds, never grant unearned perks. Upgrade observations now include the real public `G.upScrapCost` quote (including roadside markup) and `minutes`; early player01–05 runs had nominal base costs, but none purchased an upgrade. Do not turn that old adapter price omission into a production price bug. UI-only road-garage entry/reset behaviour is still outside this engine adapter.

The current observation extension owner is **this directory's `departure-observer.cjs`**. It calls the prior adapter, then injects recipes, real upgrade quotes/minutes and function-valued offer acceptance. The older runner's unmodified text is not the final observation. You need not traverse all historical wrappers/default policies: use this brief and the current extension, and log your own actually supplied observations if a field is unclear.

From player18 onward the read-only map projection additionally includes `knownPlaces:[{id,name,type,visited}]` and each route's `type`/`distanceToKnownPlaces`. These contain **only actually known map places**, not undiscovered IDs or future rewards. A curious player can follow newly discovered, not-yet-visited places using these public distances if supplies/corridor permit. Earlier17 runs did not have this global map projection; do not replay or alter them. This adds observations only, not discoveries/state/resources or RNG calls.

## Public observation / supported actions

Choice observation: `eventId,title,text,origin,controls,campConversation,choices[]` (index/id/label/hint/requirement/enabled/visible) and `state`. Outcomes are NOT included before choosing. `prepare-finale` is permitted only if that actual public control is offered; `camp-later` only for a camp conversation. Post-choice acceptance may be a boolean or function `acceptCompanions({cid,state})`—this is the real offer, not a grant.

Road observation: place/day/min/weather/night, fuel/water/food/scrap/van/fatigue/items, party/crew/bonds/injuries, up/seatCapacity, main/navigation, routes/check/forecast/distanceToGoal/distanceToStops/distanceToRecruit/distanceToSideQuest, exploredHere/visits, localControls, stl (trade/actions/recruit), upgrades (owned/cost/status), recipes (enabled/cost), sideQuest/boardOffers, campParticipants/campConversation/campPlan. Treat warnings seriously: every ration unit is not an entire group's day. Respect the selected corridor; stop goals outside it may need to wait until its endpoint. Unknown places have no public shortest-path guidance.

Read the actual public observation schema rather than guessing field names: there is no promised `navigation.atTarget`. A currently offered `explore.mainEvidence` can still be the next main action after earlier exploration at that same location; do not permanently blacklist a place after one search. An affordable market row can still reject a full bundle at the storage cap, so detect unchanged state rather than purchasing the same rejected bundle forever. These are adapter/planner precautions, not outcome hints or game bug findings. Route `check.ok` is projected through the forecast gate; explicitly checking `forecast.ok && !forecast.shortage` as well is fine. Do not infer shortage permission from an unsupported field.

Supported `decide` actions:
- travel(to), explore, camp, trade(index), work(id), repair, talk(cid), meet-recruit(cid), upgrade(id), reload
- board-open, accept-quest(index), turnin-quest
- camp-talk(cid), camp-meal, camp-repair
- walkfuel (only public enabled localControls), radio (if enabled), craft(id from recipes)

The loop automatically handles the current event, real earned perk selection, current recruitment step at its target, real arrival/next presentation and available Seoul stage. You may plan explicit recruitment, crafting/upgrades, field jobs, optional conversation and supply. Repeatedly camping with no supplies is a policy failure, not a game softlock. Free exits, refusal, delay/back, low resources and extra stops are useful but not an excuse to suicide or loop forever. You need not fulfill every target; report exactly what happened.

## Review your entire actual trace

After playing, read ALL your recorded choice occurrences and surrounding road/work/camp/reload context. Use a compact script that prints every choice text/label/result, before/after place/time/resources/roster, origin and the immediately previous/next state/action. It must not silently sample/skip rows; record reviewed counts. Full trace needn't be dumped at once: use chunks. Review the full sequence, not merely keyword searches. Source inspection and isolated followup diagnosis are allowed ONLY after the first run, labelled separately from naturally observed results. Do not infer an entire alternative storyline from a single current event.

Write `findings.json` and `report.md` with:
- id,persona,seed; attempts actually reviewed; `review:{rowsReviewed,choiceOccurrencesReviewed}` matching all retained attempts; observed terminal/session result, visited/unvisited assigned stops, policy limitations and adapter gaps.
- findings[]: stable local ID, category, tentative severity, evidence path/attempt + adjacent n values, observed event/choice/result quotes (short), actual location/time/party/resources before and after, what you expected and why, immediate next action, reproducibility/alternative interpretations. Propose minimal direction, do NOT implement.
- opinions[] for taste/pacing/voice frustration and positives; policyLimitations[]; rejected[] for disproved suspicions. Zero findings is valid; never invent bugs to meet quota.

Distinguish confirmed gameplay/logic errors, narrative inconsistency, clarity/awkwardness, taste, your own planning mistake, and adapter limitations. Actual receipt caps/floors/perks can be correct; forced losses aren't voluntary payments. `origin:memory`/지난밤/epilogue isn't current clock. party=[] may still have a temporary passenger or local/remote NPCs. Encounter entry isn't a completed favour. Dynamic narrative and paid receipts are different. API execution != visible click, screenshot, audio or native phone QA.

Send root a concise final result: main ending reached? attempts/choices/rows, key issues/evidence and file paths. Root will adjudicate duplicates and verify. Never claim to have found all bugs or played actual Studio/browser UI.
