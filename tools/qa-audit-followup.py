#!/usr/bin/env python3
"""Isolated diagnostics for stale audit assumptions; never the user's save.

Fixture state is explicitly constructed. These checks do not certify a natural
campaign, subjective listening, or visual quality.
"""
from pathlib import Path
import argparse
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def road_checkin():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 360, 'height': 728})
        page.set_default_timeout(6000)
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.goto((ROOT / '서울까지400km.html').as_uri())
        page.evaluate('''() => {
          G.newGame('onroad','동행 검사','full'); S.party=['minji','kangwoo'];
          S.party.forEach(id=>S.comps[id]={mood:60,bond:0,lvl:0,perks:[]});
          G.save();G.load();UI.restoreQaView({screen:'game'});
          G.startTravel('yangsan');S.driving.slots=[];G.save();UI.renderAll();
        }''')
        def enter(cid):
            page.locator('[data-journey-detail="crew"]').click()
            page.locator(f'#journey-detail-dialog [data-road-checkin="{cid}"]').click()
            page.wait_for_function("document.querySelector('#ev-wrap.on') && S.pendingPresentation")
        enter('minji')
        assert page.evaluate('S.comps.minji.bond===0&&!S.driving.checkIn')
        page.locator('#ev-sheet [data-road-later]').click()
        assert page.evaluate('!S.pendingPresentation&&!S.driving.checkIn&&S.comps.minji.bond===0')
        enter('kangwoo')
        page.evaluate('UI.finishStory()')
        page.locator('#ev-sheet .choice[data-i]:visible:enabled').first.click()
        page.evaluate('UI.finishStory()')
        assert page.evaluate("S.driving.checkIn==='kangwoo'&&S.comps.kangwoo.bond===1&&S.comps.kangwoo.mood===63")
        page.reload()
        if page.locator('#bt-continue').is_visible():
            page.locator('#bt-continue').click()
        page.wait_for_function("document.querySelector('#ev-sheet')?.dataset.storyPhase==='outcome'")
        assert page.evaluate("S.driving.checkIn==='kangwoo'&&S.comps.kangwoo.bond===1&&S.comps.kangwoo.mood===63")
        page.evaluate('UI.finishStory()')
        page.locator('#ev-sheet [data-r="ok"]:visible').click()
        assert page.evaluate("!G.roadCheckIn('minji').ok")
        assert not errors, errors
        browser.close()
    print('PASS current crew drawer -> talk -> defer -> another crew -> result -> Continue -> return; reward once', flush=True)
    return {'kind':'isolated-current-road-checkin','naturalCampaign':False,
            'entry':True,'cancelNoCost':True,'result':True,'continue':True,'return':True,'onceOnly':True,'pageErrors':errors}


def main():
    checks = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.set_default_timeout(6000)
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.goto((ROOT / '서울까지400km.html').as_uri())
        cases = [(width, height, index, cost)
                 for width, height in [(320, 578), (360, 728), (390, 844)]
                 for index, cost in [(0, 50), (1, 65), (2, 40)]]
        for width, height, index, expected in cases:
            page.close()
            page = browser.new_page(viewport={'width': width, 'height': height})
            page.set_default_timeout(6000)
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            page.goto((ROOT / '서울까지400km.html').as_uri())
            before = page.evaluate('''() => {
              G.newGame('onroad','페이지 검사','full'); S.at='suwon'; S.stats.km=430;
              G.save(); G.load(); UI.restoreQaView({screen:'game'});
              const before=S.day*1440+S.min; G.explore(); return before;
            }''')
            page.evaluate('UI.finishStory()')
            button = page.locator(f'#ev-sheet [data-i="{index}"]')
            state = page.evaluate('JSON.stringify(S)')
            turns = 0
            while not button.is_visible() and turns < 8:
                next_page = page.locator('#ev-sheet [data-page-next]:visible:enabled, #ev-sheet [data-choice-next]:visible:enabled').first
                assert next_page.count(), f'choice {index} has no reachable next page'
                next_page.click()
                turns += 1
            assert button.is_visible(), f'choice {index} is unreachable'
            # Reading cursors may save; gameplay values must remain unchanged.
            old = json.loads(state)
            current = page.evaluate('JSON.parse(JSON.stringify(S))')
            for key in ['day', 'min', 'food', 'water', 'scrap', 'flags', 'items']:
                assert old[key] == current[key], (index, 'paging changed', key)
            button.click()
            page.evaluate('UI.finishStory()')
            result = page.evaluate('''() => ({time:S.day*1440+S.min,flag:S.flags.first_order_trace,
              pursuit:S.pursuit,note:S.notes.at(-1).body,sourceSeen:S.used.includes('onboarding_first_road')})''')
            assert result['time'] - before == expected, result
            assert result['flag'] and result['pursuit'] == (1 if index == 2 else 0), result
            assert '수원' in result['note'] and not result['sourceSeen'], result
            fingerprint = '''() => JSON.stringify({day:S.day,min:S.min,food:S.food,
              water:S.water,scrap:S.scrap,flags:S.flags,items:S.items,notes:S.notes})'''
            paid = page.evaluate(fingerprint)
            page.reload()
            if page.locator('#bt-continue').is_visible():
                page.locator('#bt-continue').click()
            page.wait_for_function("document.querySelector('#ev-sheet')?.dataset.storyPhase==='outcome'")
            assert page.locator('#ev-sheet').get_attribute('data-event-id') == 'main_recovery_onboarding_first_road'
            assert page.evaluate(fingerprint) == paid, 'Continue changed paid result'
            checks.append({'viewport': [width, height], 'choice': index,
                           'costMinutes': expected, 'pageAdvances': turns,
                           'continuePreserved': True})
            print(f'PASS {width}x{height} recovery choice {index}: {expected} minutes, {turns} page advances, no paging cost', flush=True)
        rows = page.evaluate('''() => {
          const rows=[];
          for(const cid of Object.keys(D.campConversations)) for(const guest of [true,false]){
            const init=()=>{
              G.newGame('onroad','야영 검사','full'); S.at='gyeongju'; S.day=3; S.min=1100;
              S._breakfastDay=3; S._lunchDay=3; S.items['부품']=4; S.water=12; S.scrap=30;
              if(guest) S.recruitQ={id:cid,stage:'road',roadDay:3,target:'gyeongju'};
              else S.party=[cid];
              G.save(); G.load(); G.prepareCamp('talk',cid);
              return G.campConversationEvent();
            };
            const choices=init().choices.map(c=>c.id);
            for(const choice of choices){
              const event=init(); G.save(); G.load();
              const restored=G.campConversationEvent();
              const first=G.resolveCampChoice(restored.id,choice);
              const snapshot=()=>JSON.stringify({day:S.day,min:S.min,scrap:S.scrap,food:S.food,
                water:S.water,items:S.items,party:S.party,memory:S.campMemories[cid],comps:S.comps});
              const paid=snapshot(); G.save(); G.load();
              const again=G.resolveCampChoice(restored.id,choice);
              const other=G.resolveCampChoice(restored.id,choices.find(id=>id!==choice)||'invalid_choice');
              const locked=G.prepareCamp('talk',cid);
              rows.push({cid,guest,choice,count:choices.length,sameId:event.id===restored.id,
                applied:!!first.applied,replayed:again.ok&&!again.applied,
                otherRejected:!other.ok,locked:!locked.ok,same:paid===snapshot(),
                roster:S.party.includes(cid)===!guest});
            }
          }
          return rows;
        }''')
        for row in rows:
            assert all(row[key] for key in ['sameId', 'applied', 'replayed', 'otherRejected', 'locked', 'same', 'roster']), row
            if row['cid'] == 'minji' and row['guest']:
                assert row['count'] == 1 and row['choice'] == 'listen', row
        print(f'PASS {len(rows)} current camp choices: guest/crew, reload, once-only costs, alternate rejection', flush=True)
        assert not errors, errors
        browser.close()
    return {'kind': 'isolated-audit-followup', 'naturalCampaign': False,
            'visualReview': False, 'recovery': checks, 'camp': rows, 'pageErrors': errors}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report')
    parser.add_argument('--road-only', action='store_true')
    args = parser.parse_args()
    result = road_checkin() if args.road_only else main()
    if args.report:
        with Path(args.report).open('x') as output:
            json.dump(result, output, ensure_ascii=False, indent=2)
            output.write('\n')
