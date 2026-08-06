# Companion Voice Bible

This is the editing contract for the six recruitable companions. The runtime copy lives
in `D.companionVoices`; this page explains how to apply it when reviewing high-exposure
story, recruitment, combat, camp, and ending scenes.

## Review rule

For every companion line, check six things: vocabulary, sentence rhythm, humor,
avoidance, silence, and forbidden generic phrasing. Relationship growth should change
address, initiative, and willingness to help, but not erase the speaker's core rhythm.

| Companion | Vocabulary and rhythm | Humor | Avoidance and silence |
|---|---|---|---|
| Minji | Engines, wiring, sounds, and faults. Short polite sentences followed by quick corrections. | Corrects jokes as if diagnosing a machine. | Does not explain Mingyu on demand; touches tools or listens to the engine instead. |
| Park | Symptoms, prescriptions, temperature, and meals. Slow banmal/`하게체`, followed by a concrete action. | Dry jokes about age and occupational habits. | Does not turn lost patients into lessons; heats water or checks a bandage again. |
| Kangwoo | Distance, exits, rear watch, shifts, confirmation. Short subjectless statements. | Takes jokes literally, then returns them a beat late. | Does not give speeches defending old orders; changes position and takes watch. |
| Leo | Rhythm, chorus, voices, food, and Bori. Longer thoughts settle into a short joke. | Makes himself, his songs, and his hunger the target first. | Does not call an unfunny day a failure; switches the music off and shares the quiet. |
| Jaeyi | Weight, material, price, repairs, and next use. Fast polite speech with concrete numbers. | Prices everything as scrap until a thing cannot be priced. | Does not turn family keepsakes into a lesson; cleans, sorts, and puts them back. |
| Eunsu | Frequency, records, approval, transmission, and blanks. Precise polite speech with explicit uncertainty. | Misapplies technical distance to human distance, then quietly keeps the joke. | Does not erase her role by blaming only the system; removes the headset or verifies a record again. |

## Relationship staging

- Early: role language dominates; help is offered as a bounded professional action.
- Established: forms of address shorten, the companion initiates actions, and corrections
  can be playful.
- Trusted: the companion names what they avoid, but still uses their own vocabulary and
  physical habits. Trust is not a generic confession monologue.
- Conflict and repair: the mistake must alter an action, cost, relationship, or later line;
  apology alone is not the repair.

## Automated guardrails

`npm run lint:dialogue` verifies that all six sheets exist, registered speaker routes are
valid, recruitment dialogue keeps proposal → response → seat order, discarded lore does
not return, and unusually repeated sentence openings are surfaced for manual review.
