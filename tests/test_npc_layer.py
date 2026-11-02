#!/usr/bin/env python3
"""NPC 층 — 정착지의 사람들이 각자의 목소리로 말하는가.

2026-08-07 확장: 7→17명, 인물 전용 잡담(공용 풀 5줄을 전원이 돌려 쓰던
문제 해소), reveal 없는 로어 소문 지원. 이 검사는 그 계약을 지킨다.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / '서울까지400km.html').as_uri()
failures = []


def check(label, ok, detail=''):
    print(('  ✅ ' if ok else '  ❌ ') + label + (f' — {detail}' if detail else ''))
    if not ok:
        failures.append(label)


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)[:120]))
    page.add_init_script('localStorage.clear()')
    page.goto(GAME)

    data = page.evaluate("""() => {
      G.newGame('onroad','엔피시','full');
      const out={npcCount:Object.keys(D.npcs).length, thin:[], noChats:[], badReveal:[], dupChats:0, stateMissing:[]};
      for(const [k,v] of Object.entries(D.stls)) if((v.npcs||[]).length<2) out.thin.push(k);
      const seen=new Set();
      for(const [id,n] of Object.entries(D.npcs)){
        if(!n.chats||n.chats.length<5) out.noChats.push(id);
        for(const c of n.chats||[]){ if(seen.has(c)) out.dupChats++; seen.add(c); }
        if(n.rumor&&n.rumor.reveal&&!D.nodes[n.rumor.reveal]) out.badReveal.push(id);
        if(!S.npcs[id]) out.stateMissing.push(id);
        if((v=>!v.greet0||!v.greetGood||!v.greetBad)(n)) out.noChats.push(id+'(greet)');
      }
      return out;
    }""")
    check('NPC 15명 이상', data['npcCount'] >= 15, str(data['npcCount']))
    check('모든 정착지에 사람 2명 이상', not data['thin'], str(data['thin']))
    check('전원 전용 잡담 5줄 + 인사 3종', not data['noChats'], str(data['noChats']))
    check('잡담 중복 0 (돌려막기 없음)', data['dupChats'] == 0, str(data['dupChats']))
    check('소문 reveal 노드 전부 유효', not data['badReveal'], str(data['badReveal']))
    check('newGame이 전원 상태 생성', not data['stateMissing'], str(data['stateMissing']))

    flow = page.evaluate(r"""async () => {
      // Controlled valid visit: the real resident's settlement, daytime, stopped.
      const npc=D.npcs.gitae;
      S.at=npc.node; S.driving=null; S.min=600;
      const resources=()=>JSON.stringify({at:S.at,day:S.day,min:S.min,
        fuel:S.fuel,food:S.food,water:S.water,scrap:S.scrap,van:S.van,
        fatigue:S.fatigue,items:S.items,party:S.party});
      const before=resources(), metBefore=!!S.npcs.gitae.met, attBefore=S.npcs.gitae.att;
      UI.showStl(D.nodes[npc.node].stl,'people');
      const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const click=async selector=>{
        const button=document.querySelector(selector);
        if(!button) throw Error('Missing current NPC control: '+selector);
        button.click(); await tick();
      };
      const readToAction=async label=>{
        const seen=[];
        for(let i=0;i<80;i++){
          const reader=document.querySelector('#ev-sheet .story-reader');
          const text=reader?.textContent||'';
          if(text&&seen[seen.length-1]!==text) seen.push(text);
          const action=[...document.querySelectorAll('#ev-sheet [data-local-choice]')]
            .find(b=>b.textContent.trim()===label);
          if(action) return {text:seen.join(''),action};
          const next=document.querySelector('#ev-sheet .story-next');
          if(!next) throw Error('NPC reader has no next action: '+label);
          next.click(); await tick();
        }
        throw Error('NPC reader exceeded bounded page count: '+label);
      };
      await click('[data-person-key="npc-gitae"]');
      await click('#people-action');
      const greet=await readToAction('요즘 소문 들은 거 없어요?');
      greet.action.click(); await tick();
      const rumor=await readToAction('고맙습니다');
      rumor.action.click(); await tick();
      await click('[data-person-key="npc-gitae"]');
      await click('#people-action');
      const reopened=await readToAction('이런저런 얘기를 나눈다');
      reopened.action.click(); await tick();
      const chat=await readToAction('그만 일어난다');
      const normalize=text=>text.replace(/\s/g,'');
      const personal=(npc.chats||[]).some(text=>normalize(chat.text).includes(normalize(text)));
      chat.action.click(); await tick();
      return {rumorShown:normalize(rumor.text).includes(normalize(npc.rumor.text)),
        personalChat:personal,said:chat.text.slice(0,100),metBefore,metAfter:!!S.npcs.gitae.met,
        attitudeDelta:S.npcs.gitae.att-attBefore,resourcesUnchanged:resources()===before,
        rumorFlag:!!S.flags.rumor_gitae,rumorNote:S.notes.some(n=>n.title===npc.name+'의 소문'&&n.body===npc.rumor.text)};
    }""")
    check('무공개(로어) 소문이 크래시 없이 뜬다', bool(flow.get('rumorShown')), str(flow))
    check('잡담이 그 사람의 문장이다 (공용 풀 아님)', bool(flow.get('personalChat')), str(flow))
    check('실제 대화로 첫 만남과 소문 기록을 남긴다', not flow.get('metBefore') and flow.get('metAfter') and flow.get('rumorFlag') and flow.get('rumorNote'), str(flow))
    check('대화는 정당한 호감 +8 외 자원·시간·동료를 바꾸지 않는다', flow.get('attitudeDelta') == 8 and flow.get('resourcesUnchanged'), str(flow))
    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'NPC 층 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 정착지의 사람들이 각자의 목소리로 말한다')
