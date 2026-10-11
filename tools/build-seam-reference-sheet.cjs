// Read-only QA/reference sheet: exact canonical pixels, no art retouching.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'tools/design-drafts/scenery-seam-hd');
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  await sharp({create:{width:1024,height:1152,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([
      {input:path.join(root,'assets/ui/road-environment/miryang-v1.webp'),left:0,top:0},
      {input:path.join(root,'assets/ui/road-environment/daegu-v1.webp'),left:0,top:576}
    ]).png().toFile(path.join(dir, 'canonical-endpoints.png'));
  // Native-pixel edge QA/template, never delivered as terrain. The transparent
  // middle is the missing connector, not a sky/background edit to either city.
  const left=await sharp(path.join(root,'assets/ui/road-environment/miryang-v1.webp'))
    .extract({left:960,top:0,width:64,height:576}).png().toBuffer();
  const right=await sharp(path.join(root,'assets/ui/road-environment/daegu-v1.webp'))
    .extract({left:0,top:0,width:64,height:576}).png().toBuffer();
  await sharp({create:{width:1024,height:576,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:left,left:0,top:0},{input:right,left:960,top:0}])
    .png().toFile(path.join(dir,'edge-template.png'));
  console.log('Exact-pixel reference sheet: top Miryang, bottom Daegu; not a game asset.');
})().catch(error => { console.error(error); process.exitCode=1; });
