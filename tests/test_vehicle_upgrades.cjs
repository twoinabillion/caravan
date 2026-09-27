const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const read=f=>fs.readFileSync('src/'+f,'utf8'),saved=new Map();
const env=vm.createContext({console,Date,Math,URLSearchParams,location:{search:''},
  localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
  setTimeout:()=>0,clearTimeout(){},UI:{toast(){},renderAll(){}},
  Image:class{constructor(){this.complete=true;this.naturalWidth=384;this.naturalHeight=512;}}});
vm.runInContext(read('03-data.js')+read('03j-camp-conversations.js')+read('04a-engine-core.js')+read('04e-engine-world.js')+'\nglobalThis.g=G;globalThis.d=D;',env);
const g=env.g,d=env.d;
Object.assign(g,{hasComp:()=>false,isInjured:()=>false,qualityUpgrade(){},addNote(){},
  resetDriveTimers(){},ensureNarrativeState(){},ensureCombatFlow(){},recoverQualitySession(){},syncKnowledgeFromFlags(){},validatePresentation:v=>v||null});
const run=s=>vm.runInContext(s,env),state=()=>run('S');
const fresh=()=>run(`S={v:8,at:'gimcheon',day:1,min:600,wx:'clear',wxNext:'fog',up:{},party:[],comps:{},flags:{},stats:{km:0,events:0},items:{'부품':99},scrap:9999,fuel:42,fuelMax:70,van:82,vanMax:100,water:16,food:14,ended:false};G.advance=n=>{S.min+=n;};`);
let checks=0;const check=(x,msg)=>{assert(x,msg);checks++;};
fresh();
// Every item is reachable through an acyclic chain; slot choices are reset per item.
for(const u of d.upgrades){
  fresh();const visiting=new Set();
  function install(id){
    if(state().up[id])return;
    check(!visiting.has(id),'dependency cycle: '+id);visiting.add(id);
    for(const dep of g.upRequirements(id)){check(!!g.upDef(dep),'missing prerequisite '+dep);install(dep);}
    const cost=g.upScrapCost(g.upDef(id)),before=state().scrap;
    check(g.canBuyUp(id).ok,'unreachable '+id);check(g.buyUpgrade(id),'purchase '+id);
    check(state().scrap===before-cost,'exact one resource transaction '+id);
    const snapshot=JSON.stringify(state());check(!g.buyUpgrade(id),'duplicate purchase');
    check(JSON.stringify(state())===snapshot,'duplicate purchase changes state');visiting.delete(id);
  }
  install(u.id);g.save();run('S=null');check(g.load(),'refresh load');check(state().up[u.id],'ownership after refresh '+u.id);
}
fresh();g.buyUpgrade('bench');
check(!g.canBuyUp('cabin').ok&&g.canBuyUp('cabin').missing.includes('susp'),'cabin requires chassis support');
for(const id of ['armor','winch','tank2']){
  const before=JSON.stringify(state());check(!g.buyUpgrade(id),'blocked construction '+id);
  check(JSON.stringify(state())===before,'failed construction spent resources/time '+id);
}
check(g.upInstallationInfo('cabin').includes('서스펜션'),'garage explains prerequisite');
const unchanged=JSON.stringify(state());g.canBuyUp('cabin');g.upInstallationInfo('cabin');
check(JSON.stringify(state())===unchanged,'selection/back is read-only');
fresh();for(const id of ['garden','solar','scope'])check(g.buyUpgrade(id),'roof install');
check(!g.canBuyUp('collector').ok,'fourth roof item blocked');check(g.buyUpgrade('garden2'),'greenhouse reuses garden bay');
fresh();for(const id of ['susp','tank1','tank2','bench','cabin','bunk'])check(g.buyUpgrade(id),'rear setup '+id);
check(!g.canBuyUp('jumpseat').ok&&g.canBuyUp('jumpseat').why.includes('자리 없음'),'tank blocks service extension');
fresh();for(const id of ['susp','bench','cabin','bunk','jumpseat','tank1'])check(g.buyUpgrade(id),'reverse setup '+id);
check(!g.canBuyUp('tank2').ok,'service extension blocks large tank');
check(g.canBuyUp('mudtires').ok,'another reachable action remains');
// Existing illegal-by-new-rules builds must survive the real save/load function.
state().up={cabin:true,armor:true,winch:true,garden:true,solar:true,scope:true,antenna:true,beehive:true,tank2:true,jumpseat:true};
const owned=JSON.stringify(state().up);g.save();run('S=null');check(g.load(),'legacy load');
check(JSON.stringify(state().up)===owned,'legacy upgrades preserved without granting prerequisites');
const manifest=JSON.parse(fs.readFileSync('assets/ui/vehicle-upgrades/manifest-v1.json'));
const kitSource=read('05b-vehicle-kit.js').replace('/*__VEHICLE_KIT__*/{}',JSON.stringify(manifest.images));
run(kitSource+'\nglobalThis.kit=VEHICLE_KIT;');
const kit=env.kit;
check(d.upgrades.every(u=>kit.parts[u.id]||kit.bodies[u.id]),'all 28 have owned visual representation');
for(const [id,file] of Object.entries(manifest.images)){
  const info=cp.execFileSync('magick',['identify','-format','%w %h %[opaque]',file],{encoding:'utf8'}).split(' ');
  const size=['equipment','living'].includes(id)?manifest.atlasDelivery:manifest.bodyDelivery;
  check(+info[0]===size[0]&&+info[1]===size[1],id+' delivery dimensions');check(info[2]==='False',id+' genuine alpha');
}
let layouts=0;
const roofIds=['garden','collector','solar','antenna','beehive','scope'];
for(const build of d.vanStages)for(let mask=0;mask<64;mask++){
  const up=Object.fromEntries(roofIds.filter((_,i)=>mask&(1<<i)).map(id=>[id,true]));
  for(const greenhouse of [false,true]){
    if(greenhouse&&up.garden)up.garden2=true;
    const layout=kit.layout(up,build),again=kit.layout(up,build);
    check(JSON.stringify(layout)===JSON.stringify(again),'stable mounts');
    check(layout.roof.length===Object.keys(up).filter(id=>id!=='garden2').length,'no missing or extra roof parts');
    for(const a of layout.roof){
      check(a.x>=0&&a.x+a.w<=build.bodyL-23,'reserved cargo area');
      for(const b of layout.roof)if(a!==b&&a.row===b.row)check(a.x+a.w<=b.x||b.x+b.w<=a.x,'roof collision');
    }
    if(up.garden2)check(!layout.roof.some(x=>x.id==='garden'),'greenhouse replaces garden');
    layouts++;
  }
}
console.log(`PASS ${checks} assertions; 28 upgrade chains, blocked/duplicate transactions, roof/rear combinations, real save/load and ${layouts} layouts including legacy excess.`);
