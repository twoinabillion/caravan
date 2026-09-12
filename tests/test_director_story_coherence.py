#!/usr/bin/env python3
"""Keep the speakers in the three generational-story branches identifiable."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
failures = []


def check(label, actual, expected):
    ok = actual == expected
    print(('PASS ' if ok else 'FAIL ') + label)
    if not ok:
        failures.append(label)
        print('actual:', actual, 'expected:', expected)


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width':390,'height':844})
    page.goto((ROOT / '서울까지400km.html').as_uri())
    result = page.evaluate("""() => {
      G.newGame('onroad','화자 검수','full');
      const read=(id,phase)=>{
        const e=D.events.find(row=>row.id===id);
        const v=phase==='text'?e:e.choices[Number(phase[0])].out[Number(phase[2])];
        return UI.storyTurns(v.text,e,{turnSpeakers:v.turnSpeakers})
          .filter(t=>t.kind==='dialogue').map(t=>({who:t.who,name:t.name||'',uncertain:!!t.speakerUncertain}));
      };
      return {
        speech:read('story_generation_speech','text'),
        dialect:read('story_generation_speech','0.0'),
        direction:read('story_generation_speech','1.0'),
        theories:read('story_generation_theories','text'),
        form:read('story_generation_form','0.0'),
        forms:read('story_generation_form','1.0')
      };
    }""")
    for key, expected in {
        'speech':['passer_child','passer_elder','passer_child','passer_elder','passer_elder','passer_elder','passer_child'],
        'dialect':['passer_elder','me','passer_child'],
        'direction':['me','passer_child','me','passer_child'],
        'theories':['passer_man','passer_elder','passer_worker','passer_man','passer_elder'],
        'form':['passer_elder','me','passer_elder','passer_elder'],
    }.items():
        check(key + ': actual speaker order', [t['who'] for t in result[key]], expected)
    check('the family witness remains the elder', all(t['who']=='passer_elder' for t in result['forms']), True)
    check('known roles never fall back to an anonymous adult', any(t['uncertain'] or t['name']=='???' for rows in result.values() for t in rows), False)
    browser.close()

if failures:
    raise SystemExit(f'{len(failures)} speaker failures')
