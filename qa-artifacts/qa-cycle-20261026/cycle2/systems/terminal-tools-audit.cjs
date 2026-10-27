const fs=require('fs'),{setup}=require('../../../ten-persona-repairs-20261020/setup.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8'),rows=[];
function fixture(){const h=setup();h.run("S.items={'부품':10,'라디오 진공관':1};S.scrap=100;S.van=10;S.min=1430;S.water=0;S.food=12;S.thirst=3;S._breakfastDay=S.day;S._lunchDay=S.day;globalThis.calls=[];globalThis.AMBI={action:x=>calls.push('audio:'+x)};globalThis.renderAll=()=>calls.push('render');globalThis.renderHud=()=>calls.push('hud');globalThis.renderGarage=()=>calls.push('garage');globalThis.playUpgradeInstall=()=>calls.push('install');UI.showEnding=()=>calls.push('ending');");return h;}
function installRoad(h,kind){h.run(`globalThis.button={};globalThis.root={querySelector:q=>q==='[data-a="${kind}"]'?button:null};globalThis.closeModal=()=>calls.push('close');`);const start=ui.indexOf('  function wireStopActionButtons(');h.run(ui.slice(start,ui.indexOf('\n  function ',start+4)));h.run('wireStopActionButtons(root,{})');}
function installGarage(h,kind){h.run(`globalThis.rows=[{key:'qa',id:'bench',kind:'${kind}',enabled:true}];globalThis.garageSelection='qa';globalThis.button={};globalThis.$=q=>q==='#garage-action'?button:null;`);const start=ui.indexOf("    const action=$('#garage-action');",ui.indexOf('  function renderGarage('));h.run(ui.slice(start,ui.indexOf("    $('#stl-hub-back').onclick",start)));}
function snap(h){return h.json('({ended:S.ended,min:S.min,scrap:S.scrap,van:S.van,items:S.items,up:S.up,flags:S.flags})');}
module.exports={fixture,installRoad,installGarage,snap};
if(require.main===module){
for(const kind of ['radio','repair','upgrade','settlement-repair'])for(const mode of ['during','stale']){const h=fixture();kind==='radio'||kind==='repair'?installRoad(h,kind):installGarage(h,kind==='upgrade'?'upgrade':'repair');if(mode==='stale')h.run('G.advance(40);calls.length=0');const before=snap(h);h.run('button.onclick()');rows.push({kind,mode,before,after:snap(h),calls:h.json('calls')});}
const out=process.argv[2]||'terminal-tools-before.json';fs.writeFileSync(__dirname+'/'+out,JSON.stringify(rows,null,2),{flag:'wx'});console.log(JSON.stringify(rows,null,2));
}
