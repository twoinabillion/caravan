#!/usr/bin/env python3
"""Live mobile QA. Natural pre-join Minji checkpoint; other companions are explicit fixtures."""
import json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/director-pass-2026-09-11/camp-task2'
URL=os.environ.get('CARAVAN_LIVE_URL','http://127.0.0.1:4176/game?caravan-live=1')

def open_camp(frame):
    frame.evaluate("document.documentElement.classList.remove('qa-exact-replay')")
    frame.locator('button[data-journey-mode="local"]').click()
    frame.locator('[data-a="camp"]').click()
    frame.wait_for_function("Number(getComputedStyle(document.querySelector('.camp-live-stage')).opacity)>0.99")

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome')
        page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
        page.set_default_timeout(10000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(URL)
        frame=page.main_frame
        frame.wait_for_function('typeof G!=="undefined" && typeof UI!=="undefined"')
        assert not frame.evaluate('G.isInfiniteResourceMode()')
        save=json.loads((ROOT/'artifacts/director-pass-2026-09-11/minji-first-night-natural.save.json').read_text())
        frame.evaluate('''save=>{localStorage.setItem('seoul400_save_v1',JSON.stringify(save));G.load();UI.restoreQaView({screen:'game'});}''',save)
        open_camp(frame)
        assert '임시 동행' in frame.locator('#camp-body').inner_text()
        assert '대화 상대 미선택' in frame.locator('.camp-live-state').inner_text()
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT/'01-natural-prejoin-hub-390.png'))
        frame.locator('[data-camp-talk="minji"]').click()
        frame.evaluate('UI.finishStory()')
        assert frame.locator('.event-choice-dock .choice[data-i]').count()==2
        assert '15분' in frame.locator('.event-choice-dock').inner_text()
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT/'02-natural-prejoin-exchange-390.png'))
        frame.locator('[data-camp-later]').click()
        assert '대답 대기' in frame.locator('.camp-live-state').inner_text()
        assert not frame.evaluate('S._campPlan.talk||false')
        frame.locator('[data-camp-talk="minji"]').click()
        frame.evaluate('UI.finishStory()')
        before=frame.evaluate('({minute:S.day*1440+S.min,party:S.party,stage:S.recruitQ.stage})')
        # Reload pending dialogue through the actual live shell.
        page.reload()
        frame=page.main_frame
        frame.wait_for_function('typeof S!=="undefined" && S && document.querySelector("#ev-wrap.on")')
        frame.evaluate('UI.finishStory()')
        frame.locator('.event-choice-dock .choice[data-i="0"]').click()
        frame.evaluate('UI.finishStory()')
        after=frame.evaluate('({minute:S.day*1440+S.min,party:S.party,stage:S.recruitQ.stage,memory:S.campMemories.minji})')
        assert after['minute']==before['minute']+15 and after['party']==before['party'] and after['stage']==before['stage']
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT/'03-natural-prejoin-result-390.png'))
        page.reload()
        frame=page.main_frame
        frame.wait_for_function('typeof S!=="undefined" && S && document.querySelector("#ev-wrap.on")')
        frame.wait_for_function('document.querySelector("#ev-sheet").dataset.storyPhase==="outcome"')
        frame.evaluate('UI.finishStory()')
        assert frame.evaluate('S.day*1440+S.min')==after['minute']
        frame.locator('[data-r="ok"]').click()
        assert '대화 완료' in frame.locator('.camp-live-state').inner_text()
        frame.locator('.camp-lived-in').scroll_into_view_if_needed()
        assert after['memory']['home'] in frame.locator('.camp-lived-in').inner_text()
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT/'04-natural-prejoin-home-390.png'))
        frame.locator('#camp-x').click()
        dest=frame.evaluate('''()=>{const n=G.neighbors(S.at).find(n=>G.canTravelTo(n.id).ok);if(!n)throw Error('no travel');G.startTravel(n.id);UI.renderAll();return n.id}''')
        assert frame.locator('[aria-label="야영에서 이어진 약속"]').count()==1
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT/'05-natural-next-road-390.png'))
        natural={'before':before,'after':after,'nextDestination':dest,'driveEcho':frame.evaluate('G.campDriveEchoes()')}
        # Explicit all-party fixture checks both responses and established-camp copy at 360px.
        page.set_viewport_size({'width':360,'height':780})
        checks=[]
        for cid in ['minji','parkss','leo','jaeyi','eunsu','kangwoo']:
            frame.evaluate('''cid=>{G.newGame('onroad','검수','full');S.party=[cid];S.comps[cid]={mood:65,bond:5,lvl:0,perks:[],pending:1};S.at='gyeongju';S.min=780;S.scrap=20;S.items['부품']=4;UI.restoreQaView({screen:'game'});}''',cid)
            open_camp(frame)
            assert '오후' in frame.locator('#camp-mini').inner_text()
            frame.locator(f'[data-camp-talk="{cid}"]').click()
            frame.evaluate('UI.finishStory()')
            assert frame.locator(f'.chat-msg[data-speaker="{cid}"]').count()>=1
            choices=frame.locator('.event-choice-dock .choice[data-i]')
            assert choices.count()==2
            rects=choices.evaluate_all('(nodes)=>nodes.map(n=>({x:n.getBoundingClientRect().x,right:n.getBoundingClientRect().right,bottom:n.getBoundingClientRect().bottom}))')
            assert all(r['x']>=0 and r['right']<=360 and r['bottom']<=780 for r in rects),rects
            frame.locator('.event-choice-dock .choice[data-i="1"]').click()
            frame.evaluate('UI.finishStory()')
            speakers=frame.locator('.chat-msg').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.speaker)')
            assert cid in speakers and 'unknown' not in speakers,speakers
            page.wait_for_timeout(350)
            page.screenshot(path=str(OUT/f'fixture-{cid}-reply-360.png'))
            frame.locator('[data-r="ok"]').click()
            frame.locator('.camp-lived-in').scroll_into_view_if_needed()
            page.wait_for_timeout(350)
            page.screenshot(path=str(OUT/f'fixture-{cid}-home-360.png'))
            frame.locator('#camp-rest').click()
            open_camp(frame)
            frame.locator(f'[data-camp-talk="{cid}"]').click()
            frame.evaluate('UI.finishStory()')
            assert frame.evaluate('S.campConversation.revisit')
            page.wait_for_timeout(350)
            page.screenshot(path=str(OUT/f'fixture-{cid}-established-360.png'))
            checks.append({'cid':cid,'speakers':speakers,'choiceRects':rects})
            frame.locator('[data-camp-later]').click()
            frame.locator('#camp-x').click()
        assert not errors,errors
        (OUT/'verification.json').write_text(json.dumps({'naturalPrejoin':natural,'fixtures':checks,'errors':errors},ensure_ascii=False,indent=2))
        browser.close()
    print('PASS: live natural pre-join Minji cancel/reload/choice/home/road, six companion fixtures at 360px, correct speakers and reachable actions')
def multi_echo():
    """Focused review fixture: two nights before departure, at 360px."""
    OUT.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome')
        page=browser.new_page(viewport={'width':360,'height':780})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(URL)
        page.evaluate('''()=>{
          G.newGame('onroad','두 밤 검수','full'); rng=()=>0.99;
          S.flags.main_mission_started=true;
          S.at='gyeongju'; S.party=['minji','parkss'];
          S.party.forEach(id=>S.comps[id]={mood:65,bond:5,lvl:0,perks:[],pending:1});
          UI.restoreQaView({screen:'game'}); document.documentElement.classList.remove('qa-exact-replay');
          G.prepareCamp('talk','minji'); G.resolveCampChoice(G.campConversationEvent().id,'listen');
          G.camp();
          G.prepareCamp('talk','parkss'); G.resolveCampChoice(G.campConversationEvent().id,'record');
          S.campConversation.active=false;
          const to=G.neighbors(S.at).find(row=>G.canTravelTo(row.id).ok).id;
          if(!G.startTravel(to)) throw Error('fixture departure failed'); UI.renderAll();
        }''')
        page.reload()
        page.wait_for_selector('[data-camp-echo="parkss"]')
        assert page.locator('#ev-wrap.on').count()==0
        group=page.locator('[aria-label="야영에서 이어진 약속"]')
        assert group.count()==1
        assert page.locator('[data-camp-echo]').count()==2
        group.scroll_into_view_if_needed()
        rects=page.locator('[data-camp-echo]').evaluate_all('(nodes)=>nodes.map(n=>({left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom,overflow:n.scrollWidth>n.clientWidth}))')
        assert all(r['left']>=0 and r['right']<=360 and r['top']>=0 and r['bottom']<=780 and not r['overflow'] for r in rects),rects
        assert rects[0]['bottom']<=rects[1]['top'],rects
        assert page.evaluate('G.campTravelEchoes().length')==0
        page.screenshot(path=str(OUT/'review-two-camp-promises-360.png'))
        page.evaluate('''()=>{S.driving.campEcho=G.campDriveEchoes()[0];delete S.driving.campEchoes;G.save();}''')
        page.reload()
        page.wait_for_selector('[data-camp-echo="minji"]')
        assert page.locator('[data-camp-echo]').count()==1
        assert not errors,errors
        (OUT/'review-two-camp-promises.json').write_text(json.dumps({'fixture':'Minji then sleep then Park before actual departure','rects':rects,'legacySingleEcho':True,'errors':errors},ensure_ascii=False,indent=2))
        browser.close()
    print('PASS: 360px single section shows both next-leg promises after reload; legacy single echo remains visible; no overflow or page errors')

if __name__=='__main__':
    multi_echo() if '--multi-echo' in sys.argv else main()
