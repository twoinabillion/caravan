#!/usr/bin/env python3
"""Typography stress capture for representative event turns and decisions."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / (sys.argv[1] if len(sys.argv) > 1 else "before")
URL = (ROOT / "서울까지400km.html").as_uri()


def enter_game(page):
    page.goto(URL)
    page.click("#bt-new")
    if page.locator("#scr-mode").is_visible():
        page.click("#mode-on")
    page.fill("#inp-name", "글자 검수")
    page.click("#bt-name")
    page.evaluate("UI.skipIntro()")
    page.wait_for_timeout(180)
    page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def candidates(page):
    return page.evaluate(
        r"""() => {
          const strip=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
          const rows=[];
          D.events.forEach(event=>{
            let raw='';
            try{ raw=typeof event.text==='function'?event.text(S):event.text; }catch(_){ return; }
            let turns=[];
            try{ turns=UI.storyTurns(raw,event,{turnSpeakers:event.turnSpeakers})||[]; }catch(_){ return; }
            turns.forEach((turn,index)=>rows.push({
              id:event.id,title:strip(event.title),index,kind:turn.kind||'narration',who:turn.who||'',
              portrait:!!(turn.who&&D.portraits&&D.portraits[turn.who]),text:strip(turn.text),length:strip(turn.text).length
            }));
          });
          const longest=(filter)=>rows.filter(filter).sort((a,b)=>b.length-a.length)[0];
          const choice=D.events.map(event=>({
            id:event.id,title:strip(event.title),count:(event.choices||[]).length,
            length:(event.choices||[]).reduce((sum,item)=>sum+strip(item.label).length,0)
          })).filter(item=>item.count>=2).sort((a,b)=>b.length-a.length)[0];
          const fixed=rows.find(item=>item.id==='story_family_key'&&item.kind==='record'&&item.portrait);
          return [
            {slot:'portrait-record',...(fixed||longest(item=>item.kind==='record'&&item.portrait))},
            {slot:'portrait-dialogue',...longest(item=>item.kind==='dialogue'&&item.portrait)},
            {slot:'long-narration',...longest(item=>item.kind==='narration')},
            {slot:'long-letter',...longest(item=>item.kind==='letter')},
            {slot:'long-choice',...choice,index:-1,kind:'decision'},
            {slot:'outcome',id:'story_family_key',title:'달구지 안의 검증키',index:-1,kind:'outcome'},
            {slot:'combat-outcome',id:'combat_walker_strike',title:'렌즈가 돌아오는 순간',index:-1,kind:'combat-outcome'}
          ].filter(item=>item.id);
        }"""
    )


def measure(page):
    return page.evaluate(
        r"""() => {
          const root=document.querySelector('#ev-sheet');
          const visible=node=>{
            const style=getComputedStyle(node),box=node.getBoundingClientRect();
            return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0;
          };
          const label=node=>String(node.textContent||node.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,100);
          const textNodes=[...root.querySelectorAll('.event-head h2,.turn-speaker small,.turn-speaker b,.turn-text,.chat-name,.chat-bubble,.story-narration-label,.story-narration-text,.choice-title>span:last-child,.event-result-kicker,.fx')].filter(visible);
          const clipped=textNodes.filter(node=>node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1).map(label);
          const outsideSurface=textNodes.filter(node=>{
            const surface=node.closest('.event-field-report,.event-result-receipt,.choice');
            if(!surface) return false;
            const box=node.getBoundingClientRect(),limit=surface.getBoundingClientRect();
            return box.left<limit.left-1||box.right>limit.right+1||box.top<limit.top-1||box.bottom>limit.bottom+1;
          }).map(label);
          const escaped=[...root.querySelectorAll('button,[role="button"]')].filter(visible).filter(node=>{
            const box=node.getBoundingClientRect(); return box.left<-1||box.right>innerWidth+1||box.top<-1||box.bottom>innerHeight+1;
          }).map(label);
          const small=[...root.querySelectorAll('button,[role="button"]')].filter(visible).filter(node=>{
            const box=node.getBoundingClientRect(); return box.width<44||box.height<44;
          }).map(node=>{const box=node.getBoundingClientRect();return `${label(node)} ${Math.round(box.width)}x${Math.round(box.height)}`;});
          const avatar=root.querySelector('.turn-avatar,.chat-avatar');
          const prose=root.querySelector('.turn-text,.chat-bubble');
          const speaker=root.querySelector('.turn-speaker>span,.chat-name');
          const overlap=(a,b)=>{
            if(!a||!b||!visible(a)||!visible(b)) return false;
            const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
            return x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
          };
          return {
            viewport:[innerWidth,innerHeight],phase:root.dataset.storyPhase||'',step:root.dataset.storyStep||'',
            title:label(root.querySelector('.event-head h2')),
            clipped,outsideSurface,escaped,small,documentOverflow:document.documentElement.scrollWidth>innerWidth+1,
            avatarProseOverlap:overlap(avatar,prose),avatarSpeakerOverlap:overlap(avatar,speaker),
            text:textNodes.map(node=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node);return {label:label(node),x:Math.round(box.x),y:Math.round(box.y),w:Math.round(box.width),h:Math.round(box.height),font:style.fontSize,line:style.lineHeight,align:style.textAlign};})
          };
        }"""
    )


def open_candidate(page, item):
    page.evaluate("id => UI.showEvent(D.events.find(event => event.id === id))", item["id"])
    if item["kind"] in {"outcome", "combat-outcome"}:
        page.evaluate("UI.finishStory()")
        page.evaluate("document.querySelector('.event-choice-dock .choice[data-i]:not([disabled])').click()")
        return
    if item["kind"] == "decision":
        page.evaluate("UI.finishStory()")
        return
    for _ in range(max(0, int(item.get("index", 0)))):
        if page.locator(".story-next").count() == 0:
            break
        page.click(".story-next")
        page.wait_for_timeout(35)


with sync_playwright() as playwright:
    OUT.mkdir(parents=True, exist_ok=True)
    browser = playwright.chromium.launch(channel="chrome")
    records = {}
    errors = []
    selected = None
    for width, height in ((320, 578), (390, 844), (475, 948)):
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        page.add_init_script("localStorage.clear();localStorage.setItem('caravan_story_auto','0')")
        page.on("pageerror", lambda error, w=width: errors.append(f"{w}: {error}"))
        enter_game(page)
        if selected is None:
            selected = candidates(page)
            if not any(item.get("slot") == "combat-outcome" for item in selected):
                selected.append({
                    "slot": "combat-outcome",
                    "id": "combat_walker_strike",
                    "title": "렌즈가 돌아오는 순간",
                    "index": -1,
                    "kind": "combat-outcome",
                })
        for order, item in enumerate(selected, 1):
            open_candidate(page, item)
            page.wait_for_timeout(90)
            name=f"{width}x{height}-{order:02d}-{item['slot']}"
            page.screenshot(path=OUT / f"{name}.png")
            records[name]={"candidate":item,"metrics":measure(page)}
        page.close()
    browser.close()
    (OUT / "metrics.json").write_text(json.dumps({"selected":selected,"states":records,"errors":errors},ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"selected":selected,"states":len(records),"errors":errors},ensure_ascii=False))
