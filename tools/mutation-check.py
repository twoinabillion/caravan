#!/usr/bin/env python3
"""게이트가 지킨다는 걸 증명한다 — 기능을 부러뜨리면 빨개지는가.

2026-08-06~07 적대적 재검증 5라운드 연속으로 '거짓 통과' 게이트가 나왔다:
- test_finale: 자물쇠 셋 중 하나만 잠겨도 초록
- test_combat: `|| fx.note` 때문에 이탈 대가를 다 지워도 초록
- test_eta: 속도 상수를 3.32배 틀려도 초록 (하드코딩)
- 결말 4종: 배선 없이 화면 텍스트만 있어도 아무 게이트도 안 빨개짐

게이트를 못 믿으면 초록이 정보가 아니다. 이 도구는 정의된 뮤테이션(기능 제거)을
하나씩 적용→빌드→해당 게이트 실행→'빨개져야 통과'를 확인하고 원상복구한다.

실행: python3 tools/mutation-check.py            # 전체
      python3 tools/mutation-check.py --only eta  # 이름 필터
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 각 항목: 이 변형(old→new)을 적용하면 test가 반드시 실패해야 한다.
# old 문자열은 파일에 정확히 1회 존재해야 한다 — 아니면 뮤테이션 자체가 무효.
MUTATIONS = [
    {
        'name': 'finale-endjourney',
        'why': '에필로그가 여정을 닫지 않으면 도착 결말 3종이 전부 죽는다',
        'file': 'src/03-data.js',
        'old': "fx:{flag:'story_done', endJourney:1, moodAll:5",
        'new': "fx:{flag:'story_done', moodAll:5",
        'test': ['python3', 'tests/test_finale.py'],
    },
    {
        'name': 'finale-stranded',
        'why': '좌초 트리거를 지우면 stranded 엔딩이 텍스트로만 남는다',
        'file': 'src/04b-engine-crew.js',
        'old': "if(S._strandedDays>=2){ G.endGame('stranded'); return; }",
        'new': "if(false){ G.endGame('stranded'); return; }",
        'test': ['python3', 'tests/test_finale.py'],
    },
    {
        'name': 'finale-shunned',
        'why': '기피 트리거를 지우면 shunned 엔딩이 텍스트로만 남는다',
        'file': 'src/04b-engine-crew.js',
        'old': "if(S._shunnedDays>=4){ G.endGame('shunned'); return; }",
        'new': "if(false){ G.endGame('shunned'); return; }",
        'test': ['python3', 'tests/test_finale.py'],
    },
    {
        'name': 'eta-speed',
        'why': '예상 시간이 실제 주행과 어긋나도 아무도 모른다 (3.32배 회귀 실측)',
        'file': 'src/04c-engine-travel.js',
        'old': 'G.driveMinutes = (km)=> Math.ceil((Number(km)||0)/KMH*60);',
        'new': 'G.driveMinutes = (km)=> Math.ceil((Number(km)||0)/KMH*60*3);',
        'test': ['python3', 'tests/test_eta_consistency.py'],
    },
    {
        'name': 'pillar-slot',
        'why': '기둥 접선 슬롯을 지우면 완주가 다시 운에 갇힌다',
        'file': 'src/04c-engine-travel.js',
        'old': "if(D.events.some(e=>e.pillar&&G.pillarUnmet(e.pillar))){\n      slots.push({at:chk.km*(0.5+rng()*0.3), pillarPick:true});",
        'new': "if(false){\n      slots.push({at:chk.km*(0.5+rng()*0.3), pillarPick:true});",
        'test': ['python3', 'tools/simulate-engine.py', '--runs', '16', '--max-days', '50'],
    },
    {
        'name': 'combat-prep-bypass',
        'why': '준비 우회를 끄면 counters는 다시 장식이 되고 전투가 전부 굴림으로 돌아간다',
        'file': 'src/04b-engine-crew.js',
        'old': "&& choice.tactic && evd.combat && evd.combat.counters && evd.combat.counters[choice.tactic]",
        'new': "&& false && choice.tactic && evd.combat && evd.combat.counters && evd.combat.counters[choice.tactic]",
        'test': ['python3', 'tests/test_combat_rework.py'],
    },
    {
        'name': 'companion-drive-echo',
        'why': '접근 방식 기억을 지우면 영입 선택이 다시 문구로만 남는다',
        'file': 'src/04c-engine-travel.js',
        'old': "    dv.recruitMemory={id,choice,title:drive.title,desc:drive.desc,effect:drive.effect};",
        'new': "    if(false) dv.recruitMemory={id,choice,title:drive.title,desc:drive.desc,effect:drive.effect};",
        'test': ['python3', 'tests/test_companions_e2e.py'],
    },
    {
        'name': 'seoul-ascent',
        'why': '정거장 진행이 끊기면 최종막이 관문에서 멈춘 채 초록일 수 있다',
        'file': 'src/04e-engine-world.js',
        'old': "G.seoulEnter = (i)=>{\n  const ev = D.seoulStops.find(e=>e.seoulStop===i);\n  if(ev) G.openEvent(ev);",
        'new': "G.seoulEnter = (i)=>{\n  const ev = null;\n  if(ev) G.openEvent(ev);",
        'test': ['python3', 'tests/test_seoul_sequence.py'],
    },
    {
        'name': 'keyboard-numbers',
        'why': '숫자키 배선을 끊으면 키보드만으로는 선택을 진행할 수 없다',
        'file': 'src/07-ui.js',
        'old': "if(modal&&/^[1-9]$/.test(e.key)&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){",
        'new': "if(false&&modal&&/^[1-9]$/.test(e.key)&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){",
        'test': ['python3', 'tests/test_keyboard_access.py'],
    },
    {
        'name': 'start-profile-patch',
        'why': '패치 적용을 끊으면 프로필 3종이 같은 시작이 된다 — 선택이 장식이 된다',
        'file': 'src/04a-engine-core.js',
        'old': "  if(prof&&prof.patch) for(const [k,v] of Object.entries(prof.patch))",
        'new': "  if(false&&prof&&prof.patch) for(const [k,v] of Object.entries(prof.patch))",
        'test': ['python3', 'tests/test_start_profiles.py'],
    },
    {
        'name': 'threat-adaptation',
        'why': '적응을 끄면 한 번 배운 위협은 영원히 확정 — 학습 대 학습 축이 죽는다',
        'file': 'src/04b-engine-crew.js',
        'old': "    && G.threatAdaptedTactic(evd)!==choice.tactic   /* 기계도 배운다 — 바뀐 패턴엔 옛 해법이 안 통한다 */",
        'new': "    && true   /* 기계도 배운다 — 바뀐 패턴엔 옛 해법이 안 통한다 */",
        'test': ['python3', 'tests/test_combat_rework.py'],
    },
    {
        'name': 'keyboard-travel',
        'why': '지도 키보드 배선을 끊으면 여행이 마우스 전용으로 돌아간다',
        'file': 'src/07-ui.js',
        'old': "      if(mapOvl&&mapOvl.classList.contains('on')&&!(e.target&&e.target.closest&&e.target.closest('input, textarea, select'))){",
        'new': "      if(false&&mapOvl&&mapOvl.classList.contains('on')){",
        'test': ['python3', 'tests/test_keyboard_access.py'],
    },
]


def run(cmd, timeout=900):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)


def rebuild():
    r = run(['npm', 'run', 'build:html'])
    if r.returncode != 0:
        raise RuntimeError(f'빌드 실패:\n{r.stderr[-500:]}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='', help='이름 부분일치 필터')
    args = ap.parse_args()

    todo = [m for m in MUTATIONS if args.only in m['name']]
    if not todo:
        raise SystemExit(f'뮤테이션 없음: {args.only}')

    failures = []
    for m in todo:
        path = ROOT / m['file']
        original = path.read_text()
        count = original.count(m['old'])
        if count != 1:
            failures.append(f"{m['name']}: 앵커 문자열이 {count}회 존재 (1회여야 함) — 뮤테이션 무효")
            print(f"  ⚠️  {m['name']} — 앵커 불일치 ({count}회)")
            continue
        backup = original
        try:
            path.write_text(original.replace(m['old'], m['new']))
            rebuild()
            r = run(m['test'])
            if r.returncode == 0:
                failures.append(f"{m['name']}: 기능을 부러뜨렸는데 게이트가 초록 — {m['why']}")
                print(f"  ❌ {m['name']} — 거짓 통과! ({' '.join(m['test'])})")
            else:
                print(f"  ✅ {m['name']} — 게이트가 빨개진다")
        finally:
            path.write_text(backup)
    rebuild()   # 원상복구 빌드

    if failures:
        print(f"\n뮤테이션 검증 실패 {len(failures)}건:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print('\n✅ 모든 게이트가 자기 기능을 실제로 지킨다')


if __name__ == '__main__':
    main()
