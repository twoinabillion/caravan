#!/usr/bin/env python3
"""Source contracts for the restrained road/event interface."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
scene = (ROOT / "src/05-scene.js").read_text(encoding="utf-8")
ui = (ROOT / "src/07-ui.js").read_text(encoding="utf-8")

assert "function signs(" not in scene, "주행 배경의 자동 거리 표지판이 되살아났다"
assert "signTexts" not in scene, "거리 표지판 텍스트 수집기가 남아 있다"
assert "scene-cut-mark" not in ui, "사건 컷 번호 장식이 되살아났다"
assert "story-auto-toggle" not in ui, "사건 자동 진행 토글이 되살아났다"
assert "choice-dock-head" not in ui, "사건 선택지 위 중복 헤더가 되살아났다"
assert 'class="sr-only" data-event-progress' in ui, "접근성용 사건 진행 상태가 빠졌다"
assert "f<0.5?S.driving.from:S.driving.to" not in scene, "주행 중간 지점의 즉시 배경 교체가 되살아났다"
assert "function drawRoadBackdrop(" in scene, "주행 배경 크로스페이드 합성기가 빠졌다"
assert "raw*raw*raw*(raw*(raw*6-15)+10)" in scene, "주행 배경의 smootherstep 전환이 빠졌다"

print("✅ 거리 표지판 제거 · 사건 장식 최소화 · 접근성 진행 상태 · 주행 배경 전환 유지")
