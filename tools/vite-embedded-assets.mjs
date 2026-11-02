import {createHash} from 'node:crypto';

// Keep opaque base64 outside Vite's HTML parser; restore the authored tags after
// bundling. The slot is itself inert, so normal module scripts still bundle.
const prefix='caravan-vite-slot-';
export function parkEmbeddedAssets(html){
 if(html.includes(prefix))throw Error('Embedded asset slot namespace is reserved');
 const blocks=[],slots=[],ids=new Set();
 const parked=html.replace(/<script type="application\/octet-stream" id="(caravan-asset-\d+)">([^<]*)<\/script>/g,(block,id)=>{
  if(ids.has(id))throw Error('Duplicate embedded asset id: '+id);
  ids.add(id);
  const digest=createHash('sha256').update(block).digest('hex');
  const slot=`<script type="application/octet-stream" id="${prefix}${blocks.length}">${digest}</script>`;
  blocks.push(block);slots.push(slot);return slot;
 });
 return {html:parked,blocks,slots};
}
export function restoreEmbeddedAssets(html,{blocks,slots}){
 let previous=-1;
 for(const slot of slots){
  const at=html.indexOf(slot);
  if(at<0||html.indexOf(slot,at+slot.length)>=0)throw Error('Missing or duplicate embedded asset slot');
  if(at<=previous)throw Error('Embedded asset slot order changed');
  previous=at;
 }
 const bySlot=new Map(slots.map((slot,i)=>[slot,blocks[i]]));
 const restored=html.replace(/<script type="application\/octet-stream" id="caravan-vite-slot-\d+">[^<]*<\/script>/g,slot=>{
  if(!bySlot.has(slot))throw Error('Unknown embedded asset slot');
  return bySlot.get(slot);
 });
 if(restored.includes(prefix))throw Error('Unrestored embedded asset slot');
 return restored;
}
