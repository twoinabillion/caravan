/* Runs renderer/build behavior without a browser or real asset generation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test}=require('node:test');
const repository=process.cwd();
const sourceRoot=process.env.CARAVAN_SOURCE_ROOT?path.resolve(process.env.CARAVAN_SOURCE_ROOT):repository;
const read=relative=>fs.readFileSync(path.join(sourceRoot,relative),'utf8');
const dataSource=fs.readFileSync(path.join(repository,'src/03-data.js'),'utf8');
const sceneSource=read('src/03g-scenes.js'),uiSource=read('src/07-ui.js'),builderSource=read('tools/build-html.mjs');
const upgradeIds=['tank1','tank2','bench','cabin','susp','armor','garden','collector','solar','antenna','winch','bullbar','snorkel','mudtires','lightbar','awning','stove','sidebox','beehive','garden2','kitchen','bunk','jumpseat','fridge','armory','scope','horn','curtain'];
const destinationIds=['gimhae','yangsan','jinju','hapcheon','geochang','gumi','gimcheon','namwon','yeongdong','nonsan','gongju','cheongju','cheonan','pyeongtaek','lake','mall','tower','spring','airfield','solar','reststop','tunnelbook','ulsan','yeosu','suncheon','damyang','mokpo','andong','mungyeong','danyang','wonju','daegwallyeong','gangneung','sokcho','icheon','gyeongju','pohang','sangju','gunsan','chungju','sejong','lighthouse','drivein','sunflower','maehwa','mingyu_ridge','jaeyi_cache','cablecar','filmset'];

function loadData(){
  const context=vm.createContext({});
  vm.runInContext(dataSource+'\nglobalThis.data=D;',context);
  vm.runInContext(sceneSource,context);
  return context.data;
}
function loadHelper(name,context){
  const start=uiSource.indexOf('  function '+name+'('),end=uiSource.indexOf('\n  function ',start+4);
  assert(start>=0&&end>start,'real UI helper exists: '+name);
  vm.runInContext(uiSource.slice(start,end),context);
  return context[name];
}
function renderInstallation(data,id){
  let markup='';
  const button={focus(){}};
  const layer={querySelectorAll(){return []},querySelector(){return button}};
  const context=vm.createContext({
    D:data,S:{up:{},fuelMax:80,vanMax:125},G:{vanStage:()=>({cm:40,nm:'extended'}),seatCapacity:()=>2,hasComp:()=>false},
    AMBI:{play(){}},document:{activeElement:null},requestAnimationFrame(){},esc:value=>String(value??''),
    $:()=>({appendChild(){}}),el:(_tag,_class,html)=>{markup=html;return layer;}
  });
  const render=loadHelper('playUpgradeInstall',context);
  render(data.upgrades.find(row=>row.id===id)||{id,nm:'legacy',d:'legacy upgrade'},
    {up:{},stage:{cm:0,nm:'original'},capacity:1,fuelMax:55,vanMax:100});
  return markup.match(/class="upgrade-install-art"[^>]*background-image:url\('([^']+)'\)/)?.[1]||'';
}

test('every registered installation renders its own image instead of a shared group scene',()=>{
  const data=loadData();
  assert.deepEqual(Array.from(data.upgrades,row=>row.id).sort(),upgradeIds.slice().sort());
  assert.deepEqual(Object.keys(data.upgradeItemArt||{}).sort(),upgradeIds.slice().sort());
  const rendered=upgradeIds.map(id=>renderInstallation(data,id));
  assert.equal(new Set(rendered).size,28);
  for(const id of upgradeIds)assert.equal(renderInstallation(data,id),`__UPGRADE_ITEM_${id.toUpperCase()}__`,id);
});

test('small fuel tank, large tank, and snorkel show three different physical upgrades',()=>{
  const data=loadData();
  assert.deepEqual(['tank1','tank2','snorkel'].map(id=>renderInstallation(data,id)),
    ['__UPGRADE_ITEM_TANK1__','__UPGRADE_ITEM_TANK2__','__UPGRADE_ITEM_SNORKEL__']);
});

test('only an unknown legacy upgrade can fall back to group art',()=>{
  const data=loadData();
  data.upgradeItemArt={...data.upgradeItemArt,tank1:''};
  assert.equal(renderInstallation(data,'tank1'),'','known item missing art must not show another part');
  assert.equal(renderInstallation(data,'legacy_tank'),'__UPGRADE_FUEL__');
});

test('all portrait destinations have distinct horizontal previews without replacing arrival scene keys',()=>{
  const data=loadData(),lookup=loadHelper('routeThumbnail',vm.createContext({D:data}));
  assert.deepEqual(Object.keys(data.nodePreviewScenes||{}).sort(),destinationIds.slice().sort());
  assert.equal(new Set(destinationIds.map(id=>lookup(id))).size,49);
  for(const id of destinationIds){
    assert.equal(lookup(id),`assets/scenes/destination-${id}-v1.webp`,id);
    assert(data.nodeScenes[id].startsWith('arrival-'),id+' keeps its original arrival scene');
  }
  assert.equal(data.arrivalScenes.daegu,'arrival-daegu-dome');
});

test('route thumbnails prefer dedicated preview, then retain node, scenery, and generic fallbacks',()=>{
  const data={nodePreviewScenes:{cablecar:'wide-cablecar.webp',miryang:''},
    nodeScenes:{cablecar:'arrival-cablecar',miryang:'miryang-market'},nodeScenery:{remote:'port'},
    scenes:{'arrival-cablecar':'portrait.webp','miryang-market':'market.webp','busan-departure':'port.webp','generic-discovery':'generic.webp'}};
  const lookup=loadHelper('routeThumbnail',vm.createContext({D:data}));
  assert.equal(lookup('cablecar'),'wide-cablecar.webp');
  assert.equal(lookup('miryang'),'market.webp');
  assert.equal(lookup('remote'),'port.webp');
  assert.equal(lookup('unlisted'),'generic.webp');
  delete data.nodePreviewScenes;
  assert.equal(lookup('cablecar'),'portrait.webp','legacy data without the new table stays usable');
});

test('builder embeds item WebP, legacy JPEG, and direct destination paths with correct MIME',()=>{
  const start=builderSource.indexOf('const upgradeScenes ='),end=builderSource.indexOf('const uiAssetPaths =');
  const inlineStart=builderSource.indexOf('const inlineSceneAssetPaths='),inlineEnd=builderSource.indexOf('const title =',inlineStart);
  assert(start>=0&&end>start&&inlineStart>=0&&inlineEnd>inlineStart);
  const context=vm.createContext({path,Buffer,root:'/fixture',embeddedAssets:new Map(),
    fs:{existsSync:()=>true,readFileSync:absolute=>Buffer.from(absolute)},
    scenes:{result:sceneSource}
  });
  vm.runInContext(builderSource.slice(start,end),context);
  vm.runInContext(builderSource.slice(inlineStart,inlineEnd)+'\nglobalThis.output=upgrades.result;',context);
  const result=vm.createContext({});
  vm.runInContext(dataSource+'\n'+context.output+'\nglobalThis.values=D;',result);
  for(const id of upgradeIds)assert.equal(result.values.upgradeItemArt[id],
    'data:image/webp;base64,'+Buffer.from(`/fixture/assets/upgrades/upgrade-${id}-v1.webp`).toString('base64'),id);
  assert.equal(result.values.upgradeArt.fuel,'data:image/jpeg;base64,'+Buffer.from('/fixture/assets/upgrades/fuel.jpg').toString('base64'));
  for(const id of destinationIds)assert.equal(result.values.nodePreviewScenes[id],
    'data:image/webp;base64,'+Buffer.from(`/fixture/assets/scenes/destination-${id}-v1.webp`).toString('base64'),id);
});
