# seoul-reset-empty-v2

Generated in the preceding Task 6 session on 2026-09-11. Source: `/Users/sang/.codex/generated_images/01a08f05-0570-7141-8c78-2895fdc5e4f6/exec-490c4eb5-8398-4ed7-8ee8-c10cad8def8f.png`. Master preserved beside this note. Export: `cwebp -quiet -q 86 -resize 1280 720 seoul-reset-empty-v2.png -o assets/scenes/seoul-reset-empty-v2.webp`.

Continuation inspected full delivery image, then live4176 asset gallery before wiring. Gallery screenshot: `qa-artifacts/director-art-2026-09-11/seoul-reset-empty-v2-gallery.png`. Both loaded1280×720. Empty cast/vehicle, wet industrial architecture and original local-vs-upper-network status preserved. These are edits of existing cinematic scenes, not new setting designs.

Exact prior imagegen invocation (two sequential edits):
```js
// @exec: {"yield_time_ms": 120000, "max_output_tokens": 1200}
const root="/Users/sang/_workspace/caravan-director-20260911/";
const base="Use case: stylized-concept. Near-photographic cinematic painterly realism for the Korean post-collapse road-trip game Seoul to 400km. Grounded Korean people and infrastructure, restrained cool gray-blue palette, wet or dusty weathered materials, one practical warm amber light source where inhabited, natural anatomy, human-scale action, subtle film grain, believable 35-50mm film-still composition. Match the attached Caravan canonical references exactly in medium, palette, character identity and vehicle design.";
const negative="anime, manga, comic book, ink outline, cel shading, cartoon, chibi, pixel art, glossy advertising photo, hyperreal skin pores, fashion editorial, studio portrait, 3D render, game-engine screenshot, fantasy, zombies, neon cyberpunk, clean sci-fi vehicle, American RV, panel van, readable text, logo, watermark, UI, frame, collage, split panel";
const refs=["assets/reference/visual-canon-2026-08-11.png","assets/reference/world-canon-2026-08-11.png","assets/reference/people-canon-2026-08-11.png","assets/reference/dalguji-technical-canon-2026-08-11.webp"];
for(const kind of ["uplink-reveal","session-reset"]){
 const prompt=`${base}\nUse case: precise-object-edit. Image 1 is the EDIT TARGET, existing canonical Seoul ${kind} scene. Images 2–5 are mandatory canonical style/world/people/vehicle references only, do not reproduce their collage. Change ONLY this: remove every person and human silhouette from image 1, filling their places with the matching wet industrial floor and background pipes. There must be zero people, zero human shadows, zero vehicle. Preserve the exact industrial architecture, framing, perspective, location, lighting, colors, machinery and operational state of the edit target. ${kind==="session-reset"?"Keep the central Seoul core dark and inactive; preserve the separate small red-lit maintenance terminal at the right foreground as the only clear new red signal.":"Preserve the tall distant array of many small red executor lights behind the large stopped core, and the existing pale maintenance light in the core; do not invent a red beam or reactivate the central core."} A truthful empty point-of-view scene valid for a solo or any-party ending. Output a large landscape 16:9 master at least 1536x864. No words, logos, captions or borders. Negative: ${negative}`;
 const result=await tools.image_gen__imagegen({prompt,referenced_image_paths:[root+`assets/scenes/seoul-${kind}-v1.jpg`,...refs.map(x=>root+x)]});
 store(kind,{prompt,result});text({kind,result});
}

```
