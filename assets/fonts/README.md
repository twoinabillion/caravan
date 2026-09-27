# Bundled fonts

- Black Han Sans: existing master and OFL license retained. `BlackHanSans-Regular.woff2` is a lossless WOFF2 repack of the TTF, replacing WOFF delivery without changing glyphs.
- [Nanum Pen Script, Google Fonts](https://github.com/google/fonts/tree/main/ofl/nanumpenscript): `NanumPenScript-Regular.ttf` and `NanumPenScript-OFL.txt` are the licensed master and license. The shipping subset is renamed **Caravan Journal Hand** to respect the reserved font names. Copyright and license metadata are retained.

The approved bound notebook uses handwriting for titles, prose, known records and annotations in every journal tab. The subset collects authored characters from all game JavaScript, including dynamic place, item and mission names. Operational controls and location/time guidance retain the normal UI font. No network font request is needed in the single-file game.

Rebuild the subset after changing journal text or the data it displays:

```sh
python3 tools/prepare-quest-font.py # requires fonttools and brotli
```

This also regenerates `tools/design-drafts/quest-font.css` with an embedded font for opaque-origin sandboxed prototypes; it does not loosen the design window sandbox. Keep the output under the existing HTML size budget.
