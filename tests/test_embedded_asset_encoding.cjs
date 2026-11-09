const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const deliveryCases=()=>[1020,1021,1022,1023,1024,1025,8191,8192,8193,130000,130001,130002,130003]
 .map(n=>'data:image/webp;base64,'+Buffer.from(Array.from({length:n},(_,i)=>(i*193+n)%256)).toString('base64'));
async function runDeliveryCases(context){
 const {encodeEmbeddedAssets}=await import('../tools/encode-embedded-assets.mjs');
 const uris=deliveryCases();
 const result=encodeEmbeddedAssets('<script>"use strict";globalThis.results='+JSON.stringify(uris)+';globalThis.strictThis=(function(){return this;})();</script>');
 vm.runInNewContext(result.html.slice(result.html.indexOf('<script>')+8,result.html.indexOf('</script>')),context);
 assert.deepEqual(Array.from(context.results),uris);
 assert.equal(context.strictThis,undefined);
}
test('available byte Base64 method bypasses legacy btoa without changing URI bytes',async()=>{
 // A controlled capability boundary also exercises this branch on older Node.
 class AvailableBytes extends Uint8Array{toBase64(){return Buffer.from(this).toString('base64');}}
 await runDeliveryCases({Uint8Array:AvailableBytes,btoa(){throw Error('legacy btoa must not run when byte Base64 is available');}});
});
test('native byte Base64 preserves URI bytes and padding for every tail and large payload',{
 skip:typeof Uint8Array.prototype.toBase64!=='function'
},async()=>{
 await runDeliveryCases({Uint8Array,btoa(){throw Error('native byte Base64 must bypass legacy btoa');}});
});
test('missing byte Base64 keeps the legacy decoder byte-identical across tails and chunk boundaries',async()=>{
 class LegacyBytes extends Uint8Array{}
 Object.defineProperty(LegacyBytes.prototype,'toBase64',{value:undefined});
 await runDeliveryCases({Uint8Array:LegacyBytes,btoa:v=>Buffer.from(v,'binary').toString('base64')});
});
test('delivery encoding is byte-identical for all tail lengths and native browser decoder',async()=>{
 const {packBytes,unpackBytes,encodeEmbeddedAssets}=await import('../tools/encode-embedded-assets.mjs');
 for(let n=0;n<513;n++){const bytes=Buffer.from(Array.from({length:n},(_,i)=>(i*193+n)%256));assert.deepEqual(Buffer.from(unpackBytes(packBytes(bytes),n)),bytes);}
 const bytes=Buffer.from(Array.from({length:130001},(_,i)=>i%256));const uri='data:image/webp;base64,'+bytes.toString('base64');
 const html='<style>/* preserved */</style><script>\'use strict\';const 한='+JSON.stringify(uri)+';globalThis.result=한;</script><script type="module">export {};</script>';
 const encoded=encodeEmbeddedAssets(html);const context={Uint8Array,btoa:v=>Buffer.from(v,'binary').toString('base64')};
 vm.runInNewContext(encoded.html.slice(encoded.html.indexOf('<script>')+8,encoded.html.indexOf('</script>')),context);
 assert.equal(context.result,uri);assert(encoded.savedBytes>500);assert(encoded.html.endsWith('<script type="module">export {};</script>'));
});
test('inert asset storage keeps bytes and strict script order while removing consumed blocks',async()=>{
 const {encodeEmbeddedAssets}=await import('../tools/encode-embedded-assets.mjs');
 const uri='data:image/png;base64,'+Buffer.alloc(5000,173).toString('base64');
 const source='<p>before</p><script>"use strict";globalThis.result='+JSON.stringify(uri)+';</script><script type="module">export {};</script>';
 const result=encodeEmbeddedAssets(source,{storage:'inert'});
 assert.match(result.html,/<script type="application\/octet-stream"/);
 const blocks=new Map([...result.html.matchAll(/id="(caravan-asset-\d+)">([^<]*)<\/script>/g)].map(m=>[m[1],m[2]]));
 const context={Uint8Array,btoa:v=>Buffer.from(v,'binary').toString('base64'),document:{getElementById:id=>blocks.has(id)?{textContent:blocks.get(id),remove(){blocks.delete(id);}}:null}};
 const start=result.html.indexOf('<script>')+8,end=result.html.indexOf('</script>',start);
 assert(!result.html.slice(start,end).includes(uri.slice(30,500)));
 vm.runInNewContext(result.html.slice(start,end),context);assert.equal(context.result,uri);assert.equal(blocks.size,0);
 assert(result.html.endsWith('<script type="module">export {};</script>'));
});
