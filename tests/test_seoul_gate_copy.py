#!/usr/bin/env python3
"""남산 진입 실패가 부족한 조건과 다음 행동을 평문으로 안내하는지 검증한다."""
from pathlib import Path

from playwright.sync_api import sync_playwright


URL = "http://127.0.0.1:4173/"
SHOT = Path("/tmp/caravan-seoul-gate-copy.png")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 480, "height": 860})
    page.add_init_script("localStorage.clear()")
    page.goto(URL, wait_until="load")
    page.wait_for_selector("#game")
    frame = next(candidate for candidate in page.frames if "/game?" in candidate.url)
    frame.wait_for_function("typeof G !== 'undefined' && typeof D !== 'undefined'")
    frame.evaluate(
        """() => {
          G.newGame('onroad','남산 관문 문구 점검','full');
          S.party=[];
          ['first_order_trace','parents_routes_traced','parent_key_found',
           'father_fate_known','mother_reunited','es_truth'].forEach(flag=>S.flags[flag]=true);
          G.openEvent(D.gateEvent);
        }"""
    )
    page.wait_for_timeout(350)
    full_copy = frame.evaluate("D.gateEvent.text(S)")
    assert "남산 진입 조건이 부족합니다" in full_copy, full_copy
    assert "현재 부족한 항목: 관계 0/" in full_copy, full_copy
    assert "함께 남산에 들어갈 동료들의 사정과 목적을 충분히 확인하지 않았습니다" in full_copy, full_copy
    assert "다음에 할 일:" in full_copy, full_copy
    assert "이어진 길" not in full_copy and "되돌아온 약속" not in full_copy, full_copy
    frame.evaluate("UI.finishStory()")
    page.wait_for_timeout(150)
    opening = frame.locator("#ev-sheet").inner_text()
    assert "남산 진입 조건이 부족합니다" in opening, opening
    assert "현재 부족한 항목: 관계 0/" in opening, opening
    assert "함께 남산에 들어갈 동료들의 사정과 목적을 충분히 확인하지 않았습니다" in opening, opening
    assert "다음에 할 일:" in opening, opening
    assert "이어진 길" not in opening and "되돌아온 약속" not in opening, opening

    labels = frame.locator("#ev-sheet .event-choice-dock .choice").all_inner_texts()
    assert labels == ["왜 이 조건이 필요한지 묻는다", "다음에 할 일을 적고 돌아간다"], labels
    page.screenshot(path=str(SHOT), full_page=False)

    success = frame.evaluate("D.seoulOpenEvent.text(S)")
    assert "동행 증언 완료" in success and "지역 연락망 연결" in success, success
    assert "강제 이송 중단 절차에 접근을 허가합니다" in success, success
    assert "이어진 길" not in success and "심사 이음망" not in success, success
    browser.close()

print(f"✅ 남산 관문이 부족 조건·이유·다음 행동을 직접 안내한다 · {SHOT}")
