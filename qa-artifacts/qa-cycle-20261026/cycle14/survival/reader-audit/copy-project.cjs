const assert=require('node:assert/strict'),copy=require('./approved-copy-delta.json');
module.exports=function project(id,event){for(const d of copy.filter(d=>d.id===id)){let o=event;for(const k of d.path.slice(0,-1))o=o[k];const last=d.path.at(-1);assert.equal(o[last],d.new,`${id} exact approved copy ${d.path.join('.')}`);o[last]=d.old;}return event;};
