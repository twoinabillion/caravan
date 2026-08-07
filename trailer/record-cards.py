#!/usr/bin/env python3
"""텍스트 카드 4장을 게임 팔레트·타이프라이터 그대로 녹화한다 (1280x720 webm)."""
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
CARDS = [('1', 5.2), ('2', 5.2), ('3', 5.6), ('title', 5.0)]

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for card, secs in CARDS:
        ctx = browser.new_context(viewport={'width': 1280, 'height': 720},
                                  record_video_dir=str(HERE / 'rec'),
                                  record_video_size={'width': 1280, 'height': 720})
        page = ctx.new_page()
        page.goto((HERE / 'cards.html').as_uri() + f'?card={card}')
        page.wait_for_timeout(int(secs * 1000))
        video = page.video
        page.close()
        path = video.path()
        ctx.close()
        out = HERE / 'rec' / f'card-{card}.webm'
        Path(path).rename(out)
        print(f'✅ card-{card}: {out.stat().st_size//1024}KB')
    browser.close()
