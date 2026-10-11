/* Explicitly reviewed mechanics deltas, projected onto older corpus baselines.
   Assert each new contract before removing it; never accept a new blanket hash. */
const assert=require('node:assert/strict');
module.exports=function projectReviewedStoryChanges(rows){
  for(const row of rows){
    // Art contracts are intentionally changed; gates, payment and chains are not.
    if(row.id==='story_family_key'){
      assert.deepEqual(row.scenes,['family-verification-key']);
      row.scenes.push('story-family-key-audio-v1');
    }
    if(row.id==='main_recovery_story_family_key'){
      assert.equal(row.scene,'family-verification-key');row.scene='parents-linked-records-v2';
    }
    if(row.id==='main_recovery_story_personal_cache'){
      assert.equal(row.scene,'suwon-exchange-cache-v1');row.scene='parents-linked-records-v2';
    }
    if(row.id==='pair_kw_leo_1'){
      assert.deepEqual(row.scenes,['pair-kangwoo-leo-watch-v1']);
      row.scenes.push('pair-kangwoo-leo-quiet-song-v2');
      assert.deepEqual(row.choices[0].out[0].scenes,['pair-kangwoo-leo-replay-v1']);
      delete row.choices[0].out[0].scenes;
    }
    if(row.id==='comp_minji_radio'){
      assert.deepEqual(row.minuteWindow,[714,720]);delete row.minuteWindow;
    }
    if(row.id==='ev_seed_warehouse')for(const out of row.choices[0].out){
      assert.equal(out.fx.flag,'seed_found');out.fx.flag='seed_borrowed';
    }
    if(row.id==='seed_harvest'){
      assert.deepEqual(row.choices[1].req,{flag:'seed_borrowed',up:'garden'});
      delete row.choices[1].req.up;
    }
    if(row.id==='seed_return'){
      assert.deepEqual(row.choices[0].req,{food:1});delete row.choices[0].req;
    }
    if(row.id==='vanowner_coffee'){
      assert.equal(row.needFlag2,'van_owner_done');delete row.needFlag2;
      assert.equal(row.needItem,'커피 원두');delete row.needItem;
      assert.deepEqual(row.choices[0].req,{item:'커피 원두'});delete row.choices[0].req;
    }
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
