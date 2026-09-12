"""Task3 review regressions: place, total time, evidence provenance and legacy copy."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
failed=[]
def check(label,ok):
 print(('PASS ' if ok else 'FAIL ')+label)
 if not ok: failed.append(label)
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page()
 page.goto((ROOT/'서울까지400km.html').as_uri())
 result=page.evaluate('''() => {
  G.newGame('onroad','복구','full');S.at='suwon';S.stats.km=430;
  const op=G.mainEvidenceOpportunity(),ev=D.events.find(e=>e.id===op.event);
  const txt=typeof ev.text==='function'?ev.text(S):ev.text;
  const context=txt.includes('수원')&&txt.includes('사본')&&!txt.includes('부산을 벗어난 첫 고가도로 아래에서');
  const costDisclosed=op.hint.includes('준비 30분')&&op.hint.includes('10~35분');
  const originals=['onboarding_first_road','parents_diversion_manifest','parents_separated_work','story_family_key','story_personal_cache','story_parent_route_shared','story_parent_route_guarded','history_failed_namsan','parents_father_last_log'];
  const mapped=originals.every(id=>D.mainRecoveryEvents?.[id]&&D.events.some(e=>e.id===D.mainRecoveryEvents[id]));
  S.flags.parents_routes_traced=true;
  const step=G.departureSteps().find(s=>s.id==='parents_split');
  const legacyCopy=step.done&&step.detail.includes('확인했다');
  G.newGame('onroad','동료 기록','full');S.at='suwon';S.stats.km=430;
  S.party=['minji','parkss','leo'];S.party.forEach(id=>S.comps[id].lvl=3);
  ['first_order_trace','parents_routes_traced','parent_key_found','father_fate_known','mother_reunited','mother_broadcast_ready','postman_letter'].forEach(f=>S.flags[f]=true);
  const command=G.mainEvidenceOpportunity(),c=D.events.find(e=>e.id===command.event);
  const ctext=typeof c.text==='function'?c.text(S):c.text;
  const hybridCommand=ctext.includes('민지')&&ctext.includes('박 선생')&&ctext.includes('레오')&&!ctext.includes('세 증언의 발신 번호');
  G.applyFx(c.choices[0].out[0].fx);
  const relay=G.mainEvidenceOpportunity(),r=D.events.find(e=>e.id===relay.event);
  const rtext=typeof r.text==='function'?r.text(S):r.text;
  const hybridRelay=rtext.includes('동료')&&!rtext.includes('증언 사본을 책상에');
  return {context,costDisclosed,mapped,legacyCopy,hybridCommand,hybridRelay};
 }''')
 for key,ok in result.items():check(key,ok)
 for index,expected in [(0,50),(1,65),(2,40)]:
  test=browser.new_page()
  test.goto((ROOT/'서울까지400km.html').as_uri())
  before=test.evaluate('''() => {
   G.newGame('onroad','복구','full');S.at='suwon';S.stats.km=430;
   UI.restoreQaView({screen:'game'});
   const before=S.day*1440+S.min;G.explore();return before;
  }''')
  test.evaluate('UI.finishStory()')
  test.locator(f'#ev-sheet [data-i="{index}"]').click()
  test.evaluate('UI.finishStory()')
  actual=test.evaluate('''() => ({time:S.day*1440+S.min,flag:S.flags.first_order_trace,
    pursuit:S.pursuit,originalSeen:S.used.includes('onboarding_first_road'),
    note:S.notes.at(-1).body,body:document.querySelector('#ev-sheet').innerText})''')
  check(f'recovery choice {index} full disclosed cost and consequences',actual['time']-before==expected and actual['flag'] and actual['pursuit']==(1 if index==2 else 0))
  check(f'recovery choice {index} truthful result and note', '수원' in actual['note'] and not actual['originalSeen'] and '스캐너 아래에 둔 채' not in actual['body'])
  test.close()
 check('recovery chains preserve work and cannot replay completed southern beat',page.evaluate('''() => {
  const source=D.events.find(e=>e.id==='story_personal_cache');
  const recovered=D.events.find(e=>e.id===D.mainRecoveryEvents[source.id]);
  const chains=recovered.choices.every((choice,i)=>choice.out.every((out,j)=>out.fx.chain===D.mainRecoveryEvents[source.choices[i].out[j].fx.chain]));
  S.flags.parents_split_known=true;S.stats.km=430;
  S.flags.first_order_trace=true;S._storyQueue=['onboarding_first_road'];
  const noReplay=G.popStory()===null;
  return chains&&noReplay&&!G.beatReady(D.journeyBeats.find(b=>b.id==='parents_diversion_manifest'));
 }'''))
 browser.close()
if failed:raise SystemExit('Failed: '+', '.join(failed))
