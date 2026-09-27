import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// Deterministic delivery export only. Artistic edits belong to image_gen.
const dir='assets/ui/vehicle-upgrades';
const records=JSON.parse(fs.readFileSync(`${dir}/prompts-v1.json`)).records;
const magick=(args)=>execFileSync('magick',args,{encoding:'utf8'}).trim();
for(const r of records){
  if(!fs.existsSync(r.sourceMaster)) throw new Error(`Missing source master: ${r.id}`);
  if(!['equipment','living'].includes(r.id)){
    magick([r.sourceMaster,'-trim','+repage','-resize','504x248','-gravity','center','-background','none','-extent','512x256','-quality','80',`${dir}/body-${r.id}-v1.webp`]);
    console.log(r.id,magick([r.sourceMaster,'-trim','-format','%wx%h%O','info:']));
    continue;
  }
  const [w,h]=magick(['identify','-format','%w %h',r.sourceMaster]).split(' ').map(Number);
  const cells=[],scratch=fs.mkdtempSync('/private/tmp/caravan-parts-');
  for(let i=0;i<12;i++){
    const x=Math.round(i%3*w/3),y=Math.round(Math.floor(i/3)*h/4);
    const cw=Math.round((i%3+1)*w/3)-x,ch=Math.round((Math.floor(i/3)+1)*h/4)-y;
    const cell=`${scratch}/${i}.png`;
    magick([r.sourceMaster,'-gravity','northwest','-crop',`${cw}x${ch}+${x}+${y}`,'+repage','-trim','+repage','-resize','120x120','-gravity','center','-background','none','-extent','128x128',cell]);
    cells.push(cell);
  }
  magick(['montage',...cells,'-tile','3x4','-geometry','128x128+0+0','-background','none','-quality','82',`${dir}/parts-${r.id}-v1.webp`]);
}
