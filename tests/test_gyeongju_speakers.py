#!/usr/bin/env python3
"""왕릉 소풍의 아이가 등장한 뒤 자기 얼굴과 이름으로 말하는가."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.add_init_script("localStorage.clear()")
    page.goto(GAME)
    result = page.evaluate(
        """() => {
          G.newGame('onroad','화자 점검','full');
          const event=D.events.find(item=>item.id==='loc_gyeongju');
          const outcome=event.choices[0].out[0];
          const turns=UI.storyTurns(outcome.text,event,{turnSpeakers:outcome.turnSpeakers});
          return {
            dialogue:turns.filter(turn=>turn.kind==='dialogue').map(turn=>({who:turn.who,name:turn.name||''})),
            narration:turns.filter(turn=>turn.kind==='narration').map(turn=>turn.text),
            childPortrait:Boolean(D.portraits.passer_child),
            playerPortrait:Boolean(D.portraits.me)
          };
        }"""
    )
    assert result["dialogue"] == [
        {"who": "passer_child", "name": "마을 아이"},
        {"who": "me", "name": ""},
        {"who": "passer_child", "name": "마을 아이"},
        {"who": "me", "name": ""},
        {"who": "me", "name": ""},
    ], result
    narration = " ".join(result["narration"])
    assert "아이 하나가 내 옆에 앉았다" in narration, result
    assert "아이는 옥수수를 다 먹고 친구들에게 뛰어갔다" in narration, result
    assert result["childPortrait"] and result["playerPortrait"], result
    browser.close()

print("✅ 왕릉 소풍 · 아이 등장/퇴장 · 화자/초상 고정")
