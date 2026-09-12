"""Art must describe the rendered state, independently of generic success labels."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

def test_scene_cast_and_outcome_contract():
    with sync_playwright() as p:
        browser=p.chromium.launch()
        page=browser.new_page()
        page.goto((ROOT/'서울까지400km.html').as_uri())
        rows=page.evaluate('''() => {
          G.newGame('onroad','검증','full'); S.party=[]; S.dog=false;
          const scene=id=>{UI.showEvent([...D.events,...D.seoulStops].find(e=>e.id===id));return document.querySelector('.event-scene-frame').dataset.sceneKey};
          return {postman:scene('meet_postman'),core:scene('seoul_core'),night:scene('seoul_night'),
            ridge:['route_ridge_rescue','route_ridge_anchor','route_ridge_extract'].map(scene),
            ridgeOut:D.events.find(e=>e.id==='route_ridge_extract').choices.flatMap(c=>c.out.map(o=>o.scene)),
            walker:D.events.find(e=>e.id==='combat_walker_strike').choices.map(c=>c.out.map(o=>o.scene||'combat-walker-watch-v1')),
            recovery:Object.values(D.mainRecoveryEvents).map(scene)};
        }''')
        assert rows['postman']=='event-postman-solo-v2'
        assert rows['core']=='seoul-core-view-v2'
        assert rows['night']=='seoul-night-quiet-v2'
        assert rows['ridge']==['route-ridge-rigging-v2']*3
        assert rows['ridgeOut']==['route-ridge-safe-v2']*6
        assert rows['walker']==[
            ['combat-walker-disabled-v2','combat-walker-watch-v1'],
            ['combat-walker-disabled-v2','combat-walker-watch-v1'],
            ['combat-walker-watch-v1','combat-walker-watch-v1'],
            ['combat-walker-disabled-v2','combat-walker-watch-v1'],
            ['combat-walker-watch-v1']]
        assert all(key in ['parents-diversion-record-v2','parents-linked-records-v2'] for key in rows['recovery'])
        assert page.evaluate("D.events.find(e=>e.id==='seoul_session_reset').scenes")==['seoul-uplink-empty-v2','seoul-reset-empty-v2']
        assert page.evaluate("D.events.find(e=>e.id==='seoul_uplink_reveal').scenes")==['seoul-home-dawn-v2','seoul-uplink-empty-v2']
        cue=page.evaluate('''()=>{S.at='sangju';S.recruitQ={id:'parkss',target:'gumi',stage:'task'};G.ensureQuestLedger().tracked=['companion_parkss'];G.chooseRoute('ridge');return G.questNavigationPlan().action}''')
        assert '구미 공단 폐허까지 이동한다' in cue and '폐허으로' not in cue
        browser.close()
