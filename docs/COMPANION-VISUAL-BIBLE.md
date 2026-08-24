# Companion Visual Bible

This document extends the global `caravan-grounded-cinematic-v1` contract in
`docs/IMAGE-BIBLE.md`; it never replaces the global medium, palette, framing, or
delivery rules. It is the identity source of truth for every cinematic scene
that shows a recruitable companion. The canonical references are the portrait assets in
`assets/portraits/` and `assets/reference/people-canon-2026-08-11.png`. A scene is not approved because it has a similar mood;
the person must still be identifiable at a glance.

## Non-negotiable generation workflow

1. Attach all global references required by `assets/visual-contract.json`, plus
   `assets/reference/people-canon-2026-08-11.png` and the matching
   `assets/portraits/{id}.png` as character-reference images.
2. Include every listed identity anchor in the prompt.
3. Preserve the person across first meeting, task, temporary travel, joining,
   settlement, combat, and ending scenes. Dirt, rain, injury, and lighting may
   change; face, age, hairstyle, signature clothing, and equipment may not.
4. Generate one companion per image by default. A second named companion is
   allowed only when the scene requires their relationship.
5. Reject the image when a player could reasonably read it as a different
   person without the name in the event text.

## Character locks

| Companion | Required identity anchors | Do not change |
|---|---|---|
| Daun | adult Korean man; worn olive cap; short messy black hair; dark weathered work jacket and trousers; shoulder bag | missing cap, long hair, bright new clothes, heroic armor |
| Minji | young Korean woman; black ponytail; round mechanic goggles on head; oil-stained dark mechanic workwear; gloves and tool pouch | child styling, long loose hair, brown fashion jacket, clean uniform, missing goggles |
| Park Seong | older Korean man; neat gray hair; round metal glasses; gray sweater vest over shirt; compact medical case | young doctor, rectangular glasses, white coat, military uniform, missing case |
| Kangwoo | adult Korean man; buzzed black hair; guarded angular expression; faded olive military/work jacket | long hair, large beard, helmet, futuristic armor |
| Leo | adult Korean man; patterned dark bandana; long wavy black hair; worn dark-blue denim jacket; acoustic guitar | hat/hair swap, missing guitar, polished rock-star outfit |
| Bori | shaggy tan medium dog; dark eyes; black nose; worn red neckerchief | breed/coat change, short hair, white coat, missing neckerchief |
| Jaeyi | young Korean woman; short messy brown hair; worn mustard work jacket; dark work trousers and gloves | long hair, olive vest, tactical uniform, glamorous makeup, new clothing |
| Eunsu | adult Korean woman; straight jaw-length black bob; large over-ear headset; charcoal hooded technical jacket | long hair, bright outfit, small earpiece, missing headset, cyberpunk hardware |

## Vehicle and interior lock

- If a companion scene contains the party vehicle, also attach
  `assets/reference/visual-canon-2026-08-11.png` and
  `assets/reference/dalguji-technical-canon-2026-08-11.webp`.
- The Dalguji is always the same warm gray-beige Korean cab-over one-ton truck
  with a separate rectangular camper box, individual amber windows, rear
  double doors, black/olive roof luggage, two red fuel cans, antenna, and one
  faded white X. Never substitute a panel van, blue truck, pickup camper, bus,
  American RV, or integrated step-van.
- Interior frames use the same narrow wood-and-metal living box: rear bunk,
  map/work table, radio, practical storage, and amber lantern.

## Character-scene composition

- Use the `character` cinematic format: 16:9 landscape, medium shot, face and
  hands readable at 360px width.
- Put the companion on one third of the frame and the task clue on the other:
  Minji with a tool or vehicle part; Park with a patient, medicine, or warming
  water; Kangwoo with a route or watch point; Leo with guitar/Bori/audience;
  Jaeyi with a repaired or sorted object; Eunsu with a radio, console, or log.
- Do not make a new outfit to explain a new location. Add one practical layer
  only, such as a rain shell, gloves, bandage, or dust cover, while keeping the
  lock anchors visible.
- Avoid face-only close-ups, hero poses, fashion poses, and group-poster
  arrangements. The image should show a person doing their role.

## Review checklist

- Does it match the reference portrait before reading the event name?
- Are the signature hair, clothing, and equipment visible?
- Is the companion approximately the same apparent age and body type?
- Does the image explain the event's action rather than repeat a generic pose?
- Does it remain readable in the 16:9 event frame on a 360px mobile screen?
