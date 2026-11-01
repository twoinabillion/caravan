# Cycle91 Jaeyi address provenance

`natural-entry.json` and `natural-result.json` are byte-for-byte copies of actual cycle90 explorer attempt01 event426/choice427, `talk_jy_08`, DAY8 06:30. `provenance.json` records the original paths and SHA256. The actual paid receipt exists; it is not reconstructed. It has the old deferral prose and the contemporaneous `jy_story`, discovered `jaeyi_cache`, and address note that demonstrated the bug.

`baseline.json` was captured before the91 source edit by `qa-artifacts/qa-cycle-20261026/cycle91/survival/prepare-jaeyi.cjs`. It includes the old event definition, original entry reader, old-code next payment from the natural unpaid input, and loaded actual old paid reader/view-only/text-only results. The preparation script refuses to overwrite an existing baseline. Source and baseline hashes are in provenance. No original fixture/receipt was edited to match new expectations.

The normal reader case retains actual `reading`, `history`, cursor, selection, keys and scene time. The view-only case is an explicitly synthetic copy that moves the existing view to the supported top-level field and removes reading. The text-only case is an explicitly synthetic copy removing reading/view/authoredView: it cannot prove reconstruction of a removed original frame or history. Its frozen words/chips/notes/state and no-repayment are asserted, with the pre-edit **fallback** key/info expectation separately recorded. These three modes are not three natural saves or additional players.

New boundary and sequence cases use controlled in-memory copies or engine states, then actual eligibility/openEvent/resolve/choosePerk/warehouse completion functions. Bond, perk pending, map knowledge and chronology are explicit fixture inputs. They do not count as fresh journeys. `contract.cjs` contains the reviewed exact new prose expectations and quote counts used to project only08's text delta onto older unchanged corpus fixtures. It does not generate or replace the old baseline.

Node VM tests run actual reader/engine/save code with browser surfaces stubbed. They do not verify browser input, UI crops, or audio playback.
