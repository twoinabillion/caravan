#!/usr/bin/env python3
"""Task7 fix1 evidence: run real return tests, capturing before their final reload."""
import hashlib
import json
from pathlib import Path
import test_director_pending as checks

OUT=checks.ART/'fix1'

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    evidence=[]
    original_resume=checks.resume
    for conflicting in [False,True]:
        owner=checks.page.__wrapped__()
        page=next(owner)
        label='conflicting' if conflicting else 'prepared'
        trace={'fixture':label,'url':checks.URL,'steps':[]}
        def snapshot(step):
            state=page.evaluate("""()=>({at:S.at,day:S.day,min:S.min,km:S.stats.km,
              pending:S.pendingPresentation&&{eventId:S.pendingPresentation.eventId,phase:S.pendingPresentation.phase},
              chain:S._chain,costs:S.flags.seoul_costs_seen,stage:G.seoulStage(),
              methods:['core_transfer','core_sleep','core_quarantine'].filter(k=>S.flags[k]),
              ready:G.presentationEvent('seoul_decision').choices.map(c=>G.reqOk(c.req).ok),
              events:S.stats.events,counts:S._quality.counts})""")
            state.update(step=step,event=checks.event(page),
              fingerprintSha256=hashlib.sha256(checks.fingerprint(page).encode()).hexdigest())
            trace['steps'].append(state)
        calls=0
        def resume_with_evidence(current):
            nonlocal calls
            calls+=1
            if calls==3:
                # The real arrival button has already run. Capture its next
                # scene now, before the test's final normal Continue assertion.
                checks.finish(current)
                snapshot('live-arrival-next-scene-before-any-arrival-reload')
                current.screenshot(path=str(OUT/f'{label}-live-return.png'))
            original_resume(current)
            snapshot(f'continue-{calls}')
        checks.resume=resume_with_evidence
        try:
            checks.test_preparation_return_preserves_progress_and_can_revisit(page,conflicting)
            snapshot('after-test-explicit-choice' if conflicting else 'after-test')
            if conflicting:
                page.screenshot(path=str(OUT/'conflicting-explicit-quarantine-result.png'))
            next(owner,None)
        finally:
            owner.close()
            checks.resume=original_resume
        evidence.append(trace)
    (OUT/'live-return.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))
    print('PASS: prepared and conflicting live preparation returns; arrival-next-scene captured before reload; overnight healing and explicit quarantine choice; unchanged arrival/Continue fingerprints')

if __name__=='__main__':
    main()
