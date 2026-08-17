#!/usr/bin/env python3
"""58개 도착·7개 대도시·17명 상주 NPC를 같은 규격으로 전수 검수한다."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
GAME = (ROOT / "서울까지400km.html").as_uri()
AUDIT = Path(__file__).resolve().parent
VIEWPORTS = ((320, 578), (390, 844), (475, 948))


def boot(page):
    page.goto(GAME)
    page.evaluate(
        """() => {
          localStorage.clear();
          localStorage.setItem('caravan_story_auto','0');
          G.newGame('onroad','다온','full');
          S.party=['minji','parkss','kangwoo'];
          S.lastJourneyRecap=null;
          document.querySelectorAll('.scr,.screen').forEach(node => node.classList.remove('on'));
          document.querySelector('#scr-game').classList.add('on');
          UI.renderAll();
        }"""
    )


def settle(page):
    page.evaluate(
        """() => document.querySelectorAll('*').forEach(node =>
          node.getAnimations?.().forEach(animation => {
            try { animation.finish(); } catch (_) {}
          }))"""
    )
    page.wait_for_timeout(45)


def measure(page, selector):
    return page.evaluate(
        r"""selector => {
          const root=document.querySelector(selector);
          const visible=node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
          const controls=[...root.querySelectorAll('button,[role="button"],a[href]')].filter(visible);
          const horizontal=controls.filter(node=>{const r=node.getBoundingClientRect();return r.left<-1||r.right>innerWidth+1});
          const small=controls.filter(node=>{const r=node.getBoundingClientRect();return r.width<43.5||r.height<43.5});
          const images=[...root.querySelectorAll('img')].filter(visible).map(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {alt:node.alt,natural:[node.naturalWidth,node.naturalHeight],rendered:[Math.round(r.width),Math.round(r.height)],fit:s.objectFit,rendering:s.imageRendering};});
          const label=node=>String(node.getAttribute('aria-label')||node.textContent||node.className||node.tagName).replace(/\s+/g,' ').trim().slice(0,100);
          return {documentOverflow:document.documentElement.scrollWidth>innerWidth+1,horizontal:horizontal.map(label),small:small.map(label),images};
        }""",
        selector,
    )


def capture_arrivals(page, out, width, metrics):
    nodes = page.evaluate("Object.entries(D.nodes).map(([id,node])=>({id,name:node.name}))")
    for index, node in enumerate(nodes, start=1):
        page.evaluate("id=>{S.at=id;S.lastJourneyRecap=null;UI.onArrive()}", node["id"])
        page.wait_for_function("document.querySelector('#arrival-scene')?.classList.contains('on')")
        page.wait_for_function("document.querySelector('#arrival-scene .arrival-art')?.complete ?? true")
        settle(page)
        key=f"arrival:{node['id']}"
        data=measure(page, "#arrival-scene")
        data.update(page.evaluate("() => {const root=document.querySelector('#arrival-scene'),img=root.querySelector('.arrival-art'),r=img?.getBoundingClientRect();return {mode:root.classList.contains('arrival-portrait')?'portrait':root.classList.contains('arrival-landscape')?'landscape':'fallback',artRatio:r&&r.height?r.width/r.height:0};}"))
        metrics[key]=data
        if width == 390:
            page.screenshot(path=str(out / "arrivals" / f"{index:02d}-{node['id']}.png"))
        page.evaluate("document.querySelector('#arrival-scene').classList.remove('on')")


def capture_settlements(page, out, width, metrics):
    settlements = page.evaluate("Object.entries(D.stls).map(([id,stl])=>({id,name:stl.name,npcs:[...stl.npcs]}))")
    for index, stl in enumerate(settlements, start=1):
        page.evaluate("id=>{S.at=id;S.visited=[...new Set([...S.visited,id])];UI.showStl(id,'people')}", stl["id"])
        page.wait_for_function("[...document.querySelectorAll('#stl-body img')].every(img=>img.complete)")
        settle(page)
        key=f"people:{stl['id']}"
        data=measure(page, "#ovl-stl")
        data.update(page.evaluate("() => ({duplicateParty:document.querySelectorAll('#stl-body .stl-section-party').length,talkSlots:document.querySelectorAll('#stl-talk-slot').length,residents:document.querySelectorAll('.stl-resident-list .npc-row').length})"))
        metrics[key]=data
        if width == 390:
            page.screenshot(path=str(out / "settlements" / f"{index:02d}-{stl['id']}-people.png"))

        for npc_index, npc in enumerate(stl["npcs"], start=1):
            page.evaluate("id=>UI.showStl(id,'people')", stl["id"])
            page.click(f'[data-npc="{npc}"]')
            page.wait_for_function("[...document.querySelectorAll('#stl-body img')].every(img=>img.complete)")
            settle(page)
            talk_key=f"talk:{stl['id']}:{npc}"
            talk_data=measure(page, "#ovl-stl")
            talk_data.update(page.evaluate("npc => {const hero=document.querySelector('.stl-section-hero'),talk=document.querySelector('#stl-talk-slot .dlg.talk'),list=document.querySelector('.stl-resident-list'),selected=document.querySelector('.npc-row.talking');const top=node=>node?.getBoundingClientRect().top??-1;return {order:[top(hero),top(talk),top(list)],selected:selected?.dataset.npc||'',oneTalk:document.querySelectorAll('#stl-talk-slot .dlg.talk').length,legacy:(D.legacyIllustratedPortraits||[]).includes(npc)};}", npc))
            metrics[talk_key]=talk_data
            if width == 390:
                page.screenshot(path=str(out / "dialogues" / f"{index:02d}-{npc_index:02d}-{stl['id']}-{npc}.png"))

    metrics["portrait-inventory"] = page.evaluate(
        """() => Object.entries(D.portraits).map(([id,src])=>({id,src,legacy:(D.legacyIllustratedPortraits||[]).includes(id),npc:!!D.npcs[id],comp:!!D.comps[id]}))"""
    )


def run_viewport(browser, label, width, height, all_metrics, errors):
    page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
    page.on("pageerror",lambda error: errors.append(f"{width}x{height}: {error}"))
    boot(page)
    out=AUDIT/label
    if width == 390:
        (out/"arrivals").mkdir(parents=True,exist_ok=True)
        (out/"settlements").mkdir(parents=True,exist_ok=True)
        (out/"dialogues").mkdir(parents=True,exist_ok=True)
    metrics={}
    capture_arrivals(page,out,width,metrics)
    capture_settlements(page,out,width,metrics)
    all_metrics[f"{width}x{height}"]=metrics
    page.close()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("label",choices=("before","after"))
    args=parser.parse_args()
    all_metrics,errors={},[]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(channel="chrome")
        for width,height in VIEWPORTS:
            run_viewport(browser,args.label,width,height,all_metrics,errors)
        browser.close()
    output=AUDIT/args.label/"metrics.json"
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps({"viewports":all_metrics,"errors":errors},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"viewports":len(all_metrics),"states":sum(len(value) for value in all_metrics.values()),"errors":errors},ensure_ascii=False))


if __name__ == "__main__":
    main()
