/* Conservative inventory, NOT a deletion list. Saved sceneKeys/turn.scene are
   runtime inputs; absence from current source cannot prove historical non-use. */
const fs=require('node:fs');
const vm=require('node:vm');
const {STATIC_CONTENT_FILES}=require('./content-registry.cjs');
function audit(){
 const context=vm.createContext({console});
 for(const file of STATIC_CONTENT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context);
 const data=vm.runInContext('D',context);
 const source=fs.readdirSync('src').filter(file=>file!=='03g-scenes.js')
  .map(file=>fs.readFileSync('src/'+file,'utf8')).join('\n');
 const registry=fs.readFileSync('src/03g-scenes.js','utf8');
 const aliases=new Set([...registry.matchAll(/=\s*D\.scenes\[['"]([^'"]+)['"]\]/g)].map(match=>match[1]));
 const rows=Object.entries(data.scenes).filter(([key])=>!source.includes(key)).map(([key,value])=>{
  let file=value;
  if(/^__SCENE_/.test(value))file='assets/scenes/'+value.slice(8,-2).toLowerCase().replaceAll('_','-')+'.jpg';
  const webp=file.replace(/\.(jpg|png)$/i,'.webp');
  if(fs.existsSync(webp))file=webp;
  return {key,file,bytes:fs.existsSync(file)?fs.statSync(file).size:null,
   status:aliases.has(key)?'used-by-alias':'no-current-literal-reference; retain-for-saved-scene-review'};
 });
 return {registered:Object.keys(data.scenes).length,literalReferenceAbsent:rows.length,
  warning:'Conservative source scan, not reachability proof. Never auto-delete these entries. Persisted sceneKeys and turn.scene can reference them.',rows};
}
module.exports={audit};
if(require.main===module)console.log(JSON.stringify(audit(),null,2));
