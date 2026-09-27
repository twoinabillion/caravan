import assert from 'node:assert/strict';
import {inlineStyleAssets} from '../tools/inline-style-assets.mjs';
const input='<style>.a{background:url("__UI_SHELL__") center/100% 100% no-repeat}.b{background-image:url(__UI_SHELL__)}@font-face{src:url("__UI_DISPLAY_FONT__")}</style>';
const output=inlineStyleAssets(input,k=>'data:test;base64,'+k).result;
assert.equal(output.split('data:test;base64,SHELL').length-1,1);
assert.equal(output.split('var(--embedded-ui-shell)').length-1,2);
assert(output.includes('src:url("data:test;base64,DISPLAY_FONT")'));
assert(output.includes(' center/100% 100% no-repeat'));
console.log('PASS unchanged CSS shorthand, deduplicated image bytes and literal font-face URL');
