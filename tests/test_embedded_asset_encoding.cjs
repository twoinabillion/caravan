const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
test('delivery encoding is byte-identical for all tail lengths and native browser decoder',async()=>{
 const {packBytes,unpackBytes,encodeEmbeddedAssets}=await import('../tools/encode-embedded-assets.mjs');
 for(let n=0;n<513;n++){const bytes=Buffer.from(Array.from({length:n},(_,i)=>(i*193+n)%256));assert.deepEqual(Buffer.from(unpackBytes(packBytes(bytes),n)),bytes);}
 const bytes=Buffer.from(Array.from({length:130001},(_,i)=>i%256));const uri='data:image/webp;base64,'+bytes.toString('base64');
 const html='<style>/* preserved */</style><script>\'use strict\';const 한='+JSON.stringify(uri)+';globalThis.result=한;</script><script type="module">export {};</script>';
 const encoded=encodeEmbeddedAssets(html);const context={Uint8Array,btoa:v=>Buffer.from(v,'binary').toString('base64')};
 vm.runInNewContext(encoded.html.slice(encoded.html.indexOf('<script>')+8,encoded.html.indexOf('</script>')),context);
 assert.equal(context.result,uri);assert(encoded.savedBytes>500);assert(encoded.html.endsWith('<script type="module">export {};</script>'));
});
