'use strict';
// Run the same frozen23 red/draft fixtures against actual current production.
const before=process.env.QA_HAN_SOURCE;
process.env.QA_HAN_SOURCE='production';
require('../qa-artifacts/qa-cycle-20261026/cycle23/systems/seoul-han-draft/test.cjs');
if(before===undefined)delete process.env.QA_HAN_SOURCE;else process.env.QA_HAN_SOURCE=before;
