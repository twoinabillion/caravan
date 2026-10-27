# Cycle23 candidate art from cycle22 findings

Two QA-only assets, generated with the built-in image_gen.imagegen tool. Root owns production assets, live-gallery registration and scene mapping; this directory has no production effects.

- `local-busan-dried-fish-cart-v1.webp` — character,1024×576sRGB,125400bytes. One Jagalchi woman waves beside a handcart of dried squid/fish/anchovies. Actual `assets/portraits/passer_woman.png` was supplied directly with the canonical4 references to draft01.
- `explore-comicbook-room-v1.webp` — place,1024×576sRGB,131170bytes. Empty second-floor comic room, paperback shelves, old sofa/window seat, checkout desk and kettle/noodle corner before any player action.

Both original generated PNG masters are preserved byte-for-byte under `masters/*-master.png` (1672×941). Candidate exports use centered Lanczos fit, sRGB ICC, WebP quality86/effort6. No hand painting/content changes were made during export.

Exact contract base/negative, reference paths/SHA256 and prompts are retained in `prompts.json`, individual `*-request.json`/`*-prompt.txt`, and provenance.json. Draft01 masters are retained: both initially inherited a tower resembling Namsan from the canonical references. They were rejected, then the built-in image tool changed only distant backgrounds to anonymous harbor/rooftops. The narrow edit requests/prompt hashes are `*-edit02-request.json`.

The initial Busan edit request had6 input images(target+canonical4+portrait), which the tool rejected before generation because it allows at most5. The rejected request is preserved. The executed edit used target+canonical4, with the actual portrait identity inherited from the directly referenced draft01 and preserved in the target. `edits02.json` retains the originally proposed requests; individual edit02-request files are the exact executed versions. No tool failure was hidden and no portrait was fabricated.

Direct review: generated outputs, both exported WebPs,480px/360px previews, and the four canonical references were viewed. The revised backgrounds contain no city-identifying tower; Busan contains exactly one matching woman and no unintroduced crew, comic room contains no person. No purchase/reading outcome is pre-rendered. `source-visual-review.json` records geometry/color/subject/style/world review. Browser crop and live-gallery acceptance remain root work.


Additional two approved candidates are complete:

- `explore-abandoned-military-checkpoint-v1.webp` — place, 1024×576 sRGB, 156372 bytes. Empty abandoned military checkpoint with concrete guard hut, sandbags, barrier and fallen blank-backed warning board. No soldiers, sensors, mine or revealed loot.
- `event-human-retrieval-team-v1.webp` — character, 1024×576 sRGB, 104050 bytes. Exactly four anonymous retrieval-team members outside a gray passenger van, one woman inside; leader holds an open palm. No companion or player, rescue or forced removal.

Both original 1672×941 PNG masters are byte-identical preserved, then center-fitted/exported at q86/effort6 with sRGB ICC. `additional-provenance.json` records output/source/request hashes and exact prompts. `additional-source-visual-review.json` records direct source/export and 480/360px preview review. Retrieval draft01 copied the familiar cast into the four anonymous roles; it was rejected, retained as `masters/event-human-retrieval-team-v1-draft01.png`, and corrected with the built-in image tool. The final outside four are distinct older anonymous people. The woman inside retains the actual passer_woman identity supplied to the first generation; correction used target+canonical4 because the tool supports five images maximum. No production asset, source or gallery edits were performed here. Browser crop and live-gallery verification remain root work.


Final two root-approved clarity candidates are also complete:

- `explore-school-cafeteria-v1.webp` — place, 1024×576 sRGB, 131800 bytes. Exactly three installed large cooking pots with lids present; dense school-meal tray drying racks; empty abandoned school kitchen. No branch reward or removed lid.
- `local-chungju-receded-village-v1.webp` — place, 1024×576 sRGB, 151226 bytes. Broad exposed mud shore, distant low water, old stone walls, circular well and flat meeting-hall foundation. Three older residents walk carefully; the central elder directly matches the actual `passer_elder` portrait. No named crew/player or argument outcome.

These2 remain visual clarity improvements, not extra natural reader findings. All event outcomes were read, with frozen22 actual reader evidence preserved in `clarity-event-evidence.json`. `clarity-prompts.json` and individual request files retain exact contract base/negative, canonical4 references and elder portrait reference with hashes. PNG masters, delivery hashes and export parameters are in `clarity-provenance.json`. Final images and480/360px previews were directly viewed; `clarity-source-visual-review.json` records the review. Root retains live gallery and exact in-game crop review.
