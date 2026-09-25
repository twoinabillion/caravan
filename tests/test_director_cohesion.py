"""Narrative progression contracts, using isolated diagnostic saves, not earned campaigns.

Breaks caught: replaying a first-night exchange, losing a frozen chapter on reload,
double-counting a resolved visit, forgetting the chosen branch, and hiding earned
memories from the default ending. Prose quality is reviewed separately on screen.
"""
import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CARAVAN_TEST_URL', (ROOT / '서울까지400km.html').as_uri())


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.add_init_script("localStorage.setItem('caravan_story_auto','0')")
    page.goto(URL)
    page.evaluate("""()=>{
      G.newGame('onroad','검수','full');
      S.flags.main_mission_started=true;S.flags.onboarding_event_guide=true;
      S.party=Object.keys(D.campConversations);
      for(const cid of S.party) S.comps[cid]={mood:65,bond:5,lvl:0,perks:[],pending:1};
      S.at='gyeongju';S.min=1200;
    }""")
    yield page
    assert not errors, errors
    page.close()


@pytest.mark.parametrize('cid', ['minji', 'parkss', 'leo', 'jaeyi', 'eunsu', 'kangwoo'])
def test_next_nights_advance_and_keep_the_resolved_chapter(page, cid):
    result = page.evaluate(r"""cid=>{
      const open=()=>{G.prepareCamp('talk',cid);return G.campConversationEvent()};
      const spoken=e=>e.turns.filter(t=>t.kind==='dialogue').map(t=>t.text).join('\n');
      const first=open();
      G.resolveCampChoice(first.id,first.choices[0].id);
      S.campNight++;S.day++;S._campPlan={};
      const second=open(), frozen=JSON.stringify(second);
      G.save();G.load();
      const restored=G.campConversationEvent();
      const choice=G.resolveCampChoice(restored.id,restored.choices[0].id);
      const paid=JSON.stringify({m:S.campMemories[cid],c:S.comps[cid],min:S.min,day:S.day});
      G.save();G.load();
      const resultReplay=G.campConversationEvent();
      const duplicate=G.resolveCampChoice(restored.id,restored.choices[0].id);
      const unchanged=paid===JSON.stringify({m:S.campMemories[cid],c:S.comps[cid],min:S.min,day:S.day});
      const visits=S.campMemories[cid].visits;
      S.campNight++;S.day++;S._campPlan={};
      const third=open();
      return {first:spoken(first),second:spoken(second),third:spoken(third),
        firstLabels:first.choices.map(c=>c.label),secondLabels:second.choices.map(c=>c.label),
        restored:JSON.stringify(restored)===frozen,resultReplay:JSON.stringify(resultReplay)===frozen,
        choicesStable:first.choices.map(c=>c.id).join()===second.choices.map(c=>c.id).join(),
        paid:choice.applied,duplicate:duplicate.applied,unchanged,visits};
    }""", cid)
    assert result['second'] != result['first'], '다음 밤에도 같은 첫 대사를 반복한다'
    assert result['third'] not in [result['first'], result['second']]
    assert result['firstLabels'] != result['secondLabels']
    assert result['choicesStable'] and result['restored'] and result['resultReplay']
    assert result['paid'] and not result['duplicate'] and result['unchanged']
    assert result['visits'] == 2


@pytest.mark.parametrize('cid', ['minji', 'parkss', 'leo', 'jaeyi', 'eunsu', 'kangwoo'])
def test_followup_responds_to_the_previous_choice(page, cid):
    branches = page.evaluate("""cid=>D.campConversations[cid].choices.map(choice=>{
      // Separate minimal old-save fixtures: neither branch grants progress to the other.
      S.campConversation=null;S.campMemories={[cid]:{choiceId:choice.id,visits:1}};
      G.prepareCamp('talk',cid);return G.campConversationEvent().turns;
    })""", cid)
    assert branches[0] != branches[1], '이전 두 선택이 같은 후속 대화로 사라졌다'


def test_unresolved_legacy_camp_receipt_keeps_original_choices(page):
    result = page.evaluate("""()=>{
      S.campMemories.minji={choiceId:'sort',home:'이전에 둔 퓨즈',pendingBond:0};
      S.campConversation={id:'camp_0_minji',night:0,cid:'minji',day:1,timeLabel:'밤',
        context:'',revisit:true,choiceId:null,chips:[],active:true};
      const before=G.campConversationEvent();G.save();G.load();
      const after=G.campConversationEvent();
      return {same:JSON.stringify(before)===JSON.stringify(after),
        labels:after.choices.map(c=>c.label),old:D.campConversations.minji.choices.map(c=>c.label)};
    }""")
    assert result['same'] and result['labels'] == result['old']


@pytest.mark.parametrize('event_id,kind', [
    ('main_transfer_testimony', 'dialogue'),
    ('main_command_ledger', 'record'),
    ('main_command_companion_ledger', 'record'),
    ('main_relay_conference', 'radio'),
    ('main_relay_companion_conference', 'radio'),
])
def test_evidence_has_authored_reading_and_keeps_source_record(page, event_id, kind):
    result = page.evaluate("""id=>{
      S.party=['minji','parkss','leo'];S.party.forEach(cid=>S.comps[cid].lvl=3);
      const ev=D.events.find(ev=>ev.id===id),before=JSON.stringify(S);
      const turns=typeof ev.turns==='function'?ev.turns(S):ev.turns||[];
      const record=typeof ev.readingRecord==='function'?ev.readingRecord(S):ev.readingRecord;
      const original=typeof ev.text==='function'?ev.text(S):ev.text;
      return {turns,record,original,unchanged:before===JSON.stringify(S),scene:ev.scene};
    }""", event_id)
    assert any(turn['kind'] == kind for turn in result['turns'])
    assert result.get('record') == result['original']
    assert result['unchanged'] and len(result['turns']) <= 9
    if kind == 'radio':
        assert result['scene'] == 'main-relay-workbench-v1'
        assert len([t for t in result['turns'] if t['kind'] == 'radio']) == 3


@pytest.mark.parametrize('choice_index', [0, 1])
def test_default_ending_surfaces_only_experienced_memories(page, choice_index):
    result = page.evaluate("""index=>{
      S.party=['minji'];S.flags.core_transfer=true;
      S.opening={decisions:{opening_departure:{choiceId:'leave_key'}}};
      S.campMemories={minji:{choiceId:'listen',home:'빈 접시에 함께 내려놓은 공구.',visits:2}};
      const out=D.events.find(e=>e.id==='seoul_night').choices[index].out[0];
      const before=JSON.stringify(S), turns=out.turns(S), stateUnchanged=JSON.stringify(S)===before;
      S.opening.decisions.opening_departure.choiceId='keep_key';
      const other=out.turns(S);
      S.opening.decisions={};S.campMemories={};
      const empty=out.turns(S);
      return {turns,other,empty,stateUnchanged};
    }""", choice_index)
    text = '\n'.join(t['text'] for t in result['turns'])
    other = '\n'.join(t['text'] for t in result['other'])
    empty = '\n'.join(t['text'] for t in result['empty'])
    assert '감천' in text and '열쇠' in text and text != other
    assert '빈 접시에 함께 내려놓은 공구.' in text
    assert '감천' not in empty and '빈 접시에' not in empty
    assert result['stateUnchanged'] and len(result['turns']) <= 12


def test_ending_never_invents_or_misattributes_an_unknown_camp_memory(page):
    result = page.evaluate("""()=>{
      S.party=['minji'];S.flags.core_sleep=true;
      S.campMemories={minji:{choiceId:'removed-choice',home:'잘못된 기억'},
        unknown:{choiceId:'listen',home:'없는 인물'},eunsu:{choiceId:'facts',home:'남아 있는 수신 기록'}};
      const turns=D.events.find(e=>e.id==='seoul_night').choices[0].out[0].turns(S);
      return turns;
    }""")
    text = '\n'.join(t['text'] for t in result)
    assert '잘못된 기억' not in text and '없는 인물' not in text
    assert all(t.get('who') != 'eunsu' for t in result)


@pytest.mark.parametrize('at,expected', [('cheongju','story_family_principle'),('suwon','main_recovery_story_family_principle')])
@pytest.mark.parametrize('choice_index', [0,1])
def test_key_discovery_waits_for_completed_video_not_just_entry(page, at, expected, choice_index):
    result=page.evaluate("""({at,index})=>{
      S.at=at;S.stats.km=at==='suwon'?430:300;
      S.flags.first_order_trace=true;S.flags.parents_routes_traced=true;
      S.flags.parents_split_known=true;
      S.opening=null;S.entryMode='onroad';
      S.used.push('story_family_principle');
      const op=G.mainEvidenceOpportunity();
      const beforeReady=G.beatReady(D.journeyBeats.find(b=>b.id==='story_family_key'));
      const ev=D.events.find(e=>e.id===op.event);
      G.openEventById(op.event);UI.finishStory();
      const shown=document.querySelector('#ev-sheet').dataset.eventId;
      const resolved=G.resolvePresentedChoice(ev,ev.choices[index]);
      return {event:op.event,shown,beforeReady,resolved:resolved.ok,
        after:G.mainEvidenceOpportunity().event,videoDone:S.flags.parent_principle_found,
        afterReady:G.beatReady(D.journeyBeats.find(b=>b.id==='story_family_key'))};
    }""",{'at':at,'index':choice_index})
    assert result['event']==expected and result['shown']==expected
    assert not result['beforeReady'] and result['afterReady']
    assert result['resolved'] and result['videoDone']
    assert result['after']==('main_recovery_story_family_key' if at=='suwon' else 'story_family_key')


def test_queued_key_entry_cannot_bypass_video_and_completed_legacy_key_stays_done(page):
    result=page.evaluate("""()=>{
      S.at='cheongju';S.stats.km=300;
      G.openEventById('story_family_key');
      const opened=document.querySelector('#ev-sheet').dataset.eventId;
      S.flags.parent_key_found=true;S.flags.first_order_trace=true;S.flags.parents_routes_traced=true;
      return {opened,key:G.mainEvidenceRows().find(r=>r.id==='key')};
    }""")
    assert result['opened']=='story_family_principle'
    assert result['key']['done']


@pytest.mark.parametrize('width,height,large', [(320,740,False),(390,844,False),(1440,1000,False),(390,844,True)])
def test_authored_evidence_on_screen(page, width, height, large):
    """Diagnostic scenes, not an earned playthrough; actual layout and clicks."""
    page.set_viewport_size({'width':width,'height':height})
    output=ROOT/'artifacts/director-cohesion-20260914'
    output.mkdir(parents=True,exist_ok=True)
    page.evaluate("""()=>{
      UI.restoreQaView({screen:'game'});
      document.documentElement.classList.remove('qa-exact-replay');
    }""")
    page.evaluate("large=>document.documentElement.classList.toggle('ui-large-text',large)",large)
    label=f'{width}'+('-large' if large else '')
    for event_id in ['main_transfer_testimony','main_command_ledger','main_relay_conference']:
        page.evaluate('id=>G.openEventById(id)',event_id)
        page.evaluate('UI.finishStory()')
        page.locator('#ev-sheet .event-choice-dock .choice[data-i="0"]').scroll_into_view_if_needed()
        button=page.locator('#ev-sheet .event-choice-dock .choice[data-i="0"]')
        box=button.bounding_box()
        assert box and box['x']>=0 and box['x']+box['width']<=width+1 and box['height']>=44
        assert '???' not in page.locator('#ev-sheet').inner_text()
        assert not page.evaluate("""()=>[...document.querySelectorAll('#ev-sheet .chat-bubble,#ev-sheet .turn-text')]
          .some(node=>node.scrollWidth>node.clientWidth+1)""")
        page.screenshot(path=str(output/f'{event_id}-decision-{label}.png'))
        page.wait_for_timeout(700)
        page.locator('#ev-sheet .event-scroll').evaluate('(node)=>node.scrollTop=0')
        page.wait_for_timeout(100)
        page.screenshot(path=str(output/f'{event_id}-reading-{label}.png'))
        button.click()
        page.evaluate('UI.finishStory()')
        assert page.locator('#ev-sheet').get_attribute('data-story-phase')=='outcome'
        page.locator('[data-r="ok"]').click()


@pytest.mark.parametrize('at', ['cheongju','suwon'])
@pytest.mark.parametrize('phase', ['event','transition','legacy-chain'])
def test_saved_unchosen_key_entry_resumes_video_first(page, at, phase):
    actual=page.evaluate("""({at,phase})=>{
      S.at=at;S.stats.km=at==='suwon'?430:300;
      S.flags.first_order_trace=true;S.flags.parents_routes_traced=true;
      if(phase==='legacy-chain') S._chain='story_family_key';
      else S.pendingPresentation={version:1,eventId:'story_family_key',phase,
        text:'아직 보지 않은 영상을 이미 본 것처럼 말하는 옛 저장',
        view:{turns:[{kind:'narration',text:'옛 검증키 장면'}],index:0}};
      G.save();G.load();G.resumePresentation();UI.finishStory();
      return {id:document.querySelector('#ev-sheet').dataset.eventId,
        text:document.querySelector('#ev-sheet').innerText,key:!!S.flags.parent_key_located};
    }""",{'at':at,'phase':phase})
    assert actual['id']==('main_recovery_story_family_principle' if at=='suwon' else 'story_family_principle')
    assert not actual['key'] and '옛 검증키 장면' not in actual['text']


def test_completed_legacy_key_result_is_not_replaced_by_prerequisite(page):
    actual=page.evaluate("""()=>{
      S.at='suwon';S.flags.parent_key_located=true;
      S.pendingPresentation={version:1,eventId:'story_family_key',phase:'result',
        choiceIndex:0,outcomeIndex:0,text:'이미 꺼낸 사진과 수첩',chips:[]};
      G.save();G.load();const before=JSON.stringify(S.flags);G.resumePresentation();UI.finishStory();
      return {id:document.querySelector('#ev-sheet').dataset.eventId,
        phase:document.querySelector('#ev-sheet').dataset.storyPhase,
        same:before===JSON.stringify(S.flags),text:document.querySelector('#ev-sheet').innerText};
    }""")
    assert actual['id']=='story_family_key' and actual['phase']=='outcome'
    assert actual['same'] and '이미 꺼낸 사진과 수첩' in actual['text']


@pytest.mark.parametrize('cid,choices,unearned', [
    ('parkss',['record','record','share'],'지난번 말한 판'),
    ('kangwoo',['trust','trust','rotate'],'발끝'),
])
def test_settled_camp_does_not_borrow_an_unchosen_second_night(page,cid,choices,unearned):
    result=page.evaluate("""({cid,choices})=>{
      for(const choice of choices){
        G.prepareCamp('talk',cid);G.resolveCampChoice(G.campConversationEvent().id,choice);
        S.campNight++;S.day++;S._campPlan={};
      }
      return S.campMemories[cid];
    }""",{'cid':cid,'choices':choices})
    assert unearned not in result['home']+result['road']


def test_default_ending_recall_is_visible_and_restorable(page):
    """Explicit layout fixture; the independent campaign proves earned recall."""
    output=ROOT/'artifacts/director-cohesion-20260914'
    output.mkdir(parents=True,exist_ok=True)
    page.evaluate("""()=>{
      S.party=['minji'];S.flags.core_transfer=true;
      S.opening={decisions:{opening_departure:{choiceId:'leave_key'}}};
      S.campMemories={minji:{choiceId:'listen',visits:2,
        home:D.campConversations.minji.followup.choices.listen.home}};
      // Normalize this intentionally small fixture before testing a second load;
      // migration defaults are not duplicate result effects.
      G.save();G.load();
      UI.restoreQaView({screen:'game'});
      document.documentElement.classList.remove('qa-exact-replay');
      UI.showEvent(D.events.find(ev=>ev.id==='seoul_night'));UI.finishStory();
    }""")
    page.locator('#ev-sheet .choice[data-i="0"]').click()
    page.evaluate('UI.finishStory()')
    for width,height,large in [(320,740,False),(390,844,True)]:
        page.set_viewport_size({'width':width,'height':height})
        page.evaluate("large=>document.documentElement.classList.toggle('ui-large-text',large)",large)
        recall=page.locator('.story-narration-text').filter(has_text='민지와 함께 보낸 시간이')
        assert recall.count()==1
        page.wait_for_timeout(700)
        recall.scroll_into_view_if_needed()
        box=recall.bounding_box()
        assert box and box['x']>=0 and box['x']+box['width']<=width+1
        assert box['y']>=0 and box['y']+box['height']<=height+1
        page.screenshot(path=str(output/(f'ending-memory-{width}'+('-large.png' if large else '.png'))))
    before=page.evaluate('JSON.stringify({flags:S.flags,memory:S.campMemories,reading:S.pendingPresentation.reading})')
    page.reload()
    if page.locator('#bt-continue').is_visible():
        page.locator('#bt-continue').click()
    page.wait_for_function("S&&document.querySelector('#ev-sheet').dataset.storyPhase==='outcome'")
    after=page.evaluate('JSON.stringify({flags:S.flags,memory:S.campMemories,reading:S.pendingPresentation.reading})')
    assert before==after
