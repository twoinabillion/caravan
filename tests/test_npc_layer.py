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

    flow = page.evaluate(r"""() => new Promise(res=>{
      S.at='suwon'; UI.showStl('suwon','people');
      setTimeout(()=>{
        const row=document.querySelector('[data-person-key="npc-gitae"]');
        if(!row) return res({err:'기태 행 없음'});
        row.click();
        document.querySelector('#people-action')?.click();
        setTimeout(()=>{
          const rumorBtn=document.querySelector('[data-r="rumor"]');
          rumorBtn&&rumorBtn.click();
          setTimeout(()=>{
            const rumorShown=(document.querySelector('.dlg.talk .say')||{}).textContent||'';
            const ok=document.querySelector('[data-r="x2"]'); ok&&ok.click();
            setTimeout(()=>{
              const row2=document.querySelector('[data-person-key="npc-gitae"]');
              row2.click();
              document.querySelector('#people-action')?.click();
              setTimeout(()=>{
                const chatBtn=document.querySelector('[data-r="chat"]');
                chatBtn&&chatBtn.click();
                setTimeout(()=>{
                  const said=((document.querySelector('.dlg.talk .say')||{}).textContent||'').replace(/^기태\s*/,'').trim();
                  const personal=(D.npcs.gitae.chats||[]).some(c=>said&&c.includes(said.slice(1,20)));
                  res({rumorShown:rumorShown.includes('편지'), personalChat:personal, said:said.slice(0,40)});
                },250);
              },300);
            },250);
          },250);
        },300);
      },400);
    })""")
    check('무공개(로어) 소문이 크래시 없이 뜬다', bool(flow.get('rumorShown')), str(flow))
    check('잡담이 그 사람의 문장이다 (공용 풀 아님)', bool(flow.get('personalChat')), str(flow))
    check('콘솔 pageerror 없음', not errors, '; '.join(errors[:3]))
    browser.close()

if failures:
    raise SystemExit(f'NPC 층 검증 실패 {len(failures)}건: ' + ', '.join(failures))
print('✅ 정착지의 사람들이 각자의 목소리로 말한다')
