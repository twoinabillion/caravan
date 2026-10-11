// Decode the entire catalogue; optional GET/byte verification against active origins.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(readFileSync(resolve(root,'tools/audio-auditions/manifest.json')));
const args=process.argv.slice(2);
function origin(flag){const i=args.indexOf(flag);if(i<0)return null;const url=new URL(args[i+1]);
  if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/')throw new Error('Local origin only');return url.origin;}
const studio=origin('--studio'),preview=origin('--preview');
const sha=data=>createHash('sha256').update(data).digest('hex');
const rows=[];
for(const clip of manifest.clips){
  const file=resolve(root,clip.file);
  const result=spawnSync('ffmpeg',['-nostdin','-hide_banner','-i',file,'-af','volumedetect','-f','null','-'],{encoding:'utf8'});
  if(result.status!==0)throw new Error('Audio decode failed: '+clip.file);
  const mean=Number(result.stderr.match(/mean_volume: ([\d.-]+)/)?.[1]);
  const peak=Number(result.stderr.match(/max_volume: ([\d.-]+)/)?.[1]);
  if(!Number.isFinite(mean)||!Number.isFinite(peak)||peak>0)throw new Error('Invalid level: '+clip.file);
  rows.push({id:clip.id,file:clip.file,sha256:sha(readFileSync(file)),decoded:true,mean_dbfs:mean,peak_dbfs:peak});
}
// Low-cost relative spectrum and boundary checks on rain revisions only.
for(const name of ['light','heavy']){
  const files=[`assets/audio/auditions/elevenlabs-world-details-v1-20261010T152806Z/rain_cab_${name}.mp3`,
    `assets/audio/auditions/rain-cab-v2/rain_cab_${name}_v2.mp3`];
  for(const file of files){
    const pcm=execFileSync('ffmpeg',['-nostdin','-v','error','-i',resolve(root,file),'-ar','44100','-ac','1','-f','f32le','-'],{maxBuffer:8_000_000});
    const n=pcm.length/4;let power=0,peak=0,head=0,tail=0;const window=4410;
    for(let i=0;i<n;i++){const x=pcm.readFloatLE(i*4);power+=x*x;peak=Math.max(peak,Math.abs(x));if(i<window)head+=x*x;if(i>=n-window)tail+=x*x;}
    const high=execFileSync('ffmpeg',['-nostdin','-v','error','-i',resolve(root,file),'-af','highpass=f=2500','-ar','44100','-ac','1','-f','f32le','-'],{maxBuffer:8_000_000});
    let highPower=0;for(let i=0;i<high.length;i+=4)highPower+=high.readFloatLE(i)**2;
    rows.find(row=>row.file===file).rainMetrics={rms_dbfs:10*Math.log10(power/n),peak_dbfs:20*Math.log10(peak),
      high_2500_relative_db:10*Math.log10(highPower/power),
      head_tail_100ms_db:10*Math.log10(head/tail),
      decoded_wrap_delta:Math.abs(pcm.readFloatLE(0)-pcm.readFloatLE((n-1)*4))};
  }
}
if(studio||preview)for(let start=0;start<rows.length;start+=8)await Promise.all(rows.slice(start,start+8).map(async row=>{
  for(const [label,url] of [['studio',studio&&studio+'/game/'+row.file],['preview',preview&&preview+'/__live/asset/'+encodeURIComponent(row.file.replace(/^assets\//,''))]]){
    if(!url)continue;const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
    const mime=response.headers.get('content-type')||'';
    // The running live server predates the MP3 MIME fix. Keep its byte verification
    // truthful without restarting the user's active server/save merely for a header.
    if(!response.ok||!(mime.includes('audio')||(label==='preview'&&mime==='application/octet-stream')))throw new Error(`${label} audio unavailable: ${row.file}`);
    const bytes=Buffer.from(await response.arrayBuffer());if(sha(bytes)!==row.sha256)throw new Error(`${label} byte mismatch: ${row.file}`);
    row[label+'_byte_match']=true;
    row[label+'_mime']=mime;
  }
}));
mkdirSync(resolve(root,'reports'),{recursive:true});
writeFileSync(resolve(root,'reports/audio-refinement-v2.json'),JSON.stringify({captured_at:new Date().toISOString(),
  studio,preview,clips:rows.length,listening_review:'pending',note:'Decode/spectrum/GET checks, not subjective listening or gameplay synchronization.',rows},null,2)+'\n');
console.log(`Audio decode/hosting checks: ${rows.length}/${rows.length}; listening review still pending.`);
