# Companion Voice Bible

This is the editing contract for the six recruitable companions. The runtime copy lives
in `D.companionVoices`; this page explains how to apply it when reviewing high-exposure
story, recruitment, combat, camp, and ending scenes.

## Review rule

For every companion line, check six things: vocabulary, sentence rhythm, humor,
avoidance, silence, and forbidden generic phrasing. Relationship growth should change
address, initiative, and willingness to help, but not erase the speaker's core rhythm.

The `personaModel` attached to each runtime sheet adds four checks derived from the
full Korean Nemotron persona schema: a five-axis trait profile, the occupational behavior
used as an analogue, a contradiction, and an observable tell. These are editing lenses,
not imported biographies or generated dialogue.

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

## Korean address contract

Random road scenes may play in any order, so they cannot depend on an unseen intimacy
transition. The runtime `addresses` maps preserve these stable relationships.

| Speaker | Stable forms of address |
|---|---|
| Minji | 박 선생 `선생님`; 강우 `아저씨`; 레오 `레오`; 재이 `재이 언니`; 은수 `은수 언니` |
| Park | 민지 `민지 양/학생`; 강우 `강우 씨/자네`; younger crew by name or `자네` |
| Kangwoo | crew by name; Park `선생님` |
| Leo | 민지 `민지야`; 강우 `형`; Park `쌤/선생님`; 은수 `누나` |
| Jaeyi | 민지 `민지 씨`; Kangwoo `강우 씨/아저씨`; Leo `레오 오빠`; Eunsu `은수 언니` |
| Eunsu | peers and younger crew by `이름+씨`; Park `선생님` |

## Automated guardrails

`npm run lint:dialogue` inventories 4,112 lines across banter, chats, NPC dialogue, radio,
intro, and event quotations. It verifies all six sheets, persona models, relationship address
maps, registered speaker routes, recruitment proposal → response → seat order, discarded
lore, forbidden generic phrasing in attributed event speech, and repeated openings.
