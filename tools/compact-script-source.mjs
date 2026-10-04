import {minifySync} from 'vite';

// Delivery-only formatting. No tree shaking, identifier renaming, constant
// folding, or source edits: save keys and runtime/debug function names survive.
export function compactScriptSource(source,filename){
  const result=minifySync(filename,source,{module:false,compress:false,mangle:false,codegen:{comments:false}});
  if(result.errors.length)throw new Error(`Script compaction failed (${filename}): ${result.errors.map(e=>e.message).join('; ')}`);
  return result.code;
}
