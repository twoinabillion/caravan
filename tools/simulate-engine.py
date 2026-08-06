#!/usr/bin/env python3
"""실엔진 밸런스 시뮬레이션.

기존 simulate-journeys.py는 이벤트 층을 하드코딩 확률의 병렬 모델로 대체해
"게임의 모델"을 측정했다. 이 스크립트는 로드된 페이지의 실제 전역(G/S/D)을
직접 구동해 "게임 자체"를 측정한다 — G.newGame → G.startTravel → G.tick →
실제 이벤트 풀·선택 해석·위기·구제·시한까지 전부 진짜 코드가 돈다.

정책(policy)마다 자동 플레이어의 성향이 다르다:
  direct   보급을 최소화하고 최단 경로로 밀어붙인다
  prepared 정착지마다 보급하고 야영으로 피로를 관리한다
  explorer 탐색·정착지 일을 챙기며 느리게 간다
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HTML = ROOT / '서울까지400km.html'
DEFAULT_REPORT = ROOT / 'reports' / 'engine-simulation.json'

SIM_JS = r"""
({runs, baseSeed, policies, maxDays}) => {
  const results = [];
  // UI 부작용 차단: 시뮬은 상태만 돌린다 (모달/토스트/오디오는 no-op)
  const realModalOpen = UI.modalOpen;
  const noop = () => {};
  const stubs = ['toast','speak','playChat','playRadio','renderAll','renderHud','onDepart','clearSpeech'];
  const saved = {};
  for (const key of stubs) { saved[key] = UI[key]; UI[key] = noop; }
  UI.modalOpen = () => false;
  UI.onArrive = () => 0;
  const savedShowEvent = UI.showEvent;

  // 이벤트는 열리는 즉시 정책에 따라 선택 하나를 고르고 닫는다
  let pendingEvent = null;
  UI.showEvent = (evd) => { pendingEvent = evd; };

  const choiceUsable = (choice) => {
    if (!choice || !choice.req) return true;
    const rq = G.reqOk(choice.req);
    return !rq || rq.ok !== false;
  };
  const resolveEvent = (policy) => {
    let guard = 0;
    while (pendingEvent && guard++ < 12) {
      const evd = pendingEvent; pendingEvent = null;
      const choices = (evd.choices || []).filter(choiceUsable);
      if (!choices.length) break;
      let choice;
      if (policy === 'direct') {
        // 시간을 가장 적게 쓰는 선택을 고른다
        choice = choices.reduce((best, c) => {
          const t = (c.out && c.out[0] && c.out[0].fx && c.out[0].fx.time) || 0;
          const bt = (best.out && best.out[0] && best.out[0].fx && best.out[0].fx.time) || 0;
          return t < bt ? c : best;
        }, choices[0]);
      } else if (policy === 'explorer') {
        choice = choices[choices.length - 1];
      } else {
        choice = choices[Math.min(1, choices.length - 1)];
      }
      const out = G.pickOutcome(evd, choice);
      // 실제 UI 핸들러와 같은 순서 — 이걸 빼면 S.combat.history가 비어
      // 적응형 난이도(COMBAT_AUTO_ADJUST_*)가 꺼진 채로 밸런스를 재게 된다
      const meta = out && out.combatMeta || null;
      let entry = (out.fx && out.fx.combatEnd) ? G.rememberCombatChoice(evd, choice, meta) : null;
      G.applyFx(out.fx || {});
      if (!entry) G.rememberCombatChoice(evd, choice, meta);
      if (G.afterChoice) { try { G.afterChoice(evd, choice, out); } catch (e) {} }
      if (out.fx && out.fx.chain) { const next = D.events.find(e => e.id === out.fx.chain); if (next) G.openEvent(next); }
    }
    pendingEvent = null;
  };

  for (let i = 0; i < runs; i++) {
    const policy = policies[i % policies.length];
    G.seedOverride = baseSeed + i * 7919;
    G.newGame('onroad', '시뮬', 'full');
    G.seedOverride = undefined;
    let ended = '', guard = 0;
    while (!ended && S.day <= maxDays && guard++ < 4000) {
      if (S.at === 'seoul') { ended = 'arrived'; break; }
      // 보급 정책
      if (S.at && D.nodes[S.at] && D.nodes[S.at].stl) {
        const stl = D.stls[D.nodes[S.at].stl];
        if (policy !== 'direct' && stl && stl.trade) {
          for (let k = 0; k < (policy === 'explorer' ? 3 : 2); k++) G.tradeBundle(D.nodes[S.at].stl);
          if (S.van < S.vanMax - 20) G.settlementRepair();
        }
        if (policy === 'explorer') { try { G.explore(); resolveEvent(policy); } catch (e) {} }
      }
      // 다음 노드: 서울 방향으로 최단
      // 서울에 가장 가까워지는 이웃을 고른다 (remainKm 기준 그리디)
      const here = S.at;
      let target = null, bestRemain = Infinity;
      for (const nb of G.neighbors(here)) {
        const save = S.at; S.at = nb.id;
        const remain = G.remainKm();
        S.at = save;
        if (remain < bestRemain) { bestRemain = remain; target = nb.id; }
      }
      if (!target) { ended = 'stuck'; break; }
      const chk = G.canTravelTo(target);
      if (!chk.ok) {
        // 연료가 모자라면 자거나 사서 채운다
        if (S.at && D.nodes[S.at] && D.nodes[S.at].stl) { G.trade(D.nodes[S.at].stl, 0); G.camp(); resolveEvent(policy); continue; }
        G.camp(); resolveEvent(policy);
        if (guard > 3000) { ended = 'stuck'; break; }
        continue;
      }
      if (!G.startTravel(target)) { ended = 'stuck'; break; }
      let tickGuard = 0;
      while (S.driving && tickGuard++ < 3000 && !S.ended) {
        G.tick(1.4);
        if (pendingEvent) resolveEvent(policy);
      }
      if (S.ended) { ended = 'dead'; break; }
      resolveEvent(policy);
      // 피로/야간 관리
      if (S.fatigue >= (policy === 'direct' ? 88 : 62) || G.isNight()) { G.camp(); resolveEvent(policy); }
      if (S.ended) { ended = 'dead'; break; }
    }
    if (!ended) ended = S.ended ? 'dead' : 'timeout';
    results.push({
      policy, ended,
      day: S.day, km: Math.round(S.stats.km), events: S.stats.events,
      fuel: Math.round(S.fuel), water: S.water, food: S.food, scrap: S.scrap,
      van: Math.round(S.van), pursuit: S.pursuit, party: S.party.length,
      rescues: Object.values(S._rescues || {}).reduce((a, b) => a + b, 0),
      lateTransfer: S.day > D.transferDeadlineDay,
      deadlineSeen: !!(S.flags.deadline_seen_d10 || S.flags.deadline_seen_d5),
    });
  }
  for (const key of stubs) UI[key] = saved[key];
  UI.modalOpen = realModalOpen; UI.showEvent = savedShowEvent;
  return results;
}
"""


def summarize(rows):
    out = {}
    policies = sorted({r['policy'] for r in rows})
    for policy in policies:
        subset = [r for r in rows if r['policy'] == policy]
        arrived = [r for r in subset if r['ended'] == 'arrived']
        days = sorted(r['day'] for r in arrived)
        out[policy] = {
            'runs': len(subset),
            'arrivedPct': round(100 * len(arrived) / max(1, len(subset)), 1),
            'deadPct': round(100 * sum(1 for r in subset if r['ended'] == 'dead') / max(1, len(subset)), 1),
            'medianDay': days[len(days) // 2] if days else None,
            'endedBuckets': {k: sum(1 for r in subset if r['ended'] == k)
                             for k in sorted({r['ended'] for r in subset})},
            'meanParty': round(sum(r['party'] for r in subset) / max(1, len(subset)), 2),
            'meanRescues': round(sum(r['rescues'] for r in subset) / max(1, len(subset)), 2),
            'lateTransferPct': round(100 * sum(1 for r in subset if r['lateTransfer']) / max(1, len(subset)), 1),
            'meanEvents': round(sum(r['events'] for r in subset) / max(1, len(subset)), 1),
            'deadlineSeenPct': round(100 * sum(1 for r in subset if r['deadlineSeen']) / max(1, len(subset)), 1),
        }
    all_days = [out[p]['medianDay'] for p in policies if out[p]['medianDay'] is not None]
    out['_spread'] = {'medianDaySpread': (max(all_days) - min(all_days)) if all_days else None}
    return out


THRESHOLDS = """게이트 임계값 — 리포트 생성기가 아니라 실제로 실패할 수 있는 검사다."""


def gate(summary, rows):
    """밸런스가 무너지면 릴리스를 막는다. 리포트만 뽑고 통과시키면 게이트가 아니다."""
    problems = []
    for policy, row in summary.items():
        if policy.startswith('_'):
            continue
        if row['medianDay'] is None:
            problems.append(f"{policy}: 완주 0건 (buckets={row['endedBuckets']})")
            continue
        # 아무도 죽지 않고 아무도 못 가면 둘 다 밸런스 실패다
        if row['arrivedPct'] < 25:
            problems.append(f"{policy}: 완주 {row['arrivedPct']}% < 25%")
        if row['deadlineSeenPct'] < 100:
            problems.append(f"{policy}: 시한 압박 목격 {row['deadlineSeenPct']}% < 100%")
        if row['meanEvents'] < 5:
            problems.append(f"{policy}: 런당 사건 {row['meanEvents']}건 — 이벤트 층이 돌지 않았다")
    if not rows:
        problems.append('시뮬레이션 결과 0건')
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--runs', type=int, default=60)
    ap.add_argument('--seed', type=int, default=400_000_001)
    ap.add_argument('--max-days', type=int, default=45)
    ap.add_argument('--html', type=Path, default=DEFAULT_HTML)
    ap.add_argument('--report', type=Path, default=DEFAULT_REPORT)
    args = ap.parse_args()

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        page.add_init_script('localStorage.clear()')
        page.goto(args.html.resolve().as_uri())
        page.wait_for_function('typeof G !== "undefined" && typeof D !== "undefined"')
        rows = page.evaluate(SIM_JS, {
            'runs': args.runs, 'baseSeed': args.seed,
            'policies': ['direct', 'prepared', 'explorer'], 'maxDays': args.max_days,
        })
        browser.close()

    summary = summarize(rows)
    report = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': 'real engine (G.newGame/startTravel/tick/pickOutcome/applyFx)',
        'runs': len(rows), 'seed': args.seed, 'maxDays': args.max_days,
        'summary': summary,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2))

    print(f"실엔진 시뮬 {len(rows)}런 · seed {args.seed}")
    for policy, row in summary.items():
        if policy.startswith('_'):
            continue
        print(f"  {policy:9s} 완주 {row['arrivedPct']:5.1f}% · 사망 {row['deadPct']:4.1f}% · "
              f"중앙 DAY {str(row['medianDay']):>3s} · 구제 {row['meanRescues']:.2f}회 · "
              f"시한압박 목격 {row['deadlineSeenPct']:5.1f}% · 사건 {row['meanEvents']:.1f}건 · "
              f"동행 {row['meanParty']:.1f}명 · {row['endedBuckets']}")
    print(f"  정책 간 소요일 스프레드: {summary['_spread']['medianDaySpread']}일")
    print(f"보고서 → {args.report}")

    problems = gate(summary, rows)
    if problems:
        for p in problems:
            print(f'  ❌ {p}')
        raise SystemExit(f'실엔진 밸런스 게이트 실패 {len(problems)}건')
    print('✅ 실엔진 밸런스 게이트 통과')


if __name__ == '__main__':
    main()
