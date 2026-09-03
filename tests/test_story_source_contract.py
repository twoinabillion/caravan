#!/usr/bin/env python3
"""회상·기록·증언의 출처와 회수조 화자/초상을 실제 빌드에서 고정한다."""
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "서울까지400km.html").as_uri()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 480, "height": 820})
    page.add_init_script("localStorage.clear()")
    page.goto(GAME)

    result = page.evaluate(
        """() => {
          const event=id=>D.events.find(item=>item.id===id);
          const sourceIds=[
            'memory_busan_terminal','parents_diversion_manifest','parents_separated_work',
            'parents_father_last_log','history_parents_network','parents_mother_reunion',
            'parents_mother_truth','story_family_principle','story_family_key'
          ];
          const sources=Object.fromEntries(sourceIds.map(id=>[id,event(id)?.storyOrigin||null]));
          const scenes=Object.fromEntries([
            'parents_diversion_manifest','parents_separated_work','parents_father_last_log',
            'history_parents_network','story_family_principle'
          ].map(id=>[id,event(id)?.scenes||[]]));
          const cleaners=event('cleaners_recall');
          const turns=UI.storyTurns(cleaners.text,cleaners,{turnSpeakers:cleaners.turnSpeakers});
          G.newGame('onroad','장면 출처 점검','full');
          G.openEventById('parents_diversion_manifest');
          const origin=document.querySelector('#ev-sheet .story-origin');
          return {
            sources,
            scenes,
            memoryText:event('memory_busan_terminal').text,
            memoryOutcomes:event('memory_busan_terminal').choices.flatMap(choice=>choice.out).map(out=>out.text),
            cleanerDialogue:turns.filter(turn=>turn.kind==='dialogue').map(turn=>({who:turn.who,name:turn.name||''})),
            cleanerPortraits:{man:D.portraits.passer_man||'',woman:D.portraits.passer_woman||''},
            recordPortrait:D.eventPortraits.parents_diversion_manifest||'',
            originDom:origin?{kind:origin.dataset.originKind,text:origin.textContent.trim()}:null
          };
        }"""
    )
    record_screenshot = Path("/tmp/caravan-story-source-record.png")
    page.screenshot(path=str(record_screenshot), full_page=False)
    page.evaluate("G.openEventById('memory_busan_terminal')")
    page.wait_for_timeout(350)
    memory_screenshot = Path("/tmp/caravan-story-source-memory.png")
    page.screenshot(path=str(memory_screenshot), full_page=False)

    assert result["sources"]["memory_busan_terminal"]["kind"] == "memory", result
    assert result["sources"]["parents_diversion_manifest"]["kind"] == "record", result
    assert result["sources"]["parents_separated_work"]["kind"] == "record", result
    assert result["sources"]["parents_father_last_log"]["kind"] == "record", result
    assert result["sources"]["history_parents_network"]["kind"] == "record", result
    assert result["sources"]["parents_mother_reunion"]["kind"] == "present", result
    assert result["sources"]["parents_mother_truth"]["kind"] == "testimony", result
    assert result["sources"]["story_family_principle"]["kind"] == "video", result
    assert result["sources"]["story_family_key"]["kind"] == "audio", result

    assert result["scenes"]["parents_diversion_manifest"] == ["parents-diversion-record-v2"], result
    assert result["scenes"]["parents_separated_work"] == ["parents-linked-records-v2"], result
    assert result["scenes"]["parents_father_last_log"] == ["parents-father-last-log-record-v2"], result
    assert result["scenes"]["history_parents_network"] == ["history-parents-network-record-v2"], result
    assert result["scenes"]["story_family_principle"] == ["story-family-principle-review-v1"], result

    assert "그 불빛을 보자" in result["memoryText"], result
    assert all("기억" in text or "폐환승소" in text or "달구지" in text
               for text in result["memoryOutcomes"]), result
    assert result["cleanerDialogue"] == [
        {"who": "passer_man", "name": "회수조 선두"},
        {"who": "passer_man", "name": "회수조 선두"},
        {"who": "passer_woman", "name": "붙잡힌 여자"},
        {"who": "passer_man", "name": "회수조 선두"},
    ], result
    assert result["cleanerPortraits"]["man"], result
    assert result["cleanerPortraits"]["woman"], result
    assert result["cleanerPortraits"]["man"] != result["cleanerPortraits"]["woman"], result
    assert result["recordPortrait"] == "", result
    assert result["originDom"] == {
        "kind": "record",
        "text": "발견한 기록남쪽 환승소 운행표",
    }, result
    browser.close()

print(
    "✅ 회상·기록·증언 출처 · 증거 장면 · 회수조 화자 고정 · "
    f"{record_screenshot} · {memory_screenshot}"
)
