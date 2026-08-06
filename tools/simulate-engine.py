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
    let ended = '', guard = 0, lastMiss = null;

    // 정책별 성향 — 실제 플레이어가 시간을 쓰는 방식의 근사
    const cfg = {
      direct:   {bundles:1, explore:0, upgrades:false, repairAt:0.35, campAt:88, fieldWork:false},
      prepared: {bundles:2, explore:1, upgrades:true,  repairAt:0.70, campAt:62, fieldWork:false},
      explorer: {bundles:3, explore:2, upgrades:true,  repairAt:0.75, campAt:55, fieldWork:true},
    }[policy];

    /* 동료 영입 — 네 기둥의 '관계'는 영입 없이는 영영 0이다.
       엔진의 실제 진행 함수(G.openRecruitStep)를 그대로 부른다. */
    const pushRecruit = () => {
      let guard3 = 0;
      while (S.recruitQ && guard3++ < 4) {
        const before = JSON.stringify(S.recruitQ);
        let opened = false;
        try { opened = G.openRecruitStep(); } catch (e) { break; }
        if (opened) resolveEvent(policy);
        if (!opened || JSON.stringify(S.recruitQ) === before) break;
      }
    };

    const stayAlive = () => {
      // 어떤 정책이든 목마르면 물은 산다 (봇의 아둔함이 사망률로 잡히지 않게)
      const stl = S.at && D.nodes[S.at] && D.nodes[S.at].stl;
      if (!stl) return;
      let guard2 = 0;
      while (S.water <= G.partySize() * 2 && S.scrap >= 8 && guard2++ < 3) G.tradeBundle(stl);
    };

    while (!ended && S.day <= maxDays && guard++ < 4000) {
      if (S.at === 'seoul') {
        /* 서울 노드에 닿는 것은 완주가 아니다. G.seoulReady()가 false면 실엔진은
           관문 이벤트로 수원까지 되돌려보낸다(04-engine.js:2495). 그 상태를 완주로
           세면 '빈 장부로 서울 땅을 처음 밟은 날'을 완주 소요일로 착각하게 된다. */
        /* 여기까지가 이 도구가 정직하게 잴 수 있는 구간이다: 주행·보급 경제.
           네 기둥(서사 수집)은 자동 플레이어가 수행하지 못하므로, 관문 통과 여부와
           무관하게 '서울 노드 첫 도달일'을 기록하고 런을 끝낸다. */
        lastMiss = G.seoulReady() ? null : G.seoulMissing();
        ended = 'reached';
        break;
      }

      if (S.at && D.nodes[S.at] && D.nodes[S.at].stl) {
        const stl = D.nodes[S.at].stl;
        for (let k = 0; k < cfg.bundles; k++) G.tradeBundle(stl);
        stayAlive();
        if (S.van < S.vanMax * cfg.repairAt) G.settlementRepair();
        // 업그레이드 구매 — 성장 축이 측정되도록 (싼 것부터)
        if (cfg.upgrades) {
          const buyable = (D.upgrades || [])
            .filter(u => !S.up[u.id] && G.canBuyUp(u.id).ok)
            .sort((a, b) => a.cost.scrap - b.cost.scrap);
          if (buyable.length && S.scrap >= buyable[0].cost.scrap + 10) G.buyUpgrade(buyable[0].id);
        }
        pushRecruit();
        // 정착지 현장 일 — 시간을 쓰고 관계를 얻는다
        if (cfg.fieldWork && D.stls[stl] && D.stls[stl].field) {
          try {
            for (const entry of D.stls[stl].field.actions || []) {
              const action = G.stlFieldAction(stl, entry.id);
              const st = G.stlFieldStatus(stl, action);
              if (st && st.ok) { G.doStlFieldAction(stl, entry.id); resolveEvent(policy); break; }
            }
          } catch (e) {}
        }
      }
      // 탐색 — 노드마다 시간을 태운다
      for (let e = 0; e < cfg.explore; e++) {
        try { if (!G.explore()) break; resolveEvent(policy); } catch (er) { break; }
      }
      if (S.ended) { ended = 'dead'; break; }

      pushRecruit();
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
        if (S.at && D.nodes[S.at] && D.nodes[S.at].stl) { G.trade(D.nodes[S.at].stl, 0); G.camp(); resolveEvent(policy); continue; }
        G.camp(); resolveEvent(policy);
        if (guard > 3000) { ended = 'stuck'; break; }
        continue;
      }
      if (!G.startTravel(target)) { ended = 'stuck'; break; }
      let tickGuard = 0;
      while (S.driving && tickGuard++ < 20000 && !S.ended) {
        G.tick(1.4);
        if (pendingEvent) resolveEvent(policy);
      }
      if (S.ended) { ended = 'dead'; break; }
      resolveEvent(policy);
      if (S.fatigue >= cfg.campAt || G.isNight()) { G.camp(); resolveEvent(policy); }
      if (S.ended) { ended = 'dead'; break; }
    }
    if (!ended) ended = S.ended ? 'dead' : 'timeout';
    results.push({
      policy, ended,
      missing: lastMiss ? `${lastMiss.pillar} ${lastMiss.have}/${lastMiss.need}` : '',
      ready: !!(typeof G.seoulReady === 'function' && G.seoulReady()),
      deeds: (typeof G.deedsDone === 'function' ? G.deedsDone().length : 0),
      deedsNeed: (typeof G.pillars === 'function'
        ? Object.values(G.pillars()).reduce((n, x) => n + x.need, 0) : 0),
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
        arrived = [r for r in subset if r['ended'] == 'reached']
        days = sorted(r['day'] for r in arrived)
        out[policy] = {
            'runs': len(subset),
            'reachedPct': round(100 * len(arrived) / max(1, len(subset)), 1),
            'deadPct': round(100 * sum(1 for r in subset if r['ended'] == 'dead') / max(1, len(subset)), 1),
            'medianDay': days[len(days) // 2] if days else None,
            'endedBuckets': {k: sum(1 for r in subset if r['ended'] == k)
                             for k in sorted({r['ended'] for r in subset})},
            'meanParty': round(sum(r['party'] for r in subset) / max(1, len(subset)), 2),
            'meanDeeds': round(sum(r['deeds'] for r in subset) / max(1, len(subset)), 2),
            'deedsNeed': subset[0].get('deedsNeed', 0),
            'meanDay': round(sum(r['day'] for r in subset) / max(1, len(subset)), 2),
            'meanRescues': round(sum(r['rescues'] for r in subset) / max(1, len(subset)), 2),
            'lateTransferPct': round(100 * sum(1 for r in arrived if r['lateTransfer']) / max(1, len(arrived)), 1),
            'lateBase': 'arrived',
            'meanEvents': round(sum(r['events'] for r in subset) / max(1, len(subset)), 1),
            'deadlineSeenPct': round(100 * sum(1 for r in subset if r['deadlineSeen']) / max(1, len(subset)), 1),
        }
    all_days = [out[p]['medianDay'] for p in policies if out[p]['medianDay'] is not None]
    out['_spread'] = {'medianDaySpread': (max(all_days) - min(all_days)) if all_days else None}
    return out


THRESHOLDS = """게이트 임계값 — 리포트 생성기가 아니라 실제로 실패할 수 있는 검사다."""


def gate(summary, rows, deadline):
    """이 게이트가 재는 것과 못 재는 것을 분명히 한다.

    잰다  : 주행·보급 경제 — 서울 노드까지의 소요일(daysToSeoulNode), 자원 소모,
            구제 호출 빈도, 사건 노출량, 정책 간 차이.
    못 잰다: 실제 완주(네 기둥 13개 과업). 자동 플레이어는 동료 아크·서사 수집을
            수행하지 못해 deeds가 0에 머문다. 따라서 '완주 소요일'을 이 도구로
            주장하면 안 된다 — 2026-08-06 적대적 재검증에서 실제로 그 오류가 나왔다.
    """
    problems = []
    for policy, row in summary.items():
        if policy.startswith('_'):
            continue
        if row['medianDay'] is None:
            problems.append(f"{policy}: 서울 노드 도달 0건 (buckets={row['endedBuckets']})")
            continue
        if row['reachedPct'] < 25:
            problems.append(f"{policy}: 서울 노드 도달 {row['reachedPct']}% < 25%")
        if row['deadlineSeenPct'] < 100:
            problems.append(f"{policy}: 시한 압박 목격 {row['deadlineSeenPct']}% < 100%")
        if row['meanEvents'] < 5:
            problems.append(f"{policy}: 런당 사건 {row['meanEvents']}건 — 이벤트 층이 돌지 않았다")

    ranked = [(p, r) for p, r in summary.items()
              if not p.startswith('_') and r['medianDay'] is not None]
    if ranked:
        fastest = min(ranked, key=lambda kv: kv[1]['medianDay'])
        # 집중 플레이는 시한의 절반 안에 서울 땅을 밟을 수 있어야 한다(장부 채울 여유).
        if fastest[1]['medianDay'] > deadline * 0.5:
            problems.append(
                f"{fastest[0]}(최속): 서울 노드까지 {fastest[1]['medianDay']}일 "
                f"> 시한 {deadline}일의 50% — 장부를 채울 여유가 없다")

    spread = summary.get('_spread', {}).get('medianDaySpread')
    if spread is None or spread < 2:
        problems.append(f"정책 간 소요일 스프레드 {spread}일 < 2일 — 준비에 비용이 없다")

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
        page_deadline = page.evaluate('D.transferDeadlineDay')
        rows = page.evaluate(SIM_JS, {
            'runs': args.runs, 'baseSeed': args.seed,
            'policies': ['direct', 'prepared', 'explorer'], 'maxDays': args.max_days,
        })
        browser.close()

    summary = summarize(rows)
    report = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'source': 'real engine — 측정 대상: 주행·보급 경제(daysToSeoulNode). 실제 완주(네 기둥)는 측정 불가',
        'metric': 'daysToSeoulNode',
        'runs': len(rows), 'seed': args.seed, 'maxDays': args.max_days,
        'deadlineDay': page_deadline,
        'summary': summary,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2))

    print(f"실엔진 시뮬 {len(rows)}런 · seed {args.seed}")
    for policy, row in summary.items():
        if policy.startswith('_'):
            continue
        print(f"  {policy:9s} 서울도달 {row['reachedPct']:5.1f}% · 사망 {row['deadPct']:4.1f}% · "
              f"중앙 DAY {str(row['medianDay']):>3s} · 구제 {row['meanRescues']:.2f}회 · "
              f"시한압박 목격 {row['deadlineSeenPct']:5.1f}% · 사건 {row['meanEvents']:.1f}건 · "
              f"동행 {row['meanParty']:.1f}명 · {row['endedBuckets']}")
    print(f"  정책 간 소요일 스프레드: {summary['_spread']['medianDaySpread']}일")
    print(f"보고서 → {args.report}")

    problems = gate(summary, rows, page_deadline)
    if problems:
        for p in problems:
            print(f'  ❌ {p}')
        raise SystemExit(f'실엔진 밸런스 게이트 실패 {len(problems)}건')
    print('✅ 실엔진 밸런스 게이트 통과')


if __name__ == '__main__':
    main()
