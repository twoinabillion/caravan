#!/usr/bin/env python3
"""Diagnostic fixtures: optional camp dialogue, guests, exact-once saves and next road echo."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('CARAVAN_TEST_URL',(ROOT/'서울까지400km.html').as_uri())

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome')
        page=browser.new_page(viewport={'width':390,'height':844})
        page.goto(URL)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        for cid in ['minji','parkss','leo','jaeyi','eunsu','kangwoo']:
            for stage in ['road','follow']:
                result=page.evaluate('''({cid,stage})=>{
                  G.newGame('onroad','검수','full');
                  S.at='gyeongju'; S.day=3; S.min=1100;
                  S.recruitQ={id:cid,stage,roadDay:3,roadFrom:'ulsan',target:'gyeongju',choice:Object.keys(D.recruitQuests[cid].approaches)[0]};
                  S.lastJourneyRecap={from:'ulsan',to:'gyeongju',day:3,km:42};
                  S.lastCombatReport={result:'후퇴',resultCode:'retreat',objective:'통로 확보'};
                  S.opening={decisions:{opening_bus_repair:{label:'낡은 부품을 손질한다',choiceId:'repair'}}};
                  const participants=G.campParticipants();
                  const started=G.prepareCamp('talk',cid);
                  const ev=G.campConversationEvent();
                  const before={minute:S.day*1440+S.min,scrap:S.scrap};
                  G.save(); S=null; G.load();
                  const restored=G.campConversationEvent();
                  const chosen=G.resolveCampChoice(restored.id,restored.choices[0].id);
                  const memory=JSON.stringify(S.campMemories[cid]);
                  const after={minute:S.day*1440+S.min,scrap:S.scrap};
                  G.save(); S=null; G.load();
                  const again=G.resolveCampChoice(restored.id,restored.choices[0].id);
                  const other=G.resolveCampChoice(restored.id,restored.choices[1].id);
                  const locked=G.prepareCamp('talk',cid);
                  return {participants,started,ev,restored,chosen,again,other,locked,before,after,
                    final:{minute:S.day*1440+S.min,scrap:S.scrap},memorySame:memory===JSON.stringify(S.campMemories[cid]),
                    party:S.party,stage:S.recruitQ.stage,home:S.campMemories[cid],echo:G.campTravelEcho()};
                }''',{'cid':cid,'stage':stage})
                assert cid in result['participants'], result
                assert result['started']['ok'] and result['ev']['campConversation'],result
                assert result['ev']['id']==result['restored']['id'],result
                assert '울산' in result['ev']['text'] and '경주' in result['ev']['text'], result
                assert '후퇴' in result['ev']['text'] and '낡은 부품' in result['ev']['text'],result
                assert result['chosen']['applied'] and not result['again']['applied'],result
                assert not result['other']['ok'] and not result['locked']['ok'],result
                assert result['final']==result['after'] and result['memorySame'],result
                assert result['after']['minute']>result['before']['minute'],result
                assert cid not in result['party'] and result['stage']==stage,result
                assert result['home']['home'] and result['echo']['text'],result
        recruitment=page.evaluate('''()=>{
          const modal=UI.modalOpen, show=UI.showEvent, random=rng;
          UI.modalOpen=()=>false; rng=()=>0.99;
          const rows=Object.keys(D.campConversations).map(cid=>{
            G.newGame('onroad','좌석 검수','full'); S.at='gyeongju';
            S.party=Object.keys(D.campConversations).filter(id=>id!==cid).slice(0,G.maxParty());
            S.party.forEach(id=>S.comps[id]={mood:65,bond:5,lvl:0,perks:[],pending:1});
            S.recruitQ={id:cid,stage:'follow',roadDay:S.day,target:S.at};
            let event=null; UI.showEvent=ev=>event=ev.id;
            const beforeNight=G.openRecruitStep(); G.camp();
            const afterNight=G.openRecruitStep(); G.save(); S=null; G.load();
            const full=G.doRecruit(cid); S.party.pop(); const joined=G.doRecruit(cid);
            return {cid,beforeNight,afterNight,event,full,joined};
          });
          UI.modalOpen=modal; UI.showEvent=show; rng=random;
          return rows;
        }''')
        for row in recruitment:
            assert not row['beforeNight'] and row['afterNight'],row
            assert row['event']==f"rq_{row['cid']}_join" and not row['full'] and row['joined'],row
        costs=page.evaluate('''()=>{
          const rows=[['minji','sort','부품'],['leo','quiet','water'],['jaeyi','shelf','scrap']].map(([cid,choice,key])=>{
            G.newGame('onroad','물자 검수','full'); S.recruitQ={id:cid,stage:'road'};
            G.prepareCamp('talk',cid); const event=G.campConversationEvent();
            if(key==='부품') S.items[key]=0; else S[key]=0;
            const before=S.day*1440+S.min, rejected=G.resolveCampChoice(event.id,choice);
            return {cid,rejected,untouched:before===S.day*1440+S.min&&!S.campMemories[cid]};
          });
          return rows;
        }''')
        assert all(not row['rejected']['ok'] and row['untouched'] for row in costs),costs
        # Cancel/revisit, midnight locking, old save migration, cost validation and guest bond transfer.
        edge=page.evaluate('''()=>{
          G.newGame('onroad','검수','full'); S.at='gyeongju'; S.day=3; S.min=1438;
          S.recruitQ={id:'jaeyi',stage:'follow',roadDay:2,target:'gyeongju'};
          G.prepareCamp('talk','jaeyi'); const first=G.campConversationEvent();
          S.campConversation.active=false; G.save(); S=null; G.load();
          G.prepareCamp('talk','jaeyi'); const revisit=G.campConversationEvent();
          S.scrap=0; const denied=G.resolveCampChoice(revisit.id,'shelf');
          const before=S.day*1440+S.min;
          const chosen=G.resolveCampChoice(revisit.id,'space');
          const locked=G.prepareCamp('talk','jaeyi');
          const credit=S.campMemories.jaeyi.pendingBond;
          G.doRecruit('jaeyi'); const joined=S.comps.jaeyi.bond;
          G.doRecruit('jaeyi'); const duplicate=S.comps.jaeyi.bond;
          document.querySelectorAll('.ovl,#ev-wrap').forEach(n=>n.classList.remove('on'));
          const modal=UI.modalOpen; UI.modalOpen=()=>false; G.camp(); UI.modalOpen=modal;
          const next=G.prepareCamp('talk','jaeyi');
          const echo=G.campTravelEcho();
          delete S.campConversation; delete S.campMemories; delete S.campNight;
          S._campPlan={talk:'jaeyi'}; G.save(); S=null; G.load();
          return {same:first.id===revisit.id,denied,chosen,locked,credit,joined,duplicate,next,echo,
            migration:G.campParticipants().includes('jaeyi')&&!S._campPlan.talk};
        }''')
        assert edge['same'] and not edge['denied']['ok'],edge
        assert edge['chosen']['applied'] and not edge['locked']['ok'],edge
        assert edge['credit']==2 and edge['joined']==7 and edge['duplicate']==7,edge
        assert edge['next']['ok'] and edge['migration'],edge
        handoff=page.evaluate('''()=>{
          const modal=UI.modalOpen, show=G.openEventById;
          let opened=0; G.openEventById=()=>opened++; UI.modalOpen=()=>true;
          const current=S;
          G.presentCampEvent('camp_thief',current);
          const queued=S._storyQueue.includes('camp_thief');
          G.newGame('onroad','다음 게임','full'); UI.modalOpen=()=>false;
          G.presentCampEvent('camp_thief',current);
          G.openEventById=show; UI.modalOpen=modal;
          return {queued,opened};
        }''')
        assert handoff['queued'] and handoff['opened']==0,handoff
        multiple=page.evaluate('''()=>{
          G.newGame('onroad','두 밤 검수','full'); S.at='gyeongju';
          S.party=['minji','parkss'];
          S.party.forEach(id=>S.comps[id]={mood:65,bond:5,lvl:0,perks:[],pending:1});
          const modal=UI.modalOpen, arrival=UI.onArrive, show=UI.showEvent;
          UI.modalOpen=()=>false; UI.onArrive=()=>0; UI.showEvent=()=>{};
          G.prepareCamp('talk','minji'); G.resolveCampChoice(G.campConversationEvent().id,'listen');
          G.camp();
          G.prepareCamp('talk','parkss'); G.resolveCampChoice(G.campConversationEvent().id,'record');
          const pending=G.campTravelEchoes().map(row=>row.cid);
          const to=G.neighbors(S.at).find(row=>G.canTravelTo(row.id).ok).id;
          const departed=G.startTravel(to), first=G.campDriveEchoes().map(row=>row.cid);
          G.save(); S=null; G.load();
          const reloaded=G.campDriveEchoes().map(row=>row.cid), remaining=G.campTravelEchoes().length;
          const legacy=G.campDriveEchoes()[0]; delete S.driving.campEchoes; S.driving.campEcho=legacy;
          G.save(); S=null; G.load(); const legacyRead=G.campDriveEchoes().map(row=>row.cid);
          G.arrive();
          const next=G.neighbors(S.at).find(row=>G.canTravelTo(row.id).ok).id;
          const departedAgain=G.startTravel(next), second=G.campDriveEchoes();
          UI.modalOpen=modal; UI.onArrive=arrival; UI.showEvent=show;
          return {pending,departed,first,reloaded,remaining,legacyRead,departedAgain,second};
        }''')
        assert multiple['pending']==['minji','parkss'] and multiple['departed'],multiple
        assert multiple['first']==multiple['reloaded']==['minji','parkss'],multiple
        assert multiple['remaining']==0 and multiple['legacyRead']==['minji'],multiple
        assert multiple['departedAgain'] and multiple['second']==[],multiple
        corrupt=page.evaluate('''()=>{
          G.newGame('onroad','부분 저장 검수','full'); S.recruitQ={id:'minji',stage:'road'};
          G.prepareCamp('talk','minji'); G.resolveCampChoice(G.campConversationEvent().id,'listen');
          const minute=S.day*1440+S.min;
          S.campConversation.chips=null;
          S.campMemories={minji:null,parkss:{pendingBond:'not-a-number',pendingRoad:true,road:'기록을 건넨다.'},
            leo:{pendingBond:-12},jaeyi:{pendingBond:Infinity},bad:{pendingBond:3}};
          G.save(); S=null; const loaded=G.load();
          const replay=G.resolveCampChoice(G.campConversationEvent().id,'listen');
          const credits=Object.values(S.campMemories).map(row=>row.pendingBond);
          G.doRecruit('parkss'); const bond=S.comps.parkss.bond;
          S.campConversation={cid:'unknown',night:0}; G.save(); S=null; G.load();
          return {loaded,replayed:replay.ok&&!replay.applied,minuteUnchanged:minute===S.day*1440+S.min,
            credits,bond,unknownCleared:S.campConversation===null,rows:Object.keys(S.campMemories)};
        }''')
        assert corrupt['loaded'] and corrupt['replayed'] and corrupt['minuteUnchanged'],corrupt
        assert all(value==0 for value in corrupt['credits']) and corrupt['bond']==5,corrupt
        assert corrupt['unknownCleared'] and 'bad' not in corrupt['rows'] and 'minji' not in corrupt['rows'],corrupt
        assert not errors,errors
        browser.close()
    print('PASS: camp guests/choices/saves, all pending next-leg behaviors, legacy echoes, second-leg nonduplication and partial-save corruption')
if __name__=='__main__': main()
