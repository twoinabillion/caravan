/* Explicitly reviewed mechanics deltas, projected onto older corpus baselines.
   Assert each new contract before removing it; never accept a new blanket hash. */
const assert=require('node:assert/strict');
module.exports=function projectReviewedStoryChanges(rows){
  const mechanics=choice=>JSON.parse(JSON.stringify(choice,(key,value)=>
    ['text','label','turnSpeakers','turns','readingRecord','note'].includes(key)?undefined:value));
  for(const row of rows){
    if(row.id==='cult_recruiter'){
      assert.deepEqual(row.choices[1].req,{water:1});delete row.choices[1].req;
    }
    if(row.id==='whites_straggler'){
      assert.deepEqual(row.choices[0].req,{water:1});delete row.choices[0].req;
    }
    if(row.id==='bori_family'){
      assert.deepEqual(row.nearNode,['busan','miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']);
      delete row.nearNode;
    }
    if(row.id==='dj_meet'||row.id==='dj_onair'){
      assert.equal(row.minParty,0);row.minParty=1;
      if(row.id==='dj_onair'){
        assert.deepEqual(row.minuteWindow,[120,180]);delete row.minuteWindow;
      }
    }
    if(row.id==='meet_trader_truck'){
      assert.equal(row.retryUntilFlag,'mansu_shop');delete row.retryUntilFlag;
      assert.deepEqual(row.noFlags,['mansu_shop','mansu_hurt']);delete row.noFlags;
    }
    if(row.id==='mansu_robbed'){
      assert.equal(row.noFlag,'mansu_shop');delete row.noFlag;
    }
    if(row.id==='mansu_opening'){
      assert.equal(row.noFlag,'mansu_hurt');delete row.noFlag;
      assert.deepEqual(row.nearNode,['busan','miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']);
      delete row.nearNode;
      assert.deepEqual(row.choices[0].req,{scrap:2});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{moodAll:3,flag:'mansu_shop'}}]});
    }
    if(row.id==='freq_catch'||row.id==='freq_source'){
      assert.equal(row.minParty,0);row.minParty=1;
    }
    if(row.id==='deserter_farewell'){
      assert.deepEqual(row.nearNode,['busan','miryang','daegu','muju','jeonju','daejeon','suwon','gwangju']);
      delete row.nearNode;
    }
    if(row.id==='ai_broadcast'){
      assert.deepEqual(row.minuteWindow,[240,330]);delete row.minuteWindow;
    }
    if(row.id==='crisis_hose'){
      assert.deepEqual(row.choices[0].req,{item:'부품'});delete row.choices[0].req;
      assert.equal(row.choices.length,3);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{time:120,fuel:-3,fatigue:8}}]});
    }
    if(row.id==='conflict_fuel_detour'){
      for(const [index,req] of [[0,{fuel:8}],[1,{item:'의약품'}],[2,{fuel:4,item:'의약품'}]]){
        assert.deepEqual(row.choices[index].req,req);delete row.choices[index].req;
      }
      assert.equal(row.choices.length,4);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{time:20,mood:{parkss:-6,kangwoo:2},moodAll:-2,
        flag:'conflict_sided_kangwoo',flag2:'conflict_open',chain:'conflict_silent_cab'}}]});
    }
    if(row.id==='conflict_silent_cab'){
      assert.deepEqual(row.choices[0].req,{food:1});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      assert.deepEqual(mechanics(row.choices.pop()),{out:[{p:1,fx:{time:30,mood:{kangwoo:1,parkss:1},chain:'conflict_campfire'}}]});
    }
    if(row.id==='conflict_campfire'){
      assert.deepEqual(row.choices[0].req,{water:1});delete row.choices[0].req;
      assert.equal(row.choices.length,2);
      const alternative=row.choices.pop();
      const original=JSON.parse(JSON.stringify(row.choices[0]));delete original.out[0].fx.water;
      original.out[0].fx.mood={kangwoo:3,parkss:3};original.out[0].fx.moodAll=1;
      assert.deepEqual(mechanics(alternative),mechanics(original));
    }
    if(row.id==='photo_delivered'){
      assert.equal(row.needsDog,false);row.needsDog=true;
    }
    if(row.id==='meet_postman'){
      assert.deepEqual(row.choices[1].req,{water:1});delete row.choices[1].req;
    }
    if(row.id==='meet_seedlady'){
      assert.deepEqual(row.choices[0].req,{water:2});delete row.choices[0].req;
    }
    if(row.id==='lc_sejong_library'){
      assert.deepEqual(row.nearNode,['sejong']);row.nearNode=['sejong','gongju'];
    }
    if(row.id==='parcel_found'){
      assert.equal(row.minParty,0);row.minParty=1;
      assert.deepEqual(row.nearNode,['suwon']);row.nearNode=['suwon','pyeongtaek','seoul'];
    }
    if(row.id==='meet_waver'){
      assert.deepEqual(row.choices[0].req,{fuel:5});delete row.choices[0].req;
    }
    if(row.id==='meet_toll'){
      assert.deepEqual(row.choices[1].req,{comp:'kangwoo',scrap:8});delete row.choices[1].req.scrap;
    }
    if(row.id==='mansu_robbed'){
      assert.deepEqual(row.choices[0].req,{item:'의약품'});delete row.choices[0].req;
    }
    if(row.id==='lib_books'||row.id==='lib_return'){
      const completed=row.id==='lib_books'?'library_books':'library_done';
      assert.equal(row.retryUntilFlag,completed);assert.equal(row.noFlag,completed);
      delete row.retryUntilFlag;delete row.noFlag;
      if(row.id==='lib_return'){assert.equal(row.needItem,'책 꾸러미');delete row.needItem;}
    }
    if(row.id==='parents_mother_reunion')for(const choice of row.choices)for(const out of choice.out){
      assert.equal(out.fx.flag,'mother_reunited');
      assert.equal(out.fx.chain,'parents_mother_truth');
      delete out.fx.flag;
    }
    if(row.id==='seoul_session_reset'){
      assert.deepEqual(row.choices[0].out[0].scenes,['seoul-uplink-empty-v2','parents-mother-reunion-v1']);
      delete row.choices[0].out[0].scenes;
    }
    if(row.id==='talk_leo_10'){
      assert.equal(row.noFlag,'seoul_open');delete row.noFlag;
    }
    if(row.id==='talk_jy_21'){
      assert.equal(row.noFlag,'seoul_open');delete row.noFlag;
      for(const choice of row.choices){
        assert.equal(choice.out[0].fx.flag,'jaeyi_scale_entrusted');
        delete choice.out[0].fx.flag;
      }
    }
    if(row.id==='react_resist_es'){
      assert.equal(row.needFlag2,'cell_ghost');delete row.needFlag2;
    }
    if(row.id==='story_bridge_crew_question'){
      const reasons=['bridge_reason_stop','bridge_reason_family','bridge_reason_both'];
      assert.equal(row.choices.length,3);
      row.choices.forEach((choice,index)=>{
        assert.equal(choice.out.length,1);
        assert.equal(choice.out[0].fx.flag,'bridge_crew_answer');
        assert.equal(choice.out[0].fx.flag2,reasons[index]);
        delete choice.out[0].fx.flag2;
      });
    }
    // Art contracts are intentionally changed; gates, payment and chains are not.
    if(row.id==='story_family_key'){
      assert.deepEqual(row.scenes,['family-verification-key']);
      row.scenes.push('story-family-key-audio-v1');
    }
    if(row.id==='main_recovery_story_family_key'){
      assert.equal(row.parseRecords,true);delete row.parseRecords;
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
