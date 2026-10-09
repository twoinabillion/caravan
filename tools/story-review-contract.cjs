/* Explicitly reviewed mechanics deltas, projected onto older corpus baselines.
   Assert each new contract before removing it; never accept a new blanket hash. */
const assert=require('node:assert/strict');
module.exports=function projectReviewedStoryChanges(rows){
  for(const row of rows){
    if(row.id==='trace_coldbag_return'){
      assert.equal(row.needItem,'씨앗 꾸러미');delete row.needItem;
      assert.deepEqual(row.choices[0].req,{item:'씨앗 꾸러미'});delete row.choices[0].req;
      assert.deepEqual(row.choices[0].out[0].fx.item,{'씨앗 꾸러미':-1});
      delete row.choices[0].out[0].fx.item;
    }
    if(row.id==='es_backdoor'&&Object.hasOwn(row,'w')){
      assert.equal(row.noPool,1);assert.equal(row.needFlag2,'es_v1194');
      delete row.noPool;delete row.needFlag2;
    }
    if(row.id==='loc_jaeyi_cache'){
      assert.equal(row.choices[0].out[0].fx.flag2,'jaeyi_cache_opened');
      delete row.choices[0].out[0].fx.flag2;
    }
    if(row.id==='es_backdoor')for(const choice of row.choices)for(const out of choice.out){
      assert.deepEqual(out.fx.knowledge,['family_order_source',2]);
      delete out.fx.knowledge;
    }
    const next={story_bridge_invitation:'story_bridge_last_quiet',story_bridge_last_quiet:'seoul_open'}[row.id];
    if(next)for(const choice of row.choices)for(const out of choice.out){
      assert.equal(out.fx.chain,next);delete out.fx.chain;
    }
  }
  return rows;
};
