# Companion Visual Bible

This is the source of truth for every cinematic scene that shows a recruitable
companion. The canonical references are the portrait assets in
`assets/portraits/`. A scene is not approved because it has a similar mood;
the person must still be identifiable at a glance.

## Non-negotiable generation workflow

1. Attach `assets/portraits/{id}.png` as a character-reference image.
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
| Minji | 17; tied, messy black hair; round mechanic goggles on forehead; brown work jacket; gloves; red sleeve patch | age, long loose hair, clean uniform, missing goggles |
| Park | 60s; short gray hair; rectangular glasses; blue-gray quilted medical jacket; worn medical sleeve patch | age, white coat, missing glasses, military uniform |
| Kangwoo | 30s; close-cropped black hair; square guarded expression; worn khaki guard jacket; shoulder rank patch | hairstyle, facial hair, helmet, futuristic armor |
| Leo | late 20s; black patterned bandana; long black hair; patched navy denim jacket; guitar | hat/hair swap, missing guitar, polished rock-star outfit |
| Jaeyi | early 20s; short messy brown hair; olive work vest; worn shirt; small scavenger pins | long hair, tactical uniform, glamorous makeup, new clothing |
| Eunsu | 30s; chin-length black hair; single-ear comms piece; dark gray control-room jacket; round comms patch | long hair, bright outfit, missing comms piece, cyberpunk hardware |

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
