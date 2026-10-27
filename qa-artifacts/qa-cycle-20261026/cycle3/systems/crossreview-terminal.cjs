// Actual production callbacks; explicit terminal fixtures, no browser.
const fs=require('node:fs'),{fixture,installRoad}=require('../../cycle2/systems/terminal-tools-audit.cjs');
const ui=fs.readFileSync('src/07-ui.js','utf8');
const snap=h=>h.json('({ended:S.ended,day:S.day,min:S.min,scrap:S.scrap,fuel:S.fuel,food:S.food,water:S.water,items:S.items,sold:S._soldDemand})');
function market(h,kind){h.run(`globalThis.rows=[{key:'qa',kind:'${kind}',enabled:true,index:0,label:'연료'}];globalThis.marketSelection=rows[0];globalThis.curStl='miryang';globalThis.button={};globalThis.$=q=>q==='#market-action'?button:null;globalThis.toast=()=>calls.push('toast');globalThis.ICO=x=>x;globalThis.showStl=()=>calls.push('market');`);const start=ui.indexOf("    const action=$('#market-action');");h.run(ui.slice(start,ui.indexOf("    $('#stl-hub-back').onclick",start)));}
function marketFixture(kind){const h=fixture();h.run("S.fuel=10;S.food=6;S.items['부품']=5;S.items['의약품']=2;");market(h,kind);return h;}
module.exports={market,marketFixture,snap};
if(require.main===module){const rows=[];const h=fixture();installRoad(h,'explore');const status=h.json('G.exploreStatus()');h.run('button.onclick()');rows.push({kind:'road-explore',fixture:'fatal time at23:50, water0/thirst3',status,ended:h.run('S.ended'),calls:h.json('calls')});
for(const kind of ['trade','bundle','sell']){const h=marketFixture(kind);h.run('G.advance(40);calls.length=0');const before=snap(h),archive=h.store.get('seoul400_quality_archive_v1');h.run('button.onclick()');rows.push({kind:'market-'+kind,fixture:'captured callback after another actual G.advance ended the journey; actual demand medicine supplied',before,after:snap(h),calls:h.json('calls'),archiveChanged:archive!==h.store.get('seoul400_quality_archive_v1')});}
fs.writeFileSync(__dirname+'/'+(process.argv[2]||'crossreview-terminal02.json'),JSON.stringify(rows,null,2),{flag:'wx'});console.log(JSON.stringify(rows));}
