import fs from 'node:fs';
import path from 'node:path';
import {runtimeAtlas} from './runtime-landscape-atlas.mjs';
const root=path.resolve(import.meta.dirname,'..'),atlas=runtimeAtlas(root);
fs.writeFileSync(path.join(root,'assets/ui/road-environment/atlas-v2.json'),JSON.stringify(atlas,null,2)+'\n');
console.log(`Runtime terrain: ${atlas.routes.length} routes / ${Object.keys(atlas.cities).length} fixed places`);
