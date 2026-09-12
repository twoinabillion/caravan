# Task9A independent review — 2026-09-12

Reviewer /root/integration_review, gpt-5.6-sol/high. Read-only, supplied425971-byte diff901fd95..2570a80.

Spec: issuesfound. Taskquality:Needsfixes. Critical:none.

Important1: audits/director-journey-2026-09-11/integration-procedure.md:21 documents new-pathcollision gitdiff without -C "$WORKTREE" orcd. Runningfrom/Users/sang/original/otherrepo couldinspectwrongrepoandproduceincompletecollisions. Explicitlyscopegitandtemporarycollisionchecker toworktree, passapprovedSHA.

Minor1: tools/make-task8-index.py:164 globalindexedEvidenceFileCount recomputesPNG+journalsinstead of summingperscenarioalreadyderivedcounts; otherhashedtypeswouldsilentlydisappear. Sumperscenariocounts andseparatelyassertcurrentPNG/journalpartition.

Strengths:sharedorderedregistry/content-registry.cjs:6,:16; meaningfulduplicate/turnvalidationandindependentbuiltpageprobe(validate-content:26,:86;test_content_registry:88,:154);correctCURRENTmetrics/build/budgets/limits(update-current:11;CURRENT:14,:29);Task8minorsandTask6vehiclecorrectionaddressed(test_smoke:1408;task6report:72);AITdecompressonce/hashsize/webdist/reference/inlinebuildverification(verify-ait-web:20,:34,:46);required5artifactexceptions(integration-manifest:36);controllerverified8PNGcopies.

PhaseB/wholebranch/originalbuild/4175proofexplicitlypendingandoutsidephaseA.

Controller: fixround1 assignedoriginalimplementerfrom2570a80, bothfindings. Nooriginalwrite/runtimechange; affectedread-onlyscopecheck/indexverification, thencommitandscopedre-review.

## Scoped fix round1 — approved

FixBASE2570a805f71fd4c18cbea3c18e1d844bf6480449 → HEAD833e6fc3990c17aab634cfbdaa770a5935154cc8; /root/integration_review read-only scopedreview.

Importantunscopedcollisioncheck ADDRESSED: explicitgit-C/worktree+original+baseline+approvedargs andPythoncwd=worktree (integration-procedure.md:41,:53). Minorcount ADDRESSED: rejectcurrentindexedfilesoutsidePNG/journalpartition, sumscenario manifest-backedindexedEvidenceFileCount (tools/make-task8-index.py:61,:172). Reportedregeneration223PNG+3journals=226,durablecopybyteequal. Newbreakage:none. Out-of-scopeobservations:none. Verdict:Allfindingsaddressed,no newCritical/Importantbreakage.

ControlleracceptsTask9A833e6fc. Wholebranchreviewandactualoriginaldeliveryremainpending.
