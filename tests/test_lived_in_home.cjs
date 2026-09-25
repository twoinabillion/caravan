const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env=vm.createContext({});
vm.runInContext(fs.readFileSync('src/03-data.js','utf8')+'\nglobalThis.data=D;',env);
vm.runInContext(fs.readFileSync('src/07g-ui-home.js','utf8')+'\nglobalThis.home=HOME;',env);
const state={scene:'room.webp',party:[],up:{},keepsakes:env.data.companionKeepsakes,upgrades:env.data.upgrades,memories:{}};
const rendered=()=>env.home.html(state);
const props=()=>[...rendered().matchAll(/data-home-prop="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(props(),[],'an unearned room stays empty');
for(const id of ['minji','parkss','kangwoo','leo','jaeyi','eunsu']){
  state.party=[id];
  assert.deepEqual(props(),['companion:'+id],id+' brings only their own keepsake');
}
state.party=[];state.memories.minji={home:'민지가 접시를 보여 주던 날을 기억한다.'};
assert.deepEqual(props(),[],'a memory of someone who left is not their physical object');
assert(rendered().includes('data-home-object="memory:minji"'),'their saved memory remains readable');
state.up={bench:true};assert.deepEqual(props(),['upgrade:bench']);
state.up={bench:true,cabin:true,bunk:true};
assert.deepEqual(props(),['upgrade:bunk'],'expanded sleeping space does not stack duplicate furniture');
state.up={kitchen:true};assert.deepEqual(props(),['upgrade:kitchen'],'kitchen does not invent a stove');
state.up={stove:true};assert.deepEqual(props(),['upgrade:stove'],'stove does not invent a kitchen');
state.up={curtain:true,fridge:true};assert.deepEqual(props().sort(),['upgrade:curtain','upgrade:fridge']);
state.up={solar:true,unregistered:true};assert.deepEqual(props(),[],'exterior upgrades never appear on the floor');
state.party=['minji','parkss','kangwoo','leo','jaeyi','eunsu'];
state.up={bench:true,cabin:true,bunk:true,stove:true,kitchen:true,fridge:true,curtain:true};
const before=JSON.stringify(state);
assert.equal(props().length,11);assert.equal(new Set(props()).size,11);
assert.equal(JSON.stringify(state),before,'the room cannot alter gameplay or ownership');
state.scene=null;assert.deepEqual(props(),[],'without the room backdrop, props never float on a blank panel');
console.log('PASS earned HOME artwork: empty, six companions, departed memory, furnishing tiers, independent ownership, no mutation.');
