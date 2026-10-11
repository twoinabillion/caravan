#!/usr/bin/env python3
"""Render the actual SND combat graph offline, without a game or save.

No substitute synth recipes: execute the source owner in OfflineAudioContext.
These MP3s are listening references; gameplay still runs its original graph.
"""
import hashlib
import json
import pathlib
import subprocess
import tempfile
import wave
from array import array
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
KINDS = ['warning', 'scan', 'drone', 'walker', 'heartbeat', 'rifle', 'crossbow',
         'metal', 'fire', 'hit', 'alarm', 'hack', 'engine', 'cover', 'confirm',
         'success', 'partial', 'failure', 'exit', 'select']


def main():
    text = (ROOT / 'src/07e-ui-audio.js').read_text()
    source = text[text.index('const SND ='):text.index('/* ═══════════════════ BGM ')]
    folder = ROOT / 'assets/audio/auditions/runtime-synth-v2'
    folder.mkdir(parents=True, exist_ok=True)
    rows = []
    with sync_playwright() as playwright, tempfile.TemporaryDirectory(prefix='caravan-synth-') as temp:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        for kind in KINDS:
            samples = page.evaluate('''async ({source,kind}) => {
              const context=new OfflineAudioContext(1,48000,48000);
              context.resume=()=>Promise.resolve(); context.suspend=()=>Promise.resolve();
              const storage={getItem:()=>null,setItem:()=>{}};
              const snd=new Function('window','localStorage','$','S','UI','D','BGM','AMBI','VO',
                source+';return SND;')(
                {AudioContext:function(){return context;}},storage,()=>null,null,
                {modalOpen:()=>false},{sfx:{}},{setOn(){}},{setOn(){}},{setOn(){}});
              snd.enable(); snd.combat(kind);
              const buffer=await context.startRendering();
              return Array.from(buffer.getChannelData(0),x=>Math.round(Math.max(-1,Math.min(1,x))*32767));
            }''', {'source': source, 'kind': kind})
            if max(map(abs, samples)) < 10:
                raise RuntimeError('Silent synth reference: '+kind)
            wav = pathlib.Path(temp) / (kind+'.wav')
            with wave.open(str(wav), 'wb') as stream:
                stream.setnchannels(1); stream.setsampwidth(2); stream.setframerate(48000)
                stream.writeframes(array('h', (int(x) for x in samples)).tobytes())
            delivery = folder / (kind+'.mp3')
            subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(wav),
                            '-ar','44100','-ac','1','-codec:a','libmp3lame','-b:a','96k',str(delivery)],check=True)
            rows.append({'name':kind,'file':delivery.name,'duration':float(subprocess.check_output(
                ['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(delivery)])),
                'sha256':hashlib.sha256(delivery.read_bytes()).hexdigest()})
        browser.close()
    (folder/'manifest.json').write_text(json.dumps({'provider':'Project WebAudio SND.combat',
        'source_sha256':hashlib.sha256(source.encode()).hexdigest(),'sample_rate':48000,
        'listening_review':'pending','game_wired':False,
        'note':'Offline rendering of the actual runtime graph including -3dB master. Listening references only; not additional game samples.',
        'clips':rows},indent=2)+'\n')
    print(json.dumps({'rendered':len(rows),'folder':str(folder.relative_to(ROOT))}))


if __name__ == '__main__':
    main()
