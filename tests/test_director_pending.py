"""Task7 fixtures: normal Continue owns event/result/chain recovery."""
import json
import os
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CARAVAN_CAPTURE_URL', (ROOT / '서울까지400km.html').as_uri())
ART = ROOT / 'artifacts/director-pass-2026-09-11/task7'

@pytest.fixture
def page():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width':390,'height':844})
        page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
        page.goto(URL)
        page.evaluate("localStorage.clear(); G.newGame('onroad','이어가기','full'); S.flags.main_mission_started=true; S.flags.onboarding_event_guide=true; G.save(); G.load()")
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        yield page
        assert not errors, errors
        browser.close()

def resume(page):
    page.reload()
    if page.locator('#bt-continue').is_visible():
        page.locator('#bt-continue').click()
    page.wait_for_timeout(550)

def event(page):
    return page.locator('#ev-sheet').get_attribute('data-event-id')

def finish(page):
    page.evaluate('UI.finishStory()')

def choose(page, index=None):
    finish(page)
    button=page.locator('#ev-sheet .choice[data-i]:enabled').first if index is None else page.locator(f'#ev-sheet .choice[data-i="{index}"]')
    button.click()
    finish(page)

def fingerprint(page):
    return page.evaluate("JSON.stringify({fuel:S.fuel,water:S.water,food:S.food,scrap:S.scrap,min:S.min,day:S.day,items:S.items,party:S.party,comps:S.comps,notes:S.notes,flags:S.flags,events:S.stats.events,history:S.combat&&S.combat.history,report:S.lastCombatReport,counts:S._quality&&S._quality.counts})")

def test_ordinary_choice_and_result_survive_continue_without_reapplication(page):
    page.evaluate("G.openEventById('ev_truck_cafe'); G.save()")
    resume(page)
    assert event(page)=='ev_truck_cafe'
    choose(page)
    text=page.locator('#ev-sheet .story-reader').inner_text()
    before=fingerprint(page)
    resume(page)
    assert event(page)=='ev_truck_cafe'
    assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
    finish(page)
    assert page.locator('#ev-sheet .story-reader').inner_text()==text
    assert fingerprint(page)==before

def test_legacy_prepared_crew_recovers_unanswered_decision(page):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate('(raw)=>{localStorage.setItem(SAVE_KEY,raw);G.load()}',raw)
    resume(page)
    assert event(page)=='seoul_decision'
    assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='event'
    assert not page.evaluate('G.seoulStopDone(4)')

def test_completion_archives_once_and_keeps_export(page):
    result=page.evaluate("""()=>{S.flags.core_transfer=true;
      const out=D.events.find(e=>e.id==='seoul_session_reset').choices[0].out[0];
      G.applyFx(out.fx); const once=G.qualityArchive().length;
      G.endGame('story_done'); return {once,twice:G.qualityArchive().length,
      save:G.hasSave(),md:G.exportMd()};}""")
    assert result['once']==result['twice']==1
    assert not result['save']
    assert '새 세션' in result['md']

def test_solo_finale_copy_and_actual_camp_payoff(page):
    result=page.evaluate("""()=>{const core=D.seoulStops.find(e=>e.id==='seoul_core');
      const people=core.choices.find(c=>c.label.includes('함께 온 사람'));
      S.flags.core_sleep=true; S.stats.km=752;
      const night=D.events.find(e=>e.id==='seoul_night');
      const text=night.text(S);const result=night.choices[1].out[0].text(S);
      return {peopleAllowed:G.reqOk(people.req).ok,text,result};}""")
    assert not result['peopleAllowed']
    assert '기록을 마지막으로 다시 열었다' not in result['text']
    assert '411km' not in result['result']
    assert '다들 잠든' not in result['result']

PHASES=['seoul_open','seoul_han','seoul_ruins','seoul_square','seoul_base','seoul_core',
        'seoul_costs','seoul_decision','seoul_night','seoul_uplink_reveal','seoul_session_reset']

@pytest.mark.parametrize('phase',PHASES)
def test_each_seoul_phase_and_result_reload(page,phase):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate('''({raw,phase})=>{localStorage.setItem(SAVE_KEY,raw);G.load();
      S.pendingPresentation=null; S._chain=null;
      if(['seoul_night','seoul_uplink_reveal','seoul_session_reset'].includes(phase)) S.flags.core_transfer=true;
      UI.showEvent(G.presentationEvent(phase)); G.save();}''', {'raw':raw,'phase':phase})
    resume(page)
    assert event(page)==phase
    before=fingerprint(page)
    resume(page)
    assert event(page)==phase
    assert fingerprint(page)==before
    choose(page)
    if phase=='seoul_session_reset':
        assert page.evaluate('S.ended&&S.flags.story_done')
        assert page.evaluate('G.qualityArchive().length')==1
        return
    after=fingerprint(page)
    resume(page)
    assert event(page)==phase
    assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
    assert fingerprint(page)==after


def test_close_transition_and_combat_result_do_not_reroll(page):
    page.evaluate("G.openEventById('combat_walker_read')")
    page.evaluate("window.__combatCues=[];window.__originalCombat=SND.combat;SND.combat=cue=>window.__combatCues.push(cue)")
    choose(page)
    page.wait_for_timeout(220)
    cues=page.evaluate('window.__combatCues')
    assert 'confirm' in cues, cues
    before=fingerprint(page)
    page.add_init_script("window.addEventListener('load',()=>{window.__combatCues=[];SND.combat=cue=>window.__combatCues.push(cue)})")
    resume(page)
    assert event(page)=='combat_walker_read'
    assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
    assert fingerprint(page)==before
    assert page.evaluate('window.__combatCues')==[]
    finish(page)
    # Reload synchronously from the real close handler's next task, before 450ms.
    with page.expect_navigation(wait_until='load'):
        page.evaluate("document.querySelector('#ev-sheet [data-r=ok]').click(); location.reload()")
    if page.locator('#bt-continue').is_visible(): page.locator('#bt-continue').click()
    page.wait_for_timeout(600)
    assert event(page)=='combat_walker_strike'
    events=page.evaluate('S.stats.events')
    resume(page)
    assert event(page)=='combat_walker_strike'
    assert page.evaluate('S.stats.events')==events


def test_new_combat_resolution_has_cues_but_restored_result_is_silent(page):
    page.evaluate("G.openEventById('combat_walker_strike');window.__combatCues=[];SND.combat=cue=>window.__combatCues.push(cue)")
    choose(page,4)
    page.wait_for_timeout(220)
    cues=page.evaluate('window.__combatCues')
    assert 'confirm' in cues, cues
    assert any(cue in ('success','partial','failure') for cue in cues), cues
    before=fingerprint(page)
    page.add_init_script("window.addEventListener('load',()=>{window.__combatCues=[];SND.combat=cue=>window.__combatCues.push(cue)})")
    resume(page)
    assert event(page)=='combat_walker_strike'
    assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
    assert fingerprint(page)==before
    assert page.evaluate('window.__combatCues')==[]

@pytest.mark.parametrize('accept',[True,False])
def test_saved_recruitment_offer_can_be_decided(page,accept):
    eid=page.evaluate("()=>{const e=D.events.find(e=>e.choices.some(c=>c.out.some(o=>o.fx?.offerComp==='minji')));G.openEvent(e);return e.id;}")
    choose(page)
    resume(page)
    assert event(page)==eid
    finish(page)
    page.locator('#ev-sheet [data-r='+('yes' if accept else 'no')+']').click()
    resume(page)
    assert page.evaluate("S.party.includes('minji')")==accept
    assert event(page)!=eid

@pytest.mark.parametrize('bad',[None,{},[],{'version':99,'eventId':'ev_truck_cafe','phase':'event'},
    {'version':1,'eventId':'unknown','phase':'event'},
    {'version':1,'eventId':'ev_truck_cafe','phase':'result','choiceIndex':99,'outcomeIndex':0}])
def test_corrupt_pending_record_recovers_known_final_phase(page,bad):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate('''({raw,bad})=>{localStorage.setItem(SAVE_KEY,raw);G.load();S.pendingPresentation=bad;G.save()}''',{'raw':raw,'bad':bad})
    resume(page)
    assert event(page)=='seoul_decision'


def test_result_text_and_chips_from_save_cannot_execute_html(page):
    page.evaluate("G.openEventById('ev_truck_cafe')")
    choose(page)
    page.evaluate("""()=>{const p=S.pendingPresentation;p.text='<img src=x onerror="window.injected=true">';
      p.view={turns:[{kind:'narration',text:p.text}],index:0};
      p.chips=[{t:p.text,c:'\" onmouseover=\"window.injected=true'}];G.save()}""")
    resume(page);finish(page)
    assert not page.evaluate('!!window.injected')
    assert page.locator('#ev-sheet .story-reader img').count()==0
    assert '<img' in page.locator('#ev-sheet .story-reader').inner_text()


def test_recorded_home_opening_and_city_callbacks_are_personal(page):
    result=page.evaluate("""()=>{
      S.opening={decisions:{opening_bus_repair:{choiceId:'hose_bypass'}}};
      S.campMemories={minji:{choiceId:'listen'}};
      S._stlField={impact:{'miryang:pump':{day:1}}};
      const actual=D.finaleJourneyRecall(S);
      S.campMemories={};S.campConversation={cid:'minji',active:true};
      const unplayed=D.finaleJourneyRecall(S);
      return {actual,unplayed,home:D.campConversations.minji.choices.find(c=>c.id==='listen').home};}""")
    assert '버스 호스를 우회' in result['actual']
    assert result['home'] in result['actual']
    assert result['home'] not in result['unplayed']
    assert '밀양' in result['actual']


def test_unprepared_finale_has_an_actionable_way_back_to_prepare(page):
    page.evaluate("S.at='seoul';S.flags.seoul_open=true;S.flags.seoul_core_reached=true;S.flags.seoul_costs_seen=true;UI.showEvent(G.presentationEvent('seoul_decision'))")
    finish(page)
    assert page.locator('#ev-sheet .choice[data-i]:enabled').count()==0
    page.locator('#ev-sheet [data-finale-prepare]').click()
    assert page.evaluate('S.at')=='suwon'
    resume(page)
    assert not page.locator('#ovl-seoul').evaluate("n=>n.classList.contains('on')")
    assert event(page)!='seoul_decision'


def test_partial_finale_does_not_invent_a_disposition(page):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate('''raw=>{localStorage.setItem(SAVE_KEY,raw);G.load();S.flags.core_decided=true;G.save()}''',raw)
    resume(page)
    assert event(page)=='seoul_decision'
    assert not page.evaluate('!!(S.flags.core_transfer||S.flags.core_sleep||S.flags.core_quarantine)')


@pytest.mark.parametrize("conflicting", [False, True])
def test_preparation_return_preserves_progress_and_can_revisit(page, conflicting):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate('''raw=>{localStorage.setItem(SAVE_KEY,raw);G.load();G.save()}''',raw)
    if conflicting:
        # Corrupt historical methods do not count as an actual decision. This
        # fixture has no contacts and one injured crew member: all methods lock.
        page.evaluate("S.injuries.minji={label:'타박상',days:1};delete S.flags.main_relay_confirmed;D.resistance.forEach(c=>delete S.flags[c.flag]);S.flags.core_transfer=true;S.flags.core_sleep=true;G.save()")
    resume(page);finish(page)
    if conflicting:
        assert page.locator('#ev-sheet .choice[data-i]:enabled').count()==0
    before=page.evaluate('({day:S.day,min:S.min,flags:{...S.flags},km:S.stats.km})')
    page.locator('#ev-sheet [data-finale-prepare]').click()
    returned=page.evaluate('({day:S.day,min:S.min,flags:{...S.flags},km:S.stats.km,pending:S.pendingPresentation,chain:S._chain})')
    assert returned['day']*1440+returned['min']==before['day']*1440+before['min']+60
    assert all(returned['flags'].get(k)==v for k,v in before['flags'].items())
    assert returned['pending'] is None and returned['chain'] is None
    resume(page)
    assert page.evaluate('S.at')=='suwon'
    assert page.evaluate('S.day*1440+S.min')==returned['day']*1440+returned['min']
    if conflicting:
        # Ordinary overnight rest pays its normal time/resources and heals the
        # one-day injury. It prepares quarantine without granting any readiness.
        page.evaluate('G.camp()')
        assert not page.evaluate("G.isInjured('minji')")
        assert page.evaluate("G.presentationEvent('seoul_decision').choices.map(c=>G.reqOk(c.req).ok)")==[False,False,True]
    assert page.evaluate("G.startTravel('seoul')")
    for _ in range(120):
        if page.evaluate("S.at==='seoul'&&!S.driving"): break
        if page.locator('#ev-wrap').evaluate("n=>n.classList.contains('on')"):
            finish(page)
            if page.locator('#ev-sheet [data-r=ok]').count():
                page.locator('#ev-sheet [data-r=ok]').click()
            elif page.locator('#ev-sheet .choice[data-i]:enabled').count(): choose(page)
        else: page.evaluate('G.tick(5)')
        page.wait_for_timeout(60)
    assert page.evaluate("S.at==='seoul'&&!S.driving")
    # Do not reload at arrival: use the real arrival control. The next
    # unfinished scene must resume without manually reopening an event or map.
    arrived=fingerprint(page)
    page.locator('[data-arrival-continue]').click()
    page.wait_for_timeout(600)
    assert event(page)=='seoul_decision'
    assert fingerprint(page)==arrived
    if conflicting:
        finish(page)
        assert page.locator('#ev-sheet .choice[data-i]:enabled').count()==1
        assert page.evaluate("['core_transfer','core_sleep','core_quarantine'].filter(k=>S.flags[k])")==['core_transfer','core_sleep']
    # Continue uses the same decision, and neither return path reapplies effects.
    resume(page)
    assert event(page)=='seoul_decision'
    assert fingerprint(page)==arrived
    if conflicting:
        # Rest/reentry/Continue must not reinterpret the corrupt flags as an
        # answer. Only the player's explicit, now-enabled choice resolves them.
        choose(page,2)
        assert page.evaluate("['core_transfer','core_sleep','core_quarantine'].filter(k=>S.flags[k])")==['core_quarantine']


@pytest.mark.parametrize('phase', ['result', 'transition'])
def test_preparation_rejects_a_decision_that_is_not_unanswered(page, phase):
    page.evaluate("""phase=>{S.at='seoul';S.pendingPresentation={version:1,
      eventId:'seoul_decision',phase,choiceIndex:0,outcomeIndex:0,text:'saved result'};}""",phase)
    before=fingerprint(page)
    assert not page.evaluate('G.prepareFinale()')
    assert fingerprint(page)==before
    assert page.evaluate('S.at')=='seoul'


@pytest.mark.parametrize('flags, expected', [
    ({'seoul_costs_seen':False}, 'seoul_costs'),
    ({}, 'seoul_decision'),
    ({'core_transfer':True}, 'seoul_night'),
])
def test_normal_fifth_stop_resumes_earliest_unfinished_phase(page, flags, expected):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate("""({raw,flags})=>{localStorage.setItem(SAVE_KEY,raw);G.load();
      S.pendingPresentation=null;S._chain=null;Object.assign(S.flags,flags);}""", {'raw':raw,'flags':flags})
    before=fingerprint(page)
    page.evaluate('G.seoulEnter(4)')
    assert event(page)==expected
    assert fingerprint(page)==before


def test_old_fifth_stop_marker_does_not_complete_unresolved_finale(page):
    page.evaluate("S.flags.seoul_core_done=true;S.flags.seoul_core_reached=true")
    assert not page.evaluate('G.seoulStopDone(4)')


def test_saved_transition_with_an_interrupted_approach_can_return_to_driving(page):
    page.evaluate("""()=>{G.startTravel('yangsan');
      S.pendingPresentation={version:1,phase:'transition',eventId:'combat_walker_strike'};
      S.driving.approach=G.roadApproachProfile(G.presentationEvent('combat_walker_strike'));G.save();}""")
    resume(page)
    page.wait_for_timeout(3200)
    assert event(page)=='combat_walker_strike'
    choose(page) # available retreat
    page.locator('#ev-sheet [data-r=ok]').click()
    before=page.evaluate('S.driving.gone')
    page.evaluate('G.tick(1)')
    assert page.evaluate('S.driving.gone')>before


def test_result_receipt_preserves_its_chain_when_legacy_chain_field_is_missing(page):
    page.evaluate("G.openEventById('combat_walker_read')")
    choose(page)
    page.evaluate('S._chain=null;G.save()')
    resume(page);finish(page)
    page.locator('#ev-sheet [data-r=ok]').click()
    page.wait_for_timeout(600)
    assert event(page)=='combat_walker_strike'


def test_conflicting_legacy_methods_require_a_new_explicit_choice(page):
    raw=(ROOT/'artifacts/director-pass-2026-09-11/crew-preliminary.save.json').read_text()
    page.evaluate('''raw=>{localStorage.setItem(SAVE_KEY,raw);G.load();
      S.flags.core_transfer=true;S.flags.core_sleep=true;G.save()}''',raw)
    resume(page)
    assert event(page)=='seoul_decision'
    choose(page,2)
    assert page.evaluate("['core_transfer','core_sleep','core_quarantine'].filter(k=>S.flags[k])")==['core_quarantine']


def test_legacy_completion_checkpoint_finishes_without_another_archive(page):
    page.evaluate("S.flags.core_transfer=true;S.flags.story_done=true;G.completeJourney();G.save()")
    before=page.evaluate('G.qualityArchive().length')
    resume(page)
    assert page.evaluate('S.ended')
    assert page.evaluate('G.qualityArchive().length')==before
    assert not page.evaluate('G.hasSave()')
