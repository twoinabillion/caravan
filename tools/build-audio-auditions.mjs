// Studio-only listening catalogue. Does not change or package gameplay audio.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
const root = resolve(import.meta.dirname, '..');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const labels = {
  rain_cab_light:['날씨','차 안 · 가벼운 비'], rain_cab_heavy:['날씨','차 안 · 거센 비'],
  rain_outdoor_light:['날씨','바깥 · 가벼운 비'], rain_outdoor_heavy:['날씨','바깥 · 거센 비'],
  rain_shelter:['날씨','처마 아래 빗소리'], wipers:['차량','와이퍼'],
  wind_gentle:['날씨','잔잔한 바람'], wind_storm:['날씨','폭풍 바람'],
  forest_day:['자연','낮의 숲'], night_insects:['자연','밤벌레'], camp_fire:['자연','모닥불'],
  river:['자연','흐르는 강'], tunnel:['장소','터널 울림'], thunder_distant:['날씨','먼 천둥'],
  steps_gravel:['행동','자갈길 발걸음'], steps_wood:['행동','나무 바닥 발걸음'], steps_metal:['행동','금속 계단 발걸음'],
  door_latch:['행동','문 걸쇠'], cloth:['행동','옷감 스침'], water_pour:['행동','물 따르기'],
  bottle:['행동','물병 뚜껑'], meal:['행동','식사 준비'], stove:['행동','버너 점화'],
  repair_ratchet:['행동','래칫으로 수리'], repair_hammer:['행동','망치질'], coins:['행동','동전'],
  notebook:['행동','수첩 넘기기'], switch:['행동','스위치'], cassette:['행동','카세트'], dog_breath:['자연','강아지 숨소리'],
  tool_sorting:['인트로','공구 정리'], paper_fold:['인트로','서류 접기'], cup_set_down:['인트로','컵 내려놓기'],
  radio_tuning:['인트로','라디오 주파수 맞추기'], generator_shutdown:['인트로','발전기 정지'], bag_packing:['인트로','가방 챙기기'],
  sfx_van_start:['차량','달구지 시동'], sfx_van_idle_loop:['차량','달구지 공회전'],
  sfx_drive_asphalt_loop:['차량','아스팔트 주행'], sfx_drive_gravel_loop:['차량','자갈길 주행'],
  sfx_stop_brake:['차량','정차 · 브레이크'], sfx_cargo_depart:['차량','짐 싣고 출발'],
  sfx_rain_wiper_loop:['날씨','기존 비 · 와이퍼'], sfx_door_printer:['시스템','문 · 프린터'],
  sfx_lab_room_loop:['장소','연구실'], sfx_presentation_cut:['시스템','프레젠테이션 전환'],
  sfx_core_loop:['장소','코어 내부'], sfx_core_key_insert:['시스템','코어 열쇠 삽입'],
  sfx_market_loop:['장소','시장'], sfx_garage_loop:['장소','정비소'], sfx_van_extension:['차량','달구지 확장'],
  sfx_camp_loop:['장소','캠프'], sfx_port_arrival_loop:['장소','항구 도착'], sfx_radio_static:['시스템','라디오 잡음'],
  sfx_checkpoint:['시스템','검문소'], sfx_fuel_pump:['행동','주유'], sfx_drone_real:['시스템','드론'],
  sfx_walker_real:['시스템','워커'], sfx_radio_400_after:['시스템','400km 이후 라디오'],
  title:['음악','타이틀'], drive_day:['음악','낮의 주행'], drive_night:['음악','밤의 주행'],
  tension:['음악','긴장'], settlement:['음악','정착지'], camp:['음악','캠프'], story:['음악','이야기'],
  rain_cab_light_clear:['날씨','차 안 · 가벼운 비 · 첫 수정 후보'],
  rain_cab_heavy_clear:['날씨','차 안 · 거센 비 · 첫 수정 후보'],
  rain_glass_light:['날씨','유리·지붕 · 가벼운 비 원본'], rain_glass_heavy:['날씨','유리·지붕 · 거센 비 원본'],
  rain_cab_light_v2:['날씨','차 안 · 가벼운 비 · 선명한 v2'], rain_cab_heavy_v2:['날씨','차 안 · 거센 비 · 선명한 v2'],
};
const registry = readFileSync(resolve(root,'src/03h-audio.js'),'utf8');
const D={bgm:{},vo:{}}; runInNewContext(registry,{D});
const activeFiles=new Set(Object.values(D.detailSfx).map(file=>'assets/'+file));
// Registration alone is not a physical/action trigger.
const reserved=new Set(['camp_fire','steps_metal','bottle','stove','repair_hammer','coins','cassette','dog_breath','generator_shutdown']);
const clips = [];
for (const dir of readdirSync(resolve(root,'assets/audio/auditions')).sort()) {
  const base = `assets/audio/auditions/${dir}`;
  if(!existsSync(resolve(root,base,'manifest.json'))||dir==='runtime-synth-v2') continue;
  const batch=read(`${base}/manifest.json`);
  for (const clip of batch.clips) {
    const take=clip.name.match(/^(.*)_([bc])$/);
    const [category, label] = labels[clip.name]||(take&&labels[take[1]])||[];
    if(!category) throw new Error('Missing audio label: '+clip.name);
    const name=take?`${label} · 테이크 ${take[2].toUpperCase()}`:
      ['rain_cab_light','rain_cab_heavy'].includes(clip.name)?`${label} · 이전 버전`:label;
    const file=`${base}/${clip.file}`;
    clips.push({ id:`detail_${clip.name}`, name, category, file:`${base}/${clip.file}`,
      duration:Number(clip.duration||clip.probe?.format.duration), loop:Boolean(clip.loop??clip.request?.loop),
      status:activeFiles.has(file)&&!reserved.has(clip.name)?'preview':'candidate', provider:batch.provider,
      rights:'로컬 비상업 시청용 · 상업 출시 불가', description:clip.description||clip.prompt });
  }
}
const synthDir='assets/audio/auditions/runtime-synth-v2';
const audioSource=readFileSync(resolve(root,'src/07e-ui-audio.js'),'utf8');
const synthSource=audioSource.slice(audioSource.indexOf('const SND ='),audioSource.indexOf('/* ═══════════════════ BGM '));
const synth=read(`${synthDir}/manifest.json`);
if(synth.source_sha256!==createHash('sha256').update(synthSource).digest('hex'))
  throw new Error('Synth references are stale. Run python3 tools/render-synth-auditions.py');
const synthLabels={warning:'경고',scan:'스캔',drone:'드론 위협',walker:'워커 발소리',heartbeat:'심장 박동',
  rifle:'소총',crossbow:'석궁',metal:'금속·공구',fire:'화염',hit:'피격·충격',alarm:'경보',hack:'해킹',
  engine:'탈출 가속',cover:'숨기·엄폐',confirm:'결정 확인',success:'성공',partial:'부분 성공',failure:'실패',exit:'나가기',select:'선택'};
for(const clip of synth.clips) clips.push({id:`synth_${clip.name}`,name:`${synthLabels[clip.name]} · 합성음`,
  category:'전투·UI',file:`${synthDir}/${clip.file}`,duration:clip.duration,loop:false,status:'registered',
  provider:'실제 게임 WebAudio 코드',rights:'프로젝트 합성음 · 외부 생성 API 미사용',
  description:`SND.combat('${clip.name}')의 실제 그래프를 오프라인 렌더링한 청취 참조입니다. 게임은 이 MP3 대신 같은 합성 코드를 실행합니다. 기본 effects=1, master=-3dB. 청취 음량은 게임 믹스와 다릅니다.`});
const sfx = [...registry.split('D.sfx = {')[1].split('};')[0].matchAll(/(sfx_\w+):/g)].map(match=>match[1]);
function existing(id, file, loop, category, name) {
  if (!existsSync(resolve(root,file))) throw new Error(`Missing ${file}`);
  const duration = Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',resolve(root,file)],{encoding:'utf8'}).trim());
  clips.push({id,name,category,file,duration,loop,status:'registered',provider:'기존 프로젝트 음원',
    rights:'출시 전 원본 권리 기록 확인',description:`게임 오디오 레지스트리에 등록된 ${id}. 이곳에서는 원본 클립을 단독 재생합니다.`});
}
for (const id of sfx) existing(id,`assets/audio/sfx/${id}.mp3`,id.endsWith('_loop'),...labels[id]);
for (const id of ['title','drive_day','drive_night','tension','settlement','camp','story'])
  existing(`bgm_${id}`,id==='title'?'assets/audio/title.mp3':`assets/audio/bgm/${id}.mp3`,true,...labels[id]);
for (let index=1;index<=15;index++) {
  const id=`cheollian_core_${String(index).padStart(2,'0')}`;
  existing(id,`assets/audio/voice/${id}.mp3`,false,'목소리',`천리안 코어 · ${String(index).padStart(2,'0')}`);
}
for (const clip of clips) if (!existsSync(resolve(root,clip.file)) || !Number.isFinite(clip.duration)) throw new Error(`Invalid clip: ${clip.id}`);
mkdirSync(resolve(root,'tools/audio-auditions'),{recursive:true});
writeFileSync(resolve(root,'tools/audio-auditions/manifest.json'),JSON.stringify({version:1,project:'서울까지 400km',
  note:'원본 단독 청취입니다. 게임의 믹스·음량·타이밍과 다릅니다. 생성 음원은 Free 비상업 시청용입니다.',clips},null,2)+'\n');
console.log(`Studio audio catalogue: ${clips.length} clips (${clips.filter(clip=>clip.status==='preview').length} preview-connected, ${clips.filter(clip=>clip.status==='candidate').length} candidates).`);
