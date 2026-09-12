"""Persisted extraction chains must respect completion and the actual location."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
failed=[]
with sync_playwright() as p:
 browser=p.chromium.launch()
 for branch in ['shared','guarded']:
  for at,completed,recovered in [('suwon',False,False),('suwon',True,False),
    ('suwon',True,True),('cheonan',False,False),('cheonan',False,True),('cheongju',False,False)]:
   page=browser.new_page()
   page.goto((ROOT/'서울까지400km.html').as_uri())
   source='story_parent_route_'+branch
   chain=('main_recovery_' if recovered else '')+source
   page.evaluate('''({at,completed,branch,chain})=>{
    G.newGame('onroad','이어가기','full');S.at=at;S.stats.km=430;
    ['first_order_trace','parents_routes_traced','parent_key_located'].forEach(f=>S.flags[f]=true);
    S.flags['parent_cache_'+branch]=true;
    if(completed) S.flags.parent_key_found=true;
    S._chain=chain;G.save();S=null;if(!G.load()) throw Error('load failed');
    UI.restoreQaView({screen:'game'});
    G.openEventById('main_transfer_testimony');UI.finishStory();
   }''',{'at':at,'completed':completed,'branch':branch,'chain':chain})
   page.locator('#ev-sheet [data-i="0"]').click()
   page.evaluate('UI.finishStory()')
   page.locator('#ev-sheet [data-r="ok"]').click()
   page.wait_for_timeout(650)
   actual=page.evaluate('''()=>({event:document.querySelector('#ev-sheet').dataset.eventId||null,
    active:document.querySelector('#ev-wrap').classList.contains('on'),
    chain:S._chain,savedChain:JSON.parse(localStorage.getItem(SAVE_KEY))._chain,
    key:!!S.flags.parent_key_found,partial:S.flags.parent_cache_shared||S.flags.parent_cache_guarded,
    at:S.at,used:S.used,opportunity:G.mainEvidenceOpportunity()})''')
   expected=None if completed or at=='cheonan' else ('main_recovery_'+source if at=='suwon' else source)
   ok=(actual['event']==expected and not actual['chain'] and not actual['savedChain']
       and actual['key']==completed and actual['partial'] and actual['at']==at)
   if at=='cheonan':
    ok=ok and actual['opportunity']['target']=='suwon' and source not in actual['used']
   label=f'{branch} {at} completed={completed} recovery-ID={recovered}'
   print(('PASS ' if ok else 'FAIL ')+label+(str(actual) if not ok else ''))
   if not ok:failed.append(label)
   page.close()
 browser.close()
if failed:raise SystemExit('Failed: '+', '.join(failed))
