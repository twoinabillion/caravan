const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
test('identical assets share encoded bytes without changing script values or HTML/CSS',async()=>{
  const {poolEmbeddedAssets}=await import('../tools/pool-embedded-assets.mjs');
  const asset='data:image/webp;base64,'+'A'.repeat(1024);
  const prefix=`<style>.a{background:url('${asset}')}</style><img src="${asset}">`;
  const source=`'use strict';const a='${asset}',b="${asset}",c=\`${asset}\`;const 한=\`<img src="${asset}">\`;globalThis.result=[a,b,c,a===b,한];`;
  const html=prefix+'<script>'+source+'</script>';
  const pooled=poolEmbeddedAssets(html);
  assert.equal(pooled.pooled,1);assert(pooled.savedBytes>1800);
  assert(pooled.html.startsWith(prefix));
  const run=code=>{const c={};vm.runInNewContext(code,c);return JSON.stringify(c.result);};
  assert.equal(run(pooled.html.slice(prefix.length+8,-9)),run(source));
  assert.match(pooled.html,/<script>'use strict';\nconst CARAVAN_EMBEDDED=/);
});
test('single-use or small literals stay untouched',async()=>{
  const {poolEmbeddedAssets}=await import('../tools/pool-embedded-assets.mjs');
  const html='<script>const a="data:image/png;base64,AAA",b="data:image/png;base64,AAA";</script>';
  assert.equal(poolEmbeddedAssets(html).html,html);
});
