import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {compactStyleSource} from '../tools/compact-style-source.mjs';
test('only CSS comments and indentation change; quoted content and separators survive',()=>{
  const input=`<title>  text</title><style id="owner">\n  /* owner */\n  .a/**/ .b{content:"/* text */  ";background:url('x/* y */');}\n  .c\n    .d{color:red}\n</style><script>/* keep */</script>`;
  assert.equal(compactStyleSource(input),`<title>  text</title><style id="owner">\n\n.a .b{content:"/* text */  ";background:url('x/* y */');}\n.c\n.d{color:red}\n</style><script>/* keep */</script>`);
});
test('inline comments cannot turn compound selectors into descendants or merge tokens',()=>{
  assert.equal(compactStyleSource('<style>.a/*keep adjacency*/.b{font:se/*token*/rif}</style>'),'<style>.a/**/.b{font:se/**/rif}</style>');
});
test('escaped quote and multiline literal are preserved',()=>{
  const input=String.raw`<style>.a{content:"a\"/*keep*/";x:'one\
    two'}</style>`;
  assert.equal(compactStyleSource(input),input);
});
test('legacy scene alias resolves to the exact original placeholder',()=>{
  const ctx=vm.createContext({D:{}});
  vm.runInContext(fs.readFileSync('src/03g-scenes.js','utf8').split('D.sceneDescriptions =')[0],ctx);
  assert.equal(ctx.D.scenes['intro-resistance-begins'],ctx.D.scenes['intro-resistance-first-voices-v1']);
});
