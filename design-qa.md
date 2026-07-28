# 대화 턴·화자 식별 Design QA

- Source visual truth: `audits/dialogue-2026-07-28/board.html`
- Source screenshots: `audits/dialogue-2026-07-28/01-intro-grandfather-dialogue.png`, `04-companion-conversation-event.png`, `05-driving-character-bubbles.png`, `06-driving-narration-bubbles.png`
- Implementation screenshots: `audits/dialogue-2026-07-28/final/01-intro-grandfather-turn.png`, `02-companion-speaker-turn.png`, `03-driving-character-turn.png`, `04-driving-narration-turn.png`
- Combined full-view comparisons: `audits/dialogue-2026-07-28/final/comparison-01-intro.png`, `comparison-02-event.png`, `comparison-03-driving-dialogue.png`, `comparison-04-driving-narration.png`
- Full intro contact sheet: `audits/dialogue-2026-07-28/final/intro-12-contact-sheet.png`
- Browser viewport: 480 × 860 CSS px
- Device scale factor: 1
- Source and implementation pixels: each 480 × 860 px
- Normalization: none; each comparison is an unscaled 960 × 860 side-by-side image
- States: intro grandfather turn; `pair_mj_kw_2` Minji turn; driving Minji dialogue; driving narration

## Required Fidelity Surfaces

- Typography: the existing serif story titles and compact mono metadata remain. Speaker labels use the established amber accent; dialogue copy retains the existing body scale and line height.
- Spacing and layout rhythm: 16:9 scene art remains the visual anchor. The new turn card occupies the old body region without crowding the image or the fixed controls.
- Colors and tokens: existing navy surfaces, cool borders, pale body copy, and amber focus color are reused. AI, thought, narration, letter, record, and human dialogue differ without introducing a new palette.
- Imagery: the original scene art remains intact. Existing character portraits are reused, and new mother, father, and child portraits match the same painterly pixel-art family.
- Copy and content: the 143-year premise, parents' roles, current 6,412-person expulsion, camper conversion, and Seoul motive remain unchanged. Only delivery is split into explicit turns.

## Interaction and State Findings

No actionable P0, P1, or P2 issue remains.

- Intro: each of the 12 pages contains 4–6 explicit beats. Click, Enter, and Space advance one beat at a time before moving to the next page.
- Intro audio: legacy five-page monologues are no longer auto-played; a page voice plays only when that exact 12-page scene explicitly declares one.
- Events: all 854 event definitions pass through one turn builder. Known companions and NPCs show portrait and name; narration, AI, thoughts, letters, and records use distinct source labels.
- Choice gating: event choices stay hidden until the final story turn. Outcome copy also advances turn by turn before the final action control appears.
- Driving: only one queued bubble is visible at a time. Human dialogue has a portrait and name; narration uses a thin full-width lower caption; thoughts and broadcasts have their own labels.
- NPC chat: both the NPC reply and the player's reply carry explicit speaker identity.
- Scene zoom, event choice handling, intro keyboard control, and road-bubble queue were exercised.
- Browser console and page errors: 0.

## Comparison History

1. Initial source audit
   - P1: intro and events mixed narration and multiple speakers into one long paragraph, so the player could not immediately tell who was speaking.
   - P1: driving dialogue stacked multiple bubbles and used text-only name tags.
   - P2: choices appeared alongside unread story copy.
   - Fix: introduced a shared story-turn model, explicit speaker metadata, portraits, and read-before-choice gating.
2. First implementation capture
   - P2: advancing an event could scroll the app shell upward by 18px and expose the global dock under the event sheet.
   - P2: the event `다음 장면` control was only content-width and sat on a translucent dock.
   - P2: driving narration was too compact and visually competed with character speech.
   - P2: the dormant `intro1`–`intro5` auto-play path described obsolete long monologues and could conflict with the new speaker turns if those files were added later.
   - Fix: clipped app-shell overflow, made the event action full-width on a solid dock, changed narration to a lower-caption treatment, and limited intro voice playback to an explicitly declared page voice.
3. Final capture
   - Evidence: the four combined side-by-side comparison files listed above.
   - Result: scene art remains prominent, the current speaker is immediately legible, only one turn competes for attention, and controls remain inside the 480 × 860 viewport.

## Follow-up Polish

- P3: add alternate emotional portrait expressions later if character performance needs more range. This is not a clarity or interaction blocker.

## Verification

- Build: passed (`./build.sh`)
- Dialogue lint: 3,611 lines, 0 immersion-breaking findings
- Browser smoke test: passed, including 854 events, 195 dialogue events, 12-page intro turns, choice locking, road dialogue queue, and 0 console errors
- Visual QA: passed at 480 × 860 using combined full-view comparisons

final result: passed
