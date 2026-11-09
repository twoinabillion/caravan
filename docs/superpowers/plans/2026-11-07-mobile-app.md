# Caravan mobile app refinement implementation plan

> Use superpowers:executing-plans inline. Sang approved the preceding concrete mobile critique with “해봐봐 그러면”; do not request the same approval again. One fresh read-only final reviewer. No commit/push/deployment/reset.

**Goal:** Make existing HD dialogue comfortable on a phone, with a full-height scene composition, bottom tools, ordered back navigation and an honest return cue.

**Architecture:** Existing passenger-story-reader CSS owns mobile layout via a new structural data opt-in. A small standalone MobileReader DOM helper owns only backdrop/menu/resume UI. Existing UI retains all paging/actions/inspection/save; the installed Toss bridge forwards back events to one UI method. No authored D, engine, RNG or save schema changes.

**Tech stack:** Existing plain JS/CSS, native dialog, installed @apps-in-toss/web-framework2.10.6. No new dependency or raster.

**Design/constraints:** Based on the five-point mobile critique in chat. Foreground images stay contain/original; only the atmospheric backdrop covers.16px/21px type, manual reading, existing choice requirements/costs and old paid receipts remain. Desktop stays unchanged; short/landscape and oversized atomic content retain explicit fallbacks. Native/device performance claims require a real device.

**Review focus:** Hidden original tool focus; open menu during a scene replacement/resize; stale backdrop or unseen record at resume; back swallowing an actual choice/payment; native pagehide/pageshow rebind and no active preview save reset.

- [x] Register/show an independent mobile-reading-v1 draft on existing4386; Studio unavailable, retain exact scope. Snapshot and record baseline.
- [x] RED browser checks for mobile top gap, bottom tools, whole-image preservation and free menu; implement helper and CSS owner. Test ordinary/large/short/portrait/evidence and desktop.
- [x] RED back-order/resume checks; integrate existing close handlers and installed Toss back bridge with cleanup/rebind. Resume cue uses actual title/phase, never invented plot or unseen turns.
- [x] Run touch/keyboard, back/cancel, entry/outcome and paid reload tests in isolated earned saves. Check actual phone tools and report missing native/device coverage separately. Record software startup metrics without calling them device performance.
- [x] One fresh final review of tar-baseline delta; fix Important findings with RED→GREEN. Freeze source, full source suite, source-health, whole D equality and HTML/AIT aliases; save gallery/checkpoints and scope limits.

Final scope: attainable mobile checks completed. Real-device performance/native gestures pending because no connected handset; do not call desktop touch QA physical-device QA. See verification.json and gallery.
