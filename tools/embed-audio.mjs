#!/usr/bin/env node
/*
 * src/03h-audio.js의 플레이스홀더를 해당 MP3 data URI로 치환해 stdout에 쓴다.
 * 수 MB 문자열을 Bash 변수로 반복 치환하지 않아 빌드 시간이 파일 수에 비례한다.
 */
import fs from 'node:fs';
import path from 'node:path';

const templatePath=process.argv[2];
if(!templatePath){
  process.stderr.write('사용법: node tools/embed-audio.mjs src/03h-audio.js\n');
  process.exit(2);
}

function audioPath(key){
  if(key.startsWith('BGM_'))
    return path.join('assets/audio/bgm',key.slice(4).toLowerCase()+'.mp3');
  if(key.startsWith('SFX_'))
    return path.join('assets/audio/sfx',key.toLowerCase()+'.mp3');
  if(key.startsWith('VO_'))
    return path.join('assets/audio/voice',key.slice(3).toLowerCase()+'.mp3');
  throw new Error(`알 수 없는 오디오 키: ${key}`);
}

const template=fs.readFileSync(templatePath,'utf8');
const output=template.replace(/__([A-Z0-9_]+)__/g,(_,key)=>{
  const file=audioPath(key);
  if(!fs.existsSync(file)) throw new Error(`오디오 파일 없음: ${file}`);
  return `data:audio/mpeg;base64,${fs.readFileSync(file).toString('base64')}`;
});

process.stdout.write(output);
