const path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
// Historical manifests retain their original bytes; read evidence from this checkout.
module.exports=source=>{const prefix=['qa-artifacts/','assets/','src/'].find(p=>source.includes(p));assert(prefix,'expected repository evidence path');return path.join(root,source.slice(source.indexOf(prefix)));};
