// Circular seam overlap for the two selected cab takes; no EQ or extra bass.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const sourceDir='assets/audio/auditions/elevenlabs-rain-detail-v2-20261010T162119Z';
const targetDir='assets/audio/auditions/rain-cab-v2';
mkdirSync(resolve(root,targetDir),{recursive:true});
const clips=[];
for(const weight of ['light','heavy']){
  const input=resolve(root,sourceDir,`rain_glass_${weight}.mp3`);
  const pcm=execFileSync('ffmpeg',['-nostdin','-v','error','-i',input,'-ar','44100','-ac','1','-f','f32le','-'],{maxBuffer:8_000_000});
  const count=pcm.length/4, overlap=Math.round(.25*44100);
  const output=Buffer.alloc((count-overlap)*4);
  for(let i=0;i<count-overlap;i++){
    const phase=(i+.5)/overlap*Math.PI/2;
    const value=i<overlap
      ?pcm.readFloatLE((count-overlap+i)*4)*Math.cos(phase)+pcm.readFloatLE(i*4)*Math.sin(phase)
      :pcm.readFloatLE(i*4);
    output.writeFloatLE(value,i*4);
  }
  const name=`rain_cab_${weight}_v2`,file=name+'.mp3';
  const duration=(count-overlap)/44100;
  execFileSync('ffmpeg',['-nostdin','-v','error','-y','-f','f32le','-ar','44100','-ac','1','-i','-',
    // MP3 edge reconstruction is not circular even when the source PCM is.
    // Eight-millisecond edge tapers suppress codec-boundary clicks; this is
    // still a listening candidate, not a guarantee of imperceptible repeats.
    '-af',`loudnorm=I=-24:TP=-4:LRA=11,volume=-0.5dB,aresample=44100,afade=t=in:d=0.008,afade=t=out:st=${duration-.008}:d=0.008`,
    '-ar','44100','-ac','1','-codec:a','libmp3lame','-b:a','96k',resolve(root,targetDir,file)],{input:output});
  clips.push({name,file,parent:`${sourceDir}/rain_glass_${weight}.mp3`,
    parent_sha256:createHash('sha256').update(readFileSync(input)).digest('hex'),
    sha256:createHash('sha256').update(readFileSync(resolve(root,targetDir,file))).digest('hex'),
    duration:Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',resolve(root,targetDir,file)])),
    loop:true,description:'선명한 유리·지붕 빗방울 테이크. 250ms 원형 equal-power 경계 겹침·MP3 가장자리 8ms taper, -24LUFS 목표·-4dBTP 상한·추가 -0.5dB. EQ 없음. 실제 반복 청취 승인 대기.'});
}
writeFileSync(resolve(root,targetDir,'manifest.json'),JSON.stringify({provider:'ElevenLabs · Free / local sound edit',
  commercial_release:false,listening_review:'pending',kind:'processed',clips},null,2)+'\n');
console.log(`Circular rain deliveries: ${clips.length}`);
