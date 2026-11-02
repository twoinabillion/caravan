const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('../tools/content-registry.cjs');
function setup(){
 const store=new Map(),c=vm.createContext({console,Date,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},UI:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
 for(const f of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(f,'utf8'),c);
 for(const f of fs.readdirSync('src').filter(f=>/^04.*\.js$/.test(f)).sort())vm.runInContext(fs.readFileSync('src/'+f,'utf8'),c);
 const run=s=>vm.runInContext(s,c);run("G.newGame('onroad','다온','full','keeper');S.stats.km=8;S.stats.events=1;globalThis.e=D.events.find(e=>e.id==='onboarding_first_road')");return run;
}
for(let choice=0;choice<3;choice++)test(`first road branch ${choice}: delayed, saved, once-only and no reward`,()=>{
 const run=setup();
 assert.equal(run(`G.rememberChoice(e,e.choices[${choice}],e.choices[${choice}].out[0]).length`),1);
 assert.equal(run(`G.rememberChoice(e,e.choices[${choice}],e.choices[${choice}].out[0]).length`),0);
 run('S.driving={from:"busan",to:"yangsan",gone:8};G.save();G.load()');
 assert.equal(run('G.takeChoiceEcho()'),null);
 run('S.stats.km=20');assert.equal(run('G.takeChoiceEcho()'),null,'wait for another event as well as distance');
 run('S.stats.events=2;S.driving=null');assert.equal(run('G.takeChoiceEcho()'),null,'never interrupt a stopped reader');
 run('S.driving={from:"yangsan",to:"miryang",gone:0};globalThis.before=JSON.stringify([S.fuel,S.food,S.water,S.scrap,S.van,S.min,S.day,S.pursuit]);globalThis.echo=G.takeChoiceEcho()');
 assert.equal(run('echo.memory.choiceIndex'),choice);assert.equal(run('echo.lines.length'),2);
 assert.equal(run('JSON.stringify([S.fuel,S.food,S.water,S.scrap,S.van,S.min,S.day,S.pursuit])===before'),true);
 assert.equal(run('G.takeChoiceEcho()'),null);run('G.save();G.load()');assert.equal(run('G.takeChoiceEcho()'),null);
});
test('old first-road receipts do not acquire a retroactive memory',()=>{
 const run=setup();run("S.used.push(e.id);S.flags.first_order_trace=true;G.save();G.load();S.stats.km=100;S.stats.events=10;S.driving={from:'yangsan',to:'miryang'}");
 assert.equal(run('G.takeChoiceEcho()'),null);
});
