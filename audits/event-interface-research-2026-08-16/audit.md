# Caravan event interface research audit

Date: 2026-08-16
Viewport reviewed: 390 × 844
Scope: event opening, dialogue record, choice, outcome, and combat choice

## Evidence

- [Opening](../full-ui-alignment-2026-08-16/390x844-10-event-opening.png)
- [Dialogue record](../full-ui-alignment-2026-08-16/390x844-11-event-record.png)
- [Choice](../full-ui-alignment-2026-08-16/390x844-12-event-choice.png)
- [Outcome](../full-ui-alignment-2026-08-16/390x844-13-event-outcome.png)
- [Combat choice](../full-ui-alignment-2026-08-16/390x844-14-combat-choice.png)

## Verdict

The event UI is now geometrically stable and has a strong Caravan-specific recorder-and-paper identity. The remaining weakness is not broken layout but narrative composition: too much unused vertical space, repeated scene art, and weak physical connection between image, text, choice, and confirmation make an event feel like a sequence of static slides.

## Flow audit

1. **Opening — fair.** The art is legible and uncropped, but the short narration is ellipsized and the image/report/control are separated by large dead zones.
2. **Dialogue record — good structure, weak motion.** Speaker portrait and paper record establish identity. Reusing the same wide scene for consecutive beats makes the sequence feel static.
3. **Choice — fair.** Choice slips are understandable, but the visual stack changes abruptly from recorder to paper to detached slips. The choice should feel physically attached to the record that prompted it.
4. **Outcome — fair.** The paper language remains coherent, but consequence chips are too quiet and the return action lacks the tactile finality of the main continue control.
5. **Combat choice — fair.** The tactical mode is readable, but it feels like a generic dark dashboard rather than part of the same field recorder. The mostly empty detail panel adds height without adding comprehension.

## Reference lessons

- **Roadwarden:** keep text, choices, and notifications close to one main reading area. Its own postmortem explicitly identifies separated choices, remote notifications, tiny controls, and decorative frames as causes of confusion.
- **Disco Elysium:** make the dialogue system the primary reading surface and give it a distinct in-world interaction metaphor; short chunks and subtle feedback preserve momentum.
- **Pentiment:** let art direction and typography participate in characterization, while providing readable-font, text-size, contrast, and reduced-motion alternatives.
- **Citizen Sleeper:** character art, prose, and actions work as one compact encounter composition instead of separate screens.

## Recommended direction: moving field report

Keep one outer recorder shell and one coordinate system. Change only the internal composition according to the dramatic beat.

1. **Discovery:** 55–60% scene art, 2–4 complete narration lines, attached continue key.
2. **Dialogue:** 35–40% cinematic scene strip, portrait-led record below, no large void between them.
3. **Decision:** 30–35% scene art, compact prompt, choices directly attached to the report.
4. **Outcome:** a stamped consequence receipt with resource changes made prominent, followed by one decisive return key.
5. **Combat:** retain tactical choices but mount them inside the same recorder shell; selected-choice detail replaces the empty panel.

Use each event's existing art as a small shot sequence—establishing view, environmental detail, character reaction, aftermath—rather than repeating one crop or generating a new full image for every line. Never preview unknown people or danger before the player reaches them.

## Motion and accessibility

- Use restrained 160–240 ms fades and 2–4% pans only on scene art.
- Respect `prefers-reduced-motion` and provide a fully static fallback.
- Do not truncate narrative text with ellipses; split long copy into another beat.
- Maintain selectable text, keyboard focus, and minimum 44 px touch targets.
- Preserve adjustable text size and high-contrast options for a text-heavy flow.

## Evidence limitations

This audit is based on captured mobile states and current DOM metrics. It validates visible composition and fit, but not real-player comprehension, pacing under variable reading speeds, audio timing, screen-reader phrasing, or one-handed reach in a physical device test.

## Sources

- https://moralanxietystudio.com/roadwarden
- https://www.gamedeveloper.com/design/deep-dive-windy-meadow
- https://discoelysium.com/devblog/2016/12/20/feld-playback-experiment
- https://pentiment.obsidian.net/
- https://citizensleeper.com/
