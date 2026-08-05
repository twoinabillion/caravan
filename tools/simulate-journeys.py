#!/usr/bin/env python3
"""Run deterministic, browser-backed journey balance simulations."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HTML = ROOT / "서울까지400km.html"
DEFAULT_REPORT = ROOT / "reports" / "journey-simulation.json"


SIMULATION_JS = r"""
({runs, seed}) => {
  const mulberry32 = value => () => {
    value |= 0;
    value = value + 0x6D2B79F5 | 0;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const round = (value, places = 1) => Number(value.toFixed(places));
  const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const percentile = (values, p) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  };
  const weightedPick = (rng, entries) => {
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);
    let cursor = rng() * total;
    for (const [value, weight] of entries) {
      cursor -= weight;
      if (cursor <= 0) return value;
    }
    return entries[entries.length - 1][0];
  };

  G.newGame('onroad', 'SIM');
  if (Array.isArray(D.baseParty)) S.party = [...D.baseParty];
  const baseline = JSON.parse(JSON.stringify(S));
  const adjacency = Object.fromEntries(Object.keys(D.nodes).map(id => [id, []]));
  for (const edge of D.edges) {
    const [a, b] = edge;
    adjacency[a].push({to: b, edge});
    adjacency[b].push({to: a, edge});
  }

  const roadFactor = {high: 0.88, normal: 1, rough: 1.34};
  const policies = ['direct', 'prepared', 'explorer'];
  const policyLabels = {direct: '직행형', prepared: '준비형', explorer: '탐색형'};

  const resetState = () => {
    for (const key of Object.keys(S)) delete S[key];
    Object.assign(S, JSON.parse(JSON.stringify(baseline)));
    if (Array.isArray(D.baseParty)) S.party = [...D.baseParty];
  };

  const makePath = (policy, rng) => {
    const edgeWeights = new Map();
    for (const edge of D.edges) {
      const [a, b, km, road] = edge;
      let cost = km * (roadFactor[road] || 1);
      if (policy === 'prepared') {
        if (D.nodes[a]?.stl || D.nodes[b]?.stl) cost *= 0.84;
        if (road === 'rough') cost *= 1.16;
      } else if (policy === 'explorer') {
        cost *= 0.76 + rng() * 0.66;
        if (D.nodes[a]?.stl || D.nodes[b]?.stl) cost *= 0.92;
      }
      edgeWeights.set(edge, Math.max(km * 0.45, cost));
    }

    const distance = Object.fromEntries(Object.keys(D.nodes).map(id => [id, Infinity]));
    const previous = {};
    const pending = new Set(Object.keys(D.nodes));
    distance.busan = 0;
    while (pending.size) {
      let current = null;
      for (const id of pending) {
        if (current === null || distance[id] < distance[current]) current = id;
      }
      if (current === null || !Number.isFinite(distance[current])) break;
      pending.delete(current);
      if (current === 'seoul') break;
      for (const link of adjacency[current]) {
        if (!pending.has(link.to)) continue;
        const candidate = distance[current] + edgeWeights.get(link.edge);
        if (candidate < distance[link.to]) {
          distance[link.to] = candidate;
          previous[link.to] = current;
        }
      }
    }
    if (!Number.isFinite(distance.seoul)) return [];
    const path = ['seoul'];
    while (path[0] !== 'busan') {
      const prior = previous[path[0]];
      if (!prior) return [];
      path.unshift(prior);
    }
    return path;
  };

  const buyTo = (settlementId, kind, target, record) => {
    const trade = D.stls[settlementId]?.trade || [];
    const offer = trade.find(item => item[1] === kind);
    if (!offer) return;
    const amount = offer[2];
    const price = offer[3];
    while (S[kind] < target && S.scrap >= price) {
      S.scrap -= price;
      S[kind] = Math.min(kind === 'fuel' ? S.fuelMax : 999, S[kind] + amount);
      record.tradeSpend += price;
      record.trades += 1;
    }
  };

  const provision = (nodeId, path, pathIndex, policy, record) => {
    const settlementId = D.nodes[nodeId]?.stl;
    if (!settlementId) return;
    record.settlementStops += 1;
    let fuelNeed = 0;
    for (let i = pathIndex; i < path.length - 1; i++) {
      const edge = G.edgeBetween(path[i], path[i + 1]);
      fuelNeed += G.fuelFor(edge[2], edge[3]);
      if (i + 1 < path.length - 1 && D.nodes[path[i + 1]]?.stl) break;
    }
    const reserve = policy === 'prepared' ? 12 : policy === 'explorer' ? 8 : 3;
    buyTo(settlementId, 'fuel', Math.min(S.fuelMax, fuelNeed + reserve), record);
    const party = Math.max(2, G.partySize());
    buyTo(settlementId, 'food', party * (policy === 'prepared' ? 3.2 : 2.1), record);
    buyTo(settlementId, 'water', party * (policy === 'prepared' ? 3.8 : 2.5), record);
    if (S.van < 42 && S.scrap >= 6) {
      S.scrap -= 6;
      S.van = Math.min(S.vanMax, S.van + 22);
      record.tradeSpend += 6;
      record.repairs += 1;
    }
  };

  const resolveRoadEvent = (policy, road, rng, record) => {
    let chance = road === 'rough' ? 0.48 : road === 'high' ? 0.25 : 0.34;
    if (policy === 'prepared') chance *= 0.84;
    if (policy === 'explorer') chance *= 1.14;
    if (rng() > chance) return 25 + Math.floor(rng() * 40);
    record.events += 1;
    const roll = rng();
    if (roll < 0.26) {
      const damage = 4 + Math.floor(rng() * (road === 'rough' ? 12 : 8));
      S.van -= damage;
      record.combats += 1;
      record.vanDamage += damage;
    } else if (roll < 0.48) {
      const loss = 1 + Math.floor(rng() * 3);
      if (rng() < 0.55) S.water -= loss;
      else S.food -= loss;
      record.supplyLoss += loss;
    } else if (roll < 0.64) {
      const loss = 1 + Math.floor(rng() * 4);
      S.fuel -= loss;
      record.fuelLoss += loss;
    } else {
      const gain = 2 + Math.floor(rng() * 7);
      S.scrap += gain;
      record.salvage += gain;
      if (rng() < 0.28) S.water += 1 + Math.floor(rng() * 3);
    }
    return 45 + Math.floor(rng() * 100);
  };

  const simulate = (index, policy) => {
    resetState();
    const rng = mulberry32((seed + Math.imul(index + 1, 0x9E3779B1)) >>> 0);
    const path = makePath(policy, rng);
    const record = {
      index, policy, path, success: false, failure: null, km: 0,
      activeMinutes: 0, fuelUsed: 0, fuelLoss: 0, vanDamage: 0,
      supplyLoss: 0, salvage: 0, events: 0, combats: 0,
      roughEdges: 0, settlementStops: 0, trades: 0, tradeSpend: 0,
      repairs: 0, crisisChecks: 0
    };
    if (path.length < 2) {
      record.failure = 'route';
      return record;
    }

    provision(path[0], path, 0, policy, record);
    for (let i = 0; i < path.length - 1; i++) {
      const edge = G.edgeBetween(path[i], path[i + 1]);
      const [, , km, road] = edge;
      S.wx = weightedPick(rng, [['clear', 0.56], ['rain', 0.20], ['fog', 0.11], ['dust', 0.07], ['storm', 0.06]]);
      S.fatigue = Math.min(100, record.activeMinutes / 600 * 18);
      const fuel = G.fuelFor(km, road);
      if (S.fuel < fuel) {
        record.failure = 'fuel';
        break;
      }

      S.fuel -= fuel;
      record.fuelUsed += fuel;
      record.km += km;
      if (road === 'rough') {
        record.roughEdges += 1;
        if (rng() < 0.32) {
          const damage = 2 + Math.floor(rng() * 6);
          S.van -= damage;
          record.vanDamage += damage;
        }
      }
      if (S.wx === 'storm' && rng() < 0.42) {
        const damage = 1 + Math.floor(rng() * 5);
        S.van -= damage;
        record.vanDamage += damage;
      }

      const travelMinutes = Math.ceil(km / (road === 'rough' ? 31 : road === 'high' ? 50 : 42) * 60);
      const eventMinutes = resolveRoadEvent(policy, road, rng, record);
      const dwellMinutes = D.nodes[path[i + 1]]?.stl ? 80 + Math.floor(rng() * 100) : 20 + Math.floor(rng() * 55);
      const legMinutes = travelMinutes + eventMinutes + dwellMinutes;
      record.activeMinutes += legMinutes;
      const party = Math.max(2, G.partySize());
      const activeDays = legMinutes / 600;
      S.food -= party * 0.82 * activeDays;
      S.water -= party * 1.05 * activeDays;
      S.at = path[i + 1];

      provision(path[i + 1], path, i + 1, policy, record);
      if (S.fuel < 5 || S.food < party || S.water < party * 1.2 || S.van < 30) record.crisisChecks += 1;
      if (S.food < 0) {
        record.failure = 'food';
        break;
      }
      if (S.water < 0) {
        record.failure = 'water';
        break;
      }
      if (S.van <= 0) {
        record.failure = 'van';
        break;
      }
    }

    record.success = !record.failure && S.at === 'seoul';
    if (!record.success && !record.failure) record.failure = 'route';
    record.days = 1 + record.activeMinutes / 600;
    record.fuelLeft = S.fuel;
    record.foodLeft = S.food;
    record.waterLeft = S.water;
    record.scrapLeft = S.scrap;
    record.vanLeft = S.van;
    return record;
  };

  const results = [];
  for (let i = 0; i < runs; i++) results.push(simulate(i, policies[i % policies.length]));
  const countBy = (items, keyFn) => items.reduce((out, item) => {
    const key = keyFn(item);
    out[key] = (out[key] || 0) + 1;
    return out;
  }, {});
  const routeCounts = countBy(results, result => result.path.join(' > '));
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({route, count, percent: round(count / runs * 100)}));
  const failureCounts = countBy(results.filter(result => !result.success), result => result.failure);

  const summarize = subset => {
    const completed = subset.filter(result => result.success);
    return {
      runs: subset.length,
      completionRate: round(completed.length / Math.max(1, subset.length) * 100),
      failures: countBy(subset.filter(result => !result.success), result => result.failure),
      averageDays: round(mean(completed.map(result => result.days)), 2),
      p95Days: round(percentile(completed.map(result => result.days), 0.95), 2),
      averageKm: round(mean(completed.map(result => result.km))),
      averageFuelLeft: round(mean(completed.map(result => result.fuelLeft)), 2),
      averageFoodLeft: round(mean(completed.map(result => result.foodLeft)), 2),
      averageWaterLeft: round(mean(completed.map(result => result.waterLeft)), 2),
      averageScrapLeft: round(mean(completed.map(result => result.scrapLeft)), 2),
      averageVanLeft: round(mean(completed.map(result => result.vanLeft)), 2),
      crisisRunRate: round(subset.filter(result => result.crisisChecks > 0).length / Math.max(1, subset.length) * 100),
      averageEvents: round(mean(completed.map(result => result.events)), 2),
      averageSettlementStops: round(mean(completed.map(result => result.settlementStops)), 2)
    };
  };

  const overall = summarize(results);
  const byPolicy = Object.fromEntries(policies.map(policy => [policy, {
    label: policyLabels[policy],
    ...summarize(results.filter(result => result.policy === policy))
  }]));
  const warnings = [];
  if (overall.completionRate < 90) warnings.push({severity: 'critical', code: 'LOW_COMPLETION', message: `전체 완주율 ${overall.completionRate}%`});
  if ((failureCounts.fuel || 0) / runs > 0.05) warnings.push({severity: 'high', code: 'FUEL_LOCK', message: `연료 고갈 ${(failureCounts.fuel / runs * 100).toFixed(1)}%`});
  if (((failureCounts.food || 0) + (failureCounts.water || 0)) / runs > 0.05) warnings.push({severity: 'high', code: 'SUPPLY_LOCK', message: '식량·물 고갈이 5%를 초과'});
  for (const policy of policies) {
    if (byPolicy[policy].completionRate < 85) warnings.push({severity: 'high', code: 'POLICY_FAILURE', message: `${policyLabels[policy]} 완주율 ${byPolicy[policy].completionRate}%`});
  }
  if (overall.crisisRunRate > 35) warnings.push({severity: 'medium', code: 'CRISIS_FREQUENCY', message: `위기 자원 구간 경험률 ${overall.crisisRunRate}%`});
  if ((topRoutes[0]?.percent || 0) > 72) warnings.push({severity: 'medium', code: 'ROUTE_CONCENTRATION', message: `최다 경로 집중도 ${topRoutes[0].percent}%`});

  return {
    schemaVersion: 1,
    runs,
    seed,
    data: {nodes: Object.keys(D.nodes).length, edges: D.edges.length, settlements: Object.keys(D.stls).length},
    model: {
      source: 'Built game runtime: D.nodes, D.edges, D.stls.trade, G.fuelFor',
      policies: policyLabels,
      assumptions: [
        '도로 주행은 실제 연료 공식을 사용한다.',
        '하루는 10시간의 이동·탐색 활동으로 환산한다.',
        '식량은 인원당 활동일 0.82, 물은 1.05를 소비한다.',
        '정착지는 실제 trade 교환비로 다음 보급점까지 필요한 자원을 구매한다.',
        '전투·사고·노획은 노면과 플레이 성향에 따른 확률 모델이다.'
      ]
    },
    overall,
    byPolicy,
    failures: failureCounts,
    topRoutes,
    warnings
  };
}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Simulate long-run Caravan journeys")
    parser.add_argument("--runs", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=400_000_001)
    parser.add_argument("--html", type=Path, default=DEFAULT_HTML)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--strict", action="store_true", help="fail on critical/high warnings")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    html = args.html.resolve()
    if not html.exists():
        raise SystemExit(f"빌드 파일이 없습니다: {html}")
    if args.runs < 3:
        raise SystemExit("--runs는 3 이상이어야 합니다.")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(html.as_uri(), wait_until="domcontentloaded")
        report = page.evaluate(SIMULATION_JS, {"runs": args.runs, "seed": args.seed})
        browser.close()

    report["generatedAt"] = datetime.now(timezone.utc).isoformat()
    report_path = args.report.resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    overall = report["overall"]
    print(f"여정 시뮬레이션 {report['runs']:,}회 · seed {report['seed']}")
    print(f"완주율 {overall['completionRate']:.1f}% · 평균 {overall['averageDays']:.2f}일 · 위기 구간 {overall['crisisRunRate']:.1f}%")
    for stats in report["byPolicy"].values():
        print(f"  {stats['label']:<4} {stats['completionRate']:>5.1f}% · 연료 {stats['averageFuelLeft']:>5.1f}L · 차체 {stats['averageVanLeft']:>5.1f}")
    if report["warnings"]:
        for warning in report["warnings"]:
            print(f"  [{warning['severity'].upper()}] {warning['message']}")
    else:
        print("  경고 기준을 넘는 장기 밸런스 문제 없음")
    print(f"리포트: {report_path}")

    severe = any(warning["severity"] in {"critical", "high"} for warning in report["warnings"])
    return 1 if args.strict and severe else 0


if __name__ == "__main__":
    raise SystemExit(main())
